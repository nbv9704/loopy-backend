import { Router } from 'express'
import { authenticateSession } from '../middleware/authenticateSession'
import { requireAdmin } from '../middleware/requireAdmin'
import { getDashboardStats } from '../controllers/admin/dashboard.controller'

/**
 * Admin Routes - Rebuild Phase
 *
 * Following docs/admin_panel_plan.md:
 * - Dashboard (stats and metrics)
 * - Lesson Management
 * - Submission Review
 * - AI Grading Override
 * - PvP Question Bank
 * - Analytics
 * - User Management
 * - System Settings
 */

const router = Router()

// Apply session authentication and admin middleware to all routes
router.use(authenticateSession)
router.use(requireAdmin)

// ============================================================================
// DASHBOARD ROUTES
// ============================================================================

router.get('/stats/overview', getDashboardStats)

// ============================================================================
// TODO: Add more admin routes
// ============================================================================

export default router
