import { supabaseAdmin } from '../db/supabase'
import { AppError, errors } from '../middleware/errorHandler'
import { readAllRows } from './read-all-rows'
import { awaitAdminWrite } from './admin-write'

export function readAdminChapters() {
  return readAllRows<Record<string, any> & { id: string }>(
    (offset, end) =>
      supabaseAdmin
        .from('chapters')
        .select('*', { count: 'exact' })
        .order('language_id')
        .order('order_index')
        .order('id')
        .range(offset, end),
    'Không tải đủ danh sách chapter.'
  )
}
export async function readAdminLessons(chapterId?: string, status = 'active') {
  const lessons = await readAllRows<Record<string, any> & { id: string }>((offset, end) => {
    let query = supabaseAdmin.from('lessons').select('*', { count: 'exact' })
    if (chapterId && chapterId !== 'all') query = query.eq('chapter_id', chapterId)
    if (status === 'active') query = query.neq('status', 'archived')
    else if (status !== 'all') query = query.eq('status', status)
    return query.order('chapter_id').order('order_index').order('id').range(offset, end)
  }, 'Không tải đủ danh sách lesson.')
  const counts = new Map<string, number>()
  // Bound PostgREST URL length and page through the test-case row cap within each batch.
  for (let index = 0; index < lessons.length; index += 100) {
    const ids = lessons.slice(index, index + 100).map(row => row.id)
    const cases = await readAllRows<{ id: string; lesson_id: string }>(
      (offset, end) =>
        supabaseAdmin
          .from('lesson_test_cases')
          .select('id,lesson_id', { count: 'exact' })
          .in('lesson_id', ids)
          .order('id')
          .range(offset, end),
      'Không tải đủ số test case; chưa thể kết luận chất lượng lesson.'
    )
    for (const row of cases) counts.set(row.lesson_id, (counts.get(row.lesson_id) ?? 0) + 1)
  }
  return lessons.map(row => ({ ...row, test_case_count: counts.get(row.id) ?? 0 }))
}

type DetailTable = 'lesson_steps' | 'lesson_test_cases'
export function readLessonDetails(table: DetailTable, lessonId: string) {
  return readAllRows<Record<string, any> & { id: string }>(
    (offset, end) =>
      supabaseAdmin
        .from(table)
        .select('*', { count: 'exact' })
        .eq('lesson_id', lessonId)
        .order('order_index')
        .order('id')
        .range(offset, end),
    'Không tải đủ chi tiết lesson.'
  )
}

/** An existing ID is an update of this lesson only, never an upsert that can reparent another row. */
export async function saveLessonDetail(
  table: DetailTable,
  lessonId: string,
  id: string | undefined,
  values: Record<string, unknown>
) {
  const row: Record<string, unknown> = { ...values, lesson_id: lessonId }
  delete row.id
  const query = id
    ? supabaseAdmin.from(table).update(row).eq('id', id).eq('lesson_id', lessonId)
    : supabaseAdmin.from(table).insert(row)
  const { data, error } = await awaitAdminWrite(query.select('*').maybeSingle())
  if (error)
    throw errors.databaseError('Không xác nhận được chi tiết đã lưu. Tải lại trước khi thử tiếp.')
  if (!data)
    throw new AppError(
      409,
      'LESSON_DETAIL_CHANGED',
      'Chi tiết không còn thuộc lesson này hoặc đã bị xóa. Hãy tải lại.'
    )
  if (!data.id || (id && data.id !== id) || data.lesson_id !== lessonId)
    throw errors.databaseError('Chưa xác nhận đúng chi tiết lesson đã lưu. Hãy tải lại.')
  return data
}
export async function removeLessonDetail(table: DetailTable, id: string) {
  const { data, error } = await awaitAdminWrite(
    supabaseAdmin.from(table).delete().eq('id', id).select('id').maybeSingle()
  )
  if (error) throw errors.databaseError('Không xác nhận được chi tiết đã xóa. Hãy tải lại.')
  if (!data) throw errors.notFound('Chi tiết lesson')
  if (data.id !== id) throw errors.databaseError('Chưa xác nhận đúng chi tiết đã xóa. Hãy tải lại.')
  return { id }
}

export async function archiveAdminLesson(id: string) {
  const { data, error } = await awaitAdminWrite(
    supabaseAdmin
      .from('lessons')
      .update({ status: 'archived' })
      .eq('id', id)
      .select('id,title,status')
      .maybeSingle()
  )
  if (error) throw errors.databaseError('Không xác nhận được lesson đã lưu trữ. Hãy tải lại.')
  if (!data) throw errors.notFound('Lesson')
  if (data.id !== id || data.status !== 'archived')
    throw errors.databaseError('Chưa xác nhận đúng lesson đã lưu trữ.')
  return data
}
