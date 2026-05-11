import cors from 'cors'
import { config } from '../config'

/**
 * Centralized CORS configuration
 * Extracted from index.ts to follow Single Responsibility Principle
 */
const allowedOrigins = [config.frontendUrl]

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Allow no-origin requests (e.g. server-to-server, health checks, Postman)
    if (!origin) {
      return callback(null, true)
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
