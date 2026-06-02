import { Response, NextFunction } from 'express'
import { AuthRequest } from './auth'
import { errors } from './errorHandler'

/**
 * Session-based authentication middleware for admin dashboard
 * Checks if user is authenticated via session (not Bearer token)
 *
 * Requirements: 1.2, 1.3, 1.4, 17.1, 17.2
 */
export const authenticateSession = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Check if session exists and has userId
    if (!req.session || !req.session.userId) {
      // Return error for JSON API routes starting with /api/
      if (req.originalUrl.startsWith('/api') || req.path.startsWith('/api')) {
        throw errors.authRequired()
      }

      // Redirect to login page for GET requests
      if (req.method === 'GET') {
        return res.redirect(`/admin/login?redirect=${encodeURIComponent(req.originalUrl)}`)
      }

      // Return error for POST/PUT/DELETE requests
      throw errors.authRequired()
    }

    // Set user object from session data
    req.user = {
      id: req.session.userId,
      email: req.session.userEmail || '',
    }

    next()
  } catch (error) {
    next(error)
  }
}
