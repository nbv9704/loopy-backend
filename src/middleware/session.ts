import session from 'express-session'
import { RequestHandler } from 'express'
import { config } from '../config'
import { getAdminSessionCookieOptions } from '../utils/adminSession'
import { adminSessionStore, sessionStoreUnavailable } from '../services/admin-session-store'

const middleware = session({
  store: adminSessionStore,
  secret: config.admin.sessionSecret,
  resave: false,
  saveUninitialized: false,
  proxy: config.nodeEnv === 'production',
  cookie: {
    ...getAdminSessionCookieOptions(),
    maxAge: config.admin.sessionMaxAge,
  },
  name: 'loopy.admin.sid',
})

// Store reads fail as an infrastructure outage, not an expired/invalid user session.
export const sessionMiddleware: RequestHandler = (req, res, next) => {
  middleware(req, res, error => next(error ? sessionStoreUnavailable() : undefined))
}
export { isSessionStoreReady, closeSessionStore } from '../services/admin-session-store'
