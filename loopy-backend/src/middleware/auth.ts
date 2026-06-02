import { Request, Response, NextFunction } from 'express'
import { supabase } from '../db/supabase'
import { errors } from './errorHandler'
import { getTokenFromRequest } from '../utils/cookieHelper'

export interface AuthRequest extends Request {
  user?: {
    id: string
    email: string
  }
}

export const authenticate = async (req: AuthRequest, _res: Response, next: NextFunction) => {
  try {
    // Get token from cookie or Authorization header (fallback)
    const token = getTokenFromRequest(req)

    if (!token) {
      throw errors.authRequired()
    }

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token)

    if (error || !user) {
      const { logger } = await import('../utils/logger')
      logger.error('Supabase getUser failed in auth middleware:', error)
      throw errors.invalidToken()
    }

    req.user = {
      id: user.id,
      email: user.email!,
    }

    next()
  } catch (error) {
    next(error)
  }
}

export const optionalAuth = async (req: AuthRequest, _res: Response, next: NextFunction) => {
  try {
    // Get token from cookie or Authorization header (fallback)
    const token = getTokenFromRequest(req)

    if (token) {
      const {
        data: { user },
      } = await supabase.auth.getUser(token)

      if (user) {
        req.user = {
          id: user.id,
          email: user.email!,
        }
      }
    }

    next()
  } catch (error) {
    // Ignore auth errors for optional auth
    next()
  }
}
