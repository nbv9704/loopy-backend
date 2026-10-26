import * as publicCms from '../cms/public-read'
import { AdminContentService as cms } from '../admin-content.service'
import { supabaseAdmin } from '../../db/supabase'
import { AuditLogService } from '../audit-log.service'

jest.mock('../../db/supabase', () => ({ supabaseAdmin: { from: jest.fn(), rpc: jest.fn() } }))
jest.mock('../audit-log.service', () => ({ AuditLogService: { logAction: jest.fn() } }))
jest.mock('../../utils/logger', () => ({ logger: { error: jest.fn() } }))
const row = {
  id: 'item',
  category_id: '11111111-1111-4111-8111-111111111111',
  key: 'title',
  language: 'vi',
  value: 'Original',
  type: 'text',
  revision: 3,
  created_at: '2026-01-01',
  updated_at: '2026-01-01',
}
const query = (data: unknown, error: unknown = null, count: number | null = 0) => {
  const result = { data, error, count }
  const q = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue(result),
    single: jest.fn().mockResolvedValue(result),
    then: (resolve: (value: typeof result) => unknown) => Promise.resolve(result).then(resolve),
  }
  jest.mocked(supabaseAdmin.from).mockReturnValueOnce(q as never)
  return q
}
beforeEach(() => {
  jest.resetAllMocks()
  jest.mocked(supabaseAdmin.rpc).mockResolvedValue({ data: { cms: true }, error: null } as never)
})

it('does not treat a category read outage as missing or attempt a create', async () => {
  query(null, { message: 'private failure' })
  await expect(
    cms.createContentItem(
      { categoryId: row.category_id, key: 'title', language: 'vi', value: 'x' },
      'admin'
    )
  ).rejects.toMatchObject({ code: 'DATABASE_ERROR' })
  expect(supabaseAdmin.from).toHaveBeenCalledTimes(1)
})
it.each(['update', 'delete'] as const)('a stale %s fails before writing', async operation => {
  const q = query(row)
  await expect(
    operation === 'update'
      ? cms.updateContentItem(row.id, { value: 'Stale', expectedRevision: 2 }, 'admin')
      : cms.deleteContentItem(row.id, 'admin', 2)
  ).rejects.toMatchObject({ code: 'CMS_CONFLICT', statusCode: 409 })
  expect(q.update).not.toHaveBeenCalled()
  expect(q.delete).not.toHaveBeenCalled()
})
it.each(['update', 'delete'] as const)(
  'a concurrent %s between read and write cannot be reported as success',
  async operation => {
    query(row)
    const q = query(null)
    await expect(
      operation === 'update'
        ? cms.updateContentItem(row.id, { value: 'Stale', expectedRevision: 3 }, 'admin')
        : cms.deleteContentItem(row.id, 'admin', 3)
    ).rejects.toMatchObject({ code: 'CMS_CONFLICT' })
    expect(q.eq).toHaveBeenCalledWith('revision', 3)
    expect(AuditLogService.logAction).not.toHaveBeenCalled()
  }
)
it('rejects an update acknowledgement whose revision did not advance', async () => {
  query(row)
  query({ ...row, value: 'New' })
  await expect(
    cms.updateContentItem(row.id, { value: 'New', expectedRevision: 3 }, 'admin')
  ).rejects.toMatchObject({ code: 'DATABASE_ERROR' })
})
it('does not reverse a confirmed mutation if optional audit logging fails', async () => {
  query(row)
  query({ ...row, value: 'New', revision: 4 })
  jest.mocked(AuditLogService.logAction).mockRejectedValueOnce(new Error('Log failure'))
  await expect(
    cms.updateContentItem(row.id, { value: 'New', expectedRevision: 3 }, 'admin')
  ).resolves.toMatchObject({ revision: 4, value: 'New' })
})
it('resolves a public category name to its ID instead of comparing a name to uuid', async () => {
  query({ id: row.category_id })
  const q = query([row], null, 1)
  await expect(cms.getContentItems('header', 'vi')).resolves.toMatchObject({ total: 1 })
  expect(q.eq).toHaveBeenCalledWith('category_id', row.category_id)
})
it('quotes search punctuation and escapes wildcard characters as literal input', async () => {
  const q = query([], null, 0)
  const search = 'a,b).x%_"\\'
  await cms.getContentItems(undefined, 'vi', search)
  const pattern = JSON.stringify(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  expect(q.or).toHaveBeenCalledWith(`key.imatch.${pattern},value.imatch.${pattern}`)
})
it('uses an exact public key query and detects ambiguous category keys', async () => {
  const q = query([row, { ...row, id: 'other' }], null, 2)
  await expect(publicCms.getPublicContentByKey('title', 'vi')).rejects.toMatchObject({
    code: 'CMS_KEY_AMBIGUOUS',
  })
  expect(q.eq).toHaveBeenCalledWith('key', 'title')
  expect(q.or).not.toHaveBeenCalled()
})
it('does not accept inherited prototype keys as cached database hits', async () => {
  query([])
  const result = await publicCms.getPublicContentItemsByKeys(['constructor', 'toString'], 'vi')
  expect(result.missingKeys).toEqual(['constructor', 'toString'])
})
it('exports beyond the PostgREST page limit with metadata, using actual rows returned', async () => {
  const exportRow = { ...row, content_categories: { name: 'group' }, description: null }
  const first = query(
    Array.from({ length: 500 }, (_, i) => ({ ...exportRow, key: `k${i}` })),
    null,
    501
  )
  const second = query([{ ...exportRow, key: 'last' }], null, 501)
  const result = await cms.exportContent('vi')
  expect(first.range).toHaveBeenCalledWith(0, 499)
  expect(second.range).toHaveBeenCalledWith(500, 999)
  expect(Object.keys(result.categories.group)).toHaveLength(501)
  expect(result.categories.group.last).toEqual({
    value: 'Original',
    type: 'text',
    description: null,
  })
})
it('rejects a failed export page instead of downloading a partial backup', async () => {
  query([{ ...row, content_categories: { name: 'group' } }], null, 2)
  query(null, { message: 'private failure' }, null)
  await expect(cms.exportContent('vi')).rejects.toMatchObject({ code: 'DATABASE_ERROR' })
})
