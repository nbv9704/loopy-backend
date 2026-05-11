import cors from 'cors'
import { config } from '../config'

/**
 * Centralized CORS configuration
 * Extracted from index.ts to follow Single Responsibility Principle
 */
const allowedOrigins = [
  config.frontendUrl,
  'https://loopy.vercel.app',
  'https://loopy-frontend-blond.vercel.app'
]

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Allow no-origin requests (e.g. server-to-server, health checks, Postman)
    if (!origin) {
      return callback(null, true)
    }

    // Check if origin is allowed or matches a Vercel preview URL
    const isAllowed = allowedOrigins.includes(origin) || 
                      (origin && origin.endsWith('.vercel.app'))

    if (isAllowed) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true, // Allow cookies to be sent
  exposedHeaders: ['set-cookie'], // Expose cookie headers
})
