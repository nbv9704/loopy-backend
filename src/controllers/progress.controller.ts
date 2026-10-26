import { readProgressOverview } from '../services/progress/read-progress'
import { Response, NextFunction } from 'express'
import { supabaseAdmin } from '../db/supabase'
import { AuthRequest } from '../middleware/auth'
import { getStudyDateKey, handleGamification } from '../services/progress.service'
import { keysToCamel } from '../utils/caseConverter'
import { errors } from '../middleware/errorHandler'
import { completeCheckedLesson } from '../services/lesson-check/completion'

/** HTTP progress APIs; database transactions own progress and reward transitions. */

async function ensurePublishedLesson(lessonId: string) {
  const { data, error } = await supabaseAdmin
    .from('lessons')
    .select('id')
    .eq('id', lessonId)
    .eq('status', 'published')
    .single()

  if (error && error.code !== 'PGRST116')
    throw errors.databaseError('Không tải được bài học. Vui lòng thử lại.')
  if (!data) {
    throw errors.notFound('Lesson')
  }
}

export const getUserProgress = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const snapshot = await readProgressOverview(req.user!.id)
    res.json({ success: true, data: keysToCamel(snapshot) })
  } catch (error) {
    next(error)
  }
}

export const getLessonProgress = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id
    const { lessonId } = req.params

    await ensurePublishedLesson(lessonId)

    const { data, error } = await supabaseAdmin
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('lesson_id', lessonId)
      .single()

    if (error && error.code !== 'PGRST116') throw error

    res.json({
      success: true,
      data: keysToCamel({
        progress: data || {
          status: 'not_started',
          timeSpent: 0,
        },
      }),
    })
  } catch (error) {
    next(error)
  }
}

/** General progress updates cannot complete a lesson. */
export const updateProgress = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id
    const { lessonId } = req.params
    const { status, timeSpent } = req.body

    if (status === 'completed') {
      throw errors.badRequest(
        'Use completeLesson after lesson validation to mark a lesson completed'
      )
    }

    await ensurePublishedLesson(lessonId)

    const { data, error } = await supabaseAdmin.rpc('update_lesson_progress_atomically', {
      p_user_id: userId,
      p_lesson_id: lessonId,
      p_status: status,
      p_time_spent: timeSpent || 0,
    })

    if (error) throw error
    const progress = Array.isArray(data) ? data[0] : data
    if (!progress) throw errors.databaseError('Failed to update progress')

    res.json({
      success: true,
      data: keysToCamel({
        progress,
      }),
    })
  } catch (error) {
    next(error)
  }
}

/** Receipt validation and first-completion rewards commit together. */
export const completeLesson = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id
    const { lessonId } = req.params

    const completion = await completeCheckedLesson(
      userId,
      lessonId,
      req.body.submissionId,
      getStudyDateKey()
    )
    const wasFirstCompletion = completion.was_first_completion
    // Points and daily activity are committed in the same DB transaction as progress.
    const gamification = await handleGamification(userId, lessonId, wasFirstCompletion, true)

    res.json({
      success: true,
      data: keysToCamel({
        progress: completion,
        gamification,
      }),
    })
  } catch (error) {
    next(error)
  }
}
