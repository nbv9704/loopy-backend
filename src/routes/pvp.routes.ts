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
 * Create a new match
 * POST /api/pvp/matches
 */
router.post('/matches', validate(pvpSchemas.createMatch), pvpController.createMatch)

/**
 * Get match details
 * GET /api/pvp/matches/:matchId
 */
router.get('/matches/:matchId', validate(pvpSchemas.getMatch), pvpController.getMatch)

/**
 * Get current question for match
 * GET /api/pvp/matches/:matchId/question
 */
router.get('/matches/:matchId/question', pvpController.getCurrentQuestion)

// ============================================================================
// MATCHMAKING
// ============================================================================

/**
 * Find or create a match (matchmaking)
 * POST /api/pvp/matchmaking
 */
router.post('/matchmaking', validate(pvpSchemas.findMatch), pvpController.findMatch)

// ============================================================================
// HISTORY & STATS
// ============================================================================

/**
 * Get match history for current user
 * GET /api/pvp/history
 */
router.get('/history', validate(pvpSchemas.getMatchHistory), pvpController.getMatchHistory)

/**
 * Get user stats
 * GET /api/pvp/stats/:userId?
 */
router.get('/stats/:userId?', validate(pvpSchemas.getUserStats), pvpController.getUserStats)

/**
 * Get leaderboard
 * GET /api/pvp/leaderboard
 */
router.get('/leaderboard', validate(pvpSchemas.getLeaderboard), pvpController.getLeaderboard)

export default router
