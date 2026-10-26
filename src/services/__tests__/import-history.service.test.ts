import { ImportHistoryService } from '../import-history.service'
import { supabaseAdmin } from '../../db/supabase'

jest.mock('../../db/supabase', () => ({ supabaseAdmin: { from: jest.fn() } }))
jest.mock('../../utils/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}))

describe('import history read boundaries', () => {
  it('also follows a database row cap lower than the requested page size', async () => {
    const row = { status: 'success', lessons_count: 1, test_cases_count: 0 }
    range
      .mockResolvedValueOnce({ data: [row, row], count: 3, error: null })
      .mockResolvedValueOnce({ data: [row], count: 3, error: null })
    await expect(ImportHistoryService.getStats()).resolves.toMatchObject({
      totalImports: 3,
      totalLessonsImported: 3,
    })
    expect(range.mock.calls).toEqual([
      [0, 499],
      [2, 501],
    ])
  })
  const range = jest.fn()
  const query = { select: jest.fn(), order: jest.fn(), eq: jest.fn(), range }
  beforeEach(() => {
    jest.resetAllMocks()
    query.select.mockReturnValue(query)
    query.order.mockReturnValue(query)
    query.eq.mockReturnValue(query)
    jest.mocked(supabaseAdmin.from).mockReturnValue(query as never)
  })

  it.each(['getHistory', 'getStats'] as const)(
    '%s reports database failure instead of a successful empty result',
    async method => {
      range.mockResolvedValue({ data: null, count: null, error: { message: 'private detail' } })
      await expect(ImportHistoryService[method]()).rejects.toMatchObject({
        statusCode: 500,
        code: 'DATABASE_ERROR',
      })
    }
  )
  it('distinguishes a real empty history from a missing count', async () => {
    range.mockResolvedValueOnce({ data: [], count: 0, error: null })
    await expect(
      ImportHistoryService.getHistory({ status: 'failed', limit: 25, offset: 50 })
    ).resolves.toEqual({ data: [], count: 0 })
    expect(range).toHaveBeenCalledWith(50, 74)
    expect(query.eq).toHaveBeenCalledWith('status', 'failed')
    range.mockResolvedValueOnce({ data: [], count: null, error: null })
    await expect(ImportHistoryService.getHistory()).rejects.toMatchObject({
      code: 'DATABASE_ERROR',
    })
  })
  it('counts beyond the PostgREST page cap, including partial records', async () => {
    const row = { status: 'success', lessons_count: 2, test_cases_count: 3 }
    range
      .mockResolvedValueOnce({ data: Array(500).fill(row), count: 1001, error: null })
      .mockResolvedValueOnce({ data: Array(500).fill(row), count: 1001, error: null })
      .mockResolvedValueOnce({
        data: [{ status: 'partial', lessons_count: 1, test_cases_count: 0 }],
        count: 1001,
        error: null,
      })
    await expect(ImportHistoryService.getStats()).resolves.toEqual({
      totalImports: 1001,
      successfulImports: 1001,
      failedImports: 0,
      totalLessonsImported: 2001,
      totalTestCasesImported: 3000,
    })
    expect(range.mock.calls).toEqual([
      [0, 499],
      [500, 999],
      [1000, 1499],
    ])
  })
  it.each([
    { data: [], count: 501, error: null },
    { data: [], count: 500, error: { message: 'failed on page 2' } },
  ])(
    'rejects an incomplete/changing second page instead of reporting partial totals',
    async second => {
      range
        .mockResolvedValueOnce({
          data: Array(500).fill({ status: 'failed', lessons_count: 0, test_cases_count: 0 }),
          count: 501,
          error: null,
        })
        .mockResolvedValueOnce(second)
      await expect(ImportHistoryService.getStats()).rejects.toMatchObject({
        code: 'DATABASE_ERROR',
      })
    }
  )
})
