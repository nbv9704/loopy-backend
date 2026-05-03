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
 *               - maxPlayers
 *               - timePerQuestion
 *               - questionCount
 *             properties:
 *               mode:
 *                 type: string
 *                 enum: [1v1, battle_royale]
 *                 description: Match mode
 *                 example: 1v1
 *               languageId:
 *                 type: string
 *                 format: uuid
 *                 description: Programming language ID (optional)
 *               difficulty:
 *                 type: string
 *                 enum: [easy, medium, hard]
 *                 description: Question difficulty
 *                 example: medium
 *               maxPlayers:
 *                 type: integer
 *                 minimum: 2
 *                 description: Maximum number of players
 *                 example: 2
 *               timePerQuestion:
 *                 type: integer
 *                 minimum: 30
 *                 description: Time limit per question in seconds
 *                 example: 60
 *               questionCount:
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

/**
 * @openapi
 * /api/pvp/matches/{matchId}/question:
 *   get:
 *     tags:
 *       - PvP
 *     summary: Get current question
 *     description: Get the current question for an active match
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
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/matches/:matchId/question', pvpController.getCurrentQuestion)

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
 *     description: Matchmaking endpoint - finds an available match or creates a new one
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
 *               languageId:
 *                 type: string
 *                 format: uuid
 *               difficulty:
 *                 type: string
 *                 enum: [easy, medium, hard]
 *                 example: medium
 *     responses:
 *       200:
 *         description: Match found or created
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
