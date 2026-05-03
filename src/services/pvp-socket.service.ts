/**
 * PvP Socket Service
 * Real-time WebSocket communication for PvP matches
 */

import { Server as SocketIOServer, Socket } from 'socket.io'
import { Server as HTTPServer } from 'http'
import { config } from '../config'
import { logger } from '../utils/logger'
import { pvpService } from './pvp.service'
import { supabaseAdmin } from '../db/supabase'
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from '../types/pvp.types'

export class PvPSocketService {
  private io: SocketIOServer<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >
  private matchTimers: Map<string, NodeJS.Timeout> = new Map()

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: config.frontendUrl,
        credentials: true,
      },
      path: '/socket.io',
    })

    this.setupMiddleware()
    this.setupEventHandlers()
  }

  /**
   * Setup authentication middleware
   */
  private setupMiddleware(): void {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token

        if (!token) {
          return next(new Error('Authentication token required'))
        }

        // Verify token with Supabase
        const { data, error } = await supabaseAdmin.auth.getUser(token)

        if (error || !data.user) {
          return next(new Error('Invalid authentication token'))
        }

        // Store user ID in socket data
        socket.data.userId = data.user.id
        next()
      } catch (error) {
        logger.error('Socket authentication error:', error)
        next(new Error('Authentication failed'))
      }
    })
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    this.io.on(
      'connection',
      (
        socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
      ) => {
        const userId = socket.data.userId
        logger.info(`User connected: ${userId} (${socket.id})`)

        // Match lifecycle events
        socket.on('match:join', matchId => this.handleMatchJoin(socket, matchId))
        socket.on('match:leave', matchId => this.handleMatchLeave(socket, matchId))
        socket.on('match:ready', matchId => this.handleMatchReady(socket, matchId))

        // Submission events
        socket.on('submission:answer', payload => this.handleSubmitAnswer(socket, payload))
        socket.on('submission:code', payload => this.handleSubmitCode(socket, payload))

        // Reaction events
        socket.on('reaction:send', payload => this.handleSendReaction(socket, payload))

        // Typing indicators
        socket.on('typing:start', matchId => this.handleTypingStart(socket, matchId))
        socket.on('typing:stop', matchId => this.handleTypingStop(socket, matchId))

        // Disconnect
        socket.on('disconnect', () => this.handleDisconnect(socket))
      }
    )
  }

  /**
   * Handle user joining a match
   */
  private async handleMatchJoin(
    socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
    matchIdOrCode: string
  ): Promise<void> {
    try {
      const userId = socket.data.userId!

      logger.info(`Socket join request: User ${userId} joining match ${matchIdOrCode}`)

      // Resolve room code to actual UUID
      const matchDetails = await pvpService.getMatch(matchIdOrCode)
      const matchId = matchDetails.id

      // Check if user is already a participant
      const { data: existingParticipant } = await supabaseAdmin
        .from('pvp_participants')
        .select('*')
        .eq('match_id', matchId)
        .eq('user_id', userId)
        .single()

      let participant = existingParticipant

      // Only join if not already a participant
      if (!existingParticipant) {
        logger.info(`User ${userId} not in match yet, joining...`)
        participant = await pvpService.joinMatch(matchId, userId)

        // Notify all participants about new join
        this.io.to(matchId).emit('participant:joined', participant)
      } else {
        logger.info(`User ${userId} already in match, just connecting socket`)

        // Update connection status
        await supabaseAdmin
          .from('pvp_participants')
          .update({ is_connected: true })
          .eq('match_id', matchId)
          .eq('user_id', userId)
      }

      // Join socket room
      socket.join(matchId)
      socket.data.matchId = matchId

      // Get full match data and send to this user
      const match = await pvpService.getMatch(matchId)
      socket.emit('match:updated', { match } as any)

      logger.info(`User ${userId} socket connected to match ${matchId}`)
    } catch (error: any) {
      logger.error('Error joining match:', error)
      socket.emit('error', { message: error.message || 'Failed to join match' })
    }
  }

  /**
   * Handle user leaving a match
   */
  private async handleMatchLeave(
    socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
    matchId: string
  ): Promise<void> {
    try {
      const userId = socket.data.userId!

      // Update participant status
      await supabaseAdmin
        .from('pvp_participants')
        .update({ is_connected: false, left_at: new Date().toISOString() })
        .eq('match_id', matchId)
        .eq('user_id', userId)

      // Leave socket room
      socket.leave(matchId)
      socket.data.matchId = undefined

      // Notify other participants
      this.io.to(matchId).emit('participant:left', { user_id: userId } as any)

      logger.info(`User ${userId} left match ${matchId}`)
    } catch (error: any) {
      logger.error('Error leaving match:', error)
      socket.emit('error', { message: error.message || 'Failed to leave match' })
    }
  }

  /**
   * Handle user marking ready
   */
  private async handleMatchReady(
    socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
    matchId: string
  ): Promise<void> {
    try {
      const userId = socket.data.userId!

      logger.info(`User ${userId} marking ready in match ${matchId}`)

      // Mark ready in database
      await pvpService.markReady(matchId, userId)

      // Get participant data with profile
      const { data: participant } = await supabaseAdmin
        .from('pvp_participants')
        .select('*')
        .eq('match_id', matchId)
        .eq('user_id', userId)
        .single()

      if (!participant) {
        logger.error(`Participant not found: ${userId} in match ${matchId}`)
        return
      }

      // Get user profile
      const { data: profile } = await supabaseAdmin
        .from('user_profiles')
        .select('display_name, avatar_url')
        .eq('id', userId)
        .single()

      const participantWithProfile = {
        ...participant,
        display_name: profile?.display_name,
        avatar_url: profile?.avatar_url,
      }

      logger.info(`Broadcasting participant ready: ${userId}`)

      // Notify all participants
      this.io.to(matchId).emit('participant:ready', participantWithProfile as any)

      // Check if all ready and start match
      const started = await pvpService.checkAndStartMatch(matchId)

      if (started) {
        logger.info(`All players ready, starting match ${matchId}`)
        await this.startMatch(matchId)
      } else {
        logger.info(`Waiting for more players to be ready in match ${matchId}`)
      }

      logger.info(`User ${userId} ready in match ${matchId}`)
    } catch (error: any) {
      logger.error('Error marking ready:', error)
      socket.emit('error', { message: error.message || 'Failed to mark ready' })
    }
  }

  /**
   * Start a match
   */
  private async startMatch(matchId: string): Promise<void> {
    try {
      const match = await pvpService.getMatch(matchId)

      // Emit match started event
      this.io.to(matchId).emit('match:started', match)

      // Start first question
      await this.startQuestion(matchId)

      logger.info(`Match ${matchId} started`)
    } catch (error) {
      logger.error('Error starting match:', error)
    }
  }

  /**
   * Start a question with timer
   */
  private async startQuestion(matchId: string): Promise<void> {
    try {
      const match = await pvpService.getMatch(matchId)
      const question = await pvpService.getCurrentQuestion(matchId)

      // Emit question changed event
      this.io.to(matchId).emit('match:question_changed', {
        match,
        question,
        timeRemaining: match.time_per_question,
      })

      // Set timer for question
      const timer = setTimeout(async () => {
        await this.endQuestion(matchId)
      }, match.time_per_question * 1000)

      this.matchTimers.set(matchId, timer)

      logger.info(`Question started for match ${matchId}`)
    } catch (error) {
      logger.error('Error starting question:', error)
    }
  }

  /**
   * End current question and move to next or complete match
   */
  private async endQuestion(matchId: string): Promise<void> {
    try {
      logger.info(`[endQuestion] Starting for match ${matchId}`)

      // Clear timer
      const timer = this.matchTimers.get(matchId)
      if (timer) {
        clearTimeout(timer)
        this.matchTimers.delete(matchId)
        logger.info(`[endQuestion] Cleared timer for match ${matchId}`)
      }

      // Get match
      const { data: match } = await supabaseAdmin
        .from('pvp_matches')
        .select('*')
        .eq('id', matchId)
        .single()

      if (!match) {
        logger.error(`[endQuestion] Match not found: ${matchId}`)
        return
      }

      const nextIndex = match.current_question_index + 1
      logger.info(
        `[endQuestion] Match ${matchId}: current=${match.current_question_index}, next=${nextIndex}, total=${match.question_ids.length}`
      )

      // Check if more questions
      if (nextIndex < match.question_ids.length) {
        logger.info(
          `[endQuestion] Entering cooldown before next question (${nextIndex}/${match.question_ids.length})`
        )

        // Notify clients about the cooldown
        this.io.to(matchId).emit('match:cooldown', {
          duration: 3,
          isMatchOver: false,
          nextQuestionIndex: nextIndex,
        })

        // Wait 3 seconds
        setTimeout(async () => {
          try {
            // Move to next question
            await supabaseAdmin
              .from('pvp_matches')
              .update({ current_question_index: nextIndex })
              .eq('id', matchId)

            await this.startQuestion(matchId)
          } catch (e) {
            logger.error('[endQuestion cooldown timeout] Error:', e)
          }
        }, 3000)
      } else {
        logger.info(
          `[endQuestion] No more questions, entering cooldown before completing match ${matchId}`
        )

        // Notify clients about the final cooldown before showing results
        this.io.to(matchId).emit('match:cooldown', {
          duration: 3,
          isMatchOver: true,
        })

        // Wait 3 seconds
        setTimeout(async () => {
          try {
            await this.completeMatch(matchId)
          } catch (e) {
            logger.error('[endQuestion final cooldown timeout] Error:', e)
          }
        }, 3000)
      }
    } catch (error) {
      logger.error('[endQuestion] Error:', error)
    }
  }

  /**
   * Complete a match and calculate final scores
   */
  private async completeMatch(matchId: string): Promise<void> {
    try {
      logger.info(`[completeMatch] Starting for match ${matchId}`)

      // Get participants with scores (without join)
      const { data: participants, error: participantsError } = await supabaseAdmin
        .from('pvp_participants')
        .select('*')
        .eq('match_id', matchId)
        .order('total_score', { ascending: false })

      if (participantsError) {
        logger.error(`[completeMatch] Error fetching participants:`, participantsError)
        return
      }

      if (!participants || participants.length === 0) {
        logger.error(`[completeMatch] No participants found for match ${matchId}`)
        return
      }

      logger.info(`[completeMatch] Found ${participants.length} participants`)

      // Get user profiles separately
      const userIds = participants.map((p: any) => p.user_id)
      const { data: profiles } = await supabaseAdmin
        .from('user_profiles')
        .select('id, display_name')
        .in('id', userIds)

      // Create profile map
      const profileMap = new Map(profiles?.map(p => [p.id, p.display_name]) || [])

      // Assign ranks (handle ties)
      let currentRank = 1
      let previousScore: number | null = null

      const rankedParticipants = participants.map((p: any, index: number) => {
        const score = p.total_score || 0
        if (previousScore !== null && score < previousScore) {
          currentRank = index + 1
        }
        previousScore = score

        return {
          userId: p.user_id,
          displayName: profileMap.get(p.user_id) || 'Anonymous',
          score,
          rank: currentRank,
        }
      })

      logger.info(`[completeMatch] Ranked participants:`, rankedParticipants)

      // Check for draw (multiple users with rank 1)
      const firstPlaceWinners = rankedParticipants.filter(p => p.rank === 1)
      const isDraw = firstPlaceWinners.length > 1

      // Update match status and winner (null if draw)
      const { error: updateError } = await supabaseAdmin
        .from('pvp_matches')
        .update({
          status: 'completed',
          ended_at: new Date().toISOString(),
          winner_id: isDraw ? null : firstPlaceWinners[0].userId,
        })
        .eq('id', matchId)

      if (updateError) {
        logger.error(`[completeMatch] Error updating match status:`, updateError)
        return
      }

      logger.info(
        `[completeMatch] Updated match status to completed, winner: ${isDraw ? 'DRAW' : firstPlaceWinners[0].userId}`
      )

      // Update participant ranks
      for (const p of rankedParticipants) {
        await supabaseAdmin
          .from('pvp_participants')
          .update({ final_rank: p.rank })
          .eq('match_id', matchId)
          .eq('user_id', p.userId)
      }

      logger.info(`[completeMatch] Updated participant ranks`)

      // Get updated match
      const match = await pvpService.getMatch(matchId)

      logger.info(`[completeMatch] Emitting match:completed event to room ${matchId}`)

      // Emit match completed event
      this.io.to(matchId).emit('match:completed', {
        match,
        finalScores: rankedParticipants,
      })

      logger.info(`[completeMatch] Match ${matchId} completed successfully`)
    } catch (error) {
      logger.error('[completeMatch] Error:', error)
    }
  }

  /**
   * Handle answer submission
   */
  private async handleSubmitAnswer(
    socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
    payload: { matchId: string; questionId: string; answer: string; timeTaken?: number }
  ): Promise<void> {
    try {
      const userId = socket.data.userId!

      // Submit answer
      const submission = await pvpService.submitAnswer(
        payload.matchId,
        userId,
        payload.questionId,
        payload.answer,
        payload.timeTaken || 0
      )

      // Notify all participants (hide answer)
      const sanitized = { ...submission, selected_answer: undefined }
      this.io.to(payload.matchId).emit('submission:received', sanitized)

      // Calculate rank
      const { data: submissions } = await supabaseAdmin
        .from('pvp_submissions')
        .select('*')
        .eq('match_id', payload.matchId)
        .eq('question_id', payload.questionId)
        .order('submitted_at', { ascending: true })

      const rank = submissions?.findIndex(s => s.user_id === userId) + 1 || 1

      // Emit rank
      this.io.to(payload.matchId).emit('submission:ranked', {
        userId,
        questionId: payload.questionId,
        rank,
        pointsEarned: submission.points_earned,
      })

      logger.info(`User ${userId} submitted answer for question ${payload.questionId}`)

      // Check if all participants have submitted
      const { data: participants } = await supabaseAdmin
        .from('pvp_participants')
        .select('user_id')
        .eq('match_id', payload.matchId)

      const participantCount = participants?.length || 0
      const submissionCount = submissions?.length || 0

      logger.info(
        `Submissions: ${submissionCount}/${participantCount} for question ${payload.questionId}`
      )

      // If all participants submitted, end question immediately
      if (submissionCount >= participantCount) {
        logger.info(
          `All participants submitted for question ${payload.questionId}, ending round...`
        )

        // Clear existing timer
        const timer = this.matchTimers.get(payload.matchId)
        if (timer) {
          clearTimeout(timer)
          this.matchTimers.delete(payload.matchId)
        }

        // End question after short delay (2 seconds to show results)
        setTimeout(async () => {
          await this.endQuestion(payload.matchId)
        }, 2000)
      }
    } catch (error: any) {
      logger.error('Error submitting answer:', error)
      socket.emit('error', { message: error.message || 'Failed to submit answer' })
    }
  }

  /**
   * Handle code submission
   */
  private async handleSubmitCode(
    socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
    payload: { matchId: string; questionId: string; code: string; timeTaken?: number }
  ): Promise<void> {
    try {
      const userId = socket.data.userId!

      const submission = await pvpService.submitCode(
        payload.matchId,
        userId,
        payload.questionId,
        payload.code,
        payload.timeTaken || 0
      )

      // Notify all participants (hide code)
      const sanitized = { ...submission, code: undefined }
      this.io.to(payload.matchId).emit('submission:received', sanitized)

      // Calculate rank
      const { data: submissions } = await supabaseAdmin
        .from('pvp_submissions')
        .select('*')
        .eq('match_id', payload.matchId)
        .eq('question_id', payload.questionId)
        .order('submitted_at', { ascending: true })

      const rank = submissions?.findIndex(s => s.user_id === userId) + 1 || 1

      // Emit rank
      this.io.to(payload.matchId).emit('submission:ranked', {
        userId,
        questionId: payload.questionId,
        rank,
        pointsEarned: submission.points_earned,
      })

      logger.info(`User ${userId} submitted code for question ${payload.questionId}`)

      // Check if all participants have submitted
      const { data: participants } = await supabaseAdmin
        .from('pvp_participants')
        .select('user_id')
        .eq('match_id', payload.matchId)

      const participantCount = participants?.length || 0
      const submissionCount = submissions?.length || 0

      logger.info(
        `Code submissions: ${submissionCount}/${participantCount} for question ${payload.questionId}`
      )

      // If all participants submitted, end question immediately
      if (submissionCount >= participantCount) {
        logger.info(
          `All participants submitted code for question ${payload.questionId}, ending round...`
        )

        // Clear existing timer
        const timer = this.matchTimers.get(payload.matchId)
        if (timer) {
          clearTimeout(timer)
          this.matchTimers.delete(payload.matchId)
        }

        // End question after short delay (2 seconds to show results)
        setTimeout(async () => {
          await this.endQuestion(payload.matchId)
        }, 2000)
      }
    } catch (error: any) {
      logger.error('Error submitting code:', error)
      socket.emit('error', { message: error.message || 'Failed to submit code' })
    }
  }

  /**
   * Handle sending reaction
   */
  private async handleSendReaction(
    socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
    payload: { matchId: string; emoji: string; targetUserId?: string }
  ): Promise<void> {
    try {
      const userId = socket.data.userId!

      // Save reaction
      const { data: reaction, error: reactionError } = await supabaseAdmin
        .from('pvp_reactions')
        .insert({
          match_id: payload.matchId,
          user_id: userId,
          emoji: payload.emoji,
          target_user_id: payload.targetUserId || null,
        })
        .select('*')
        .single()

      if (reactionError || !reaction) {
        logger.error('Error saving reaction:', reactionError)
        return
      }

      // Get user profile separately
      const { data: profile } = await supabaseAdmin
        .from('user_profiles')
        .select('display_name')
        .eq('id', userId)
        .single()

      // Broadcast reaction
      this.io.to(payload.matchId).emit('reaction:received', {
        ...reaction,
        display_name: profile?.display_name || 'Anonymous',
      })
    } catch (error: any) {
      logger.error('Error sending reaction:', error)
      socket.emit('error', { message: error.message || 'Failed to send reaction' })
    }
  }

  /**
   * Handle typing start
   */
  private async handleTypingStart(
    socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
    matchId: string
  ): Promise<void> {
    const userId = socket.data.userId!

    // Get user info
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('display_name')
      .eq('id', userId)
      .single()

    // Broadcast to others in match
    socket.to(matchId).emit('typing:user_started', {
      userId,
      displayName: profile?.display_name || 'Anonymous',
    })
  }

  /**
   * Handle typing stop
   */
  private handleTypingStop(
    socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
    matchId: string
  ): void {
    const userId = socket.data.userId!

    // Broadcast to others in match
    socket.to(matchId).emit('typing:user_stopped', { userId })
  }

  /**
   * Handle disconnect
   */
  private async handleDisconnect(
    socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
  ): Promise<void> {
    const userId = socket.data.userId
    const matchId = socket.data.matchId

    logger.info(`User disconnected: ${userId} (${socket.id})`)

    if (matchId) {
      // Update participant status
      await supabaseAdmin
        .from('pvp_participants')
        .update({ is_connected: false })
        .eq('match_id', matchId)
        .eq('user_id', userId)

      // Notify other participants
      this.io.to(matchId).emit('participant:disconnected', userId!)
    }
  }

  /**
   * Get Socket.IO instance
   */
  public getIO(): SocketIOServer<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  > {
    return this.io
  }
}
