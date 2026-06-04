import { Request, Response, NextFunction } from 'express'
import { supabaseAdmin } from '../db/supabase'
import { errors } from '../middleware/errorHandler'
import { keysToCamel } from '../utils/caseConverter'

export const getChapterById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    const { data, error } = await supabaseAdmin
      .from('chapters')
      .select('id, language_id, chapter_number, title, description, order_index, languages(id, name, display_name, icon, can_run_in_browser)')
      .eq('id', id)
      .single()

    if (error || !data) {
      throw errors.notFound('Chapter')
    }

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

    const { data, error } = await supabaseAdmin
      .from('lessons')
      .select('id, chapter_id, lesson_id, title, description, order_index, difficulty, estimated_time, starter_code, task_description, hint, common_mistakes, is_aha_lesson')
      .eq('chapter_id', id)
      .order('order_index')

    if (error) throw error

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
