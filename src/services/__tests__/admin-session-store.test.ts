import { createClient } from 'redis'
import { logger } from '../../utils/logger'
import {
  adminSessionStore,
  assertSessionStoreReady,
  closeSessionStore,
  isSessionStoreReady,
} from '../admin-session-store'

jest.mock('../../config', () => ({
  config: {
    nodeEnv: 'production',
    redis: { url: 'rediss://redis.test.invalid:6379' },
    admin: { sessionMaxAge: 28800000 },
  },
}))
jest.mock('../../utils/logger', () => ({ logger: { warn: jest.fn(), error: jest.fn() } }))
jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    isReady: true,
    isOpen: true,
    on: jest.fn(),
    connect: jest.fn().mockResolvedValue(undefined),
    withCommandOptions: jest.fn().mockReturnThis(),
    ping: jest.fn().mockResolvedValue('PONG'),
    quit: jest.fn().mockResolvedValue(undefined),
    destroy: jest.fn(),
  })),
}))
const client = jest.mocked(createClient).mock.results[0].value
const options = jest.mocked(createClient).mock.calls[0][0]
const onError = client.on.mock.calls.find(([event]: [string]) => event === 'error')[1]
beforeEach(() => {
  jest.clearAllMocks()
  client.isReady = true
  client.isOpen = true
  client.ping.mockReset().mockResolvedValue('PONG')
  client.quit.mockReset().mockResolvedValue(undefined)
})

it('does not queue/replay stale authentication commands while Redis reconnects', async () => {
  expect(options).toMatchObject({
    disableOfflineQueue: true,
    commandOptions: { timeout: 5000 },
    socket: { tls: true, rejectUnauthorized: true },
  })
  expect(options?.pingInterval).toBeGreaterThan(0)
  client.isReady = false
  expect(isSessionStoreReady()).toBe(false)
  await expect(assertSessionStoreReady()).rejects.toMatchObject({
    statusCode: 503,
    code: 'ADMIN_SESSION_UNAVAILABLE',
  })
  expect(client.ping).not.toHaveBeenCalled()
  expect(adminSessionStore).toBeDefined()
})
it('checks a half-open connection with a bounded ping before authentication', async () => {
  await expect(assertSessionStoreReady()).resolves.toBeUndefined()
  expect(client.withCommandOptions).toHaveBeenCalledWith({ timeout: 2000 })
  expect(client.ping).toHaveBeenCalledTimes(1)
})
it('classifies a reset connection as unavailable even if the ready flag is stale', async () => {
  client.ping.mockRejectedValueOnce(
    Object.assign(new Error('private upstream detail'), { code: 'ECONNRESET' })
  )
  await expect(assertSessionStoreReady()).rejects.toMatchObject({
    statusCode: 503,
    code: 'ADMIN_SESSION_UNAVAILABLE',
  })
})
it('does not accept an unexpected Redis health response', async () => {
  client.ping.mockResolvedValueOnce('unexpected')
  await expect(assertSessionStoreReady()).rejects.toMatchObject({ statusCode: 503 })
})
it('bounds a browser-session cookie by the configured server-side session TTL', () => {
  expect(adminSessionStore?.ttl).toBe(28800)
})
it('logs a connection classification without the raw upstream message or credentials', () => {
  onError(Object.assign(new Error('private credential or URL'), { code: 'ECONNRESET' }))
  expect(logger.warn).toHaveBeenCalledWith('Admin session Redis connection error', {
    code: 'ECONNRESET',
  })
})
it('releases a broken socket if graceful shutdown fails', async () => {
  client.quit.mockRejectedValueOnce(new Error('connection reset'))
  await expect(closeSessionStore()).resolves.toBeUndefined()
  expect(client.destroy).toHaveBeenCalledTimes(1)
})
