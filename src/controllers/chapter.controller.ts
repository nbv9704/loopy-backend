import { Request, Response, NextFunction } from 'express'
import { supabaseAdmin } from '../db/supabase'
import { errors } from '../middleware/errorHandler'

export const getChapterById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    const { data, error } = await supabaseAdmin
      .from('chapters')
      .select('*, languages(*)')
      .eq('id', id)
      .single()

    if (error || !data) {
      throw errors.notFound('Chapter')
    }

    res.json({
      success: true,
      data: {
        chapter: data,
      },
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
      .select('*')
      .eq('chapter_id', id)
      .order('order_index')

    if (error) throw error

    res.json({
      success: true,
      data: {
        lessons: data,
      },
    })
  } catch (error) {
    next(error)
  }
}
