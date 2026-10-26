import { supabaseAdmin } from '../../db/supabase'
import { readAdminSubmissions, readAdminSubmissionsPage } from '../admin-submissions.service'
jest.mock('../../db/supabase', () => ({ supabaseAdmin: { from: jest.fn() } }))
beforeEach(() => jest.resetAllMocks())
it('fills the requested window across a lower API row cap without reading every historic submission', async () => {
  const queries: Array<{ range: jest.Mock; eq: jest.Mock; order: jest.Mock }> = []
  jest.mocked(supabaseAdmin.from).mockImplementation(() => {
    const q = {
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      then: (resolve: (value: unknown) => unknown) =>
        Promise.resolve({ data: [{ id: String(queries.length) }], count: 100, error: null }).then(
          resolve
        ),
    }
    queries.push(q)
    return q as never
  })
  await expect(readAdminSubmissions('pass', 2)).resolves.toHaveLength(2)
  expect(queries).toHaveLength(2)
  expect(queries.map(q => q.range.mock.calls[0])).toEqual([
    [0, 1],
    [1, 1],
  ])
  expect(queries[0].eq).toHaveBeenCalledWith('is_correct', true)
  expect(queries[0].order).toHaveBeenCalledWith('id', { ascending: false })
})
it('never turns a submission read failure into an empty list', async () => {
  const q = {
    select: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    then: (resolve: (value: unknown) => unknown) =>
      Promise.resolve({ data: null, count: null, error: { message: 'private' } }).then(resolve),
  }
  jest.mocked(supabaseAdmin.from).mockReturnValue(q as never)
  await expect(readAdminSubmissions('all', 75)).rejects.toMatchObject({
    code: 'DATABASE_ERROR',
    details: undefined,
  })
})

it('reads a filtered page beyond the old 75-row window and fills a lower database row cap', async () => {
  const ranges: number[][] = []
  const eq = jest.fn().mockReturnThis()
  jest.mocked(supabaseAdmin.from).mockImplementation(() => {
    let start = 0,
      end = 0
    const query = {
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      eq,
      range: jest.fn(function (this: unknown, a: number, b: number) {
        start = a
        end = b
        ranges.push([a, b])
        return this
      }),
      then: (resolve: (value: unknown) => unknown) =>
        Promise.resolve({
          data: Array.from({ length: Math.min(7, end - start + 1) }, (_, i) => ({
            id: String(start + i),
          })),
          count: 245,
          error: null,
        }).then(resolve),
    }
    return query as never
  })
  const page = await readAdminSubmissionsPage('fail', 20, 80)
  expect(page).toMatchObject({ total: 245, limit: 20, offset: 80 })
  expect(page.items.map(item => item.id)).toEqual(
    Array.from({ length: 20 }, (_, i) => String(i + 80))
  )
  expect(ranges).toEqual([
    [80, 99],
    [87, 99],
    [94, 99],
  ])
  expect(eq).toHaveBeenCalledTimes(3)
  expect(eq).toHaveBeenCalledWith('is_correct', false)
})

it.each([0, 2])(
  'returns an empty requested page after data shrinks to %i records, with its exact total',
  async total => {
    const query = {
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      then: (resolve: (value: unknown) => unknown) =>
        Promise.resolve({ data: [], count: total, error: null }).then(resolve),
    }
    jest.mocked(supabaseAdmin.from).mockReturnValue(query as never)
    await expect(readAdminSubmissionsPage('all', 20, 20)).resolves.toEqual({
      items: [],
      total,
      limit: 20,
      offset: 20,
    })
  }
)

it('rejects a partial page if the count changes while filling the window', async () => {
  let calls = 0
  const query = {
    select: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    then: (resolve: (value: unknown) => unknown) => {
      calls++
      return Promise.resolve({
        data: [{ id: String(calls) }],
        count: calls === 1 ? 50 : 51,
        error: null,
      }).then(resolve)
    },
  }
  jest.mocked(supabaseAdmin.from).mockReturnValue(query as never)
  await expect(readAdminSubmissionsPage('all', 20, 20)).rejects.toMatchObject({
    code: 'DATABASE_ERROR',
  })
})
