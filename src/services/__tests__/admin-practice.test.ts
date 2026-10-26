import { supabaseAdmin } from '../../db/supabase'
import {
  getAdminPracticeStats,
  listAdminPracticeSets,
  patchAdminPracticeSet,
} from '../practice/admin'
jest.mock('../../db/supabase', () => ({ supabaseAdmin: { from: jest.fn() } }))
const row = {
  id: 'set',
  title: 'Set',
  status: 'draft',
  visibility: 'official',
  practice_questions: [{ count: 23 }],
}
function query(data: unknown, count: number | null, error: unknown = null) {
  const result = { data, count, error }
  const q = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    range: jest.fn().mockResolvedValue(result),
    maybeSingle: jest.fn().mockResolvedValue(result),
    then: (resolve: (value: typeof result) => unknown) => Promise.resolve(result).then(resolve),
  }
  jest.mocked(supabaseAdmin.from).mockReturnValue(q as never)
  return q
}
beforeEach(() => jest.resetAllMocks())
it('keeps the total when an offset is past the last page', async () => {
  query([], 8)
  await expect(listAdminPracticeSets({ offset: 20 })).resolves.toMatchObject({
    items: [],
    total: 8,
    offset: 20,
  })
})
it('uses the aggregate question count without fetching answer rows', async () => {
  const q = query([row], 1)
  const result = await listAdminPracticeSets({ status: 'all' })
  expect(result.items[0]).toMatchObject({ questionCount: 23 })
  expect(supabaseAdmin.from).toHaveBeenCalledTimes(1)
  expect(q.order).toHaveBeenCalledWith('id', { ascending: false })
  expect(result.items[0].questions).toBeUndefined()
})
it.each([
  [null, 0],
  [[], null],
  [[{ ...row, practice_questions: [] }], 1],
])('rejects missing catalog data/counts (%#)', async (data, count) => {
  query(data, count as number | null)
  await expect(listAdminPracticeSets({})).rejects.toMatchObject({
    code: 'DATABASE_ERROR',
    details: undefined,
  })
})
it('a stale status selection is tested within the write', async () => {
  const q = query(null, 0)
  await expect(
    patchAdminPracticeSet('set', { status: 'published' }, { status: 'draft' })
  ).rejects.toMatchObject({ code: 'PRACTICE_CHANGED', statusCode: 409 })
  expect(q.eq.mock.calls).toEqual([
    ['id', 'set'],
    ['status', 'draft'],
  ])
})
it('a visibility change must acknowledge both visibility and owner type', async () => {
  query({ ...row, owner_type: 'user' }, 1)
  await expect(
    patchAdminPracticeSet(
      'set',
      { visibility: 'official', owner_type: 'official' },
      { visibility: 'private' }
    )
  ).rejects.toMatchObject({ code: 'DATABASE_ERROR' })
})
it('statistics cover every capped page and preserve real zero attempt/submission counts', async () => {
  jest.mocked(supabaseAdmin.from).mockImplementation(table => {
    if (table !== 'practice_sets') return query([], 0) as never
    const rows = [row, { ...row, id: 'set2', status: 'published', visibility: 'public' }]
    return {
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: (offset: number) =>
        Promise.resolve({ data: rows.slice(offset, offset + 1), count: 2, error: null }),
    } as never
  })
  await expect(getAdminPracticeStats()).resolves.toMatchObject({
    totalSets: 2,
    officialSets: 1,
    publishedSets: 1,
    draftSets: 1,
    totalAttempts: 0,
    totalSubmissions: 0,
  })
})
