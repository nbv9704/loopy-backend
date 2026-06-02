import { Request, Response } from 'express'

/**
 * Health check controller
 * Extracted from inline endpoint in index.ts
 */
export const healthCheck = (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
  })
}
