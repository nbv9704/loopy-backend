import { Express } from 'express'
import express from 'express'
import compression from 'compression'
import cookieParser from 'cookie-parser'
import path from 'path'
import { helmetMiddleware } from './security'
import { corsMiddleware } from './cors'
import { csrfProtection } from './csrf'
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

  // Rate limiting (MUST run before body parsing to prevent payload-based DoS)
  app.use(rateLimiter)

  // CORS configuration
  app.use(corsMiddleware)

  // CSRF protection for mutating requests
  app.use(csrfProtection)

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }))
  app.use(express.urlencoded({ extended: true }))

  // Cookie parsing middleware (for secure token storage)
  app.use(cookieParser())

  // Compression middleware
  app.use(compression() as any)

  // Session middleware for admin dashboard
  app.use(sessionMiddleware as any)

  // Serve uploaded files (logos, images)
  app.use('/uploads', express.static(path.join(__dirname, '..', '..', 'public', 'uploads')))
}
