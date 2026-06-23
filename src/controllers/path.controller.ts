import { Request, Response, NextFunction } from 'express'
import { supabaseAdmin } from '../db/supabase'
import { errors } from '../middleware/errorHandler'
import { keysToCamel } from '../utils/caseConverter'

/**
 * Get all available learning paths
 */
export const getAllPaths = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { languageId, goalId } = req.query

    let query = supabaseAdmin
      .from('learning_paths')
      .select('*, languages(*)')
      .eq('is_active', true)

    if (languageId) query = query.eq('language_id', String(languageId))
    if (goalId) query = query.eq('goal_id', String(goalId))

    const { data, error } = await query.order('title', { ascending: true })

    if (error) throw error

    res.json({
      success: true,
      data: keysToCamel({
        paths: data,
      }),
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get a specific path with its chapters
 */
export const getPathById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    // Get path details
    const { data: path, error: pathError } = await supabaseAdmin
      .from('learning_paths')
      .select('*, languages(*)')
      .eq('id', id)
      .single()

    if (pathError || !path) {
      throw errors.notFound('Learning Path')
    }

    // Get chapters mapped to this path
    const { data: chapters, error: chaptersError } = await supabaseAdmin
      .from('path_chapters')
      .select('chapter_id, order_index, chapters(*)')
      .eq('path_id', id)
      .order('order_index')

    if (chaptersError) throw chaptersError

    const chapterRows = chapters || []
    const chapterIds = chapterRows.map((pc: any) => pc.chapter_id)
    const lessonCounts = new Map<string, number>()

    if (chapterIds.length > 0) {
      const { data: lessons, error: lessonsError } = await supabaseAdmin
        .from('lessons')
        .select('chapter_id')
        .in('chapter_id', chapterIds)
        .eq('status', 'published')

      if (lessonsError) throw lessonsError

      for (const lesson of lessons || []) {
        lessonCounts.set(lesson.chapter_id, (lessonCounts.get(lesson.chapter_id) || 0) + 1)
      }
    }

    res.json({
      success: true,
      data: keysToCamel({
        path,
        chapters: chapterRows.map((pc: any) => ({
          ...pc.chapters,
          order_index: pc.order_index, // Use the path-specific order
          lesson_count: lessonCounts.get(pc.chapter_id) || 0,
        })),
      }),
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get all paths matching a specific goal_id
 */
export const getPathsByGoal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { goalId } = req.params

    const { data, error } = await supabaseAdmin
      .from('learning_paths')
      .select('*, languages(*)')
      .eq('goal_id', goalId)
      .eq('is_active', true)

    if (error) throw error

    res.json({
      success: true,
      data: keysToCamel({
        paths: data,
      }),
    })
  } catch (error) {
    next(error)
  }
}
