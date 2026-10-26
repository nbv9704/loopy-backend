import { Response } from 'express'
import { createClient } from '@supabase/supabase-js'
import { login, logout } from '../admin-api.controller'
import { getAdminSessionCookieOptions } from '../../utils/adminSession'
import express from 'express'
import request from 'supertest'
import adminApiRoutes from '../../routes/admin-api.routes'
import { errorHandler } from '../../middleware/errorHandler'
import { supabaseAdmin } from '../../db/supabase'
import { sessionMiddleware } from '../../middleware/session'
import { adminSessionStore, assertSessionStoreReady } from '../../services/admin-session-store'
import session from 'express-session'
import { authLimiter } from '../../middleware/rateLimiter'
import type { RateLimitRequestHandler } from 'express-rate-limit'

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({ auth: { signInWithPassword: jest.fn() } })),
}))
jest.mock('../../db/supabase', () => ({ supabaseAdmin: { from: jest.fn() } }))
jest.mock('../../utils/logger', () => ({ logger: { info: jest.fn(), error: jest.fn() } }))
jest.mock('../../services/admin-session-store', () => {
  const { MemoryStore } = jest.requireActual('express-session')
  const { AppError } = jest.requireActual('../../middleware/errorHandler')
  return {
    adminSessionStore: new MemoryStore(),
    assertSessionStoreReady: jest.fn(),
    sessionStoreUnavailable: () =>
      new AppError(
        503,
        'ADMIN_SESSION_UNAVAILABLE',
        'Phiên admin đang gián đoạn. Vui lòng thử lại.'
      ),
  }
})

describe('admin login session rotation', () => {
  const signIn = (createClient as jest.Mock).mock.results[0].value.auth
    .signInWithPassword as jest.Mock
  beforeEach(async () => {
    await (authLimiter as RateLimitRequestHandler).resetKey('::ffff:127.0.0.1')
    jest.clearAllMocks()
    jest.mocked(assertSessionStoreReady).mockReset().mockResolvedValue(undefined)
    signIn.mockResolvedValue({
      data: {
        user: { id: 'admin', email: 'admin@example.test' },
        session: { access_token: 'fake-jwt' },
      },
      error: null,
    })
    ;(supabaseAdmin.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: { is_admin: true }, error: null }),
    })
  })
  it('stores privileges only after replacing the pre-login session', async () => {
    const fresh = {
      cookie: {},
      save: jest.fn(callback => callback(null)),
      userId: undefined as string | undefined,
    }
    const old = { userId: 'pre-login', regenerate: jest.fn() }
    const req = {
      body: { email: 'admin@example.test', password: 'fake-password' },
      session: old,
    } as unknown as Parameters<typeof login>[0]
    old.regenerate.mockImplementation(callback => {
      req.session = fresh as never
      callback(null)
    })
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() } as unknown as Response
    const next = jest.fn()
    await login(req, res, next)
    expect(old.regenerate).toHaveBeenCalledTimes(1)
    expect(old.userId).toBe('pre-login')
    expect(fresh.userId).toBe('admin')
    expect(fresh.save).toHaveBeenCalledTimes(1)
    expect(next).not.toHaveBeenCalled()
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }))
  })
  it.each([
    [{ name: 'AuthApiError', status: 400 }, 401],
    [{ name: 'AuthRetryableFetchError', status: 0 }, 503],
    [{ name: 'AuthApiError', status: 503 }, 503],
  ])(
    'distinguishes invalid credentials from an unavailable identity provider (%j)',
    async (error, status) => {
      signIn.mockResolvedValueOnce({ data: { user: null }, error })
      const req = {
        body: { email: 'admin@example.test', password: 'fake-password' },
      } as Parameters<typeof login>[0]
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as unknown as Response
      const next = jest.fn()
      await login(req, res, next)
      if (status === 401) expect(res.status).toHaveBeenCalledWith(401)
      else
        expect(next).toHaveBeenCalledWith(
          expect.objectContaining({ statusCode: 503, code: 'AUTH_PROVIDER_UNAVAILABLE' })
        )
      expect(supabaseAdmin.from).not.toHaveBeenCalled()
    }
  )
  it('does not create an authenticated response if regeneration fails', async () => {
    const session = {
      regenerate: jest.fn(callback => callback(new Error('store unavailable'))),
      save: jest.fn(),
    }
    const req = {
      body: { email: 'admin@example.test', password: 'fake-password' },
      session,
    } as unknown as Parameters<typeof login>[0]
    const res = { json: jest.fn(), clearCookie: jest.fn() } as unknown as Response
    const next = jest.fn()
    await login(req, res, next)
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 503, code: 'ADMIN_SESSION_UNAVAILABLE' })
    )
    expect(session.save).not.toHaveBeenCalled()
    expect(res.json).not.toHaveBeenCalled()
  })

  it.each([null, new Error('store unavailable')])(
    'clears the local cookie even when destroying the session returns %s',
    async failure => {
      const req = {
        session: { destroy: jest.fn(callback => callback(failure)) },
      } as unknown as Parameters<typeof logout>[0]
      const res = {
        clearCookie: jest.fn(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response
      await logout(req, res, jest.fn())
      expect(res.clearCookie).toHaveBeenCalledWith(
        'loopy.admin.sid',
        getAdminSessionCookieOptions()
      )
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: !failure }))
    }
  )

  describe('real Express session lifecycle with a local fake store', () => {
    const store = adminSessionStore as unknown as session.MemoryStore
    const app = () => {
      const instance = express()
      instance.use(express.json())
      instance.use(sessionMiddleware)
      instance.use('/api/admin-auth', adminApiRoutes)
      instance.use(errorHandler)
      return instance
    }
    beforeEach(done => store.clear(done))
    afterEach(() => jest.restoreAllMocks())
    const credentials = { email: 'admin@example.test', password: 'fake-password' }

    it('creates one persisted session, then authenticates with its cookie', async () => {
      const client = request.agent(app())
      const response = await client.post('/api/admin-auth/login').send(credentials)
      expect(response.status).toBe(200)
      expect(response.headers['set-cookie'][0]).toMatch(
        /loopy\.admin\.sid=.*HttpOnly.*SameSite=Lax/
      )
      const current = await client.get('/api/admin-auth/me')
      expect(current.status).toBe(200)
      expect(current.body.user).toMatchObject({ id: 'admin', role: 'admin' })
      const sessions = await new Promise<Record<string, session.SessionData> | null | undefined>(
        (resolve, reject) => store.all((error, rows) => (error ? reject(error) : resolve(rows)))
      )
      const saved = Object.values(sessions || {})
      expect(saved).toHaveLength(1)
      expect(saved[0]).not.toHaveProperty('accessToken')
      expect(response.headers['set-cookie'][0]).not.toContain('Expires=')
    })
    it('preserves remember-me cookie expiry', async () => {
      const response = await request(app())
        .post('/api/admin-auth/login')
        .send({ ...credentials, remember: true })
      expect(response.status).toBe(200)
      expect(response.headers['set-cookie'][0]).toContain('Expires=')
    })
    it('rejects a Redis outage before sending credentials to the auth provider', async () => {
      // Use the typed infrastructure error used by the real store guard.
      const { sessionStoreUnavailable } = await import('../../services/admin-session-store')
      jest
        .mocked(assertSessionStoreReady)
        .mockReset()
        .mockRejectedValueOnce(sessionStoreUnavailable())
      const response = await request(app()).post('/api/admin-auth/login').send(credentials)
      expect(response.status).toBe(503)
      expect(signIn).not.toHaveBeenCalled()
      expect(response.body.error.code).toBe('ADMIN_SESSION_UNAVAILABLE')
    })
    it.each([false, true])(
      'does not auto-save or issue privileges after a failed acknowledgement (write applied=%s)',
      async applied => {
        const original = store.set.bind(store)
        const set = jest.spyOn(store, 'set').mockImplementation((sid, value, callback) => {
          if (applied) original(sid, value, () => callback?.(new Error('ECONNRESET')))
          else callback?.(new Error('ECONNRESET'))
        })
        const response = await request(app()).post('/api/admin-auth/login').send(credentials)
        expect(response.status).toBe(503)
        expect(response.body.error.code).toBe('ADMIN_SESSION_UNAVAILABLE')
        expect(response.headers['set-cookie'][0]).toMatch(/loopy\.admin\.sid=;/)
        expect(set).toHaveBeenCalledTimes(1)
        const count = await new Promise<number | undefined>((resolve, reject) =>
          store.length((error, length) => (error ? reject(error) : resolve(length)))
        )
        expect(count).toBe(0)
      }
    )
    it('does not turn a session read outage into logout or a generic 500', async () => {
      const client = request.agent(app())
      await client.post('/api/admin-auth/login').send(credentials).expect(200)
      jest
        .spyOn(store, 'get')
        .mockImplementation((_sid, callback) => callback(new Error('ECONNRESET')))
      const response = await client.get('/api/admin-auth/me')
      expect(response.status).toBe(503)
      expect(response.body.error.code).toBe('ADMIN_SESSION_UNAVAILABLE')
      expect(response.headers['set-cookie']).toBeUndefined()
    })
    it('still rejects an authenticated learner whose profile lacks the admin flag', async () => {
      jest.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { is_admin: false }, error: null }),
      } as never)
      const response = await request(app()).post('/api/admin-auth/login').send(credentials)
      expect(response.status).toBe(403)
      expect(response.headers['set-cookie']).toBeUndefined()
    })
  })

  it('uses secure cross-site cookie attributes in production for both set and clear', () => {
    expect(getAdminSessionCookieOptions('production')).toEqual({
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
    })
  })

  it.each([
    { email: ['admin@example.test'], password: 'test' },
    { email: 'admin@example.test', password: 123 },
    { email: 'admin@example.test', password: 'test', remember: 'yes' },
  ])('rejects malformed login input before authenticating', async body => {
    const app = express()
    app.use(express.json())
    app.use('/api/admin-auth', adminApiRoutes)
    app.use(errorHandler)
    const response = await request(app).post('/api/admin-auth/login').send(body)
    expect(response.status).toBe(400)
    expect(signIn).not.toHaveBeenCalled()
  })
})
