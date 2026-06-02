import { Request, Response, NextFunction } from 'express'
import { supabaseAdmin } from '../db/supabase'
import { errors } from '../middleware/errorHandler'
import { keysToCamel } from '../utils/caseConverter'

export const getAllLanguages = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const { data, error } = await supabaseAdmin.from('languages').select('id, name, display_name, icon, can_run_in_browser').order('id')

    if (error) throw error

    res.json({
      success: true,
      data: keysToCamel({
        languages: data,
      }),
    })
  } catch (error) {
    next(error)
  }
}

export const getLanguageById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    const { data, error } = await supabaseAdmin.from('languages').select('id, name, display_name, icon, can_run_in_browser').eq('id', id).single()

    if (error || !data) {
      throw errors.notFound('Language')
    }

    res.json({
      success: true,
      data: keysToCamel({
        language: data,
      }),
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
      .select('id, language_id, chapter_number, title, description, order_index')
      .eq('language_id', id)
      .order('order_index')

    if (error) throw error

    res.json({
      success: true,
      data: keysToCamel({
        chapters: data,
      }),
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
      .select('id, language_id, chapter_number, title, description, order_index, lessons(id, chapter_id, lesson_id, title, description, order_index, difficulty, estimated_time, starter_code, task_description, hint, common_mistakes, is_aha_lesson, status)')
      .eq('language_id', id)
      .order('order_index')

    if (error) throw error

    // Flatten lessons from chapters and sort by order_index, and only include published lessons
    const allLessons = (data || []).flatMap((chapter: any) =>
      (chapter.lessons || [])
        .filter((l: any) => l.status === 'published')
        .sort((a: any, b: any) => a.order_index - b.order_index)
    )

    res.json({
      success: true,
      data: keysToCamel({
        chapters: (data || []).map((ch: any) => {
          const chapterData = { ...ch }
          delete chapterData.lessons
          return chapterData
        }),
        lessons: allLessons,
      }),
    })
  } catch (error) {
    next(error)
  }
}
