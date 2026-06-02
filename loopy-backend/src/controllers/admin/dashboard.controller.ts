import { Request, Response } from 'express'
import { supabase, supabaseAdmin } from '../../db/supabase'
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
    let totalLessons = 0 // published only
    let totalLessonsAll = 0 // all statuses
    let draftLessons = 0
    let archivedLessons = 0
    let totalSubmissions = 0
    let submissionsToday = 0
    let submissionsThisWeek = 0
    let completionRate = 0
    let averageExecutionTime = 0
    let totalPvPMatches = 0
    const contentQuality = {
      lessonsMissingRequiredFields: 0,
      lessonsWithoutHint: 0,
      lessonsWithoutTestCases: 0,
    }

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

    // Get total lessons (published only for public view)
    try {
      const { count: lessonsCount, error: lessonsError } = await supabase
        .from('lessons')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published')

      if (lessonsError) {
        logger.warn('Error fetching lessons count:', lessonsError)
      } else {
        totalLessons = lessonsCount || 0
      }
    } catch (error) {
      logger.warn('Exception fetching lessons:', error)
    }

    // Get total lessons (all statuses) for admin overview
    try {
      const { count: allLessonsCount, error: allLessonsError } = await supabase
        .from('lessons')
        .select('*', { count: 'exact', head: true })

      if (allLessonsError) {
        logger.warn('Error fetching all lessons count:', allLessonsError)
      } else {
        totalLessonsAll = allLessonsCount || 0
      }
    } catch (error) {
      logger.warn('Exception fetching all lessons:', error)
    }

    // Get draft lessons count
    try {
      const { count: draftCount, error: draftError } = await supabase
        .from('lessons')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'draft')

      if (draftError) {
        logger.warn('Error fetching draft lessons count:', draftError)
      } else {
        draftLessons = draftCount || 0
      }
    } catch (error) {
      logger.warn('Exception fetching draft lessons:', error)
    }

    // Get archived lessons count
    try {
      const { count: archivedCount, error: archivedError } = await supabase
        .from('lessons')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'archived')

      if (archivedError) {
        logger.warn('Error fetching archived lessons count:', archivedError)
      } else {
        archivedLessons = archivedCount || 0
      }
    } catch (error) {
      logger.warn('Exception fetching archived lessons:', error)
    }

    // Get total submissions
    try {
      const { count: submissionsCount, error: submissionsError } = await supabase
        .from('lesson_submissions')
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
        .from('lesson_submissions')
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
        .from('lesson_submissions')
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
        .from('lesson_submissions')
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
        .from('lesson_submissions')
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

    // Get total PvP matches
    try {
      const { count: pvpCount, error: pvpError } = await supabase
        .from('pvp_matches')
        .select('*', { count: 'exact', head: true })

      if (pvpError) {
        logger.warn('Error fetching PvP matches count:', pvpError)
      } else {
        totalPvPMatches = pvpCount || 0
      }
    } catch (error) {
      logger.warn('Exception fetching PvP matches:', error)
    }

    // Get lesson quality signals for admin content operations
    try {
      const { data: lessonRows, error: lessonQualityError } = await supabaseAdmin
        .from('lessons')
        .select('id, title, starter_code, task_description, solution_code, hint')

      if (lessonQualityError) {
        logger.warn('Error fetching lesson quality rows:', lessonQualityError)
      } else {
        const lessons = lessonRows || []
        const lessonIds = lessons.map(lesson => lesson.id)
        const lessonsWithTestCases = new Set<string>()

        contentQuality.lessonsMissingRequiredFields = lessons.filter(
          lesson =>
            !String(lesson.title || '').trim() ||
            !String(lesson.starter_code || '').trim() ||
            !String(lesson.task_description || '').trim() ||
            !String(lesson.solution_code || '').trim()
        ).length
        contentQuality.lessonsWithoutHint = lessons.filter(
          lesson => !String(lesson.hint || '').trim()
        ).length

        if (lessonIds.length > 0) {
          const { data: testCaseRows, error: testCaseError } = await supabaseAdmin
            .from('lesson_test_cases')
            .select('lesson_id')
            .in('lesson_id', lessonIds)

          if (testCaseError) {
            logger.warn('Error fetching lesson test case counts:', testCaseError)
          } else {
            for (const testCase of testCaseRows || []) {
              lessonsWithTestCases.add(testCase.lesson_id)
            }
          }
        }

        contentQuality.lessonsWithoutTestCases = lessons.filter(
          lesson => !lessonsWithTestCases.has(lesson.id)
        ).length
      }
    } catch (error) {
      logger.warn('Exception fetching lesson quality:', error)
    }

    // Get recent activity (5 recently modified lessons)
    let recentLessons: any[] = []
    try {
      const { data, error } = await supabaseAdmin
        .from('lessons')
        .select('id, title, lesson_id, chapter_id, updated_at')
        .order('updated_at', { ascending: false })
        .limit(5)
      
      if (error) {
        logger.warn('Error fetching recent lessons:', error)
      } else {
        recentLessons = data || []
      }
    } catch (error) {
      logger.warn('Exception fetching recent lessons:', error)
    }

    // Get recent failed submissions (5 most recent)
    let recentFailedSubmissions: any[] = []
    try {
      const { data, error } = await supabaseAdmin
        .from('lesson_submissions')
        .select(`
          id, 
          user_id, 
          lesson_id, 
          submitted_at,
          lessons (
            title
          )
        `)
        .eq('is_correct', false)
        .order('submitted_at', { ascending: false })
        .limit(5)
      
      if (error) {
        logger.warn('Error fetching recent failed submissions:', error)
      } else {
        recentFailedSubmissions = data || []
      }
    } catch (error) {
      logger.warn('Exception fetching recent failed submissions:', error)
    }

    logger.info('Dashboard stats computed successfully', {
      totalUsers,
      totalLessons,
      totalLessonsAll,
      draftLessons,
      archivedLessons,
      totalSubmissions,
      submissionsToday,
      submissionsThisWeek,
      completionRate,
      averageExecutionTime,
      totalPvPMatches,
      contentQuality,
      recentLessonsCount: recentLessons.length,
      recentFailedSubmissionsCount: recentFailedSubmissions.length,
    })

    res.json({
      success: true,
      data: {
        totalUsers,
        totalLessons,
        totalLessonsAll,
        draftLessons,
        archivedLessons,
        totalSubmissions,
        submissionsToday,
        submissionsThisWeek,
        completionRate,
        totalPvPMatches,
        averageExecutionTime,
        averageAIScore: averageExecutionTime,
        contentQuality,
        recentLessons,
        recentFailedSubmissions,
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
