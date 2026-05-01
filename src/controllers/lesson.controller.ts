import { Request, Response, NextFunction } from 'express'
import { supabaseAdmin } from '../db/supabase'
import { errors } from '../middleware/errorHandler'

export const getLessonById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    const { data, error } = await supabaseAdmin
      .from('lessons')
      .select('*, chapters(*, languages(*))')
      .eq('id', id)
      .single()

    if (error || !data) {
      throw errors.notFound('Lesson')
    }

    res.json({
      success: true,
      data: {
        lesson: data,
      },
    })
  } catch (error) {
    next(error)
  }
}

export const getExercisesByLesson = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    const { data, error } = await supabaseAdmin
      .from('exercises')
      .select('id, lesson_id, exercise_number, question, hint, difficulty, order_index')
      .eq('lesson_id', id)
      .order('order_index')

    if (error) throw error

    res.json({
      success: true,
      data: {
        exercises: data,
      },
    })
  } catch (error) {
    next(error)
  }
}
