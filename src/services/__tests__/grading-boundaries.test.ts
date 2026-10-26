import { supabaseAdmin } from '../../db/supabase'
import { readPublishedGradingContext } from '../grading/lesson-context'
import { readSubmissionHistory } from '../grading/submission-history'
import { generateLessonHint } from '../grading/hint'
import { aiAnalyzerService } from '../ai-analyzer.service'

jest.mock('../../db/supabase', () => ({ supabaseAdmin: { from: jest.fn() } }))
jest.mock('../ai-analyzer.service', () => ({ aiAnalyzerService: { generateHint: jest.fn() } }))
beforeEach(() => jest.resetAllMocks())

function context(data: unknown, error: unknown = null) {
  const q = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue({ data, error }),
  }
  jest.mocked(supabaseAdmin.from).mockReturnValue(q as never)
  return q
}
const lesson = {
  id: 'lesson',
  title: 'Server title',
  task_description: 'Server task',
  insight: 'Server insight',
  starter_code: 'server()',
  grading_mode: 'function',
  chapters: { language_id: 'javascript' },
}

it('uses persisted context and language for both modern and legacy hint routes', async () => {
  const q = context(lesson)
  jest.mocked(aiAnalyzerService.generateHint).mockResolvedValue({ hint: 'A hint' })
  await expect(
    generateLessonHint('lesson', {
      code: 'student()',
      language: 'javascript',
      outputLogs: ['error'],
      exerciseTitle: 'Forged',
      starterCode: 'Forged',
    } as never)
  ).resolves.toEqual({ hint: 'A hint' })
  expect(q.eq).toHaveBeenCalledWith('status', 'published')
  expect(aiAnalyzerService.generateHint).toHaveBeenCalledWith({
    exerciseTitle: 'Server title',
    exerciseQuestion: 'Server task',
    lessonInsight: 'Server insight',
    starterCode: 'server()',
    gradingMode: 'function',
    code: 'student()',
    language: 'javascript',
    outputLogs: ['error'],
  })
})
it('fails on context read errors without calling AI or claiming the lesson is absent', async () => {
  context(null, { message: 'private DB detail' })
  await expect(
    generateLessonHint('lesson', { code: 'x', language: 'javascript' })
  ).rejects.toMatchObject({ statusCode: 500, code: 'DATABASE_ERROR' })
  expect(aiAnalyzerService.generateHint).not.toHaveBeenCalled()
})
it('returns 404 only for an absent published lesson', async () => {
  context(null)
  await expect(readPublishedGradingContext('lesson')).rejects.toMatchObject({ statusCode: 404 })
})
it('rejects a mismatched language before AI work', async () => {
  context(lesson)
  await expect(
    generateLessonHint('lesson', { code: 'x', language: 'python' })
  ).rejects.toMatchObject({ statusCode: 400 })
  expect(aiAnalyzerService.generateHint).not.toHaveBeenCalled()
})
it.each([
  { ...lesson, chapters: [] },
  { ...lesson, grading_mode: 'unknown' },
])('does not invent a missing language or grading configuration', async invalid => {
  context(invalid)
  await expect(readPublishedGradingContext('lesson')).rejects.toMatchObject({ statusCode: 500 })
})

function history(
  scores: Array<number | null>,
  options: { fail?: 'stats' | 'page'; count?: number } = {}
) {
  const queries: any[] = []
  jest.mocked(supabaseAdmin.from).mockImplementation(() => {
    let projection = ''
    const q = {
      select: jest.fn((fields: string): any => {
        projection = fields
        return q
      }),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn((offset: number, end: number) => {
        const stats = projection === 'id, final_score'
        const rows = scores.map((final_score, id) => ({
          id: String(id),
          final_score,
          grading_method: null,
        }))
        return Promise.resolve({
          data: rows.slice(offset, Math.min(offset + 1, end + 1)),
          count: stats ? scores.length : (options.count ?? scores.length),
          error: options.fail === (stats ? 'stats' : 'page') ? { message: 'Offline' } : null,
        })
      }),
    }
    queries.push(q)
    return q as never
  })
  return queries
}
it('reads scores and a full requested page even when PostgREST caps each response to one row', async () => {
  const queries = history([null, 0, 100, 50])
  const result = await readSubmissionHistory('owner', 'lesson', 2, 2)
  expect(result).toMatchObject({
    bestScore: 100,
    averageScore: 50,
    totalAttempts: 4,
    page: 2,
    limit: 2,
  })
  expect(result.submissions.map(row => row.id)).toEqual(['2', '3'])
  expect(result.submissions[0].gradingMethod).toBeNull()
  for (const q of queries) {
    expect(q.eq.mock.calls).toEqual([
      ['user_id', 'owner'],
      ['lesson_id', 'lesson'],
    ])
    expect(q.order).toHaveBeenCalledWith('id', expect.anything())
  }
})
it.each([{ scores: [] }, { scores: [null, null] }])(
  'distinguishes no scored attempts from a genuine zero score (%j)',
  async ({ scores }) => {
    history(scores)
    await expect(readSubmissionHistory('owner', 'lesson', 1, 10)).resolves.toMatchObject({
      bestScore: null,
      averageScore: null,
      totalAttempts: scores.length,
    })
  }
)
it('keeps zero scores and the total when requesting a page beyond the last attempt', async () => {
  history([0])
  await expect(readSubmissionHistory('owner', 'lesson', 2, 10)).resolves.toMatchObject({
    submissions: [],
    bestScore: 0,
    averageScore: 0,
    totalAttempts: 1,
  })
})
it.each(['stats', 'page'] as const)(
  'does not replace a failed %s read with empty/zero history',
  async fail => {
    history([100], { fail })
    await expect(readSubmissionHistory('owner', 'lesson', 1, 10)).rejects.toMatchObject({
      code: 'DATABASE_ERROR',
    })
  }
)
it('rejects a count change between stats and the requested page', async () => {
  history([100], { count: 2 })
  await expect(readSubmissionHistory('owner', 'lesson', 1, 10)).rejects.toMatchObject({
    code: 'DATABASE_ERROR',
  })
})
it.each([-1, 101, NaN])('rejects malformed stored scores (%s)', async score => {
  history([score])
  await expect(readSubmissionHistory('owner', 'lesson', 1, 10)).rejects.toMatchObject({
    code: 'DATABASE_ERROR',
  })
})
it.each([
  [0, 10],
  [1, 0],
  [1, 51],
  [1.2, 10],
])('rejects an invalid history window (%s, %s) before I/O', async (page, limit) => {
  await expect(readSubmissionHistory('owner', 'lesson', page, limit)).rejects.toMatchObject({
    statusCode: 400,
  })
  expect(supabaseAdmin.from).not.toHaveBeenCalled()
})
