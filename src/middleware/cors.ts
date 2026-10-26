import cors from 'cors'
import { getAllowedOrigins } from '../utils/origins'

/**
 * Centralized CORS configuration
 * Extracted from index.ts to follow Single Responsibility Principle
 */
export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Allow no-origin requests (e.g. server-to-server, health checks, Postman)
    if (!origin) {
      return callback(null, true)
    }

    const allowedOrigins = getAllowedOrigins()
    
    // Check if origin is EXACTLY allowed in the whitelist
    const isAllowed = allowedOrigins.includes(origin)

    if (isAllowed) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true, // Allow cookies to be sent
  exposedHeaders: ['set-cookie'], // Expose cookie headers
})
