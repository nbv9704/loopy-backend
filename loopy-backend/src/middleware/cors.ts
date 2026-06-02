import cors from 'cors'
import { config } from '../config'

/**
 * Centralized CORS configuration
 * Extracted from index.ts to follow Single Responsibility Principle
 */
const getEnvAllowedOrigins = () => {
  const envOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : []
  return [
    config.frontendUrl,
    'https://loopy.vercel.app',
    'https://loopy-frontend-blond.vercel.app',
    ...envOrigins
  ].map(o => o.trim()).filter(Boolean)
}

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Allow no-origin requests (e.g. server-to-server, health checks, Postman)
    if (!origin) {
      return callback(null, true)
    }

    const allowedOrigins = getEnvAllowedOrigins()
    
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
