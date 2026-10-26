import { supabaseAdmin } from '../db/supabase'
import { errors } from '../middleware/errorHandler'

/**
 * Progress Service
 * REVIEW: Extracted from progress.controller.ts to follow Single Responsibility Principle
 * REVIEW: Controllers should only handle HTTP logic, not complex algorithms
 * REVIEW: This service contains pure, testable business logic
 */

interface CompletedLesson {
  completed_at: string | null
  [key: string]: any
}

interface StreakResult {
  current: number
  longest: number
}

const STUDY_TIME_ZONE = 'Asia/Ho_Chi_Minh'
const DAY_IN_MS = 24 * 60 * 60 * 1000

export interface UserStreak {
  current_streak: number
  longest_streak: number
  last_activity_date?: string | null
}

export const getStudyDateKey = (date = new Date()): string => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: STUDY_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)

  const year = parts.find(part => part.type === 'year')?.value
  const month = parts.find(part => part.type === 'month')?.value
  const day = parts.find(part => part.type === 'day')?.value

  return `${year}-${month}-${day}`
}

const normalizeDateKey = (value: string | Date): string => {
  if (value instanceof Date) {
    return getStudyDateKey(value)
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value
  }

  return getStudyDateKey(new Date(value))
}

const dateKeyToDayNumber = (dateKey: string): number => {
  const [year, month, day] = dateKey.split('-').map(Number)
  return Math.floor(Date.UTC(year, month - 1, day) / DAY_IN_MS)
}

const getDayDiff = (laterDateKey: string, earlierDateKey: string): number => {
  return dateKeyToDayNumber(laterDateKey) - dateKeyToDayNumber(earlierDateKey)
}

/**
 * Calculate user's learning streak based on completion dates
 * Streak = consecutive days with at least one lesson completed
 *
 * @param completedLessons - Array of completed lessons with completion dates
 * @returns Object containing current streak and longest streak
 */
export const calculateUserStreak = (
  completedLessons: CompletedLesson[],
  todayDateKey = getStudyDateKey()
): StreakResult => {
  // Extract and normalize completion dates
  const completionDates = completedLessons
    .filter(p => p.completed_at)
    .map(p => normalizeDateKey(p.completed_at!))
    .filter(date => date <= todayDateKey)
    .sort()
    .reverse() // Most recent first

  // Remove duplicates (same day completions)
  const uniqueDates = [...new Set(completionDates)]

  // Initialize streak counters
  let currentStreak = 0
  let longestStreak = 0

  if (uniqueDates.length === 0) {
    return { current: 0, longest: 0 }
  }

  // Check if most recent completion is today or yesterday
  const daysDiff = getDayDiff(todayDateKey, uniqueDates[0])

  if (daysDiff > 1) {
    // Streak is broken
    return { current: 0, longest: calculateLongestStreakInHistory(uniqueDates) }
  }

  // Calculate current streak
  currentStreak = 1

  for (let i = 1; i < uniqueDates.length; i++) {
    const diff = getDayDiff(uniqueDates[i - 1], uniqueDates[i])

    if (diff === 1) {
      currentStreak++
    } else {
      break
    }
  }

  // Calculate longest streak in history
  longestStreak = Math.max(currentStreak, calculateLongestStreakInHistory(uniqueDates))

  return { current: currentStreak, longest: longestStreak }
}

/**
 * Calculate the longest streak in the entire history
 * Helper function for calculateUserStreak
 *
 * @param uniqueDates - Sorted array of unique completion dates (most recent first)
 * @returns Longest streak count
 */
function calculateLongestStreakInHistory(uniqueDates: string[]): number {
  let longestStreak = 1
  let tempStreak = 1

  for (let i = 1; i < uniqueDates.length; i++) {
    const diff = getDayDiff(uniqueDates[i - 1], uniqueDates[i])

    if (diff === 1) {
      tempStreak++
      longestStreak = Math.max(longestStreak, tempStreak)
    } else {
      tempStreak = 1
    }
  }

  return longestStreak
}

export const normalizeUserStreak = (
  streak?: Partial<UserStreak> | null,
  todayDateKey = getStudyDateKey()
): UserStreak => {
  const longestStreak = streak?.longest_streak || 0
  const currentStreak = streak?.current_streak || 0
  const lastActivityDate = streak?.last_activity_date
    ? normalizeDateKey(streak.last_activity_date)
    : null

  if (!lastActivityDate || currentStreak <= 0) {
    return {
      current_streak: 0,
      longest_streak: longestStreak,
      last_activity_date: lastActivityDate,
    }
  }

  const daysSinceActivity = getDayDiff(todayDateKey, lastActivityDate)
  const isStillActive = daysSinceActivity >= 0 && daysSinceActivity <= 1

  return {
    current_streak: isStillActive ? currentStreak : 0,
    longest_streak: longestStreak,
    last_activity_date: lastActivityDate,
  }
}

export const getFreshUserStreak = async (userId: string): Promise<UserStreak> => {
  const { data: streak, error } = await supabaseAdmin
    .from('user_streaks')
    .select('current_streak, longest_streak, last_activity_date')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw errors.databaseError('Failed to load learning streak')

  // Reading a stale streak must never overwrite a concurrent completion.
  return normalizeUserStreak(streak)
}

/**
 * Group progress data by language
 *
 * @param progressData - Array of user progress with lesson and chapter data
 * @returns Object grouped by language ID with stats
 */
export const groupProgressByLanguage = (progressData: any[]): Record<string, any> => {
  return progressData.reduce((acc: any, progress: any) => {
    const languageId = progress.lessons.chapters.language_id
    if (!acc[languageId]) {
      acc[languageId] = {
        total: 0,
        completed: 0,
        inProgress: 0,
        lessons: [],
      }
    }
    acc[languageId].total++
    if (progress.status === 'completed') acc[languageId].completed++
    if (progress.status === 'in_progress') acc[languageId].inProgress++
    return acc
  }, {})
}

/**
 * Handle gamification logic when a lesson is completed
 * - Increments user points
 * - Checks and awards badges based on milestones
 * 
 * @param userId - ID of the user
 * @param lessonId - ID of the completed lesson
 * @returns Object containing earned points and any new badges
 */
export const handleGamification = async (
  userId: string,
  _lessonId: string,
  isFirstTime: boolean = true,
  rewardsAlreadyRecorded: boolean = false
): Promise<{ pointsEarned: number; newBadges: any[] }> => {
  const POINTS_PER_LESSON = 100
  const newBadges: any[] = []

  try {
    let pointsEarned = 0
    const todayDateStr = getStudyDateKey()

    if (!isFirstTime) {
      await getFreshUserStreak(userId)
      return { pointsEarned, newBadges }
    }

    pointsEarned = POINTS_PER_LESSON

    if (!rewardsAlreadyRecorded) {
      const { data: existingActivity } = await supabaseAdmin
        .from('user_daily_activity')
        .select('*')
        .eq('user_id', userId)
        .eq('activity_date', todayDateStr)
        .maybeSingle()

      await supabaseAdmin
        .from('user_daily_activity')
        .upsert(
          {
            user_id: userId,
            activity_date: todayDateStr,
            lessons_completed: (existingActivity?.lessons_completed || 0) + 1,
            points_earned: (existingActivity?.points_earned || 0) + POINTS_PER_LESSON,
          },
          { onConflict: 'user_id,activity_date' }
        )

      const { data: profile } = await supabaseAdmin
        .from('user_profiles')
        .select('points')
        .eq('id', userId)
        .single()

      await supabaseAdmin
        .from('user_profiles')
        .update({ points: (profile?.points || 0) + POINTS_PER_LESSON })
        .eq('id', userId)
    }

    // 2. Always update/re-calculate User Streaks to maintain active daily study streak
    // Retrieve all active study days from user_daily_activity
    const { data: activities, error: activitiesError } = await supabaseAdmin
      .from('user_daily_activity')
      .select('activity_date')
      .eq('user_id', userId)
      .gt('lessons_completed', 0)

    if (activitiesError || !activities) throw errors.databaseError('Failed to load study history')

    const activityDates = (activities || []).map((act: any) => ({
      completed_at: act.activity_date,
    }))

    const streakResult = calculateUserStreak(activityDates, todayDateStr)

    await supabaseAdmin
      .from('user_streaks')
      .upsert(
        {
          user_id: userId,
          current_streak: streakResult.current,
          longest_streak: streakResult.longest,
          last_activity_date: todayDateStr,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )

    // 3. Check for "First Step" badge
    const { count: completedCount } = await supabaseAdmin
      .from('user_progress')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'completed')

    if (completedCount === 1) {
      const { data: badge } = await supabaseAdmin
        .from('user_badges')
        .insert({ user_id: userId, badge_id: 'first-step' })
        .select('badges(*)')
        .maybeSingle()

      if (badge) newBadges.push(badge)
    }

    if (streakResult.current >= 7) {
      const { data: badge } = await supabaseAdmin
        .from('user_badges')
        .upsert(
          { user_id: userId, badge_id: 'streak-7' },
          { onConflict: 'user_id,badge_id', ignoreDuplicates: true }
        )
        .select('badges(*)')
        .maybeSingle()

      if (badge) newBadges.push(badge)
    }

    return { pointsEarned, newBadges }
  } catch (error) {
    console.error('Gamification error:', error)
    // Optional rewards metadata cannot undo points committed by complete_lesson_atomically.
    return { pointsEarned: rewardsAlreadyRecorded && isFirstTime ? POINTS_PER_LESSON : 0, newBadges: [] }
  }
}
