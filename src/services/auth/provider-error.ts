import { AppError } from '../../middleware/errorHandler'

/** Do not translate an upstream outage into an expired browser session. */
export function authProviderFailure(
  error: unknown,
  unavailableCode = 'AUTH_UNAVAILABLE'
): AppError | null {
  if (!error) return null
  const value = error as { status?: number; name?: string }
  if (value.status === 429)
    return new AppError(
      429,
      'AUTH_RATE_LIMITED',
      'Có quá nhiều yêu cầu xác thực. Vui lòng thử lại sau.'
    )
  if (value.name === 'AuthRetryableFetchError' || !value.status || value.status >= 500)
    return new AppError(
      503,
      unavailableCode,
      'Dịch vụ xác thực đang gián đoạn. Vui lòng thử lại sau.'
    )
  return null
}

export function requireAuthSession(
  session: unknown
): asserts session is { access_token: string; refresh_token: string } {
  const value = session as { access_token?: unknown; refresh_token?: unknown } | null
  if (
    !value ||
    typeof value.access_token !== 'string' ||
    !value.access_token.trim() ||
    typeof value.refresh_token !== 'string' ||
    !value.refresh_token.trim()
  )
    throw new AppError(
      502,
      'AUTH_INVALID_RESPONSE',
      'Dịch vụ xác thực chưa trả về phiên hợp lệ. Vui lòng thử lại.'
    )
}
