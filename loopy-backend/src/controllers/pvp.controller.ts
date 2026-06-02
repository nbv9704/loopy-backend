/**
 * PvP Controller
 * HTTP endpoints for PvP system
 */

import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/auth'
import { pvpService } from '../services/pvp.service'
import { supabaseAdmin } from '../db/supabase'
import { logger } from '../utils/logger'
import { errors } from '../middleware/errorHandler'

/**
 * Create a new PvP match
 * POST /api/pvp/matches
 */
export const createMatch = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { mode, language_id, difficulty, max_players, time_per_question, question_count } =
      req.body

    const match = await pvpService.createMatch({
      mode,
      language_id,
      difficulty,
      max_players,
      time_per_question,
      question_count,
    }, req.user?.id)

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

    // 2. Check if already full
    const { data: participants } = await supabaseAdmin
      .from('pvp_participants')
      .select('user_id')
      .eq('match_id', match.id)

    const isAlreadyIn = participants?.some(p => p.user_id === userId)
    if (!isAlreadyIn && participants && participants.length >= match.max_players) {
      throw errors.badRequest('Match is already full')
    }

    // 3. Join the match in DB
    const participant = await pvpService.joinMatch(match.id, userId)

    // 4. Notify other participants via socket
    const io = (req.app as any).get('io')
    if (io) {
      io.to(match.id).emit('participant:joined', participant)
    }

    res.json({
      success: true,
      data: { match },
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
    if (!userId) {
      throw errors.unauthorized()
    }

    const { language_id, difficulty, mode = '1v1' } = req.body

    logger.info('Matchmaking request:', { userId, language_id, difficulty, mode })

    // Try to find an existing waiting match
    let query = supabaseAdmin
      .from('pvp_matches')
      .select('*, pvp_participants(count)')
      .eq('status', 'waiting')
      .eq('mode', mode)

    if (difficulty) {
      query = query.eq('difficulty', difficulty)
    }

    if (language_id) {
      query = query.eq('language_id', language_id)
    }

    const { data: existingMatches, error: searchError } = await query

    if (searchError) {
      logger.error('Search error:', searchError)
      throw errors.databaseError('Failed to search for matches', searchError)
    }

    logger.info(`Existing matches found: ${existingMatches?.length || 0}`)

    // Find a match that's not full
    let match = existingMatches?.find((m: any) => {
      const participantCount = m.pvp_participants?.[0]?.count || 0
      logger.info(`Match ${m.id}: ${participantCount}/${m.max_players} players`)
      return participantCount < m.max_players
    })

    // If no match found, create new one
    if (!match) {
      logger.info('No available match found, creating new one...')
      try {
        match = await pvpService.createMatch({
          mode,
          language_id,
          difficulty,
          max_players: mode === '1v1' ? 2 : 10,
          time_per_question: 30,
          question_count: 5,
        }, userId)
        logger.info(`New match created: ${match.id}`)
      } catch (createError: any) {
        logger.error('Failed to create match:', createError)
        throw createError
      }
    } else {
      logger.info(`Found existing match: ${match.id}`)
    }

    // Join the match
    let isNewJoin = false
    try {
      const participant = await pvpService.joinMatch(match.id, userId)
      logger.info('User joined match successfully')

      // Check if this is a new join (not the match creator)
      const { data: allParticipants } = await supabaseAdmin
        .from('pvp_participants')
        .select('user_id')
        .eq('match_id', match.id)

      isNewJoin = (allParticipants?.length || 0) > 1

      // If new join, emit socket event to notify other participants
      if (isNewJoin) {
        const io = (req.app as any).get('io')
        if (io) {
          logger.info(`Emitting participant:joined event to room: ${match.id}`)
          io.to(match.id).emit('participant:joined', participant)
        }
      }
    } catch (joinError: any) {
      logger.error('Failed to join match:', joinError)
      throw joinError
    }

    res.json({
      success: true,
      data: { match },
    })
  } catch (error) {
    logger.error('Matchmaking error:', error)
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

    const question = await pvpService.getCurrentQuestion(matchId)

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
