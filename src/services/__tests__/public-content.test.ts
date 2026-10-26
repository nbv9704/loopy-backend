import * as cms from '../cms/public-read'
import { supabaseAdmin } from '../../db/supabase'

jest.mock('../../db/supabase', () => ({ supabaseAdmin: { from: jest.fn() } }))
const row = {
  id: 'a',
  category_id: 'header',
  key: 'title',
  language: 'vi',
  value: 'Title',
  type: 'text',
  description: null,
  created_at: '2026-01-01',
  updated_at: '2026-01-01',
  revision: 99,
  created_by: 'private actor',
  updated_by: 'private actor',
}
function query(data: unknown, count: number | null, error: unknown = null) {
  const result = { data, count, error }
  const q = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    then: (resolve: (result: unknown) => unknown) => Promise.resolve(result).then(resolve),
  }
  jest.mocked(supabaseAdmin.from).mockReturnValueOnce(q as never)
  return q
}
beforeEach(() => jest.resetAllMocks())

it('reads public content without selecting or exposing admin revision/audit columns', async () => {
  const q = query([{ ...row, revision: undefined }], 1)
  const result = await cms.getPublicContentByKey('title', 'vi')
  expect(q.select.mock.calls[0][0]).not.toMatch(/revision|created_by|updated_by/)
  expect(result).toMatchObject({ id: 'a', value: 'Title', categoryId: 'header' })
  expect(result).not.toHaveProperty('revision')
  expect(result).not.toHaveProperty('createdBy')
  expect(result).not.toHaveProperty('updatedBy')
})
it('keeps public collection reads independent from editor migrations', async () => {
  const q = query([{ ...row, revision: undefined }], 1)
  const result = await cms.getPublicContentItems(undefined, 'vi')
  expect(result.total).toBe(1)
  expect(q.select.mock.calls[0][0]).not.toMatch(/revision|created_by|updated_by/)
  expect(result.items[0]).not.toHaveProperty('createdBy')
})
it('reads past a row cap and omits all ambiguous keys while preserving valid keys', async () => {
  const first = query([{ id: 'a', key: 'title', value: 'First' }], 5)
  const second = query(
    [
      { id: 'b', key: 'title', value: 'Second' },
      { id: 'c', key: 'title', value: 'Third' },
      { id: 'd', key: 'subtitle', value: '' },
      { id: 'e', key: 'title', value: 'Fourth' },
    ],
    5
  )
  const result = await cms.getPublicContentItemsByKeys(['title', 'subtitle', 'missing'], 'vi')
  expect(result).toEqual({
    items: { subtitle: '' },
    missingKeys: ['missing'],
    ambiguousKeys: ['title'],
  })
  expect(first.range).toHaveBeenCalledWith(0, 499)
  expect(second.range).toHaveBeenCalledWith(1, 500)
})
it('does not return partial CMS values when a later page fails', async () => {
  query([{ id: 'a', key: 'title', value: 'Partial' }], 2)
  query(null, null, { message: 'private database error' })
  await expect(cms.getPublicContentItemsByKeys(['title', 'subtitle'], 'vi')).rejects.toMatchObject({
    code: 'DATABASE_ERROR',
  })
})
it('returns a typed conflict for a single key rather than choosing a category', async () => {
  query([row, { ...row, id: 'b' }], 2)
  await expect(cms.getPublicContentByKey('title', 'vi')).rejects.toMatchObject({
    statusCode: 409,
    code: 'CMS_KEY_AMBIGUOUS',
  })
})
it('does not query for an empty batch', async () => {
  expect(await cms.getPublicContentItemsByKeys([], 'vi')).toEqual({
    items: {},
    missingKeys: [],
    ambiguousKeys: [],
  })
  expect(supabaseAdmin.from).not.toHaveBeenCalled()
})

describe('public namespace ownership', () => {
  const variants = [
    { ...row, id: 'a', key: 'nav.logout', value: 'Common', content_categories: { name: 'common' } },
    { ...row, id: 'b', key: 'nav.logout', value: 'Header', content_categories: { name: 'header' } },
    { ...row, id: 'c', key: 'nav.logout', value: 'Edited', content_categories: { name: 'nav' } },
  ]

  it.each([false, true])(
    'single and batch use the owner regardless of order (reverse=%s)',
    async reverse => {
      const rows = reverse ? [...variants].reverse() : variants
      query(rows, rows.length)
      await expect(cms.getPublicContentByKey('nav.logout', 'vi')).resolves.toMatchObject({
        id: 'c',
        value: 'Edited',
      })
      query(rows, rows.length)
      await expect(cms.getPublicContentItemsByKeys(['nav.logout'], 'vi')).resolves.toEqual({
        items: { 'nav.logout': 'Edited' },
        missingKeys: [],
        ambiguousKeys: [],
      })
    }
  )

  it('finds the owner on a later page and does not expose relation or audit fields', async () => {
    const first = query(variants.slice(0, 2), 3)
    const last = query(variants.slice(2), 3)
    const result = await cms.getPublicContentByKey('nav.logout', 'vi')
    expect(result).toMatchObject({ value: 'Edited' })
    expect(result).not.toHaveProperty('content_categories')
    expect(result).not.toHaveProperty('revision')
    expect(first.select.mock.calls[0][0]).not.toMatch(/revision|created_by|updated_by/)
    expect(last.range).toHaveBeenCalledWith(2, 501)
  })

  it('keeps unique legacy keys readable in nonmatching categories', async () => {
    query([variants[1]], 1)
    await expect(cms.getPublicContentItemsByKeys(['nav.logout'], 'vi')).resolves.toMatchObject({
      items: { 'nav.logout': 'Header' },
      ambiguousKeys: [],
    })
  })

  it('preserves an empty owner value instead of a nonempty legacy copy', async () => {
    query([...variants.slice(0, 2), { ...variants[2], value: '' }], 3)
    await expect(cms.getPublicContentItemsByKeys(['nav.logout'], 'vi')).resolves.toMatchObject({
      items: { 'nav.logout': '' },
      ambiguousKeys: [],
    })
  })

  it.each(['missing', 'multiple', 'prefix-only'])(
    'keeps an unresolved %s owner ambiguous',
    async mode => {
      const rows =
        mode === 'multiple'
          ? [...variants, { ...variants[2], id: 'd' }]
          : mode === 'prefix-only'
            ? variants.map(item => ({ ...item, content_categories: { name: 'navigation' } }))
            : variants.slice(0, 2)
      query(rows, rows.length)
      await expect(cms.getPublicContentByKey('nav.logout', 'vi')).rejects.toMatchObject({
        statusCode: 409,
        code: 'CMS_KEY_AMBIGUOUS',
      })
      query(rows, rows.length)
      await expect(cms.getPublicContentItemsByKeys(['nav.logout'], 'vi')).resolves.toEqual({
        items: {},
        missingKeys: [],
        ambiguousKeys: ['nav.logout'],
      })
    }
  )
})

describe('public batch key selection', () => {
  it('deduplicates keys, filters language, and reports missing keys', async () => {
    const q = query([{ id: row.id, key: row.key, value: row.value }], 1)
    const result = await cms.getPublicContentItemsByKeys([row.key, row.key, ' missing '], 'vi')
    expect(q.in).toHaveBeenCalledWith('key', [row.key, 'missing'])
    expect(q.eq).toHaveBeenCalledWith('language', 'vi')
    expect(result).toEqual({
      items: { [row.key]: row.value },
      missingKeys: ['missing'],
      ambiguousKeys: [],
    })
  })
  it('does not query for blank keys', async () => {
    expect(await cms.getPublicContentItemsByKeys(['', '  '], 'vi')).toEqual({
      items: {},
      missingKeys: [],
      ambiguousKeys: [],
    })
    expect(supabaseAdmin.from).not.toHaveBeenCalled()
  })
  it('propagates a database failure', async () => {
    query(null, null, { message: 'database unavailable' })
    await expect(cms.getPublicContentItemsByKeys([row.key], 'vi')).rejects.toThrow()
  })
})
