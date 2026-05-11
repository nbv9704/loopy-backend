import { Request, Response, NextFunction } from 'express'
import { supabase, supabaseAdmin } from '../db/supabase'
import { errors } from '../middleware/errorHandler'
import { logger } from '../utils/logger'
import { config } from '../config'
import {
  setAuthTokenCookie,
  setRefreshTokenCookie,
  clearAuthCookies,
  getRefreshTokenFromRequest,
  getTokenFromRequest,
} from '../utils/cookieHelper'

export const signup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, displayName } = req.body

    // In development, use admin client to bypass email confirmation
    const isDevelopment = process.env.NODE_ENV === 'development'

    let authData, authError

    if (isDevelopment) {
      // Use admin client to create user without email confirmation
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm email in development
        user_metadata: {
          display_name: displayName || email.split('@')[0],
        },
      })
      authData = data
      authError = error
    } else {
      // Use regular signup in production
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: config.frontendUrl,
          data: {
            display_name: displayName || email.split('@')[0],
          },
        },
      })
      authData = data
      authError = error
    }

    if (authError) {
      logger.error('Supabase signup error:', authError)
      return next(errors.validationError(authError.message))
    }

    if (!authData.user) {
      logger.error('No user data returned from Supabase')
      return next(errors.validationError('Failed to create user'))
    }

    logger.info('User created in auth:', authData.user.id)

    // Create user profile
    const { error: profileError } = await supabaseAdmin.from('user_profiles').insert({
      id: authData.user.id,
      display_name: displayName || email.split('@')[0],
      preferred_language: 'javascript',
    } as any)

    if (profileError) {
      logger.error('Failed to create user profile:', profileError)
      // Don't fail signup if profile creation fails, we can create it later
    } else {
      logger.info('User profile created:', authData.user.id)
    }

    // For development with admin.createUser, we need to sign in to get a session
    let session = null
    if (isDevelopment) {
      logger.info('Signing in user for session:', email)
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        logger.error('Failed to sign in after signup:', signInError)
      } else {
        session = signInData?.session
        logger.info('Session created for user:', authData.user.id)

        // Set secure httpOnly cookies
        if (session?.access_token) {
          setAuthTokenCookie(res, session.access_token)
        }
        if (session?.refresh_token) {
          setRefreshTokenCookie(res, session.refresh_token)
        }
      }
    }

    // Return success (NO TOKENS in response body for security)
    res.status(201).json({
      success: true,
      data: {
        user: {
          id: authData.user.id,
          email: authData.user.email,
        },
        // Don't send tokens in response - they're in httpOnly cookies
        message: session ? 'Đăng ký thành công' : 'Vui lòng kiểm tra email để xác nhận tài khoản',
      },
    })
  } catch (error: any) {
    logger.error('Signup error:', error)
    next(new Error(error.message))
  }
}

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      if (error.message === 'Email not confirmed') {
        throw errors.unauthorized(
          'Tài khoản chưa được xác nhận. Vui lòng kiểm tra email để kích hoạt.'
        )
      } else if (error.message === 'Invalid login credentials') {
        throw errors.unauthorized('Tài khoản hoặc mật khẩu không chính xác')
      }
      throw errors.unauthorized(error.message)
    }

    // Set secure httpOnly cookies
    if (data.session?.access_token) {
      setAuthTokenCookie(res, data.session.access_token)
    }
    if (data.session?.refresh_token) {
      setRefreshTokenCookie(res, data.session.refresh_token)
    }

    // Return success (NO TOKENS in response body for security)
    res.json({
      success: true,
      data: {
        user: {
          id: data.user.id,
          email: data.user.email,
        },
        // Don't send tokens in response - they're in httpOnly cookies
      },
    })
  } catch (error) {
    next(error)
  }
}

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = getTokenFromRequest(req)

    if (token) {
      // Verify token to get user, then sign them out via admin API
      const {
        data: { user },
      } = await supabase.auth.getUser(token)
      if (user) {
        await supabaseAdmin.auth.admin.signOut(user.id)
      }
    }

    // Clear httpOnly cookies
    clearAuthCookies(res)

    res.json({
      success: true,
      data: {
        message: 'Logged out successfully',
      },
    })
  } catch (error) {
    next(error)
  }
}

export const getCurrentUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = getTokenFromRequest(req)

    if (!token) {
      throw errors.authRequired()
    }

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token)

    if (error || !user) {
      throw errors.invalidToken()
    }

    // Get user profile
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          profile,
        },
      },
    })
  } catch (error) {
    next(error)
  }
}

export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get refresh token from cookie or body (fallback for migration)
    const refreshToken = getRefreshTokenFromRequest(req)

    if (!refreshToken) {
      throw errors.invalidToken()
    }

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    })

    if (error) {
      throw errors.invalidToken()
    }

    // Set new secure httpOnly cookies
    if (data.session?.access_token) {
      setAuthTokenCookie(res, data.session.access_token)
    }
    if (data.session?.refresh_token) {
      setRefreshTokenCookie(res, data.session.refresh_token)
    }

    // Return success (NO TOKENS in response body for security)
    res.json({
      success: true,
      data: {
        message: 'Token refreshed successfully',
        // Don't send tokens in response - they're in httpOnly cookies
      },
    })
  } catch (error) {
    next(error)
  }
}
