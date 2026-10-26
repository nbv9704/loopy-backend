import { readAllRows } from '../services/read-all-rows'
import { Request, Response, NextFunction } from 'express'
import { supabaseAdmin } from '../db/supabase'
import { errors } from '../middleware/errorHandler'
import { keysToCamel } from '../utils/caseConverter'
import { publicLessonStepSelect } from '../services/lesson-check/public-content'

export const getLessonById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    const { data, error } = await supabaseAdmin
      .from('lessons')
      .select(
        'id, chapter_id, lesson_id, title, description, order_index, difficulty, estimated_time, starter_code, task_description, hint, hint_level_1, hint_level_2, hint_level_3, common_mistakes, is_aha_lesson, status, chapters(id, language_id, chapter_number, title, description, order_index, languages(id, name, display_name, icon, can_run_in_browser))'
      )
      .eq('id', id)
      .eq('status', 'published')
      .single()

    if (error && error.code !== 'PGRST116')
      throw errors.databaseError('Không tải được bài học. Vui lòng thử lại.')
    if (error || !data) {
      throw errors.notFound('Lesson')
    }

    const steps = await readAllRows(
      (offset, end) =>
        supabaseAdmin
          .from('lesson_steps')
          .select(publicLessonStepSelect, { count: 'exact' })
          .eq('lesson_id', data.id)
          .order('order_index')
          .order('id')
          .range(offset, end),
      'Không tải đủ các bước học. Vui lòng thử lại.'
    )

    res.json({
      success: true,
      data: keysToCamel({
        lesson: {
          ...data,
          steps: steps || [],
        },
      }),
    })
  } catch (error) {
    next(error)
  }
}

export const getExercisesByLesson = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.json({
      success: true,
      data: keysToCamel({
        exercises: [],
      }),
    })
  } catch (error) {
    next(error)
  }
}
