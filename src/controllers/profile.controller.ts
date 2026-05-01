import { Request, Response, NextFunction } from 'express'
import { supabaseAdmin } from '../db/supabase'
import { AuthRequest } from '../middleware/auth'
import { errors } from '../middleware/errorHandler'

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

    res.json({
      success: true,
      data: {
        profile: data,
      },
    })
  } catch (error) {
    next(error)
  }
}

export const updateProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id
    const { displayName, avatarUrl, bio, preferredLanguage } = req.body

    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (displayName !== undefined) updateData.display_name = displayName
    if (avatarUrl !== undefined) updateData.avatar_url = avatarUrl
    if (bio !== undefined) updateData.bio = bio
    if (preferredLanguage !== undefined) updateData.preferred_language = preferredLanguage

    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error

    res.json({
      success: true,
      data: {
        profile: data,
      },
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
      data: {
        profile: data,
      },
    })
  } catch (error) {
    next(error)
  }
}
