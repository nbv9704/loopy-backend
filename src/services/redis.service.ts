/**
 * Redis Service
 *
 * Provides Redis connection (via ioredis) and a BullMQ-based
 * Match Timer Queue. The queue replaces in-memory setTimeout for
 * PvP question countdowns, making timers persistent across server
 * restarts and safe for multi-instance deployments.
 */

import Redis from 'ioredis'
import { Queue, Worker, Job } from 'bullmq'
import { config } from '../config'
import { logger } from '../utils/logger'

// ============================================================================
// Redis Connection
// ============================================================================

let redisConnection: Redis | null = null

/**
 * Get or create the shared Redis connection.
 * Returns null if REDIS_URL is not configured (local dev without Redis).
 */
export function getRedisConnection(): Redis | null {
  if (redisConnection) return redisConnection

  const url = config.redis.url
  if (!url) {
    logger.warn('REDIS_URL not configured – match timers will use in-memory fallback')
    return null
  }

  redisConnection = new Redis(url, {
    maxRetriesPerRequest: null, // Required by BullMQ
    enableReadyCheck: false,
    tls: url.startsWith('rediss://') ? {} : undefined,
  })

  redisConnection.on('connect', () => logger.info('Redis connected'))
  redisConnection.on('error', (err) => logger.error('Redis error:', err))

  return redisConnection
}

// ============================================================================
// Match Timer Queue
// ============================================================================

export type MatchTimerJobName = 'endQuestion' | 'cooldownNext' | 'cooldownComplete'

export interface MatchTimerJobData {
  matchId: string
  jobName: MatchTimerJobName
}

let matchTimerQueue: Queue<MatchTimerJobData> | null = null

/**
 * Get or create the MatchTimer BullMQ Queue.
 * Returns null if Redis is not available.
 */
export function getMatchTimerQueue(): Queue<MatchTimerJobData> | null {
  if (matchTimerQueue) return matchTimerQueue

  const connection = getRedisConnection()
  if (!connection) return null

  matchTimerQueue = new Queue<MatchTimerJobData>('match-timer', {
    connection,
    defaultJobOptions: {
      removeOnComplete: true,
      removeOnFail: 10, // Keep last 10 failed jobs for debugging
      attempts: 1, // No retries – timers are best-effort
    },
  })

  logger.info('MatchTimer queue created')
  return matchTimerQueue
}

/**
 * Schedule a delayed job on the match timer queue.
 * Falls back to returning null if Redis is unavailable.
 *
 * @param jobName  - Descriptive name for the job
 * @param matchId  - The PvP match ID
 * @param delayMs  - Delay in milliseconds before the job fires
 * @returns The job ID (used to cancel later), or null
 */
export async function scheduleMatchTimer(
  jobName: MatchTimerJobName,
  matchId: string,
  delayMs: number
): Promise<string | null> {
  const queue = getMatchTimerQueue()
  if (!queue) return null

  // Use a deterministic job ID so we can easily remove it later
  const jobId = `${jobName}_${matchId}`

  const job = await queue.add(
    jobName,
    { matchId, jobName },
    { delay: delayMs, jobId }
  )

  logger.info(`Scheduled ${jobName} for match ${matchId} in ${delayMs}ms (job: ${job.id})`)
  return job.id ?? null
}

/**
 * Cancel a previously scheduled match timer.
 */
export async function cancelMatchTimer(
  jobName: MatchTimerJobName,
  matchId: string
): Promise<void> {
  const queue = getMatchTimerQueue()
  if (!queue) return

  const jobId = `${jobName}_${matchId}`

  try {
    const job = await Job.fromId<MatchTimerJobData>(queue, jobId)
    if (job) {
      await job.remove()
      logger.info(`Cancelled ${jobName} timer for match ${matchId}`)
    }
  } catch {
    // Job may have already been processed – that's fine
    logger.debug(`Timer ${jobId} already processed or not found`)
  }
}

/**
 * Create the BullMQ Worker that processes match timer jobs.
 * The handler callback receives the job data and should call
 * the appropriate PvP socket method (endQuestion, cooldown, etc).
 *
 * @param handler - Callback invoked when a timer fires
 * @returns The Worker instance, or null if Redis is unavailable
 */
export function createMatchTimerWorker(
  handler: (jobName: MatchTimerJobName, matchId: string) => Promise<void>
): Worker<MatchTimerJobData> | null {
  const connection = getRedisConnection()
  if (!connection) return null

  const worker = new Worker<MatchTimerJobData>(
    'match-timer',
    async (job) => {
      logger.info(`Timer fired: ${job.data.jobName} for match ${job.data.matchId}`)
      await handler(job.data.jobName, job.data.matchId)
    },
    {
      connection,
      concurrency: 5,
    }
  )

  worker.on('failed', (job, err) => {
    logger.error(`Timer job failed: ${job?.id}`, err)
  })

  logger.info('MatchTimer worker started')
  return worker
}
