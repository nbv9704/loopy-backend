import { readLanguages, readChapters } from '../services/curriculum/catalog-read'
import { Request, Response, NextFunction } from 'express'
import { supabaseAdmin } from '../db/supabase'
import { errors } from '../middleware/errorHandler'
import { keysToCamel } from '../utils/caseConverter'

import { getCurriculum } from '../services/curriculum.service'

export const getAllLanguages = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await readLanguages()

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

    const { data, error } = await supabaseAdmin
      .from('languages')
      .select('id, name, display_name, icon, can_run_in_browser')
      .eq('id', id)
      .maybeSingle()

    if (error) throw errors.databaseError('Không tải được ngôn ngữ. Vui lòng thử lại.')
    if (!data) throw errors.notFound('Language')

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

    const data = await readChapters(id)

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
 * Optional pathId uses the active path's chapter mapping and order.
 */
export const getChaptersWithLessons = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    const curriculum = await getCurriculum(id, { pathId: req.query.pathId as string | undefined })
    res.json({ success: true, data: keysToCamel(curriculum) })
  } catch (error) {
    next(error)
  }
}

export const getChaptersWithLessonsByPath = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { languageId, learningPath } = req.params

    const curriculum = await getCurriculum(languageId, { legacyGoal: learningPath })
    res.json({ success: true, data: keysToCamel(curriculum) })
  } catch (error) {
    next(error)
  }
}
