import { Response, NextFunction } from 'express'
import { AuthRequest } from './auth'
import { supabaseAdmin } from '../db/supabase'
import { errors } from './errorHandler'

/**
 * Middleware to verify that the authenticated user has admin privileges.
 * Must be used after the authenticate middleware.
 *
 * Requirements: 2.3, 2.4, 2.5
 */
export const requireAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Verify user is authenticated
    if (!req.user) {
      throw errors.authRequired()
    }

    // Query user_profiles table for is_admin field
    const { data: profile, error } = await supabaseAdmin
      .from('user_profiles')
      .select('is_admin')
      .eq('id', req.user.id)
      .single()

    // Handle query errors or missing profile
    if (error) {
      throw errors.forbidden()
    }

    // Check if user has admin privileges
    if (!profile || !profile.is_admin) {
      throw errors.forbidden()
    }

    // User is admin, proceed to next middleware/handler
    next()
  } catch (error) {
    next(error)
  }
}
