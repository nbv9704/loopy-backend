import session from 'express-session'
import { config } from '../config'

/**
 * Session middleware configuration for admin dashboard
 * Uses secure HTTP-only cookies with appropriate settings per environment
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const sessionMiddleware: any = session({
  secret: config.admin.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: config.nodeEnv === 'production', // HTTPS only in production
    maxAge: config.admin.sessionMaxAge,
    sameSite: config.nodeEnv === 'production' ? 'none' : 'lax',
  },
  name: 'loopy.admin.sid', // Custom session cookie name
})
