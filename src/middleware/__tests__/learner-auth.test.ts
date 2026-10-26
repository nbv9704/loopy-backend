import type { Response } from 'express'
import { authenticate, optionalAuth, type AuthRequest } from '../auth'
import { supabase } from '../../db/supabase'

jest.mock('../../db/supabase', () => ({ supabase: { auth: { getUser: jest.fn() } } }))

describe.each([authenticate, optionalAuth])('%p provider errors', middleware => {
  const response = {} as Response
  beforeEach(() => jest.resetAllMocks())
  it.each([429, 503])(
    'preserves retryable status %i instead of pretending the account is anonymous',
    async status => {
      jest
        .mocked(supabase.auth.getUser)
        .mockResolvedValue({ data: { user: null }, error: { status } } as any)
      const req = { cookies: { auth_token: 'test-token' }, headers: {} } as unknown as AuthRequest
      const next = jest.fn()
      await middleware(req, response, next)
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: status }))
      expect(req.user).toBeUndefined()
    }
  )
  it('does not contact the provider without an access token', async () => {
    const next = jest.fn()
    await middleware({ cookies: {}, headers: {} } as unknown as AuthRequest, response, next)
    expect(supabase.auth.getUser).not.toHaveBeenCalled()
    expect(next).toHaveBeenCalledTimes(1)
  })
})

it('allows optional guest access for a verified invalid token', async () => {
  jest
    .mocked(supabase.auth.getUser)
    .mockResolvedValue({ data: { user: null }, error: { status: 401 } } as any)
  const next = jest.fn()
  await optionalAuth(
    { cookies: { auth_token: 'expired' }, headers: {} } as unknown as AuthRequest,
    {} as Response,
    next
  )
  expect(next).toHaveBeenCalledWith()
})
