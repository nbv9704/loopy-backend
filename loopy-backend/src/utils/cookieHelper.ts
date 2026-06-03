/**
 * Cookie Helper Utilities
 * Centralized cookie configuration for secure token storage
 */

import { Response } from 'express'
import { config } from '../config'

export interface CookieOptions {
  httpOnly: boolean
  secure: boolean
  sameSite: 'strict' | 'lax' | 'none'
  path: string
  domain?: string
  maxAge: number
}

/**
 * Get secure cookie options based on environment
 */
export const getSecureCookieOptions = (maxAge: number): CookieOptions => {
  const isProduction = config.nodeEnv === 'production'

  return {
    httpOnly: true, // Prevent JavaScript access (XSS protection)
    secure: isProduction, // HTTPS only in production
    sameSite: isProduction ? 'none' : 'lax', // 'none' is required for cross-site cookies in prod
    path: '/',
    domain: process.env.COOKIE_DOMAIN || undefined,
    maxAge, // milliseconds
  }
}

/**
 * Set authentication token cookie
 * Short-lived: 15 minutes
 */
export const setAuthTokenCookie = (res: Response, token: string): void => {
  const options = getSecureCookieOptions(15 * 60 * 1000) // 15 minutes
  res.cookie('auth_token', token, options)
}

/**
 * Set refresh token cookie
 * Long-lived: 30 days
 */
export const setRefreshTokenCookie = (res: Response, refreshToken: string): void => {
  const options = getSecureCookieOptions(30 * 24 * 60 * 60 * 1000) // 30 days
  res.cookie('refresh_token', refreshToken, options)
}

/**
 * Clear all authentication cookies
 */
export const clearAuthCookies = (res: Response): void => {
  const options = getSecureCookieOptions(0)
  res.clearCookie('auth_token', options)
  res.clearCookie('refresh_token', options)
}

/**
 * Get token from cookie or Authorization header (fallback for migration)
 */
export const getTokenFromRequest = (req: any): string | null => {
  // Priority 1: Cookie (new secure method)
  if (req.cookies?.auth_token) {
    return req.cookies.auth_token
  }

  // Priority 2: Authorization header (fallback for migration period)
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }

  return null
}

/**
 * Get refresh token from cookie or body (fallback for migration)
 */
export const getRefreshTokenFromRequest = (req: any): string | null => {
  // Priority 1: Cookie (new secure method)
  if (req.cookies?.refresh_token) {
    return req.cookies.refresh_token
  }

  // Priority 2: Request body (fallback for migration period)
  if (req.body?.refreshToken) {
    return req.body.refreshToken
  }

  return null
}
