import { supabaseAdmin } from '../../db/supabase'
import { errors } from '../../middleware/errorHandler'
import type { SubmissionHistory, SubmissionSummary } from '../grading-orchestrator.service'
import { readAllRows } from '../read-all-rows'

const message = 'Không tải đủ lịch sử bài nộp. Vui lòng thử lại.'

export async function readSubmissionHistory(
  userId: string,
  lessonId: string,
  page: number,
  limit: number
): Promise<SubmissionHistory> {
  if (
    !Number.isInteger(page) ||
    page < 1 ||
    page > 1000 ||
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 50
  )
    throw errors.badRequest('Trang lịch sử không hợp lệ.')

  // Include ungraded attempts in the total, but never pretend they received a zero score.
  const scores = await readAllRows<{ id: string; final_score: number | null }>(
    (offset, end) =>
      supabaseAdmin
        .from('lesson_submissions')
        .select('id, final_score', { count: 'exact' })
        .eq('user_id', userId)
        .eq('lesson_id', lessonId)
        .order('id', { ascending: true })
        .range(offset, end),
    message
  )
  const offset = (page - 1) * limit
  const submissions = await readAllRows<Record<string, any> & { id: string }>(
    async (start, end) => {
      const result = await supabaseAdmin
        .from('lesson_submissions')
        .select(
          'id, code, test_score, ai_score, final_score, grade_level, grading_method, graded_at, submitted_at',
          { count: 'exact' }
        )
        .eq('user_id', userId)
        .eq('lesson_id', lessonId)
        .order('submitted_at', { ascending: false })
        .order('id', { ascending: false })
        .range(offset + start, offset + Math.min(end, limit - 1))
      if (result.count !== scores.length) throw errors.databaseError(message)
      return { ...result, count: Math.max(0, Math.min(limit, scores.length - offset)) }
    },
    message
  )

  const graded = scores.flatMap(row => {
    if (row.final_score === null) return []
    if (!Number.isFinite(row.final_score) || row.final_score < 0 || row.final_score > 100)
      throw errors.databaseError(message)
    return [row.final_score]
  })
  return {
    submissions: submissions.map((row): SubmissionSummary => ({
      id: row.id,
      code: row.code,
      testScore: row.test_score,
      aiScore: row.ai_score,
      finalScore: row.final_score,
      gradeLevel: row.grade_level,
      gradingMethod: row.grading_method ?? null,
      gradedAt: row.graded_at,
      submittedAt: row.submitted_at,
    })),
    bestScore: graded.length ? graded.reduce((best, score) => Math.max(best, score), 0) : null,
    averageScore: graded.length
      ? Math.round(graded.reduce((sum, score) => sum + score, 0) / graded.length)
      : null,
    totalAttempts: scores.length,
    page,
    limit,
  }
}
