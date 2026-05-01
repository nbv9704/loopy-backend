import rateLimit from 'express-rate-limit'
import { config } from '../config'

// Disable rate limiting in development
const isDevelopment = config.nodeEnv === 'development'

export const rateLimiter = isDevelopment
  ? (req: any, res: any, next: any) => next() // Skip rate limiting in dev
  : rateLimit({
      windowMs: config.rateLimit.windowMs,
      max: config.rateLimit.maxRequests,
      message: {
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests, please try again later',
        },
      },
      standardHeaders: true,
      legacyHeaders: false,
    })

export const codeExecutionLimiter = isDevelopment
  ? (req: any, res: any, next: any) => next() // Skip rate limiting in dev
  : rateLimit({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: config.rateLimit.codeExecutionLimit,
      message: {
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many code executions, please try again later',
        },
      },
      standardHeaders: true,
      legacyHeaders: false,
    })

/**
 * Submission Rate Limiter for Auto-Grading System
 *
 * Limits code submissions to prevent abuse and ensure fair usage.
 * Requirement 13.8: Rate limiting of 10 submissions per minute per user
 */
export const submissionRateLimiter = isDevelopment
  ? (req: any, res: any, next: any) => next() // Skip rate limiting in dev
  : rateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: 10, // 10 submissions per minute per user
      message: {
        success: false,
        error: {
          code: 'SUBMISSION_RATE_LIMIT_EXCEEDED',
          message: 'Bạn đã nộp bài quá nhiều lần. Vui lòng đợi 1 phút và thử lại.',
        },
      },
      standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
      legacyHeaders: false, // Disable `X-RateLimit-*` headers
      // Use user ID as key if authenticated, otherwise use IP
      keyGenerator: (req: any) => {
        return req.user?.id || req.ip
      },
      // Skip rate limiting for failed requests (e.g., validation errors)
      skipFailedRequests: true,
      // Skip rate limiting for successful requests that don't consume resources
      skipSuccessfulRequests: false,
    })
