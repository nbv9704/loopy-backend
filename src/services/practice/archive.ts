import { supabaseAdmin } from '../../db/supabase'
import { AppError, errors } from '../../middleware/errorHandler'
import { awaitWrite } from '../write-result'

/** Owner and observed status belong to the UPDATE, not just an earlier read. */
export async function archiveOwnedPractice(setId: string, userId: string, expectedStatus: string) {
  const { data, error } = await awaitWrite(
    supabaseAdmin
      .from('practice_sets')
      .update({ status: 'archived' })
      .eq('id', setId)
      .eq('created_by', userId)
      .eq('status', expectedStatus)
      .select('id,status')
      .maybeSingle()
  )
  if (error)
    throw errors.databaseError(
      'Chưa xác nhận được việc lưu trữ. Hãy tải lại danh sách trước khi thử lại.'
    )
  if (!data)
    throw new AppError(
      409,
      'PRACTICE_CHANGED',
      'Bộ bài đã thay đổi hoặc bị xóa. Hãy tải lại danh sách.'
    )
  if (data.id !== setId || data.status !== 'archived')
    throw errors.databaseError('Không xác nhận đúng bộ bài đã lưu trữ.')
  return { success: true, data: { id: data.id, status: data.status } }
}
