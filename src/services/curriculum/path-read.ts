import { supabaseAdmin } from '../../db/supabase'
import { errors } from '../../middleware/errorHandler'
import { readAllRowsByKey } from '../read-all-rows'
import { publicPathSelect } from './projections'

export interface PathChapterMapping {
  chapter_id: string
  order_index: number
}

export async function readActivePath(pathId: string, languageId?: string) {
  let query = supabaseAdmin
    .from('learning_paths')
    .select(publicPathSelect)
    .eq('id', pathId)
    .eq('is_active', true)
  if (languageId) query = query.eq('language_id', languageId)
  const { data, error } = await query.maybeSingle()
  if (error) throw errors.databaseError('Không tải được lộ trình. Vui lòng thử lại.')
  if (!data) throw errors.notFound('Learning Path')
  return data
}

export async function readPathMapping(pathId: string): Promise<PathChapterMapping[]> {
  return readAllRowsByKey<PathChapterMapping>(
    (offset, end) =>
      supabaseAdmin
        .from('path_chapters')
        .select('chapter_id, order_index', { count: 'exact' })
        .eq('path_id', pathId)
        .order('order_index')
        .order('chapter_id')
        .range(offset, end),
    'Không tải đủ chương của lộ trình. Vui lòng thử lại.',
    row => row.chapter_id
  )
}
