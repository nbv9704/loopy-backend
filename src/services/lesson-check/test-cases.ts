import { supabaseAdmin } from '../../db/supabase'
import { readAllRows } from '../read-all-rows'

export function readLessonTestCases(lessonId: string) {
  return readAllRows<Record<string, any> & { id: string }>(
    (offset, end) =>
      supabaseAdmin
        .from('lesson_test_cases')
        .select('*', { count: 'exact' })
        .eq('lesson_id', lessonId)
        .order('order_index')
        .order('id')
        .range(offset, end),
    'Không tải đủ bộ kiểm tra. Vui lòng thử lại.'
  )
}
