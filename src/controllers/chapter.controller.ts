import { readAllRows } from '../services/read-all-rows'
import { Request, Response, NextFunction } from 'express'
import { supabaseAdmin } from '../db/supabase'
import { errors } from '../middleware/errorHandler'
import { keysToCamel } from '../utils/caseConverter'

const publicLessonListSelect = [
  'id',
  'chapter_id',
  'lesson_id',
  'lesson_type',
  'title',
  'description',
  'order_index',
  'difficulty',
  'estimated_time',
  'starter_code',
  'task_description',
  'hint',
  'hint_level_1',
  'hint_level_2',
  'hint_level_3',
  'common_mistakes',
  'is_aha_lesson',
  'status',
].join(', ')

export const getChapterById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    const { data, error } = await supabaseAdmin
      .from('chapters')
      .select(
        'id, language_id, chapter_number, title, description, order_index, languages(id, name, display_name, icon, can_run_in_browser)'
      )
      .eq('id', id)
      .maybeSingle()

    if (error) throw errors.databaseError('Không tải được chương học. Vui lòng thử lại.')
    if (!data) throw errors.notFound('Chapter')

    res.json({
      success: true,
      data: keysToCamel({
        chapter: data,
      }),
    })
  } catch (error) {
    next(error)
  }
}

export const getLessonsByChapter = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    const data = await readAllRows(
      (offset, end) =>
        supabaseAdmin
          .from('lessons')
          .select(publicLessonListSelect, { count: 'exact' })
          .eq('chapter_id', id)
          .eq('status', 'published')
          .order('order_index')
          .order('id')
          .range(offset, end)
          .returns<{ id: string }[]>(),
      'Không tải đủ bài học trong chương.'
    )

    res.json({
      success: true,
      data: keysToCamel({
        lessons: data,
      }),
    })
  } catch (error) {
    next(error)
  }
}
