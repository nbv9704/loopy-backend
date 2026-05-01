import { Request, Response, NextFunction } from 'express'
import { supabaseAdmin } from '../db/supabase'
import { errors } from '../middleware/errorHandler'

export const getAllLanguages = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const { data, error } = await supabaseAdmin.from('languages').select('*').order('id')

    if (error) throw error

    res.json({
      success: true,
      data: {
        languages: data,
      },
    })
  } catch (error) {
    next(error)
  }
}

export const getLanguageById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    const { data, error } = await supabaseAdmin.from('languages').select('*').eq('id', id).single()

    if (error || !data) {
      throw errors.notFound('Language')
    }

    res.json({
      success: true,
      data: {
        language: data,
      },
    })
  } catch (error) {
    next(error)
  }
}

export const getChaptersByLanguage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    const { data, error } = await supabaseAdmin
      .from('chapters')
      .select('*')
      .eq('language_id', id)
      .order('order_index')

    if (error) throw error

    res.json({
      success: true,
      data: {
        chapters: data,
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Batch endpoint: Get all chapters with their lessons for a language.
 * Eliminates N+1 waterfall queries on the frontend.
 * Single DB query using Supabase nested select.
 */
export const getChaptersWithLessons = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    const { data, error } = await supabaseAdmin
      .from('chapters')
      .select('*, lessons(*)')
      .eq('language_id', id)
      .order('order_index')

    if (error) throw error

    // Flatten lessons from chapters and sort by order_index
    const allLessons = (data || []).flatMap((chapter: any) =>
      (chapter.lessons || []).sort((a: any, b: any) => a.order_index - b.order_index)
    )

    res.json({
      success: true,
      data: {
        chapters: (data || []).map((ch: any) => {
          const { lessons: _, ...chapterData } = ch
          return chapterData
        }),
        lessons: allLessons,
      },
    })
  } catch (error) {
    next(error)
  }
}
