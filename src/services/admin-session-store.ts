import { RedisStore } from 'connect-redis'
import { createClient } from 'redis'
import { config } from '../config'
import { AppError } from '../middleware/errorHandler'
import { logger } from '../utils/logger'

export const sessionStoreUnavailable = () =>
  new AppError(
    503,
    'ADMIN_SESSION_UNAVAILABLE',
    'Dịch vụ phiên admin đang mất kết nối. Vui lòng thử lại sau ít giây.'
  )

const redisClient = config.redis.url
  ? createClient({
      url: config.redis.url,
      // Keep idle TLS connections alive; fail commands instead of replaying stale login writes.
      pingInterval: 30000,
      disableOfflineQueue: true,
      commandsQueueMaxLength: 100,
      commandOptions: { timeout: 5000 },
      socket: {
        connectTimeout: 10000,
        reconnectStrategy: retries => Math.min(100 * 2 ** Math.min(retries, 5), 3000),
        ...(config.redis.url.startsWith('rediss://')
          ? {
              tls: true as const,
              rejectUnauthorized: process.env.REDIS_REJECT_UNAUTHORIZED !== 'false',
            }
          : {}),
      },
    })
  : null

if (redisClient) {
  redisClient.on('error', error =>
    logger.warn('Admin session Redis connection error', {
      code: (error as NodeJS.ErrnoException).code || error.name,
    })
  )
  void redisClient.connect().catch(() => logger.warn('Admin session Redis connection unavailable'))
} else if (config.nodeEnv === 'production') {
  throw new Error('REDIS_URL is required in production for admin sessions')
} else {
  logger.warn('Admin sessions use MemoryStore outside production: REDIS_URL is not configured')
}

export const adminSessionStore = redisClient
  ? new RedisStore({
      client: redisClient,
      prefix: 'loopy.session:',
      ttl: Math.ceil(config.admin.sessionMaxAge / 1000),
    })
  : undefined

export const isSessionStoreReady = () =>
  redisClient ? redisClient.isReady : config.nodeEnv !== 'production'

/** A ready flag alone cannot detect a half-open connection after a long idle period. */
export async function assertSessionStoreReady() {
  if (!isSessionStoreReady()) throw sessionStoreUnavailable()
  if (!redisClient) return
  try {
    if ((await redisClient.withCommandOptions({ timeout: 2000 }).ping()) !== 'PONG')
      throw sessionStoreUnavailable()
  } catch {
    throw sessionStoreUnavailable()
  }
}

export async function closeSessionStore() {
  if (!redisClient?.isOpen) return
  try {
    if (redisClient.isReady) await redisClient.quit()
    else redisClient.destroy()
  } catch {
    if (redisClient.isOpen) redisClient.destroy()
  }
}
