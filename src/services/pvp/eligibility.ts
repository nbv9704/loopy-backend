import { supabaseAdmin } from '../../db/supabase'
import { errors } from '../../middleware/errorHandler'

/** Eligibility comes from saved published progress, never cached points. */
export async function getPvPEligibility(userId: string) {
  const [profile, progress] = await Promise.all([
    supabaseAdmin
      .from('user_profiles')
      .select('onboarding_completed')
      .eq('id', userId)
      .maybeSingle(),
    supabaseAdmin
      .from('user_progress')
      .select('id, lessons!inner(status)', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'completed')
      .eq('lessons.status', 'published'),
  ])
  if (profile.error || progress.error || typeof progress.count !== 'number')
    throw errors.databaseError('Không tải được điều kiện tham gia PvP. Vui lòng thử lại.')
  const onboardingCompleted = profile.data?.onboarding_completed === true
  const hasCompletedLesson = progress.count > 0
  return {
    eligible: onboardingCompleted && hasCompletedLesson,
    onboardingCompleted,
    hasCompletedLesson,
  }
}
