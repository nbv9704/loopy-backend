import { supabaseAdmin } from '../../db/supabase'
import { overrideSubmissionScore } from '../grading/score-override'
import { readGradingUsage } from '../grading/usage'

jest.mock('../../db/supabase', () => ({ supabaseAdmin: { from: jest.fn() } }))
beforeEach(() => jest.resetAllMocks())
const original = {
  id: 'submission',
  test_score: 0,
  ai_score: 100,
  final_score: 100,
  grading_method: 'both',
  test_results: null,
  ai_analysis: {},
  feedback: null,
  override_at: null,
  graded_at: '2026-10-23T00:00:00.000Z',
  execution_time: null,
  is_correct: true,
  lesson_check_receipts: [],
}
function mockOverride(
  options: {
    current?: unknown
    readError?: boolean
    saved?: 'absent' | 'wrong' | 'timestamp'
    writeError?: boolean
  } = {}
) {
  let patch: Record<string, unknown> = {}
  const read = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue({
      data: options.current === undefined ? original : options.current,
      error: options.readError ? { message: 'Offline' } : null,
    }),
  }
  const write = {
    update: jest.fn((values: Record<string, unknown>): any => {
      patch = values
      return write
    }),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn(async () => ({
      data:
        options.saved === 'absent'
          ? null
          : {
              ...original,
              ...patch,
              ...(options.saved === 'wrong' ? { final_score: 99 } : {}),
              ...(options.saved === 'timestamp'
                ? { override_at: String(patch.override_at).replace('Z', '+00:00') }
                : {}),
            },
      error: options.writeError ? { message: 'Offline' } : null,
    })),
  }
  jest
    .mocked(supabaseAdmin.from)
    .mockReturnValueOnce(read as never)
    .mockReturnValueOnce(write as never)
  return write
}
it('recomputes AI-only fallback correctly, persists is_correct, compares nullable fields and returns saved timing', async () => {
  const q = mockOverride()
  const result = await overrideSubmissionScore(
    'submission',
    { aiScore: 50, note: 'Review' },
    'admin'
  )
  expect(result).toMatchObject({ finalScore: 50, gradeLevel: 'poor', executionTime: null })
  expect(q.update).toHaveBeenCalledWith(
    expect.objectContaining({
      is_correct: false,
      ai_score: 50,
      final_score: 50,
      override_by: 'admin',
    })
  )
  expect(q.is).toHaveBeenCalledWith('feedback', null)
  expect(q.is).toHaveBeenCalledWith('override_at', null)
  expect(q.eq).toHaveBeenCalledWith('final_score', 100)
  expect(q.eq).toHaveBeenCalledWith('is_correct', true)
})
it.each([{ receipts: [{ id: 'receipt' }] }, { receipts: { id: 'receipt' } }])(
  'never edits a modern receipt-backed check (%j)',
  async ({ receipts }) => {
    const q = mockOverride({ current: { ...original, lesson_check_receipts: receipts } })
    await expect(
      overrideSubmissionScore('submission', { finalScore: 100, note: 'Review' }, 'admin')
    ).rejects.toMatchObject({ code: 'CHECK_RECEIPT_IMMUTABLE' })
    expect(q.update).not.toHaveBeenCalled()
  }
)
it('does not assume receipt provenance when the relation is missing from the response', async () => {
  const q = mockOverride({ current: { ...original, lesson_check_receipts: undefined } })
  await expect(
    overrideSubmissionScore('submission', { finalScore: 100, note: 'Review' }, 'admin')
  ).rejects.toBeDefined()
  expect(q.update).not.toHaveBeenCalled()
})
it.each([{ readError: true }, { writeError: true }, { saved: 'wrong' as const }])(
  'does not claim an unconfirmed score update succeeded (%j)',
  async options => {
    mockOverride(options)
    await expect(
      overrideSubmissionScore('submission', { finalScore: 50, note: 'Review' }, 'admin')
    ).rejects.toMatchObject({ code: 'DATABASE_ERROR' })
  }
)
it('returns a conflict when another admin changed or removed the row after the read', async () => {
  mockOverride({ saved: 'absent' })
  await expect(
    overrideSubmissionScore('submission', { finalScore: 50, note: 'Review' }, 'admin')
  ).rejects.toMatchObject({ statusCode: 409, code: 'SUBMISSION_CHANGED' })
})
it('distinguishes a missing submission from a failed read', async () => {
  mockOverride({ current: null })
  await expect(
    overrideSubmissionScore('submission', { finalScore: 50, note: 'Review' }, 'admin')
  ).rejects.toMatchObject({ statusCode: 404 })
})

function usage(rows: unknown[], fail = false) {
  const q = {
    select: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    range: jest.fn((offset: number) =>
      Promise.resolve({
        data: rows.slice(offset, offset + 1),
        count: rows.length,
        error: fail ? { message: 'Offline' } : null,
      })
    ),
  }
  jest.mocked(supabaseAdmin.from).mockReturnValue(q as never)
  return q
}
it('reads capped usage pages, preserves unknown/zero metrics and exposes a bounded UTC period', async () => {
  const q = usage([
    { id: 'a', total_tokens: 10, cache_hit: true, response_time: 0 },
    { id: 'b', total_tokens: null, cache_hit: null, response_time: null },
    { id: 'c', total_tokens: 20, cache_hit: false, response_time: 10 },
  ])
  const result = await readGradingUsage(new Date('2026-10-23T13:00:00Z'))
  expect(result.today).toMatchObject({
    totalRequests: 3,
    totalTokens: 30,
    cacheUnknown: 1,
    cacheHits: 1,
    cacheMisses: 1,
    cacheHitRate: 0.5,
    avgResponseTime: 5,
    responseTimeSamples: 2,
    tokenSamples: 2,
  })
  expect(result.limits.dailyTokenLimit).toBeNull()
  expect(q.gte).toHaveBeenCalledWith('created_at', '2026-10-23T00:00:00.000Z')
  expect(q.lt).toHaveBeenCalledWith('created_at', '2026-10-24T00:00:00.000Z')
})
it('does not invent zero latency when there are no measured usage events', async () => {
  usage([])
  await expect(readGradingUsage()).resolves.toMatchObject({
    today: { avgResponseTime: null, cacheHitRate: null, totalRequests: 0 },
  })
})
it.each([true, false])(
  'rejects a usage read error or malformed recorded metrics (%s)',
  async fail => {
    usage([{ id: 'a', total_tokens: -1, cache_hit: false, response_time: 1 }], fail)
    await expect(readGradingUsage()).rejects.toMatchObject({ code: 'DATABASE_ERROR' })
  }
)

it('accepts the same persisted timestamp returned with a PostgreSQL UTC offset', async () => {
  mockOverride({ saved: 'timestamp' })
  await expect(
    overrideSubmissionScore('submission', { finalScore: 0, note: 'Review' }, 'admin')
  ).resolves.toMatchObject({ finalScore: 0 })
})
