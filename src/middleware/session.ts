import session from 'express-session'
import { RedisStore } from 'connect-redis'
import { createClient } from 'redis'
import { config } from '../config'

// Initialize Redis client for session store
let redisClient = null;
let store = undefined;

if (config.redis.url) {
  redisClient = createClient({
    url: config.redis.url,
    socket: config.redis.url.startsWith('rediss://') 
      ? { connectTimeout: 30000, tls: true, rejectUnauthorized: process.env.REDIS_REJECT_UNAUTHORIZED !== 'false' }
      : { connectTimeout: 30000 }
  })
  
  // Connect and handle errors but do not block startup
  redisClient.connect().catch((err: any) => {
    console.error('Session Redis Client Connection Error:', err)
  })
  
  store = new RedisStore({
    client: redisClient,
    prefix: 'loopy.session:',
  })
} else {
  if (config.nodeEnv === 'production') {
    throw new Error('FATAL: REDIS_URL is required in production environment for secure session management!')
  }
  console.warn('⚠️ No REDIS_URL provided, falling back to MemoryStore for sessions. This is a security risk in production.')
}

/**
 * Session middleware configuration for admin dashboard
 * Uses secure HTTP-only cookies with appropriate settings per environment
 */
export const sessionMiddleware = session({
  store: store,
  secret: config.admin.sessionSecret,
  resave: false,
  saveUninitialized: false,
  proxy: config.nodeEnv === 'production', // Trust proxy in production for secure cookies
  cookie: {
    httpOnly: true,
    secure: config.nodeEnv === 'production', // HTTPS only in production
    maxAge: config.admin.sessionMaxAge,
    sameSite: config.nodeEnv === 'production' ? 'none' : 'lax',
  },
  name: 'loopy.admin.sid', // Custom session cookie name
})
