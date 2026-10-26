import { Request, Response, NextFunction } from 'express'
import { supabaseAdmin } from '../db/supabase'
import { AuthRequest } from '../middleware/auth'
import { errors } from '../middleware/errorHandler'
import { keysToCamel } from '../utils/caseConverter'
import { getFreshUserStreak } from '../services/progress.service'
import { saveProfileUpdate } from '../services/profile/update-profile'

export const getMyProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id

    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (error) throw errors.databaseError('Không đọc được hồ sơ. Vui lòng thử lại.')
    if (!data) throw errors.notFound('Profile')

    const streak = await getFreshUserStreak(userId)

    res.json({
      success: true,
      data: keysToCamel({
        profile: {
          ...data,
          current_streak: streak.current_streak,
          longest_streak: streak.longest_streak,
        },
      }),
    })
  } catch (error) {
    next(error)
  }
}

export const updateProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await saveProfileUpdate(req.user!.id, req.body)

    res.json({
      success: true,
      data: keysToCamel({
        profile: data,
      }),
    })
  } catch (error) {
    next(error)
  }
}

export const getPublicProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .select('id, display_name, avatar_url, bio, created_at')
      .eq('id', id)
      .maybeSingle()

    if (error) throw errors.databaseError('Không đọc được hồ sơ. Vui lòng thử lại.')
    if (!data) throw errors.notFound('Profile')

    res.json({
      success: true,
      data: keysToCamel({
        profile: data,
      }),
    })
  } catch (error) {
    next(error)
  }
}
