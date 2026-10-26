import * as curriculumController from '../controllers/admin/curriculum.controller'
import { getSubmissions } from '../controllers/admin/submissions.controller'
import { Router } from 'express'
import { authenticateSession } from '../middleware/authenticateSession'
import { requireAdmin } from '../middleware/requireAdmin'
import { getDashboardStats } from '../controllers/admin/dashboard.controller'
import { getAuditLogs } from '../controllers/admin/audit-log.controller'
import { getImportHistory, getImportStats } from '../controllers/admin/import-history.controller'
import {
  getContentItems,
  getContentItem,
  createContentItem,
  updateContentItem,
  deleteContentItem,
  getCategories,
  exportContent,
  importContent,
} from '../controllers/admin/content.controller'
import { bulkImport } from '../controllers/bulk-import.controller'
import * as practiceAdminController from '../controllers/admin/practice.controller'
import { validate } from '../middleware/validate'
import { contentSchemas } from '../schemas/content.schemas'
import { practiceSchemas } from '../schemas/practice.schemas'
import { adminSchemas } from '../schemas/admin.schemas'

/**
 * Session-protected admin routes. Controllers own database and business logic.
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
// AUDIT LOGS
// ============================================================================

router.get('/audit-logs', validate(adminSchemas.auditLogsQuery), getAuditLogs)

// ============================================================================
// IMPORT HISTORY
// ============================================================================

router.get('/import-history/stats', getImportStats)
router.get('/import-history', validate(adminSchemas.importHistoryQuery), getImportHistory)

// ============================================================================
// SUBMISSION MONITORING
// ============================================================================

router.get('/submissions', validate(adminSchemas.submissionsQuery), getSubmissions)

// ============================================================================
// CONTENT MANAGEMENT - CMS Content Items
// ============================================================================

// Admin content management endpoints
// NOTE: Specific routes must come before parameterized routes to avoid conflicts
router.get('/content', validate(contentSchemas.contentQuery), getContentItems)
router.post('/content', validate(contentSchemas.createContentItem), createContentItem)
router.get('/content/categories', getCategories)
router.get('/content/export', validate(contentSchemas.exportContentQuery), exportContent)
router.post('/content/import', validate(contentSchemas.importContent), importContent)
router.get('/content/:id', validate(contentSchemas.cmsReadItemParams), getContentItem)
router.put('/content/:id', validate(contentSchemas.updateContentItem), updateContentItem)
router.delete('/content/:id', validate(contentSchemas.contentItemParams), deleteContentItem)

// ============================================================================
// BULK IMPORT
// ============================================================================

router.post('/import', validate(adminSchemas.bulkImport), bulkImport)

// Chapter Management
router.get('/chapters', curriculumController.getChapters)

// Lesson Management
router.get('/lessons', validate(adminSchemas.lessonsQuery), curriculumController.listLessons)

router.get(
  '/lessons/:lessonId',
  validate(contentSchemas.lessonParams),
  curriculumController.getLesson
)

// Test Case Management
router.get(
  '/lessons/:lessonId/test-cases',
  validate(contentSchemas.lessonParams),
  curriculumController.listTestCases
)

router.post(
  '/lessons/:lessonId/test-cases',
  validate(contentSchemas.lessonTestCase),
  curriculumController.saveTestCase
)

router.delete(
  '/test-cases/:testCaseId',
  validate(contentSchemas.testCaseParams),
  curriculumController.deleteTestCase
)

// Lesson Step Management - Learn-scoped activities, separate from Practice questions
router.get(
  '/lessons/:lessonId/steps',
  validate(contentSchemas.lessonParams),
  curriculumController.listSteps
)

router.post(
  '/lessons/:lessonId/steps',
  validate(contentSchemas.lessonStep),
  curriculumController.saveStep
)

router.delete(
  '/lesson-steps/:stepId',
  validate(contentSchemas.lessonStepParams),
  curriculumController.deleteStep
)

router.post('/lessons', validate(contentSchemas.lesson), curriculumController.saveLesson)

router.delete(
  '/lessons/:lessonId',
  validate(contentSchemas.lessonParams),
  curriculumController.archiveLesson
)

// ============================================================================
// PRACTICE SET MANAGEMENT
// ============================================================================

router.get(
  '/practice/sets',
  validate(practiceSchemas.adminListSets),
  practiceAdminController.listAllSets
)
router.get(
  '/practice/sets/:setId',
  validate(practiceSchemas.setParams),
  practiceAdminController.getSet
)
router.post(
  '/practice/sets',
  validate(practiceSchemas.createSet),
  practiceAdminController.createSet
)
router.put(
  '/practice/sets/:setId',
  validate(practiceSchemas.updateSet),
  practiceAdminController.updateSet
)
router.delete(
  '/practice/sets/:setId',
  validate(practiceSchemas.adminArchiveSet),
  practiceAdminController.deleteSet
)
router.put(
  '/practice/sets/:setId/status',
  validate(practiceSchemas.updateStatus),
  practiceAdminController.updateStatus
)
router.put(
  '/practice/sets/:setId/visibility',
  validate(practiceSchemas.updateVisibility),
  practiceAdminController.updateVisibility
)
router.get('/practice/stats', practiceAdminController.getStats)

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
