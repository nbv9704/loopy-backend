import { supabaseAdmin } from '../../db/supabase'
import { clearKeywordCache, containsBannedKeywords, loadKeywords } from '../contentModeration'

jest.mock('../../db/supabase', () => ({ supabaseAdmin: { from: jest.fn() } }))
jest.mock('../logger', () => ({ logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() } }))

function keywords(values: string[]) {
  clearKeywordCache()
  const query = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    range: jest.fn().mockResolvedValue({
      data: values.map((keyword, index) => ({ id: String(index), keyword })),
      count: values.length,
      error: null,
    }),
  }
  jest.mocked(supabaseAdmin.from).mockReturnValue(query as never)
}

it.each(['c++', '[blocked]', 'a.b'])(
  'treats keyword %s as literal text, never as a regular expression',
  async keyword => {
    keywords([keyword])
    await expect(containsBannedKeywords(`before ${keyword} after`)).resolves.toEqual({
      found: true,
      matches: [keyword],
    })
  }
)

it('does not let a dot keyword match arbitrary characters', async () => {
  keywords(['a.b'])
  await expect(containsBannedKeywords('aXb')).resolves.toEqual({ found: false, matches: [] })
})

it('normalizes both the Vietnamese keyword and text while preserving readable feedback', async () => {
  keywords(['Đồ tệ'])
  await expect(containsBannedKeywords('DO TE')).resolves.toEqual({
    found: true,
    matches: ['đồ tệ'],
  })
})

it('keeps whole-word matching and ignores whitespace-only legacy keywords', async () => {
  keywords(['test', '   '])
  await expect(containsBannedKeywords('testing')).resolves.toEqual({ found: false, matches: [] })
})

it('does not resurrect a cached dictionary from a read started before an admin change', async () => {
  clearKeywordCache()
  let release!: (value: unknown) => void
  const pending = new Promise(resolve => {
    release = resolve
  })
  const query = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    range: jest
      .fn()
      .mockReturnValueOnce(pending)
      .mockResolvedValue({ data: [{ id: 'new', keyword: 'fresh' }], count: 1, error: null }),
  }
  jest.mocked(supabaseAdmin.from).mockReturnValue(query as never)
  const first = loadKeywords()
  clearKeywordCache()
  release({ data: [{ id: 'old', keyword: 'stale' }], count: 1, error: null })
  await expect(first).resolves.toEqual(['fresh'])
  await expect(loadKeywords()).resolves.toEqual(['fresh'])
  expect(query.range).toHaveBeenCalledTimes(2)
})

it('keeps the existing fail-open policy on read errors but never caches that error as an empty dictionary', async () => {
  clearKeywordCache()
  const query = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    range: jest
      .fn()
      .mockResolvedValueOnce({ data: null, count: null, error: { message: 'offline' } })
      .mockResolvedValueOnce({ data: [{ id: 'id', keyword: 'blocked' }], count: 1, error: null }),
  }
  jest.mocked(supabaseAdmin.from).mockReturnValue(query as never)
  await expect(loadKeywords()).resolves.toEqual([])
  await expect(loadKeywords()).resolves.toEqual(['blocked'])
})
