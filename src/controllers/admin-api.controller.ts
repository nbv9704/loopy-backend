import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/auth'
import { supabaseAdmin } from '../db/supabase'
import { createClient } from '@supabase/supabase-js'
import { config } from '../config'
import { logger } from '../utils/logger'

const supabase = createClient(config.supabase.url, config.supabase.anonKey)

declare module 'express-session' {
  interface SessionData {
    userId?: string
    userEmail?: string
    accessToken?: string
  }
}

interface LoginRequest extends AuthRequest {
  body: {
    email: string
    password: string
    remember?: boolean
  }
}

/**
 * Admin API Controller - JSON API endpoints for React SPA
 */

/**
 * Login endpoint - Returns JSON response
 * POST /api/admin-auth/login
 */
export async function login(req: LoginRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password, remember } = req.body

    // Validate input
    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Email and password are required',
      })
      return
    }

    // Authenticate with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error || !data.user) {
      logger.error('Login failed - authentication error:', error)
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      })
      return
    }

    logger.info(`User authenticated: ${data.user.id} (${data.user.email})`)

    // Check if user is admin
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('is_admin')
      .eq('id', data.user.id)
      .single()

    logger.info('Profile query result:', { profile, error: profileError })

    if (profileError) {
      logger.error('Profile query error:', profileError)
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user profile',
      })
      return
    }

    if (!profile) {
      logger.error('Profile not found for user:', data.user.id)
      res.status(403).json({
        success: false,
        message: 'User profile not found',
      })
      return
    }

    // Check admin status
    const isAdmin = profile.is_admin === true

    logger.info(`Admin check for ${data.user.email}:`, {
      is_admin: profile.is_admin,
      isAdmin,
    })

    if (!isAdmin) {
      res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
      })
      return
    }

    // Store user info in session
    req.session.userId = data.user.id
    req.session.userEmail = data.user.email || ''
    req.session.accessToken = data.session?.access_token

    // Set session cookie options
    if (remember) {
      req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000 // 30 days
    } else {
      req.session.cookie.maxAge = 24 * 60 * 60 * 1000 // 1 day
    }

    // Save session
    req.session.save(err => {
      if (err) {
        logger.error('Session save error:', err)
        res.status(500).json({
          success: false,
          message: 'Failed to create session',
        })
        return
      }

      logger.info(`Login successful for ${data.user.email}`)

      // Return success response
      res.json({
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email,
          role: 'admin',
        },
        token: data.session?.access_token, // For compatibility with React app
      })
    })
  } catch (error) {
    logger.error('Login error:', error)
    next(error)
  }
}

/**
 * Logout endpoint - Clears session
 * POST /api/admin-auth/logout
 */
export async function logout(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    // Destroy session
    req.session.destroy(err => {
      if (err) {
        res.status(500).json({
          success: false,
          message: 'Failed to logout',
        })
        return
      }

      // Clear session cookie
      res.clearCookie('connect.sid')

      res.json({
        success: true,
        message: 'Logged out successfully',
      })
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get current user info
 * GET /api/admin-auth/me
 */
export async function getCurrentUser(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Check if session exists
    if (!req.session || !req.session.userId) {
      res.status(401).json({
        success: false,
        message: 'Not authenticated',
      })
      return
    }

    // Return user info from session
    res.json({
      success: true,
      user: {
        id: req.session.userId,
        email: req.session.userEmail,
        role: 'admin',
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get dashboard statistics
 * GET /api/admin-auth/dashboard/stats
 */
export async function getDashboardStats(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Fetch statistics for all content types
    const [
      technologiesResult,
      linksResult,
      featuresResult,
      statsResult,
      languagesResult,
      stepsResult,
      navigationResult,
    ] = await Promise.all([
      supabaseAdmin.from('documentation_technologies').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('documentation_links').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('landing_features').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('landing_stats').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('landing_languages').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('landing_how_it_works').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('navigation_items').select('id', { count: 'exact', head: true }),
    ])

    const statistics = {
      technologies: technologiesResult.count || 0,
      links: linksResult.count || 0,
      features: featuresResult.count || 0,
      stats: statsResult.count || 0,
      languages: languagesResult.count || 0,
      steps: stepsResult.count || 0,
      navigationItems: navigationResult.count || 0,
    }

    res.json({
      success: true,
      data: statistics,
    })
  } catch (error) {
    next(error)
  }
}
