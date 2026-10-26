import { supabaseAdmin } from '../../db/supabase'
import { errors } from '../../middleware/errorHandler'

interface OnboardingUpdate {
  onboardingCompleted?: boolean
  currentPathId?: string | null
  preferredLanguage?: string
  learningPath?: string
}

/** Validate the resulting selection, including explicit nulls and an existing completed flag. */
export async function validateOnboardingSelection(userId: string, update: OnboardingUpdate) {
  const touchesSelection =
    update.onboardingCompleted !== undefined ||
    update.currentPathId !== undefined ||
    update.preferredLanguage !== undefined ||
    update.learningPath !== undefined
  if (!touchesSelection) return

  const { data: current, error: profileError } = await supabaseAdmin
    .from('user_profiles')
    .select('preferred_language, learning_path, current_path_id, onboarding_completed')
    .eq('id', userId)
    .maybeSingle()
  if (profileError) throw errors.databaseError('Không tải được hồ sơ để kiểm tra lộ trình.')
  if (!current) throw errors.notFound('Profile')

  const language = update.preferredLanguage ?? current.preferred_language
  const goal = update.learningPath ?? current.learning_path
  const pathId = update.currentPathId === undefined ? current.current_path_id : update.currentPathId
  const completed = update.onboardingCompleted ?? current.onboarding_completed
  if (completed && (!language || !goal || !pathId)) {
    throw errors.validationError(
      'Onboarding requires preferredLanguage, learningPath, and currentPathId'
    )
  }
  const onlyReset =
    update.onboardingCompleted === false &&
    update.currentPathId === undefined &&
    update.preferredLanguage === undefined &&
    update.learningPath === undefined
  if (!pathId || onlyReset) return current

  const { data: path, error: pathError } = await supabaseAdmin
    .from('learning_paths')
    .select('id, language_id, goal_id, is_active')
    .eq('id', pathId)
    .maybeSingle()
  if (pathError) throw errors.databaseError('Không tải được lộ trình đã chọn.')
  if (!path || !path.is_active)
    throw errors.validationError('Learning path không hợp lệ hoặc đã bị tắt')
  if (language && path.language_id !== language)
    throw errors.validationError('Learning path không khớp với ngôn ngữ đã chọn')
  if (goal && path.goal_id !== goal)
    throw errors.validationError('Learning path không khớp với mục tiêu học đã chọn')
  return current
}
