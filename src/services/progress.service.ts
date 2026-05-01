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

/**
 * Calculate user's learning streak based on completion dates
 * Streak = consecutive days with at least one lesson completed
 *
 * @param completedLessons - Array of completed lessons with completion dates
 * @returns Object containing current streak and longest streak
 */
export const calculateUserStreak = (completedLessons: CompletedLesson[]): StreakResult => {
  // Extract and normalize completion dates
  const completionDates = completedLessons
    .filter(p => p.completed_at)
    .map(p => {
      const date = new Date(p.completed_at!)
      return date.toISOString().split('T')[0] // Get YYYY-MM-DD
    })
    .sort()
    .reverse() // Most recent first

  // Remove duplicates (same day completions)
  const uniqueDates = [...new Set(completionDates)]

  // Initialize streak counters
  let currentStreak = 0
  let longestStreak = 0
  let tempStreak = 0

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (uniqueDates.length === 0) {
    return { current: 0, longest: 0 }
  }

  const mostRecentDate = new Date(uniqueDates[0])
  mostRecentDate.setHours(0, 0, 0, 0)

  // Check if most recent completion is today or yesterday
  const daysDiff = Math.floor((today.getTime() - mostRecentDate.getTime()) / (1000 * 60 * 60 * 24))

  if (daysDiff > 1) {
    // Streak is broken
    return { current: 0, longest: calculateLongestStreakInHistory(uniqueDates) }
  }

  // Calculate current streak
  currentStreak = 1
  tempStreak = 1

  for (let i = 1; i < uniqueDates.length; i++) {
    const currentDate = new Date(uniqueDates[i - 1])
    const prevDate = new Date(uniqueDates[i])
    currentDate.setHours(0, 0, 0, 0)
    prevDate.setHours(0, 0, 0, 0)

    const diff = Math.floor((currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24))

    if (diff === 1) {
      currentStreak++
      tempStreak++
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
    const currentDate = new Date(uniqueDates[i - 1])
    const prevDate = new Date(uniqueDates[i])
    currentDate.setHours(0, 0, 0, 0)
    prevDate.setHours(0, 0, 0, 0)

    const diff = Math.floor((currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24))

    if (diff === 1) {
      tempStreak++
      longestStreak = Math.max(longestStreak, tempStreak)
    } else {
      tempStreak = 1
    }
  }

  return longestStreak
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
    acc[languageId].lessons.push(progress)
    return acc
  }, {})
}
