import { supabaseAdmin } from '../../db/supabase'
import { errors } from '../../middleware/errorHandler'
import { getFreshUserStreak, groupProgressByLanguage } from '../progress.service'
import { readAllRows, readAllRowsByKey } from '../read-all-rows'

interface ProgressRow {
  id: string
  lesson_id: string
  status: string
  lessons: { chapters: { language_id: string } }
}
interface BadgeAssignment {
  badge_id: string
  badges: unknown
}

/** A progress snapshot must include every visible row before any totals are reported. */
export async function readProgressOverview(userId: string) {
  const [progress, totalResult, profileResult, badges, streak] = await Promise.all([
    readAllRows<ProgressRow>(
      (offset, end) =>
        supabaseAdmin
          .from('user_progress')
          .select(
            '*, lessons!inner(id, lesson_id, title, chapter_id, status, chapters(language_id))',
            { count: 'exact' }
          )
          .eq('user_id', userId)
          .eq('lessons.status', 'published')
          .order('updated_at', { ascending: false })
          .order('id')
          .range(offset, end),
      'Không tải đủ tiến độ học. Vui lòng thử lại.'
    ),
    supabaseAdmin
      .from('lessons')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'published'),
    supabaseAdmin.from('user_profiles').select('points').eq('id', userId).maybeSingle(),
    readAllRowsByKey<BadgeAssignment>(
      (offset, end) =>
        supabaseAdmin
          .from('user_badges')
          .select('badge_id, badges(*)', { count: 'exact' })
          .eq('user_id', userId)
          .order('badge_id')
          .range(offset, end),
      'Không tải đủ huy hiệu học tập.',
      row => row.badge_id
    ),
    getFreshUserStreak(userId),
  ])
  if (totalResult.error || !Number.isSafeInteger(totalResult.count) || totalResult.count! < 0)
    throw errors.databaseError('Không đếm được tổng số bài học.')
  if (
    profileResult.error ||
    !profileResult.data ||
    !Number.isSafeInteger(profileResult.data.points) ||
    profileResult.data.points < 0
  )
    throw errors.databaseError('Không tải được điểm học tập.')
  if (
    progress.some(row => !row.lesson_id || !row.lessons?.chapters?.language_id) ||
    new Set(progress.map(row => row.lesson_id)).size !== progress.length ||
    badges.some(row => !row.badges || typeof row.badges !== 'object')
  )
    throw errors.databaseError('Dữ liệu tiến độ học không hợp lệ. Vui lòng thử lại.')
  return {
    progress,
    summary: groupProgressByLanguage(progress),
    completedLessons: progress.filter(row => row.status === 'completed').length,
    totalLessons: totalResult.count!,
    currentStreak: streak.current_streak,
    longestStreak: streak.longest_streak,
    totalPoints: profileResult.data.points,
    badges: badges.map(row => row.badges),
  }
}
