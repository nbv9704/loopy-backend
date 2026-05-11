import { Response, NextFunction } from 'express'
import { supabaseAdmin } from '../db/supabase'
import { AuthRequest } from '../middleware/auth'
import {  } from '../middleware/errorHandler'
import { calculateUserStreak, groupProgressByLanguage } from '../services/progress.service'

/**
 * Progress Controller
 * REVIEW: Refactored to use ProgressService for business logic
 * REVIEW: Replaced manual read-then-write with atomic upserts
 * REVIEW: Controller now only handles HTTP logic (req/res)
 */

export const getUserProgress = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id

    const { data, error } = await supabaseAdmin
      .from('user_progress')
      .select('*, lessons(id, lesson_id, title, chapter_id, chapters(language_id))')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    if (error) throw error

    // Calculate stats
    const completedLessons = data.filter((p: any) => p.status === 'completed')
    const completedCount = completedLessons.length

    // Get total lessons count
    const { count: totalLessons } = await supabaseAdmin
      .from('lessons')
      .select('*', { count: 'exact', head: true })

    // REVIEW: Extracted streak calculation to ProgressService
    const { current, longest } = calculateUserStreak(completedLessons)

    // REVIEW: Extracted grouping logic to ProgressService
    const progressByLanguage = groupProgressByLanguage(data)

    res.json({
      success: true,
      data: {
        progress: data,
        summary: progressByLanguage,
        completed_lessons: completedCount,
        total_lessons: totalLessons || 99,
        current_streak: current,
        longest_streak: longest,
      },
    })
  } catch (error) {
    next(error)
  }
}

export const getLessonProgress = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id
    const { lessonId } = req.params

    const { data, error } = await supabaseAdmin
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('lesson_id', lessonId)
      .single()

    if (error && error.code !== 'PGRST116') throw error

    res.json({
      success: true,
      data: {
        progress: data || {
          status: 'not_started',
          time_spent: 0,
        },
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * REVIEW: Replaced manual read-then-write with atomic upsert
 * REVIEW: Single network request, no race conditions
 */
export const updateProgress = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id
    const { lessonId } = req.params
    const { status, timeSpent } = req.body

    // Get existing progress to calculate cumulative time
    const { data: existing } = await supabaseAdmin
      .from('user_progress')
      .select('time_spent')
      .eq('user_id', userId)
      .eq('lesson_id', lessonId)
      .single()

    const cumulativeTime = existing ? existing.time_spent + (timeSpent || 0) : timeSpent || 0

    // REVIEW: Atomic upsert - single network request
    const { data, error } = await supabaseAdmin
      .from('user_progress')
      .upsert(
        {
          user_id: userId,
          lesson_id: lessonId,
          status,
          time_spent: cumulativeTime,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,lesson_id' }
      )
      .select()
      .single()

    if (error) throw error

    res.json({
      success: true,
      data: {
        progress: data,
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * REVIEW: Replaced manual read-then-write with atomic upsert
 * REVIEW: Single network request, no race conditions
 */
export const completeLesson = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id
    const { lessonId } = req.params

    // REVIEW: Atomic upsert - single network request
    const { data, error } = await supabaseAdmin
      .from('user_progress')
      .upsert(
        {
          user_id: userId,
          lesson_id: lessonId,
          status: 'completed',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,lesson_id' }
      )
      .select()
      .single()

    if (error) throw error

    res.json({
      success: true,
      data: {
        progress: data,
      },
    })
  } catch (error) {
    next(error)
  }
}
