import { Express } from 'express'


/**
 * Static file serving configuration for production SPA
 * Extracted from index.ts to follow Single Responsibility Principle
 */
export function setupStaticServing(app: Express): void {
  // Since the frontend is now hosted on Vercel, the backend no longer serves static files.
  // We replace the SPA catch-all with a simple health check endpoint for UptimeRobot.
  app.get('/', (_req, res) => {
    res.status(200).json({
      success: true,
      message: 'Loopy Backend API is running successfully',
      timestamp: new Date().toISOString(),
    })
  })

  // 404 handler for undefined API routes
  app.use((_req, res) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Endpoint not found',
      },
    })
  })
}
