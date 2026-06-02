import { Request, Response, NextFunction } from 'express'
import { supabaseAdmin } from '../db/supabase'
import { errors } from '../middleware/errorHandler'
import { keysToCamel } from '../utils/caseConverter'

export const getLessonById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    const { data, error } = await supabaseAdmin
      .from('lessons')
      .select('id, chapter_id, lesson_id, title, description, order_index, difficulty, estimated_time, starter_code, task_description, hint, common_mistakes, is_aha_lesson, status, chapters(id, language_id, chapter_number, title, description, order_index, languages(id, name, display_name, icon, can_run_in_browser))')
      .eq('id', id)
      .eq('status', 'published')
      .single()

    if (error || !data) {
      throw errors.notFound('Lesson')
    }

    res.json({
      success: true,
      data: keysToCamel({
        lesson: data,
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
