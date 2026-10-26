import { z } from 'zod'
import { supabaseAdmin } from '../../db/supabase'
import { AppError, errors } from '../../middleware/errorHandler'
import type { LessonCheckResult } from '../lesson-check.service'

const id = z.string().min(1)
const receipt = z.object({
  id,
  user_id: id,
  lesson_id: id,
  passed: z.boolean(),
  content_revision: z.number().int().positive(),
})
const completion = z
  .object({
    id,
    status: z.literal('completed'),
    completed_at: z.string().datetime({ offset: true }).nullable(),
    time_spent: z.number().int().nonnegative().nullable(),
    was_first_completion: z.boolean(),
  })
  .refine(saved => !saved.was_first_completion || saved.completed_at !== null)

function transactionError(error: { code?: string } | null, message: string) {
  if (!error) return
  if (['PGRST202', '42883', '42703'].includes(error.code || ''))
    throw new AppError(
      503,
      'SCHEMA_NOT_READY',
      'Bài học tạm thời chưa sẵn sàng. Vui lòng thử lại sau.'
    )
  if (error.code === 'P0002') throw errors.notFound('Lesson')
  if (['P0501', 'P0502'].includes(error.code || ''))
    throw new AppError(
      409,
      'LESSON_CHECK_STALE',
      'Nội dung hoặc kết quả kiểm tra đã thay đổi. Hãy tải lại bài và kiểm tra lại trước khi lưu.'
    )
  throw errors.databaseError(message)
}

/** Only this RPC can issue a receipt; a direct/legacy submission never authorizes completion. */
export async function recordLessonCheck(
  userId: string,
  lessonId: string,
  revision: number,
  code: string,
  result: LessonCheckResult,
  executionTime: number
): Promise<string> {
  const message = 'Không lưu được kết quả kiểm tra. Vui lòng thử lại.'
  const { data, error } = await supabaseAdmin
    .rpc('record_lesson_check', {
      p_user_id: userId,
      p_lesson_id: lessonId,
      p_content_revision: revision,
      p_code: code,
      p_result: {
        passed: result.passed,
        score: result.score,
        checks: result.checks,
        hint: result.hint,
      },
      p_execution_time: executionTime,
    })
    .then(
      response => response,
      () => {
        throw errors.databaseError(message)
      }
    )
  transactionError(error, message)
  const parsed = receipt.safeParse(data)
  if (
    !parsed.success ||
    parsed.data.user_id !== userId ||
    parsed.data.lesson_id !== lessonId ||
    parsed.data.content_revision !== revision ||
    parsed.data.passed !== result.passed
  )
    throw errors.databaseError(message)
  return parsed.data.id
}

export async function completeCheckedLesson(
  userId: string,
  lessonId: string,
  submissionId: string,
  activityDate: string
) {
  const message = 'Không xác nhận được tiến độ đã lưu. Vui lòng thử lại.'
  const { data, error } = await supabaseAdmin.rpc('complete_checked_lesson_atomically', {
    p_user_id: userId,
    p_lesson_id: lessonId,
    p_submission_id: submissionId,
    p_completed_at: new Date().toISOString(),
    p_activity_date: activityDate,
  })
  transactionError(error, message)
  const parsed = completion.safeParse(Array.isArray(data) && data.length === 1 ? data[0] : data)
  if (!parsed.success) throw errors.databaseError(message)
  return parsed.data
}
