/**
 * PvP Controller
 * HTTP endpoints for PvP system
 */

import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/auth'
import { pvpService } from '../services/pvp.service'
import { supabaseAdmin } from '../db/supabase'
import { logger } from '../utils/logger'
import { AppError, errors } from '../middleware/errorHandler'

/**
 * Create a new PvP match
 * POST /api/pvp/matches
 */
export const createMatch = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id
    if (!userId) throw errors.unauthorized()

    await pvpService.assertEligible(userId)

    const { mode, language_id, difficulty, max_players, time_per_question, question_count } =
      req.body

    const match = await pvpService.createMatch({
      mode,
      language_id,
      difficulty,
      max_players,
      time_per_question,
      question_count,
    })

    res.status(201).json({
      success: true,
      data: { match },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get match details
 * GET /api/pvp/matches/:matchId
 */
export const getMatch = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { matchId } = req.params
    const userId = req.user?.id

    logger.info('Get match request:', { matchId, userId })

    const match = await pvpService.getMatch(matchId)

    logger.info(
      `Match found: ${match.id} Status: ${match.status} Participants: ${match.participants?.length}`
    )

    res.json({
      success: true,
      data: { match },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Join a specific match by ID or Room Code
 * POST /api/pvp/matches/:matchId/join
 */
export const joinMatch = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      throw errors.unauthorized()
    }

    const { matchId } = req.params

    // 1. Find the match (could be ID or Room Code)
    const match = await pvpService.getMatch(matchId)

    // Capacity, membership and status are checked together under the match lock.
    const participant = await pvpService.joinMatch(match.id, userId)

    // 4. Notify other participants via socket
    const io = (req.app as any).get('io')
    if (io) {
      io.to(match.id).emit('participant:joined', participant)
    }

    res.json({
      success: true,
      data: { match: await pvpService.getMatch(match.id) },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Find or create a match (matchmaking)
 * POST /api/pvp/matchmaking
 */
export const findMatch = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id
    if (!userId) throw errors.unauthorized()
    const result = await pvpService.findMatch(userId, req.body)
    // The result has already committed; optional realtime notification cannot undo it.
    if (!result.replayed) {
      try {
        req.app.get('io')?.to(result.match.id).emit('participant:joined', result.participant)
      } catch {
        logger.warn('PvP matchmaking notification unavailable')
      }
    }
    res.json({ success: true, data: { match: result.match } })
  } catch (error) {
    next(error)
  }
}

export const getEligibility = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.id) throw errors.unauthorized()
    res.json({ success: true, data: await pvpService.getEligibility(req.user.id) })
  } catch (error) {
    next(error)
  }
}

/**
 * Get current question for match
 * GET /api/pvp/matches/:matchId/question
 */
export const getCurrentQuestion = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { matchId } = req.params
    const userId = req.user?.id
    if (!userId) {
      throw errors.unauthorized()
    }

    const match = await pvpService.getMatch(matchId)
    const isParticipant = match.participants?.some(
      participant => participant.user_id === userId && !participant.left_at
    )
    if (!isParticipant) {
      throw errors.forbidden()
    }
    if (
      match.status !== 'in_progress' ||
      !match.question_started_at ||
      match.question_closed_at ||
      match.question_started_index !== match.current_question_index
    )
      throw new AppError(
        409,
        'PVP_QUESTION_NOT_OPEN',
        'Câu hỏi chưa mở hoặc đã đóng. Hãy chờ đồng bộ vòng đấu.'
      )

    const question = await pvpService.getCurrentQuestion(match.id)

    res.json({
      success: true,
      data: { question },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get match history for user
 * GET /api/pvp/history
 */
export const getMatchHistory = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      throw errors.unauthorized()
    }

    const { limit, offset } = req.query

    const { data: matches, error } = await supabaseAdmin
      .from('pvp_matches')
      .select(
        `
        *,
        pvp_participants!inner(
          user_id,
          total_score,
          final_rank
        )
      `
      )
      .eq('pvp_participants.user_id', userId)
      .order('created_at', { ascending: false })
      .range(Number(offset) || 0, (Number(offset) || 0) + (Number(limit) || 10) - 1)

    if (error) {
      throw errors.databaseError('Failed to fetch match history', error)
    }

    res.json({
      success: true,
      data: { matches: matches || [] },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get user stats
 * GET /api/pvp/stats/:userId?
 */
export const getUserStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.params.userId || req.user?.id
    if (!userId) {
      throw errors.unauthorized()
    }

    const stats = await pvpService.getUserStats(userId)

    res.json({
      success: true,
      data: { stats },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get leaderboard
 * GET /api/pvp/leaderboard
 */
export const getLeaderboard = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { limit, sort_by } = req.query

    const leaderboard = await pvpService.getLeaderboard(
      Number(limit) || 50,
      (sort_by as any) || 'rating'
    )

    res.json({
      success: true,
      data: { leaderboard },
    })
  } catch (error) {
    next(error)
  }
}
