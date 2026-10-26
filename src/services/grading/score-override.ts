import { supabaseAdmin } from '../../db/supabase'
import { AppError, errors } from '../../middleware/errorHandler'
import { awaitAdminWrite } from '../admin-write'
import type { GradingResult, ScoreOverride } from '../grading-orchestrator.service'
import { calculateFinalScore, calculateGradeLevel } from './scores'

export async function overrideSubmissionScore(
  id: string,
  override: ScoreOverride,
  adminId: string
): Promise<Omit<GradingResult, 'executionTime'> & { executionTime: number | null }> {
  const { data: current, error } = await supabaseAdmin
    .from('lesson_submissions')
    .select(
      'id, test_score, ai_score, final_score, grading_method, test_results, ai_analysis, feedback, override_at, graded_at, execution_time, is_correct, lesson_check_receipts(id)'
    )
    .eq('id', id)
    .maybeSingle()
  if (error) throw errors.databaseError('Không tải được bài nộp để điều chỉnh điểm.')
  if (!current) throw errors.notFound('Submission')
  // Receipt-backed deterministic checks are immutable evidence, never an editable legacy grade.
  const receipts = current.lesson_check_receipts
  if (receipts === undefined)
    throw errors.databaseError('Chưa xác nhận được nguồn kết quả kiểm tra.')
  if (receipts !== null && (!Array.isArray(receipts) || receipts.length > 0))
    throw new AppError(
      409,
      'CHECK_RECEIPT_IMMUTABLE',
      'Kết quả kiểm tra Learn không được sửa qua chấm điểm cũ.'
    )
  if (!['test', 'ai', 'both'].includes(current.grading_method))
    throw errors.badRequest('Bài nộp không thuộc luồng chấm điểm cũ.')
  if (typeof current.graded_at !== 'string' || !Number.isFinite(Date.parse(current.graded_at)))
    throw errors.badRequest('Bài nộp chưa có thời điểm chấm hợp lệ.')
  const testScore = override.testScore ?? current.test_score ?? 0
  const aiScore = override.aiScore ?? current.ai_score
  const hasTests =
    Array.isArray(current.test_results?.results) && current.test_results.results.length > 0
  const finalScore =
    override.finalScore ?? calculateFinalScore(testScore, aiScore, current.grading_method, hasTests)
  if (
    ![testScore, finalScore, ...(aiScore === null ? [] : [aiScore])].every(
      score => Number.isFinite(score) && score >= 0 && score <= 100
    )
  )
    throw errors.databaseError('Điểm hiện tại không hợp lệ. Chưa gửi thay đổi.')
  const gradeLevel = calculateGradeLevel(finalScore)
  const feedback = [current.feedback, `[Admin Override] ${override.note}`]
    .filter(Boolean)
    .join('\n\n')
  const values = {
    test_score: testScore,
    ai_score: aiScore,
    final_score: finalScore,
    grade_level: gradeLevel,
    is_correct: finalScore >= 70,
    feedback,
    override_by: adminId,
    override_at: new Date().toISOString(),
    override_note: override.note,
  }
  let query = supabaseAdmin.from('lesson_submissions').update(values).eq('id', id)
  // Compare the server read in the UPDATE itself; concurrent edits cannot silently overwrite it.
  for (const key of [
    'test_score',
    'ai_score',
    'final_score',
    'feedback',
    'override_at',
    'graded_at',
    'grading_method',
    'is_correct',
  ] as const)
    query = current[key] === null ? query.is(key, null) : query.eq(key, current[key])
  const { data: saved, error: writeError } = await awaitAdminWrite(query.select('*').maybeSingle())
  if (writeError)
    throw errors.databaseError('Chưa xác nhận được thay đổi điểm. Hãy tải lại trước khi gửi lại.')
  if (!saved)
    throw new AppError(409, 'SUBMISSION_CHANGED', 'Bài nộp đã thay đổi hoặc bị xóa. Hãy tải lại.')
  if (
    saved.id !== id ||
    Object.entries(values).some(([key, value]) =>
      key === 'override_at'
        ? typeof saved[key] !== 'string' || Date.parse(saved[key]) !== Date.parse(value as string)
        : saved[key] !== value
    )
  )
    throw errors.databaseError('Phản hồi chưa xác nhận đúng thay đổi điểm. Hãy tải lại.')
  return {
    submissionId: saved.id,
    testScore: saved.test_score,
    aiScore: saved.ai_score,
    finalScore: saved.final_score,
    gradeLevel: saved.grade_level,
    feedback: {
      testResults: saved.test_results,
      aiAnalysis: saved.ai_analysis,
      overallFeedback: saved.feedback,
    },
    gradedAt: new Date(saved.graded_at),
    executionTime: saved.execution_time,
  }
}
