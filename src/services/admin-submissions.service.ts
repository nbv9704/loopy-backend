import { supabaseAdmin } from '../db/supabase'
import { readAllRows } from './read-all-rows'
import { errors } from '../middleware/errorHandler'
import { confirmEmptyRange } from './empty-range'

export async function readAdminSubmissions(status: string, limit: number) {
  return (await readAdminSubmissionsPage(status, limit, 0)).items
}

/** Read only the requested window, filling it even when PostgREST has a lower row cap. */
export async function readAdminSubmissionsPage(status: string, limit: number, offset: number) {
  let total: number | null = null
  const message = 'Không tải đủ trang bài nộp. Vui lòng thử lại.'
  const queryFor = (head = false) => {
    let query = supabaseAdmin
      .from('lesson_submissions')
      .select(
        `
        id,
        user_id,
        lesson_id,
        code,
        is_correct,
        test_score,
        final_score,
        grade_level,
        feedback,
        execution_time,
        submitted_at,
        lessons (
          id,
          lesson_id,
          title,
          chapters (
            id,
            language_id,
            title
          )
        )
      `,
        { count: 'exact', ...(head ? { head: true } : {}) }
      )
      .order('submitted_at', { ascending: false })
      .order('id', { ascending: false })

    if (status === 'pass') query = query.eq('is_correct', true)
    if (status === 'fail') query = query.eq('is_correct', false)
    return query
  }
  const items = await readAllRows<Record<string, any> & { id: string }>(async (start, end) => {
    const result = await queryFor().range(offset + start, offset + Math.min(end, limit - 1))
    if (start === 0 && result.error?.code === 'PGRST103') {
      total = await confirmEmptyRange(offset, () => queryFor(true), message)
      return { data: [], count: 0, error: null }
    }
    const count = result.count
    if (
      result.error ||
      count === null ||
      !Number.isSafeInteger(count) ||
      count < 0 ||
      (total !== null && total !== count)
    )
      throw errors.databaseError(message)
    total = count
    return { ...result, count: Math.min(limit, Math.max(0, count - offset)) }
  }, message)
  return { items, total: total!, limit, offset }
}
