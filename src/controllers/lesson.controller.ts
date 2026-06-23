import { Request, Response, NextFunction } from 'express'
import { supabaseAdmin } from '../db/supabase'
import { errors } from '../middleware/errorHandler'
import { keysToCamel } from '../utils/caseConverter'

export const getLessonById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    const { data, error } = await supabaseAdmin
      .from('lessons')
      .select('id, chapter_id, lesson_id, title, description, order_index, difficulty, estimated_time, starter_code, task_description, hint, hint_level_1, hint_level_2, hint_level_3, common_mistakes, is_aha_lesson, status, chapters(id, language_id, chapter_number, title, description, order_index, languages(id, name, display_name, icon, can_run_in_browser))')
      .eq('id', id)
      .eq('status', 'published')
      .single()

    if (error || !data) {
      throw errors.notFound('Lesson')
    }

    const { data: steps, error: stepsError } = await supabaseAdmin
      .from('lesson_steps')
      .select('id, lesson_id, type, title, prompt, options, correct_answer, explanation, hint, is_required, order_index')
      .eq('lesson_id', data.id)
      .order('order_index', { ascending: true })

    if (stepsError) throw stepsError

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
