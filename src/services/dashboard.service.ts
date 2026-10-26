import { supabaseAdmin } from '../db/supabase'
import { errors } from '../middleware/errorHandler'
import { readAllRows } from './read-all-rows'

interface Lesson {
  id: string
  title: string
  lesson_id: string
  chapter_id: string
  updated_at: string | null
  status: string
  starter_code: string | null
  task_description: string | null
  solution_code: string | null
  hint: string | null
}
interface Submission {
  id: string
  user_id: string
  lesson_id: string
  submitted_at: string
  is_correct: boolean
  execution_time: number | null
}
const unavailable = 'Không tải đủ thống kê dashboard. Vui lòng thử lại.'
async function countRows(table: 'user_profiles' | 'pvp_matches') {
  const { count, error } = await supabaseAdmin
    .from(table)
    .select('id', { count: 'exact', head: true })
  if (error || count === null || !Number.isSafeInteger(count) || count < 0)
    throw errors.databaseError(unavailable)
  return count
}

/** Counts are live reads, not a database snapshot. Do not silently return partial totals. */
export async function getDashboardOverview(now = new Date()) {
  const [totalUsers, totalPvPMatches, lessons, submissions, testCases] = await Promise.all([
    countRows('user_profiles'),
    countRows('pvp_matches'),
    readAllRows<Lesson>(
      (offset, end) =>
        supabaseAdmin
          .from('lessons')
          .select(
            'id,title,lesson_id,chapter_id,updated_at,status,starter_code,task_description,solution_code,hint',
            { count: 'exact' }
          )
          .order('updated_at', { ascending: false, nullsFirst: false })
          .order('id', { ascending: false })
          .range(offset, end),
      unavailable
    ),
    readAllRows<Submission>(
      (offset, end) =>
        supabaseAdmin
          .from('lesson_submissions')
          .select('id,user_id,lesson_id,submitted_at,is_correct,execution_time', { count: 'exact' })
          .order('submitted_at', { ascending: false })
          .order('id', { ascending: false })
          .range(offset, end),
      unavailable
    ),
    readAllRows<{ id: string; lesson_id: string }>(
      (offset, end) =>
        supabaseAdmin
          .from('lesson_test_cases')
          .select('id,lesson_id', { count: 'exact' })
          .order('id', { ascending: true })
          .range(offset, end),
      unavailable
    ),
  ])
  const day = 24 * 60 * 60 * 1000
  const vietnamOffset = 7 * 60 * 60 * 1000
  const today = Math.floor((now.getTime() + vietnamOffset) / day) * day - vietnamOffset
  const week = now.getTime() - 7 * day
  let correct = 0,
    elapsed = 0,
    executionSamples = 0,
    submissionsToday = 0,
    submissionsThisWeek = 0
  for (const submission of submissions) {
    const time = Date.parse(submission.submitted_at)
    if (!Number.isFinite(time) || typeof submission.is_correct !== 'boolean')
      throw errors.databaseError(unavailable)
    if (time >= today && time <= now.getTime()) submissionsToday++
    if (time >= week && time <= now.getTime()) submissionsThisWeek++
    if (submission.is_correct) {
      correct++
      if (submission.execution_time !== null) {
        if (
          typeof submission.execution_time !== 'number' ||
          !Number.isFinite(submission.execution_time) ||
          submission.execution_time < 0
        )
          throw errors.databaseError(unavailable)
        elapsed += submission.execution_time
        executionSamples++
      }
    }
  }
  const withTests = new Set(testCases.map(row => row.lesson_id))
  const titles = new Map(lessons.map(row => [row.id, row.title]))
  const completionRate = submissions.length
    ? Math.round((correct / submissions.length) * 100)
    : null
  return {
    totalUsers,
    totalPvPMatches,
    totalLessonsAll: lessons.length,
    totalLessons: lessons.filter(row => row.status === 'published').length,
    draftLessons: lessons.filter(row => row.status === 'draft').length,
    archivedLessons: lessons.filter(row => row.status === 'archived').length,
    totalSubmissions: submissions.length,
    submissionsToday,
    submissionsThisWeek,
    // Kept for old readers; this is submission accuracy, not journey completion.
    completionRate,
    averageExecutionTime: executionSamples ? Math.round(elapsed / executionSamples) : null,
    executionSamples,
    generatedAt: now.toISOString(),
    timeZone: 'Asia/Ho_Chi_Minh',
    contentQuality: {
      lessonsMissingRequiredFields: lessons.filter(row =>
        [row.title, row.starter_code, row.task_description, row.solution_code].some(
          value => !value?.trim()
        )
      ).length,
      lessonsWithoutHint: lessons.filter(row => !row.hint?.trim()).length,
      lessonsWithoutTestCases: lessons.filter(row => !withTests.has(row.id)).length,
    },
    recentLessons: lessons.slice(0, 5).map(({ id, title, lesson_id, chapter_id, updated_at }) => ({
      id,
      title,
      lesson_id,
      chapter_id,
      updated_at,
    })),
    recentFailedSubmissions: submissions
      .filter(row => !row.is_correct)
      .slice(0, 5)
      .map(({ id, user_id, lesson_id, submitted_at }) => ({
        id,
        user_id,
        lesson_id,
        submitted_at,
        lessons: { title: titles.get(lesson_id) ?? null },
      })),
  }
}
