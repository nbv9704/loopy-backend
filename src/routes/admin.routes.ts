import { Router } from 'express'
import { authenticateSession } from '../middleware/authenticateSession'
import { requireAdmin } from '../middleware/requireAdmin'
import { getDashboardStats } from '../controllers/admin/dashboard.controller'
import { bulkImport } from '../controllers/bulk-import.controller'

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
// CONTENT MANAGEMENT
// ============================================================================

router.post('/import', bulkImport)

// ============================================================================
// SYSTEM HEALTH
// ============================================================================

router.get('/health/metrics', (_req, res) => {
  const mem = process.memoryUsage()
  const uptime = process.uptime()

  res.json({
    success: true,
    data: {
      memory: {
        heapUsedMB: Math.round(mem.heapUsed / 1024 / 1024),
        heapTotalMB: Math.round(mem.heapTotal / 1024 / 1024),
        rssMB: Math.round(mem.rss / 1024 / 1024),
        externalMB: Math.round(mem.external / 1024 / 1024),
      },
      uptime: {
        seconds: Math.round(uptime),
        formatted: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`,
      },
      nodeVersion: process.version,
      platform: process.platform,
      timestamp: new Date().toISOString(),
    },
  })
})

export default router
