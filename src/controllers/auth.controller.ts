import { authProviderFailure, requireAuthSession } from '../services/auth/provider-error'
import { Request, Response, NextFunction } from 'express'
import { supabase, supabaseAdmin } from '../db/supabase'
import { isDevelopmentDatabase } from '../utils/development'
import { AppError, errors } from '../middleware/errorHandler'
import { logger } from '../utils/logger'
import { config } from '../config'
import {
  setAuthTokenCookie,
  setRefreshTokenCookie,
  clearAuthCookies,
  getRefreshTokenFromRequest,
  getTokenFromRequest,
} from '../utils/cookieHelper'
import { keysToCamel } from '../utils/caseConverter'
import { validateContent } from '../utils/contentModeration'
import { getFreshUserStreak } from '../services/progress.service'

const ensureUserProfile = async (user: {
  id: string
  email?: string | null
  user_metadata?: Record<string, unknown>
}) => {
  const displayName =
    typeof user.user_metadata?.display_name === 'string'
      ? user.user_metadata.display_name
      : user.email?.split('@')[0] || 'Người học'

  const { error } = await supabaseAdmin.from('user_profiles').upsert(
    {
      id: user.id,
      display_name: displayName,
      preferred_language: 'javascript',
    } as any,
    { onConflict: 'id', ignoreDuplicates: true }
  )

  if (error) throw errors.databaseError('Failed to ensure user profile', error)
}

export const signup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, displayName } = req.body

    // Validate displayName for banned keywords
    await validateContent([displayName])

    // In development, use admin client to bypass email confirmation
    const isDevelopment = isDevelopmentDatabase()

    let authData, authError
    let session: { access_token: string; refresh_token: string } | null = null

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
      session = data.session
    }

    if (authError) {
      logger.error('Supabase signup error:', authError)
      return next(authProviderFailure(authError) || errors.validationError(authError.message))
    }

    if (!authData?.user?.id || !authData.user.email)
      throw new AppError(502, 'AUTH_INVALID_RESPONSE', 'Dữ liệu tài khoản không hợp lệ.')

    logger.info('User created in auth:', authData.user.id)

    // Create user profile
    const { error: profileError } = await supabaseAdmin.from('user_profiles').upsert(
      {
        id: authData.user.id,
        display_name: displayName || email.split('@')[0],
        preferred_language: 'javascript',
      } as any,
      { onConflict: 'id', ignoreDuplicates: true }
    )

    if (profileError) {
      logger.error('Failed to create user profile:', profileError)
      return next(errors.databaseError('Failed to create user profile', profileError))
    } else {
      logger.info('User profile created:', authData.user.id)
    }

    // For development with admin.createUser, we need to sign in to get a session
    if (isDevelopment) {
      logger.info('Signing in user for session:', email)
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError)
        throw (
          authProviderFailure(signInError) ||
          errors.unauthorized('Tài khoản đã tạo nhưng chưa đăng nhập được. Vui lòng đăng nhập lại.')
        )
      session = signInData?.session
      requireAuthSession(session)
    }
    if (session) {
      requireAuthSession(session)
      setAuthTokenCookie(res, session.access_token)
      setRefreshTokenCookie(res, session.refresh_token)
    }

    // Return success (NO TOKENS in response body for security)
    res.status(201).json({
      success: true,
      data: keysToCamel({
        user: {
          id: authData.user.id,
          email: authData.user.email,
        },
        requires_email_confirmation: !session,
        // Don't send tokens in response - they're in httpOnly cookies
        message: session ? 'Đăng ký thành công' : 'Vui lòng kiểm tra email để xác nhận tài khoản',
      }),
    })
  } catch (error) {
    logger.error('Signup error:', error)
    next(error)
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
      const unavailable = authProviderFailure(error)
      if (unavailable) throw unavailable
      if (error.message === 'Email not confirmed') {
        throw errors.unauthorized(
          'Tài khoản chưa được xác nhận. Vui lòng kiểm tra email để kích hoạt.'
        )
      } else if (error.message === 'Invalid login credentials') {
        throw errors.unauthorized('Tài khoản hoặc mật khẩu không chính xác')
      }
      throw errors.unauthorized(error.message)
    }

    requireAuthSession(data.session)
    if (!data.user?.id || !data.user.email)
      throw new AppError(502, 'AUTH_INVALID_RESPONSE', 'Dữ liệu tài khoản không hợp lệ.')
    await ensureUserProfile(data.user)

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
      data: keysToCamel({
        user: {
          id: data.user.id,
          email: data.user.email,
        },
        // Don't send tokens in response - they're in httpOnly cookies
      }),
    })
  } catch (error) {
    next(error)
  }
}

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // End the local session even when the auth provider is unavailable.
    clearAuthCookies(res)
    const token = getTokenFromRequest(req)

    if (token) {
      // Verify token to get user, then sign them out via admin API
      const {
        data: { user },
        error: verificationError,
      } = await supabase.auth.getUser(token)
      if (authProviderFailure(verificationError)) {
        throw new AppError(
          502,
          'AUTH_LOGOUT_FAILED',
          'Đã xóa phiên trên trình duyệt nhưng chưa xác minh được việc thu hồi phiên trên máy chủ.'
        )
      }
      if (user) {
        const { error } = await supabaseAdmin.auth.admin.signOut(token)
        if (error) {
          throw new AppError(
            502,
            'AUTH_LOGOUT_FAILED',
            'Đã xóa phiên trên trình duyệt nhưng chưa thu hồi được phiên trên máy chủ.'
          )
        }
      }
    }

    res.json({
      success: true,
      data: keysToCamel({
        message: 'Logged out successfully',
      }),
    })
  } catch {
    next(
      new AppError(
        502,
        'AUTH_LOGOUT_FAILED',
        'Đã xóa phiên trên trình duyệt nhưng chưa thu hồi được phiên trên máy chủ.'
      )
    )
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

    if (error) throw authProviderFailure(error) || errors.invalidToken()
    if (!user) throw errors.invalidToken()

    await ensureUserProfile(user)

    // Get user profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.id !== user.id)
      throw errors.databaseError('Không đọc được hồ sơ người học. Vui lòng thử lại.')

    const streak = await getFreshUserStreak(user.id)

    res.json({
      success: true,
      data: keysToCamel({
        user: {
          id: user.id,
          email: user.email,
          profile: {
            ...profile,
            current_streak: streak.current_streak,
            longest_streak: streak.longest_streak,
          },
        },
      }),
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

    if (error) throw authProviderFailure(error) || errors.invalidToken()
    requireAuthSession(data.session)

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
      data: keysToCamel({
        message: 'Token refreshed successfully',
        // Don't send tokens in response - they're in httpOnly cookies
      }),
    })
  } catch (error) {
    next(error)
  }
}
