import { Router } from 'express'
import { authenticateSession } from '../middleware/authenticateSession'
import { requireAdmin } from '../middleware/requireAdmin'
import { authLimiter } from '../middleware/rateLimiter'
import * as adminApiController from '../controllers/admin-api.controller'

/**
 * Admin API Routes - JSON API endpoints for React SPA
 */

const router = Router()

// ============================================================================
// PUBLIC ROUTES (NO AUTHENTICATION REQUIRED)
// ============================================================================

/**
 * Login endpoint
 * POST /api/admin/login
 */
router.post('/login', authLimiter, adminApiController.login)

// ============================================================================
// PROTECTED ROUTES (SESSION AUTHENTICATION REQUIRED)
// ============================================================================

/**
 * Logout endpoint
 * POST /api/admin/logout
 */
router.post('/logout', authenticateSession, adminApiController.logout)

/**
 * Get current user info
 * GET /api/admin/me
 */
router.get('/me', authenticateSession, requireAdmin, adminApiController.getCurrentUser)

/**
 * Get dashboard statistics
 * GET /api/admin/dashboard/stats
 */
router.get('/dashboard/stats', authenticateSession, requireAdmin, adminApiController.getDashboardStats)

export default router
