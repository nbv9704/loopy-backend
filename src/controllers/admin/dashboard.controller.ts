import { Request, Response } from 'express'
import { supabase } from '../../db/supabase'
import { logger } from '../../utils/logger'

/**
 * Get dashboard overview statistics
 * GET /api/admin/stats/overview
 */
export const getDashboardStats = async (_req: Request, res: Response) => {
  try {
    logger.info('Dashboard stats request started')

    // Initialize all stats with default values
    let totalUsers = 0
    let totalLessons = 0
    let totalSubmissions = 0
    let submissionsToday = 0
    let submissionsThisWeek = 0
    let completionRate = 0
    let averageExecutionTime = 0

    // Get total users (from auth.users via user_profiles)
    try {
      const { count: usersCount, error: usersError } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })

      if (usersError) {
        logger.warn('Error fetching users count:', usersError)
      } else {
        totalUsers = usersCount || 0
      }
    } catch (error) {
      logger.warn('Exception fetching users:', error)
    }

    // Get total lessons
    try {
      const { count: lessonsCount, error: lessonsError } = await supabase
        .from('lessons')
        .select('*', { count: 'exact', head: true })

      if (lessonsError) {
        logger.warn('Error fetching lessons count:', lessonsError)
      } else {
        totalLessons = lessonsCount || 0
      }
    } catch (error) {
      logger.warn('Exception fetching lessons:', error)
    }

    // Get total submissions
    try {
      const { count: submissionsCount, error: submissionsError } = await supabase
        .from('exercise_submissions')
        .select('*', { count: 'exact', head: true })

      if (submissionsError) {
        logger.warn('Error fetching submissions count:', submissionsError)
      } else {
        totalSubmissions = submissionsCount || 0
      }
    } catch (error) {
      logger.warn('Exception fetching submissions:', error)
    }

    // Get submissions today
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const { count: todayCount, error: todayError } = await supabase
        .from('exercise_submissions')
        .select('*', { count: 'exact', head: true })
        .gte('submitted_at', today.toISOString())

      if (todayError) {
        logger.warn('Error fetching today submissions:', todayError)
      } else {
        submissionsToday = todayCount || 0
      }
    } catch (error) {
      logger.warn('Exception fetching today submissions:', error)
    }

    // Get submissions this week
    try {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      weekAgo.setHours(0, 0, 0, 0)
      const { count: weekCount, error: weekError } = await supabase
        .from('exercise_submissions')
        .select('*', { count: 'exact', head: true })
        .gte('submitted_at', weekAgo.toISOString())

      if (weekError) {
        logger.warn('Error fetching week submissions:', weekError)
      } else {
        submissionsThisWeek = weekCount || 0
      }
    } catch (error) {
      logger.warn('Exception fetching week submissions:', error)
    }

    // Get completion rate
    try {
      const { count: correctCount, error: correctError } = await supabase
        .from('exercise_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('is_correct', true)

      if (correctError) {
        logger.warn('Error fetching correct submissions:', correctError)
      } else {
        completionRate =
          totalSubmissions > 0 ? Math.round(((correctCount || 0) / totalSubmissions) * 100) : 0
      }
    } catch (error) {
      logger.warn('Exception fetching correct submissions:', error)
    }

    // Get average execution time
    try {
      const { data: executionTimes, error: executionError } = await supabase
        .from('exercise_submissions')
        .select('execution_time')
        .eq('is_correct', true)
        .not('execution_time', 'is', null)

      if (executionError) {
        logger.warn('Error fetching execution times:', executionError)
      } else if (executionTimes && executionTimes.length > 0) {
        averageExecutionTime = Math.round(
          executionTimes.reduce((sum, s) => sum + (s.execution_time || 0), 0) /
            executionTimes.length
        )
      }
    } catch (error) {
      logger.warn('Exception fetching execution times:', error)
    }

    logger.info('Dashboard stats computed successfully', {
      totalUsers,
      totalLessons,
      totalSubmissions,
      submissionsToday,
      submissionsThisWeek,
      completionRate,
      averageExecutionTime,
    })

    res.json({
      success: true,
      data: {
        totalUsers,
        totalLessons,
        totalSubmissions,
        submissionsToday,
        submissionsThisWeek,
        completionRate,
        totalPvPMatches: 0, // Placeholder
        averageAIScore: averageExecutionTime,
      },
    })
  } catch (error) {
    logger.error('Error fetching dashboard stats:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard statistics',
      details: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
