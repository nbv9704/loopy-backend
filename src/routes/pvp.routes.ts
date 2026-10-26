import { Router } from 'express'
import { authenticate } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { pvpSchemas } from '../schemas/pvp.schemas'
import * as pvpController from '../controllers/pvp.controller'

/**
 * PvP Routes
 * Real-time competitive coding endpoints
 */

const router = Router()

// All PvP routes require authentication
router.use(authenticate)

/**
 * @openapi
 * /api/pvp/eligibility:
 *   get:
 *     tags: [PvP]
 *     summary: Read the current user's saved PvP eligibility
 *     description: Checks onboarding and at least one completed published lesson. Cached profile points do not decide access. Matchmaking and joining recheck permissions at commit.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Authoritative eligibility preview
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   required: [eligible, onboardingCompleted, hasCompletedLesson]
 *                   properties:
 *                     eligible:
 *                       type: boolean
 *                     onboardingCompleted:
 *                       type: boolean
 *                     hasCompletedLesson:
 *                       type: boolean
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/eligibility', pvpController.getEligibility)

// ============================================================================
// MATCH MANAGEMENT
// ============================================================================

/**
 * @openapi
 * /api/pvp/matches:
 *   post:
 *     tags:
 *       - PvP
 *     summary: Create a new PvP match
 *     description: Create a new competitive coding match with specified configuration
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mode
 *               - max_players
 *               - time_per_question
 *               - question_count
 *             properties:
 *               mode:
 *                 type: string
 *                 enum: [1v1, battle_royale]
 *                 description: Match mode
 *                 example: 1v1
 *               language_id:
 *                 type: string
 *                 example: javascript
 *                 description: Programming language ID (optional)
 *               difficulty:
 *                 type: string
 *                 enum: [easy, medium, hard]
 *                 description: Question difficulty
 *                 example: medium
 *               max_players:
 *                 type: integer
 *                 minimum: 2
 *                 description: Maximum number of players
 *                 example: 2
 *               time_per_question:
 *                 type: integer
 *                 minimum: 30
 *                 description: Time limit per question in seconds
 *                 example: 60
 *               question_count:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 10
 *                 description: Number of questions in match
 *                 example: 5
 *     responses:
 *       201:
 *         description: Match created successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/matches', validate(pvpSchemas.createMatch), pvpController.createMatch)

/**
 * @openapi
 * /api/pvp/matches/{matchId}:
 *   get:
 *     tags:
 *       - PvP
 *     summary: Get match details
 *     description: Retrieve detailed information about a specific match
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: matchId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Match ID or room code
 *     responses:
 *       200:
 *         description: Match details retrieved successfully
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/matches/:matchId', validate(pvpSchemas.getMatch), pvpController.getMatch)
router.post('/matches/:matchId/join', validate(pvpSchemas.getMatch), pvpController.joinMatch)

/**
 * @openapi
 * /api/pvp/matches/{matchId}/question:
 *   get:
 *     tags:
 *       - PvP
 *     summary: Get current question
 *     description: Read only the currently open round as an active non-forfeited participant. Waiting, paused/closed and not-yet-open rounds return 409.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: matchId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Current question retrieved successfully
 *       409:
 *         description: Question is not open
 *       403:
 *         description: Active match membership required
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get(
  '/matches/:matchId/question',
  validate(pvpSchemas.getMatch),
  pvpController.getCurrentQuestion
)

// ============================================================================
// MATCHMAKING
// ============================================================================

/**
 * @openapi
 * /api/pvp/matchmaking:
 *   post:
 *     tags:
 *       - PvP
 *     summary: Find or create a match
 *     description: Atomically resume an existing live membership or find/create and join a room. Eligibility, queue capacity, room creation and joining commit together; repeated requests do not create another membership. Missing official questions returns 409; missing schema returns 503.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mode
 *             properties:
 *               mode:
 *                 type: string
 *                 enum: [1v1, battle_royale]
 *                 example: 1v1
 *               language_id:
 *                 type: string
 *                 example: javascript
 *               difficulty:
 *                 type: string
 *                 enum: [easy, medium, hard]
 *                 example: medium
 *     responses:
 *       200:
 *         description: Match and membership committed successfully
 *       409:
 *         description: No official questions available for the selection
 *       503:
 *         description: Matchmaking schema is not ready
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/matchmaking', validate(pvpSchemas.findMatch), pvpController.findMatch)

// ============================================================================
// HISTORY & STATS
// ============================================================================

/**
 * @openapi
 * /api/pvp/history:
 *   get:
 *     tags:
 *       - PvP
 *     summary: Get match history
 *     description: Retrieve match history for the current user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *     responses:
 *       200:
 *         description: Match history retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/history', validate(pvpSchemas.getMatchHistory), pvpController.getMatchHistory)

/**
 * @openapi
 * /api/pvp/stats/{userId}:
 *   get:
 *     tags:
 *       - PvP
 *     summary: Get user stats
 *     description: Retrieve PvP statistics for a user (defaults to current user if userId not provided)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: false
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: User stats retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/stats/:userId?', validate(pvpSchemas.getUserStats), pvpController.getUserStats)

/**
 * @openapi
 * /api/pvp/leaderboard:
 *   get:
 *     tags:
 *       - PvP
 *     summary: Get leaderboard
 *     description: Retrieve global PvP leaderboard rankings
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *       - name: timeframe
 *         in: query
 *         schema:
 *           type: string
 *           enum: [all_time, monthly, weekly]
 *           default: all_time
 *     responses:
 *       200:
 *         description: Leaderboard retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/leaderboard', validate(pvpSchemas.getLeaderboard), pvpController.getLeaderboard)

export default router
