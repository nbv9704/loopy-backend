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
const shutdown = () => {
  logger.info('Signal received: closing HTTP server')
  server.close(() => process.exit(0))
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
