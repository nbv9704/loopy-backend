import { Request, Response, NextFunction } from 'express'
import { supabase } from '../db/supabase'
import { errors } from './errorHandler'

export interface AuthRequest extends Request {
  user?: {
    id: string
    email: string
  }
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw errors.authRequired()
    }

    const token = authHeader.substring(7)

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token)

    if (error || !user) {
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

export const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
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
