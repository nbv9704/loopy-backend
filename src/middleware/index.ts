import { Express } from 'express'
import express from 'express'
import compression from 'compression'
import path from 'path'
import { helmetMiddleware } from './security'
import { corsMiddleware } from './cors'
import { rateLimiter } from './rateLimiter'
import { sessionMiddleware } from './session'

/**
 * Centralized middleware setup
 * Extracted from index.ts to follow Single Responsibility Principle
 * REVIEW: All middleware configuration is now isolated from the entry point
 */
export function setupMiddleware(app: Express): void {
  // Security middleware
  app.use(helmetMiddleware)

  // CORS configuration
  app.use(corsMiddleware)

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }))
  app.use(express.urlencoded({ extended: true }))

  // Compression middleware
  app.use(compression() as any)

  // Session middleware for admin dashboard
  app.use(sessionMiddleware as any)

  // Serve uploaded files (logos, images)
  app.use('/uploads', express.static(path.join(__dirname, '..', '..', 'public', 'uploads')))

  // Rate limiting
  app.use(rateLimiter)
}
