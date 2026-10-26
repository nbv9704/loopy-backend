import express from 'express'
import { createServer } from 'http'
import { config } from './config'
import { logger } from './utils/logger'
import { setupMiddleware } from './middleware'
import { errorHandler } from './middleware/errorHandler'
import { setupSwagger } from './middleware/swagger.middleware'
import { setupStaticServing } from './utils/staticServing'
import apiRoutes from './routes'
import { PvPSocketService } from './services/pvp-socket.service'
import { closeSessionStore } from './middleware/session'
import { gradingCacheService } from './services/grading-cache.service'
import { cacheService } from './services/cache.service'

/**
 * Application entry point
 * REVIEW: Abstracted middleware setup and routing to their respective domains
 * REVIEW: The entry point now strictly handles server initialization and shutdown
 */
const app = express()

// Enable trust proxy in production for secure cookies behind reverse proxies (e.g. Render)
if (config.nodeEnv === 'production') {
  app.set('trust proxy', 1)
}

const httpServer = createServer(app)

// 1. Setup Standard & Security Middleware
setupMiddleware(app)

// 2. Setup Documentation
setupSwagger(app)

// 3. Mount Application Routes
app.use('/api', apiRoutes)

// 4. Handle Static SPA Serving (Production)
setupStaticServing(app)

// 5. Error Handling (Must be last)
app.use(errorHandler)

// 6. Initialize Socket.io for PvP
const pvpSocketService = new PvPSocketService(httpServer)
const io = pvpSocketService.getIO()
app.set('io', io) // Store io instance for use in controllers
logger.info('🎮 PvP Socket.io service initialized')

// Start Server
const server = httpServer.listen(config.port, () => {
  logger.info(`🚀 Server running on port ${config.port}`)
  logger.info(`📝 Environment: ${config.nodeEnv}`)
  logger.info(`🌐 Frontend URL: ${config.frontendUrl}`)
  logger.info(`⚡ WebSocket ready at ws://localhost:${config.port}`)
})

// Graceful Shutdown
let shuttingDown = false
const shutdown = async () => {
  if (shuttingDown) return
  shuttingDown = true
  app.locals.shuttingDown = true
  logger.info('Signal received: closing HTTP, Socket.IO and Redis resources')
  const deadline = setTimeout(() => process.exit(1), 10000)
  deadline.unref()
  const httpDrained = new Promise<void>(resolve => { server.close(() => resolve()) })
  const results = await Promise.allSettled([
    httpDrained, pvpSocketService.close(), closeSessionStore(), gradingCacheService.disconnect(),
  ])
  cacheService.close()
  clearTimeout(deadline)
  process.exit(results.some(result => result.status === 'rejected') ? 1 : 0)
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
