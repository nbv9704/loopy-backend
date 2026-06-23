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
      .select('id, language_id, learning_path, chapter_number, title, description, order_index, lessons(id, chapter_id, lesson_id, lesson_type, title, description, code, insight, order_index, difficulty, estimated_time, starter_code, task_description, hint, hint_level_1, hint_level_2, hint_level_3, common_mistakes, solution_code, is_aha_lesson, status, validation_type, validation_rules, success_output, failure_hint, grading_mode, debug_starter_code, debug_task_description, debug_validation_rules, debug_hint, lesson_steps(id, lesson_id, type, title, prompt, options, correct_answer, explanation, hint, is_required, order_index))')
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

export const getChaptersWithLessonsByPath = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { languageId, learningPath } = req.params

    const { data, error } = await supabaseAdmin
      .from('chapters')
      .select('id, language_id, learning_path, chapter_number, title, description, order_index, lessons(id, chapter_id, lesson_id, lesson_type, title, description, code, insight, order_index, difficulty, estimated_time, starter_code, task_description, hint, hint_level_1, hint_level_2, hint_level_3, common_mistakes, solution_code, is_aha_lesson, status, validation_type, validation_rules, success_output, failure_hint, grading_mode, debug_starter_code, debug_task_description, debug_validation_rules, debug_hint, lesson_steps(id, lesson_id, type, title, prompt, options, correct_answer, explanation, hint, is_required, order_index))')
      .eq('language_id', languageId)
      .eq('learning_path', learningPath)
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
