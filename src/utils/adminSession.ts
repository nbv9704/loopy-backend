import type { CookieOptions, Request, Response } from 'express'
import { config } from '../config'
import { logger } from './logger'

/** Creation and clearing must share attributes for cross-site production sessions. */
export function getAdminSessionCookieOptions(environment = config.nodeEnv): CookieOptions {
  return {
    httpOnly: true,
    secure: environment === 'production',
    sameSite: environment === 'production' ? 'none' : 'lax',
    path: '/',
  }
}

/** Do not let express-session auto-save privileges or issue a cookie after a failed save. */
export function discardFailedAdminSession(req: Request, res: Response) {
  const pending = req.session
  delete (req as { session?: unknown }).session
  res.clearCookie('loopy.admin.sid', getAdminSessionCookieOptions())
  if (!pending) return
  try {
    pending.destroy(error => {
      if (error) logger.error('Failed admin session cleanup was not confirmed')
    })
  } catch {
    logger.error('Failed admin session cleanup was not confirmed')
  }
}
