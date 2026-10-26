import { supabaseAdmin } from '../../db/supabase'
import { AppError, errors } from '../../middleware/errorHandler'
import { validateContent } from '../../utils/contentModeration'
import { keysToSnake } from '../../utils/caseConverter'
import { validateOnboardingSelection } from './onboarding-selection'

interface ProfileUpdate {
  displayName?: string
  bio?: string
  avatarUrl?: string
  preferredLanguage?: string
  learningPath?: string
  learningGoal?: string
  currentPathId?: string | null
  onboardingCompleted?: boolean
  experienceLevel?: string
}

/** Preserve the selection that was validated until the conditional write commits. */
export async function saveProfileUpdate(userId: string, input: ProfileUpdate) {
  if (
    input.learningGoal !== undefined &&
    input.learningPath !== undefined &&
    input.learningGoal !== input.learningPath
  )
    throw errors.validationError('learningGoal và learningPath không khớp.')
  await validateContent([input.displayName, input.bio])
  const update = { ...input }
  if (update.learningGoal !== undefined && update.learningPath === undefined)
    update.learningPath = update.learningGoal
  delete update.learningGoal
  const expected = await validateOnboardingSelection(userId, update)
  let query = supabaseAdmin.from('user_profiles').update(keysToSnake(update)).eq('id', userId)
  if (expected) {
    for (const key of [
      'preferred_language',
      'learning_path',
      'current_path_id',
      'onboarding_completed',
    ] as const) {
      query = expected[key] === null ? query.is(key, null) : query.eq(key, expected[key])
    }
  }
  const { data, error } = await query.select().maybeSingle()
  if (error) throw errors.databaseError('Không lưu được hồ sơ. Vui lòng thử lại.')
  if (!data) {
    if (expected)
      throw new AppError(
        409,
        'PROFILE_CHANGED',
        'Lộ trình đã thay đổi ở phiên khác. Kiểm tra lại lựa chọn trước khi lưu lại.'
      )
    throw errors.notFound('Profile')
  }
  if (data.id !== userId) throw errors.databaseError('Không xác nhận được hồ sơ đã lưu.')
  return data
}
