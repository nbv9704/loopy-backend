import cors from 'cors'
import { config } from '../config'

/**
 * Centralized CORS configuration
 * Extracted from index.ts to follow Single Responsibility Principle
 */
const allowedOrigins = [config.frontendUrl]

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // In development, allow no-origin requests (Postman, curl)
    if (!origin && config.nodeEnv === 'development') {
      return callback(null, true)
    }

    // In production, require origin header
    if (!origin) {
      return callback(new Error('Origin header required'))
    }

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true, // Allow cookies to be sent
  exposedHeaders: ['set-cookie'], // Expose cookie headers
})
