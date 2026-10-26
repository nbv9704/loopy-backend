import { authProviderFailure } from '../services/auth/provider-error'
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

    if (error) throw authProviderFailure(error) || errors.invalidToken()
    if (!user) throw errors.invalidToken()

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
        error,
      } = await supabase.auth.getUser(token)

      const unavailable = authProviderFailure(error)
      if (unavailable) return next(unavailable)
      if (!error && user) {
        req.user = {
          id: user.id,
          email: user.email!,
        }
      }
    }

    next()
  } catch (error) {
    next(authProviderFailure(error) || error)
  }
}
