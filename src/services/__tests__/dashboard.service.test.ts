import { getDashboardOverview } from '../dashboard.service'
import { supabaseAdmin } from '../../db/supabase'

jest.mock('../../db/supabase', () => ({ supabaseAdmin: { from: jest.fn() } }))
jest.mock('../../utils/logger', () => ({ logger: { error: jest.fn() } }))
const lesson = {
  id: 'lesson',
  title: 'Title',
  lesson_id: 'intro',
  chapter_id: 'chapter',
  updated_at: null,
  status: 'published',
  starter_code: 'code',
  task_description: 'task',
  solution_code: 'solution',
  hint: 'hint',
}
const attempt = {
  id: 'attempt',
  user_id: 'learner',
  lesson_id: 'lesson',
  submitted_at: '2026-10-22T17:00:00Z',
  is_correct: true,
  execution_time: 0,
}
function fixture(rows: Record<string, unknown[]> = {}, failure?: string) {
  jest.mocked(supabaseAdmin.from).mockImplementation((table: string) => {
    const data = rows[table] ?? []
    const result = {
      data,
      count: data.length,
      error: table === failure ? { message: 'private' } : null,
    }
    const q = {
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn((offset: number) =>
        Promise.resolve({ ...result, data: data.slice(offset, offset + 1) })
      ),
      then: (resolve: (value: typeof result) => unknown) => Promise.resolve(result).then(resolve),
    }
    return q as never
  })
}
beforeEach(() => jest.resetAllMocks())
it('uses every capped page, preserves 0ms, and uses Vietnam midnight and an exact rolling 7 days', async () => {
  fixture({
    lessons: [lesson, { ...lesson, id: 'draft', status: 'draft', hint: null, solution_code: null }],
    lesson_test_cases: [{ id: 'case', lesson_id: 'lesson' }],
    user_profiles: [{ id: 'user' }],
    lesson_submissions: [
      attempt,
      {
        ...attempt,
        id: 'before-midnight',
        submitted_at: '2026-10-22T16:59:59Z',
        execution_time: 20,
      },
      {
        ...attempt,
        id: 'old',
        submitted_at: '2026-10-16T00:00:00Z',
        is_correct: false,
        execution_time: null,
      },
    ],
  })
  const stats = await getDashboardOverview(new Date('2026-10-23T02:00:00Z'))
  expect(stats).toMatchObject({
    totalUsers: 1,
    totalLessonsAll: 2,
    totalLessons: 1,
    draftLessons: 1,
    totalSubmissions: 3,
    submissionsToday: 1,
    submissionsThisWeek: 2,
    completionRate: 67,
    averageExecutionTime: 10,
    executionSamples: 2,
    contentQuality: {
      lessonsWithoutHint: 1,
      lessonsWithoutTestCases: 1,
      lessonsMissingRequiredFields: 1,
    },
  })
  expect(stats.recentLessons[0].updated_at).toBeNull()
})
it('distinguishes no samples from a measured zero', async () => {
  fixture()
  await expect(getDashboardOverview()).resolves.toMatchObject({
    totalSubmissions: 0,
    completionRate: null,
    averageExecutionTime: null,
    executionSamples: 0,
  })
})
it.each(['user_profiles', 'pvp_matches', 'lessons', 'lesson_submissions', 'lesson_test_cases'])(
  'does not produce reassuring zeros when %s is unavailable',
  async table => {
    fixture({}, table)
    await expect(getDashboardOverview()).rejects.toMatchObject({ code: 'DATABASE_ERROR' })
  }
)
it('rejects malformed execution metrics instead of publishing NaN', async () => {
  fixture({ lesson_submissions: [{ ...attempt, execution_time: -5 }] })
  await expect(getDashboardOverview()).rejects.toMatchObject({ code: 'DATABASE_ERROR' })
})
