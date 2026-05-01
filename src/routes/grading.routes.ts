/**
 * Grading Routes
 *
 * Student submission endpoints and admin grading endpoints.
 *
 * @see .kiro/specs/auto-grading-system/design.md
 */

import { Router } from 'express'
import { optionalAuth } from '../middleware/auth'
import { authenticateSession } from '../middleware/authenticateSession'
import { requireAdmin } from '../middleware/requireAdmin'
import { submissionRateLimiter } from '../middleware/rateLimiter'
import {
  submitForGrading,
  getSubmissionHistory,
  getSubmissionDetail,
} from '../controllers/grading.controller'
import {
  overrideScore,
  getTestCases,
  createTestCase,
  getUsageStats,
} from '../controllers/grading-admin.controller'

const router = Router()

// ============================================================================
// STUDENT ENDPOINTS (optionalAuth — works without login in dev mode)
// ============================================================================

// POST /api/grading/exercises/:exerciseId/submit
// Rate limited: 10 submissions per minute per user (Requirement 13.8)
router.post('/exercises/:exerciseId/submit', optionalAuth, submissionRateLimiter, submitForGrading)

// GET /api/grading/exercises/:exerciseId/submissions
router.get('/exercises/:exerciseId/submissions', optionalAuth, getSubmissionHistory)

// GET /api/grading/exercises/:exerciseId/submissions/:submissionId
router.get('/exercises/:exerciseId/submissions/:submissionId', optionalAuth, getSubmissionDetail)

// ============================================================================
// ADMIN ENDPOINTS (Session auth + admin role)
// ============================================================================

// PUT /api/grading/admin/submissions/:submissionId/override
router.put(
  '/admin/submissions/:submissionId/override',
  authenticateSession,
  requireAdmin,
  overrideScore
)

// GET /api/grading/admin/exercises/:exerciseId/test-cases
router.get(
  '/admin/exercises/:exerciseId/test-cases',
  authenticateSession,
  requireAdmin,
  getTestCases
)

// POST /api/grading/admin/exercises/:exerciseId/test-cases
router.post(
  '/admin/exercises/:exerciseId/test-cases',
  authenticateSession,
  requireAdmin,
  createTestCase
)

// GET /api/grading/admin/usage
router.get('/admin/usage', authenticateSession, requireAdmin, getUsageStats)

export default router
