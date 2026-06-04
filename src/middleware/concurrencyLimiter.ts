import { Request, Response, NextFunction } from 'express'
import { logger } from '../utils/logger'

let activeExecutions = 0
const MAX_CONCURRENT_EXECUTIONS = 5 // Max concurrent code executions system-wide

export const concurrencyLimiter = (_req: Request, res: Response, next: NextFunction): void => {
  if (activeExecutions >= MAX_CONCURRENT_EXECUTIONS) {
    logger.warn('Concurrency execution limit reached', { activeExecutions })
    res.status(429).json({
      success: false,
      error: {
        code: 'TOO_MANY_CONCURRENT_REQUESTS',
        message: 'Hệ thống đang bận xử lý code. Vui lòng thử lại sau vài giây.',
      },
    })
    return
  }

  activeExecutions++
  
  let finished = false
  const cleanup = () => {
    if (!finished) {
      finished = true
      activeExecutions = Math.max(0, activeExecutions - 1)
    }
  }

  res.on('finish', cleanup)
  res.on('close', cleanup)
  
  next()
}

// For testing purposes only
export const resetActiveExecutions = (): void => {
  activeExecutions = 0
}

