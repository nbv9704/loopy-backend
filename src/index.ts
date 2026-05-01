import express from 'express'
import { config } from './config'
import { logger } from './utils/logger'
import { setupMiddleware } from './middleware'
import { errorHandler } from './middleware/errorHandler'
import { setupSwagger } from './middleware/swagger.middleware'
import { setupStaticServing } from './utils/staticServing'
import apiRoutes from './routes'

/**
 * Application entry point
 * REVIEW: Abstracted middleware setup and routing to their respective domains
 * REVIEW: The entry point now strictly handles server initialization and shutdown
 */
const app = express()

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

// Start Server
const server = app.listen(config.port, () => {
  logger.info(`🚀 Server running on port ${config.port}`)
  logger.info(`📝 Environment: ${config.nodeEnv}`)
  logger.info(`🌐 Frontend URL: ${config.frontendUrl}`)
})

// Graceful Shutdown
const shutdown = () => {
  logger.info('Signal received: closing HTTP server')
  server.close(() => process.exit(0))
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
