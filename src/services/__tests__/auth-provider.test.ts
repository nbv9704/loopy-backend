import { authProviderFailure, requireAuthSession } from '../auth/provider-error'

describe('auth provider boundary', () => {
  it.each([500, 502, 503, 504])('does not classify provider HTTP %i as session expiry', status => {
    expect(authProviderFailure({ status })).toMatchObject({
      statusCode: 503,
      code: 'AUTH_UNAVAILABLE',
    })
  })
  it('preserves provider throttling', () => {
    expect(authProviderFailure({ status: 429 })).toMatchObject({ statusCode: 429 })
  })
  it.each([400, 401, 403, 422])('allows callers to classify a credential error %i', status => {
    expect(authProviderFailure({ status })).toBeNull()
  })
  it('handles thrown transport errors without returning private details', () => {
    const result = authProviderFailure(new Error('private URL and token'))
    expect(result).toMatchObject({ statusCode: 503 })
    expect(result?.message).not.toContain('private')
  })
  it.each([null, {}, { access_token: 'access' }, { access_token: '', refresh_token: 'refresh' }])(
    'rejects an incomplete session %j',
    session => {
      expect(() => requireAuthSession(session)).toThrow(
        expect.objectContaining({ code: 'AUTH_INVALID_RESPONSE' })
      )
    }
  )
})
