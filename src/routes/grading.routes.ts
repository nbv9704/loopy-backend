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

/**
 * @openapi
 * /api/grading/exercises/{exerciseId}/submit:
 *   post:
 *     tags:
 *       - Grading
 *     summary: Submit exercise for auto-grading
 *     description: |
 *       Submit code solution for an exercise to be automatically graded against test cases.
 *       This endpoint is rate-limited to 10 submissions per minute per user to prevent abuse.
 *       Works without authentication in development mode.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: exerciseId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Exercise unique identifier (UUID)
 *         example: "789e0123-e89b-12d3-a456-426614174002"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *             properties:
 *               code:
 *                 type: string
 *                 minLength: 1
 *                 description: User's code solution
 *                 example: "function add(a, b) { return a + b; }"
 *           example:
 *             code: "function add(a, b) { return a + b; }"
 *     responses:
 *       200:
 *         description: Submission graded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     submission:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                           description: Submission unique identifier
 *                           example: "abc12345-e89b-12d3-a456-426614174003"
 *                         exercise_id:
 *                           type: string
 *                           format: uuid
 *                           description: Exercise identifier
 *                           example: "789e0123-e89b-12d3-a456-426614174002"
 *                         user_id:
 *                           type: string
 *                           format: uuid
 *                           nullable: true
 *                           description: User identifier (null in dev mode without auth)
 *                           example: "123e4567-e89b-12d3-a456-426614174000"
 *                         code:
 *                           type: string
 *                           description: Submitted code
 *                           example: "function add(a, b) { return a + b; }"
 *                         score:
 *                           type: number
 *                           description: Calculated score (0-100)
 *                           example: 100
 *                         passed:
 *                           type: boolean
 *                           description: Whether all test cases passed
 *                           example: true
 *                         test_results:
 *                           type: array
 *                           description: Results for each test case
 *                           items:
 *                             type: object
 *                         submitted_at:
 *                           type: string
 *                           format: date-time
 *                           description: Submission timestamp
 *                           example: "2024-01-15T10:30:00Z"
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 */
router.post('/exercises/:exerciseId/submit', optionalAuth, submissionRateLimiter, submitForGrading)

/**
 * @openapi
 * /api/grading/exercises/{exerciseId}/submissions:
 *   get:
 *     tags:
 *       - Grading
 *     summary: Get submission history
 *     description: Retrieve submission history for a specific exercise. Returns the user's past submissions ordered by most recent first. Works without authentication in development mode.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: exerciseId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Exercise unique identifier (UUID)
 *         example: "789e0123-e89b-12d3-a456-426614174002"
 *     responses:
 *       200:
 *         description: Submission history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     submissions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                             description: Submission unique identifier
 *                             example: "abc12345-e89b-12d3-a456-426614174003"
 *                           code:
 *                             type: string
 *                             description: Submitted code
 *                             example: "function add(a, b) { return a + b; }"
 *                           score:
 *                             type: number
 *                             description: Calculated score (0-100)
 *                             example: 100
 *                           passed:
 *                             type: boolean
 *                             description: Whether all test cases passed
 *                             example: true
 *                           submitted_at:
 *                             type: string
 *                             format: date-time
 *                             description: Submission timestamp
 *                             example: "2024-01-15T10:30:00Z"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 */
router.get('/exercises/:exerciseId/submissions', optionalAuth, getSubmissionHistory)

/**
 * @openapi
 * /api/grading/exercises/{exerciseId}/submissions/{submissionId}:
 *   get:
 *     tags:
 *       - Grading
 *     summary: Get submission details
 *     description: Retrieve detailed information about a specific submission, including test results and grading feedback. Works without authentication in development mode.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: exerciseId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Exercise unique identifier (UUID)
 *         example: "789e0123-e89b-12d3-a456-426614174002"
 *       - in: path
 *         name: submissionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Submission unique identifier (UUID)
 *         example: "abc12345-e89b-12d3-a456-426614174003"
 *     responses:
 *       200:
 *         description: Submission details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     submission:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                           description: Submission unique identifier
 *                           example: "abc12345-e89b-12d3-a456-426614174003"
 *                         exercise_id:
 *                           type: string
 *                           format: uuid
 *                           description: Exercise identifier
 *                           example: "789e0123-e89b-12d3-a456-426614174002"
 *                         user_id:
 *                           type: string
 *                           format: uuid
 *                           nullable: true
 *                           description: User identifier
 *                           example: "123e4567-e89b-12d3-a456-426614174000"
 *                         code:
 *                           type: string
 *                           description: Submitted code
 *                           example: "function add(a, b) { return a + b; }"
 *                         score:
 *                           type: number
 *                           description: Calculated score (0-100)
 *                           example: 100
 *                         passed:
 *                           type: boolean
 *                           description: Whether all test cases passed
 *                           example: true
 *                         test_results:
 *                           type: array
 *                           description: Detailed results for each test case
 *                           items:
 *                             type: object
 *                         feedback:
 *                           type: string
 *                           nullable: true
 *                           description: Grading feedback or comments
 *                           example: Great job! All test cases passed.
 *                         submitted_at:
 *                           type: string
 *                           format: date-time
 *                           description: Submission timestamp
 *                           example: "2024-01-15T10:30:00Z"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 */
router.get('/exercises/:exerciseId/submissions/:submissionId', optionalAuth, getSubmissionDetail)

// ============================================================================
// ADMIN ENDPOINTS (Session auth + admin role)
// ============================================================================

/**
 * @openapi
 * /api/grading/admin/submissions/{submissionId}/override:
 *   put:
 *     tags:
 *       - Grading Admin
 *     summary: Override submission score (Admin only)
 *     description: Manually override the auto-graded score for a submission. Requires admin authentication via session.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: submissionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Submission unique identifier (UUID)
 *         example: "abc12345-e89b-12d3-a456-426614174003"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - score
 *             properties:
 *               score:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *                 description: New score to set (0-100)
 *                 example: 85
 *               feedback:
 *                 type: string
 *                 description: Optional feedback or reason for override
 *                 example: Partial credit for correct approach
 *           example:
 *             score: 85
 *             feedback: Partial credit for correct approach
 *     responses:
 *       200:
 *         description: Score overridden successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.put(
  '/admin/submissions/:submissionId/override',
  authenticateSession,
  requireAdmin,
  overrideScore
)

/**
 * @openapi
 * /api/grading/admin/exercises/{exerciseId}/test-cases:
 *   get:
 *     tags:
 *       - Grading Admin
 *     summary: Get test cases for exercise (Admin only)
 *     description: Retrieve all test cases configured for a specific exercise. Requires admin authentication via session.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: exerciseId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Exercise unique identifier (UUID)
 *         example: "789e0123-e89b-12d3-a456-426614174002"
 *     responses:
 *       200:
 *         description: Test cases retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get(
  '/admin/exercises/:exerciseId/test-cases',
  authenticateSession,
  requireAdmin,
  getTestCases
)

/**
 * @openapi
 * /api/grading/admin/exercises/{exerciseId}/test-cases:
 *   post:
 *     tags:
 *       - Grading Admin
 *     summary: Create test case for exercise (Admin only)
 *     description: Add a new test case to an exercise for auto-grading. Requires admin authentication via session.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: exerciseId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Exercise unique identifier (UUID)
 *         example: "789e0123-e89b-12d3-a456-426614174002"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - input
 *               - expectedOutput
 *             properties:
 *               input:
 *                 type: string
 *                 description: Test case input
 *                 example: "2, 3"
 *               expectedOutput:
 *                 type: string
 *                 description: Expected output for this input
 *                 example: "5"
 *               description:
 *                 type: string
 *                 description: Optional description of what this test case validates
 *                 example: Test addition of two positive numbers
 *           example:
 *             input: "2, 3"
 *             expectedOutput: "5"
 *             description: Test addition of two positive numbers
 *     responses:
 *       201:
 *         description: Test case created successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.post(
  '/admin/exercises/:exerciseId/test-cases',
  authenticateSession,
  requireAdmin,
  createTestCase
)

/**
 * @openapi
 * /api/grading/admin/usage:
 *   get:
 *     tags:
 *       - Grading Admin
 *     summary: Get grading system usage statistics (Admin only)
 *     description: Retrieve usage statistics for the auto-grading system, including submission counts, pass rates, and performance metrics. Requires admin authentication via session.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Usage statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalSubmissions:
 *                       type: integer
 *                       description: Total number of submissions
 *                       example: 1250
 *                     passRate:
 *                       type: number
 *                       description: Overall pass rate percentage
 *                       example: 68.5
 *                     averageScore:
 *                       type: number
 *                       description: Average score across all submissions
 *                       example: 72.3
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/admin/usage', authenticateSession, requireAdmin, getUsageStats)

export default router
