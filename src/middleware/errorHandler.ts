import { Request, Response, NextFunction } from 'express'
import { logger } from '../utils/logger'

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message)
    this.name = 'AppError'
    Error.captureStackTrace(this, this.constructor)
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log error
  logger.error('Error occurred:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  })

  // Handle known errors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    })
  }

  // Handle unknown errors
  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
  })
}

// Error factory functions
export const errors = {
  authRequired: () => new AppError(401, 'AUTH_REQUIRED', 'Authentication required'),
  invalidToken: () => new AppError(401, 'INVALID_TOKEN', 'Invalid or expired token'),
  forbidden: () => new AppError(403, 'FORBIDDEN', 'Insufficient permissions'),
  notFound: (resource: string) => new AppError(404, 'NOT_FOUND', `${resource} not found`),
  validationError: (details: any) =>
    new AppError(400, 'VALIDATION_ERROR', 'Invalid input data', details),
  rateLimitExceeded: () => new AppError(429, 'RATE_LIMIT_EXCEEDED', 'Too many requests'),
  executionTimeout: () => new AppError(408, 'EXECUTION_TIMEOUT', 'Code execution timeout'),
  executionError: (message: string) => new AppError(400, 'EXECUTION_ERROR', message),
  databaseError: (message: string, details?: any) =>
    new AppError(500, 'DATABASE_ERROR', message, details),
  unauthorized: (message: string = 'Unauthorized access') => new AppError(401, 'UNAUTHORIZED', message),
}
