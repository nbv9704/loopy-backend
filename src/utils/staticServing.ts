import { Express } from 'express'
import express from 'express'
import path from 'path'
import { config } from '../config'

/**
 * Static file serving configuration for production SPA
 * Extracted from index.ts to follow Single Responsibility Principle
 */
export function setupStaticServing(app: Express): void {
  if (config.nodeEnv === 'production') {
    const frontendBuildPath = path.join(__dirname, '..', '..', '..', 'dist')

    // Serve static files from the unified frontend build
    app.use(express.static(frontendBuildPath))

    // Catch-all route for SPA - must be after API routes
    app.get('*', (_req, res) => {
      res.sendFile(path.join(frontendBuildPath, 'index.html'))
    })
  } else {
    // 404 handler for development (when frontend runs separately)
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
}
