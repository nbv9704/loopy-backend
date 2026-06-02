import { Request, Response, NextFunction } from 'express'
import { supabaseAdmin } from '../db/supabase'
import { AuthRequest } from '../middleware/auth'
import { errors } from '../middleware/errorHandler'
import { keysToCamel, keysToSnake } from '../utils/caseConverter'

export const getMyProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id

    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error || !data) {
      throw errors.notFound('Profile')
    }

    // Get user streak
    const { data: streak } = await supabaseAdmin
      .from('user_streaks')
      .select('current_streak, longest_streak')
      .eq('user_id', userId)
      .single()

    res.json({
      success: true,
      data: keysToCamel({
        profile: {
          ...data,
          current_streak: streak?.current_streak || 0,
          longest_streak: streak?.longest_streak || 0,
        },
      }),
    })
  } catch (error) {
    next(error)
  }
}

export const updateProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id
    
    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .update(keysToSnake(req.body))
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error

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
      .single()

    if (error || !data) {
      throw errors.notFound('Profile')
    }

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
