import { supabaseAdmin } from '../../db/supabase'
import { confirmEmptyRange } from '../empty-range'
import { readAdminSubmissionsPage } from '../admin-submissions.service'
import { AuditLogService } from '../audit-log.service'
import { ImportHistoryService } from '../import-history.service'
import { queryCmsItems } from '../cms/query'

jest.mock('../../db/supabase', () => ({ supabaseAdmin: { from: jest.fn() } }))
beforeEach(() => jest.resetAllMocks())

it.each([
  { count: null, error: null },
  { count: -1, error: null },
  { count: 1.5, error: null },
  { count: 21, error: null },
  { count: 0, error: { code: 'DB_DOWN' } },
])('never invents an empty page from an unavailable or contradictory count', async result => {
  await expect(
    confirmEmptyRange(20, () => Promise.resolve(result), 'Cannot read page')
  ).rejects.toMatchObject({ code: 'DATABASE_ERROR' })
})

it('does not use empty-page recovery for the first page', async () => {
  const count = jest.fn().mockResolvedValue({ count: 0, error: null })
  await expect(confirmEmptyRange(0, count, 'Cannot read page')).rejects.toMatchObject({
    code: 'DATABASE_ERROR',
  })
  expect(count).not.toHaveBeenCalled()
})

class Query {
  head = false
  select = jest.fn((_columns: string, options?: { head?: boolean }) => {
    this.head = !!options?.head
    return this
  })
  order = jest.fn().mockReturnThis()
  eq = jest.fn().mockReturnThis()
  or = jest.fn().mockReturnThis()
  range = jest.fn().mockReturnThis()
  then(resolve: (result: unknown) => unknown) {
    return Promise.resolve(
      this.head
        ? { data: null, count: 1, error: null }
        : { data: null, count: null, error: { code: 'PGRST103' } }
    ).then(resolve)
  }
}

const cases = [
  {
    name: 'audit',
    run: () =>
      AuditLogService.getLogs({ action: 'delete', resourceType: 'lesson', limit: 20, offset: 20 }),
    result: { data: [], count: 1 },
  },
  {
    name: 'history',
    run: () =>
      ImportHistoryService.getHistory({
        status: 'failed',
        chapterId: 'chapter',
        limit: 20,
        offset: 20,
      }),
    result: { data: [], count: 1 },
  },
  {
    name: 'CMS',
    run: () =>
      queryCmsItems('id,key', '11111111-1111-4111-8111-111111111111', 'vi', 'footer.*', 20, 20),
    result: { items: [], total: 1 },
  },
  {
    name: 'submissions',
    run: () => readAdminSubmissionsPage('fail', 20, 20),
    result: { items: [], total: 1, offset: 20, limit: 20 },
  },
]

it.each(cases)(
  '$name confirms a real 416 with a HEAD count using the same full-collection filters',
  async item => {
    const queries: Query[] = []
    jest.mocked(supabaseAdmin.from).mockImplementation(() => {
      const q = new Query()
      queries.push(q)
      return q as never
    })
    await expect(item.run()).resolves.toEqual(item.result)
    expect(queries).toHaveLength(2)
    expect(queries[1].select).toHaveBeenCalledWith(expect.any(String), {
      count: 'exact',
      head: true,
    })
    expect(queries[1].eq.mock.calls).toEqual(queries[0].eq.mock.calls)
    expect(queries[1].or.mock.calls).toEqual(queries[0].or.mock.calls)
    expect(queries[1].range).not.toHaveBeenCalled()
  }
)
