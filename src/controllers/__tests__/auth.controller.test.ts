import { Request, Response } from 'express'
import { logout, signup, login, refreshToken, getCurrentUser } from '../auth.controller'
import { supabase, supabaseAdmin } from '../../db/supabase'

describe('signup against a real database from a local development process', () => {
  const originalEnv = { ...process.env }
  afterEach(() => {
    process.env = { ...originalEnv }
  })
  it('does not use admin email confirmation when the database is production', async () => {
    jest.resetAllMocks()
    process.env.NODE_ENV = 'development'
    process.env.LOOPY_DATABASE_KIND = 'production'
    jest
      .mocked(supabase.auth.signUp)
      .mockResolvedValue({
        data: { user: { id: 'test-user', email: 'learner@example.test' } },
        error: null,
      } as any)
    jest
      .mocked(supabaseAdmin.from)
      .mockReturnValue({ upsert: jest.fn().mockResolvedValue({ error: null }) } as any)
    const req = {
      body: { email: 'learner@example.test', password: 'test-only', displayName: 'Test' },
    } as Request
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as unknown as Response
    const next = jest.fn()
    await signup(req, res, next)
    expect(next).not.toHaveBeenCalled()
    expect(supabase.auth.signUp).toHaveBeenCalledTimes(1)
    expect(supabaseAdmin.auth.admin.createUser).not.toHaveBeenCalled()
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ requiresEmailConfirmation: true }),
      })
    )
  })
})

jest.mock('../../db/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      refreshSession: jest.fn(),
    },
  },
  supabaseAdmin: {
    from: jest.fn(),
    auth: { admin: { signOut: jest.fn(), createUser: jest.fn() } },
  },
}))
jest.mock('../../utils/logger', () => ({ logger: { info: jest.fn(), error: jest.fn() } }))
jest.mock('../../utils/contentModeration', () => ({ validateContent: jest.fn() }))
jest.mock('../../services/progress.service', () => ({ getFreshUserStreak: jest.fn() }))

describe('logout', () => {
  const getUser = supabase.auth.getUser as jest.Mock
  const signOut = supabaseAdmin.auth.admin.signOut as jest.Mock
  let req: Request
  let res: Response
  let next: jest.Mock

  beforeEach(() => {
    jest.resetAllMocks()
    req = { cookies: { auth_token: 'test-access-jwt' }, headers: {} } as unknown as Request
    res = { clearCookie: jest.fn(), json: jest.fn() } as unknown as Response
    next = jest.fn()
    getUser.mockResolvedValue({ data: { user: { id: 'user-uuid' } }, error: null })
    signOut.mockResolvedValue({ error: null })
  })

  const expectCleared = () => {
    expect(res.clearCookie).toHaveBeenCalledWith(
      'auth_token',
      expect.objectContaining({ httpOnly: true, path: '/' })
    )
    expect(res.clearCookie).toHaveBeenCalledWith(
      'refresh_token',
      expect.objectContaining({ httpOnly: true, path: '/' })
    )
  }

  it('revokes using the access JWT, not the user UUID', async () => {
    await logout(req, res, next)
    expect(signOut).toHaveBeenCalledWith('test-access-jwt')
    expectCleared()
    expect(next).not.toHaveBeenCalled()
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }))
  })

  it('logs out locally when no access cookie remains', async () => {
    req.cookies = {}
    await logout(req, res, next)
    expect(getUser).not.toHaveBeenCalled()
    expect(signOut).not.toHaveBeenCalled()
    expectCleared()
  })

  it('clears stale cookies when the token no longer identifies a user', async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: { status: 401 } })
    await logout(req, res, next)
    expect(signOut).not.toHaveBeenCalled()
    expectCleared()
  })

  it('reports revocation failure and still clears local cookies', async () => {
    signOut.mockResolvedValue({ error: { message: 'private provider detail' } })
    await logout(req, res, next)
    expectCleared()
    expect(res.json).not.toHaveBeenCalled()
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'AUTH_LOGOUT_FAILED', statusCode: 502 })
    )
    expect(next.mock.calls[0][0].message).not.toContain('private provider detail')
  })

  it.each(['getUser', 'signOut'])('clears cookies if %s throws', async failingCall => {
    const failingMock = failingCall === 'getUser' ? getUser : signOut
    failingMock.mockRejectedValue(new Error('provider unavailable'))
    await logout(req, res, next)
    expectCleared()
    expect(next).toHaveBeenCalledWith(expect.any(Error))
  })
})

describe('learner auth acknowledgements', () => {
  let req: Request
  let res: Response
  let next: jest.Mock
  beforeEach(() => {
    jest.resetAllMocks()
    req = {
      body: { email: 'learner@example.test', password: 'test-only' },
      cookies: { auth_token: 'access', refresh_token: 'refresh' },
      headers: {},
    } as unknown as Request
    res = {
      cookie: jest.fn(),
      clearCookie: jest.fn(),
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    } as unknown as Response
    next = jest.fn()
  })
  it.each(['login', 'refresh', 'me'] as const)(
    'returns retryable status when %s provider is unavailable',
    async operation => {
      const result = {
        data: { user: null, session: null },
        error: { status: 503, message: 'private provider details' },
      }
      jest.mocked(supabase.auth.signInWithPassword).mockResolvedValue(result as any)
      jest.mocked(supabase.auth.refreshSession).mockResolvedValue(result as any)
      jest.mocked(supabase.auth.getUser).mockResolvedValue(result as any)
      await { login, refresh: refreshToken, me: getCurrentUser }[operation](req, res, next)
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 503, code: 'AUTH_UNAVAILABLE' })
      )
      expect(res.json).not.toHaveBeenCalled()
      expect(res.cookie).not.toHaveBeenCalled()
    }
  )
  it.each(['login', 'refresh'] as const)(
    'does not acknowledge %s without both session tokens',
    async operation => {
      const result = {
        data: {
          user: { id: 'learner', email: 'learner@example.test' },
          session: { access_token: 'access' },
        },
        error: null,
      }
      jest.mocked(supabase.auth.signInWithPassword).mockResolvedValue(result as any)
      jest.mocked(supabase.auth.refreshSession).mockResolvedValue(result as any)
      await (operation === 'login' ? login : refreshToken)(req, res, next)
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 502, code: 'AUTH_INVALID_RESPONSE' })
      )
      expect(res.json).not.toHaveBeenCalled()
      expect(res.cookie).not.toHaveBeenCalled()
      expect(supabaseAdmin.from).not.toHaveBeenCalled()
    }
  )
  it('does not return a partial current-user success when profile reading fails', async () => {
    jest
      .mocked(supabase.auth.getUser)
      .mockResolvedValue({
        data: { user: { id: 'learner', email: 'learner@example.test' } },
        error: null,
      } as any)
    jest
      .mocked(supabaseAdmin.from)
      .mockReturnValue({
        upsert: jest.fn().mockResolvedValue({ error: null }),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest
          .fn()
          .mockResolvedValue({ data: null, error: { message: 'database unavailable' } }),
      } as any)
    await getCurrentUser(req, res, next)
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ code: 'DATABASE_ERROR' }))
    expect(res.json).not.toHaveBeenCalled()
  })
  it('reports logout verification outage while still clearing browser cookies', async () => {
    jest
      .mocked(supabase.auth.getUser)
      .mockResolvedValue({ data: { user: null }, error: { status: 503 } } as any)
    await logout(req, res, next)
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ code: 'AUTH_LOGOUT_FAILED' }))
    expect(res.clearCookie).toHaveBeenCalledTimes(2)
  })
})

it('sets cookies for an auto-confirmed signup without falsely asking for confirmation', async () => {
  jest.resetAllMocks()
  const originalKind = process.env.LOOPY_DATABASE_KIND
  process.env.LOOPY_DATABASE_KIND = 'production'
  try {
    jest
      .mocked(supabase.auth.signUp)
      .mockResolvedValue({
        data: {
          user: { id: 'learner', email: 'learner@example.test' },
          session: { access_token: 'test-access-token', refresh_token: 'test-refresh-token' },
        },
        error: null,
      } as any)
    jest
      .mocked(supabaseAdmin.from)
      .mockReturnValue({ upsert: jest.fn().mockResolvedValue({ error: null }) } as any)
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn(),
    } as unknown as Response
    const next = jest.fn()
    await signup(
      { body: { email: 'learner@example.test', password: 'test-only' } } as Request,
      res,
      next
    )
    expect(next).not.toHaveBeenCalled()
    expect(res.cookie).toHaveBeenCalledTimes(2)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ requiresEmailConfirmation: false }),
      })
    )
    expect(JSON.stringify(jest.mocked(res.json).mock.calls)).not.toContain('test-access-token')
    expect(JSON.stringify(jest.mocked(res.json).mock.calls)).not.toContain('test-refresh-token')
  } finally {
    if (originalKind === undefined) delete process.env.LOOPY_DATABASE_KIND
    else process.env.LOOPY_DATABASE_KIND = originalKind
  }
})
