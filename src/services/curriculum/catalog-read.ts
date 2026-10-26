import { supabaseAdmin } from '../../db/supabase'
import { errors } from '../../middleware/errorHandler'
import { readAllRows, readRowsForIds } from '../read-all-rows'
import { readActivePath, readPathMapping } from './path-read'
import { publicChapterSelect, publicLanguageSelect, publicPathSelect } from './projections'

export const readLanguages = () =>
  readAllRows(
    (offset, end) =>
      supabaseAdmin
        .from('languages')
        .select(publicLanguageSelect, { count: 'exact' })
        .order('id')
        .range(offset, end),
    'Không tải đủ danh sách ngôn ngữ.'
  )

export const readChapters = (languageId: string) =>
  readAllRows(
    (offset, end) =>
      supabaseAdmin
        .from('chapters')
        .select(publicChapterSelect, { count: 'exact' })
        .eq('language_id', languageId)
        .order('order_index')
        .order('id')
        .range(offset, end),
    'Không tải đủ danh sách chương.'
  )

export function readPaths(filters: { languageId?: string; goalId?: string } = {}) {
  return readAllRows((offset, end) => {
    let query = supabaseAdmin
      .from('learning_paths')
      .select(publicPathSelect, { count: 'exact' })
      .eq('is_active', true)
    if (filters.languageId) query = query.eq('language_id', filters.languageId)
    if (filters.goalId) query = query.eq('goal_id', filters.goalId)
    return query.order('title').order('id').range(offset, end)
  }, 'Không tải đủ danh sách lộ trình.')
}

export async function readPathOverview(pathId: string) {
  const path = await readActivePath(pathId)
  const mapping = await readPathMapping(pathId)
  const chapters = await readRowsForIds<{ id: string; [key: string]: unknown }>(
    mapping.map(row => row.chapter_id),
    (ids, offset, end) =>
      supabaseAdmin
        .from('chapters')
        .select(publicChapterSelect, { count: 'exact' })
        .in('id', ids)
        .eq('language_id', path.language_id)
        .order('id')
        .range(offset, end),
    'Không tải đủ chương của lộ trình.'
  )
  const chaptersById = new Map(chapters.map(chapter => [chapter.id, chapter]))
  if (mapping.some(row => !chaptersById.has(row.chapter_id)))
    throw errors.databaseError('Lộ trình tham chiếu chương không hợp lệ.')
  const lessons = await readRowsForIds<{ id: string; chapter_id: string }>(
    chapters.map(chapter => chapter.id),
    (ids, offset, end) =>
      supabaseAdmin
        .from('lessons')
        .select('id, chapter_id', { count: 'exact' })
        .in('chapter_id', ids)
        .eq('status', 'published')
        .order('id')
        .range(offset, end),
    'Không đếm được đủ bài học của lộ trình.'
  )
  const counts = new Map<string, number>()
  for (const lesson of lessons)
    counts.set(lesson.chapter_id, (counts.get(lesson.chapter_id) || 0) + 1)
  return {
    path,
    chapters: mapping.map(row => ({
      ...chaptersById.get(row.chapter_id)!,
      order_index: row.order_index,
      lesson_count: counts.get(row.chapter_id) || 0,
    })),
  }
}
