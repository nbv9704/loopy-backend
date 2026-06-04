import { Request, Response, NextFunction } from 'express'
import { config } from '../config'

const getEnvAllowedOrigins = () => {
  const envOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : []
  return [
    config.frontendUrl,
    'https://loopy.vercel.app',
    'https://loopy-frontend-blond.vercel.app',
    ...envOrigins
  ].map(o => o.trim()).filter(Boolean)
}

function isOriginAllowed(origin: string): boolean {
  const allowedOrigins = getEnvAllowedOrigins()
  return allowedOrigins.includes(origin)
}

/**
 * Strict Origin and Referer verification middleware to protect against CSRF attacks.
 * Applied automatically to mutating requests (POST, PUT, DELETE, PATCH).
 */
export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
  // Skip CSRF check for safe methods
  const mutatingMethods = ['POST', 'PUT', 'DELETE', 'PATCH']
  if (!mutatingMethods.includes(req.method)) {
    return next()
  }

  // Get Origin and Referer headers
  const origin = req.headers.origin as string
  const referer = req.headers.referer as string

  // Validate Origin header if present
  if (origin) {
    if (isOriginAllowed(origin)) {
      return next()
    }
  } else if (referer) {
    // Validate Referer URL host if Origin is missing (e.g. some custom clients)
    try {
      const refererUrl = new URL(referer)
      const refererOrigin = `${refererUrl.protocol}//${refererUrl.host}`
      if (isOriginAllowed(refererOrigin)) {
        return next()
      }
    } catch {
      // Ignore URL parsing errors and reject
    }
  }

  // Reject the request if origin/referer are missing or unauthorized
  res.status(403).json({
    success: false,
    message: 'Forbidden: CSRF validation failed',
  })
}
