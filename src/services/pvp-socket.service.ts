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
import { observability } from './observability.service'
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
  private matchTimers: Map<string, NodeJS.Timeout> = new Map() // In-memory question timers
  private questionStartTimes: Map<string, number> = new Map()
  private disconnectTimers: Map<string, NodeJS.Timeout> = new Map() // Grace period timers keyed by `matchId:userId`
  private pausedMatches: Set<string> = new Set() // Matches currently paused due to disconnect
  private endingQuestions: Set<string> = new Set() // Mutex: prevent double endQuestion calls

  private static readonly DISCONNECT_GRACE_SECONDS = 30

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
        // Priority 1: Get token from cookie (new secure method)
        let token = socket.handshake.auth.token

        // Priority 2: Get token from cookie header (httpOnly cookies)
        if (!token && socket.request.headers.cookie) {
          const cookies = socket.request.headers.cookie.split(';').reduce(
            (acc, cookie) => {
              const [key, value] = cookie.trim().split('=')
              acc[key] = value
              return acc
            },
            {} as Record<string, string>
          )
          token = cookies.auth_token
        }

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

      observability.trackPvPEvent('join', matchId, userId)

      // Get full match data and send to this user
      const match = await pvpService.getMatch(matchId)
      socket.emit('match:updated', { match } as any)

      // --- Handle reconnection to a paused match ---
      const timerKey = `${matchId}:${userId}`
      if (this.disconnectTimers.has(timerKey)) {
        // Cancel the grace period timer
        clearTimeout(this.disconnectTimers.get(timerKey)!)
        this.disconnectTimers.delete(timerKey)

        logger.info(`[Disconnect Grace] User ${userId} reconnected — cancelling forfeit timer`)

        // Notify everyone about the reconnection
        this.io.to(matchId).emit('participant:reconnected', userId)

        // Get display name
        const { data: reconProfile } = await supabaseAdmin
          .from('user_profiles')
          .select('display_name')
          .eq('id', userId)
          .single()

        this.io.to(matchId).emit('match:resumed', {
          reconnectedUserId: userId,
          displayName: reconProfile?.display_name || 'Người chơi',
        })

        // If match was paused, unpause and restart the question timer
        if (this.pausedMatches.has(matchId)) {
          this.pausedMatches.delete(matchId)
          await this.startQuestion(matchId)
        }
      }

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

      // Check match status
      const { data: match } = await supabaseAdmin
        .from('pvp_matches')
        .select('status')
        .eq('id', matchId)
        .single()

      if (match?.status === 'waiting' || match?.status === 'starting') {
        // Delete participant entirely if match hasn't started
        await supabaseAdmin
          .from('pvp_participants')
          .delete()
          .eq('match_id', matchId)
          .eq('user_id', userId)
      } else {
        // Mark as left if match is in progress
        await supabaseAdmin
          .from('pvp_participants')
          .update({ is_connected: false, left_at: new Date().toISOString() })
          .eq('match_id', matchId)
          .eq('user_id', userId)
      }

      // Leave socket room
      socket.leave(matchId)
      socket.data.matchId = undefined

      // Notify other participants
      this.io.to(matchId).emit('participant:left', { user_id: userId } as any)

      logger.info(`User ${userId} left match ${matchId} (Status: ${match?.status})`)
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
      const currentMatch = await pvpService.getMatch(matchId)
      
      // Prevent double start if already starting or in_progress
      if (currentMatch.status === 'starting' || currentMatch.status === 'in_progress') {
        logger.info(`Match ${matchId} already started, skipping handleMatchReady start`)
        return
      }

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

      const delayMs = match.time_per_question * 1000

      // 1. Record start time
      this.questionStartTimes.set(matchId, Date.now())

      // 2. Schedule timer FIRST to ensure the match progresses even if emission fails
      await this.clearQuestionTimer(matchId)
      const timer = setTimeout(async () => {
        await this.endQuestion(matchId)
      }, delayMs)
      this.matchTimers.set(matchId, timer)

      // 3. Emit question changed event
      this.io.to(matchId).emit('match:question_changed', {
        match,
        question,
        timeRemaining: match.time_per_question,
      })

      logger.info(`[startQuestion] Question ${match.current_question_index + 1} started for match ${matchId} (${delayMs}ms)`)
    } catch (error) {
      logger.error('Error starting question:', error)
    }
  }

  /**
   * End current question and move to next or complete match
   */
  private async endQuestion(matchId: string): Promise<void> {
    // Mutex guard: prevent double calls
    if (this.endingQuestions.has(matchId)) {
      logger.warn(`[endQuestion] Already ending question for match ${matchId}, skipping duplicate call`)
      return
    }
    this.endingQuestions.add(matchId)

    try {
      logger.info(`[endQuestion] Starting for match ${matchId}`)

      // Clear timer
      await this.clearQuestionTimer(matchId)
      this.questionStartTimes.delete(matchId)

      // Get match
      const { data: match, error: fetchError } = await supabaseAdmin
        .from('pvp_matches')
        .select('*')
        .eq('id', matchId)
        .single()

      if (fetchError || !match) {
        logger.error(`[endQuestion] Match not found or error: ${matchId}`, fetchError)
        // Even if match not found in DB, we should attempt to clear timers
        return
      }

      // Ensure match is still in progress or starting
      if (match.status !== 'in_progress' && match.status !== 'starting') {
        logger.warn(`[endQuestion] Match ${matchId} is not in a state to end question: ${match.status}. Check if match was already completed or cancelled.`)
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

        // Always use setTimeout for cooldown (3s is too short to need Redis persistence)
        setTimeout(async () => {
          try {
            logger.info(`[cooldown] Transitioning to question ${nextIndex} for match ${matchId}`)
            await supabaseAdmin
              .from('pvp_matches')
              .update({ current_question_index: nextIndex })
              .eq('id', matchId)
            await this.startQuestion(matchId)
          } catch (e) {
            logger.error('[cooldown] Error transitioning to next question:', e)
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

        // Always use setTimeout for final cooldown
        setTimeout(async () => {
          try {
            logger.info(`[cooldown] Completing match ${matchId}`)
            await this.completeMatch(matchId)
          } catch (e) {
            logger.error('[cooldown] Error completing match:', e)
          }
        }, 3000)
      }
    } catch (error) {
      logger.error('[endQuestion] Error:', error)
      // Attempt to ensure progress even on failure if match exists
      try {
        this.io.to(matchId).emit('match:cooldown', { duration: 0, isMatchOver: true })
      } catch {
        // Ignore errors if socket channel is already destroyed
      }
    } finally {
      // Release mutex after a short delay to cover the cooldown scheduling
      setTimeout(() => this.endingQuestions.delete(matchId), 1000)
    }
  }

  /**
   * Clear question timer (in-memory setTimeout)
   */
  private async clearQuestionTimer(matchId: string): Promise<void> {
    const timer = this.matchTimers.get(matchId)
    if (timer) {
      clearTimeout(timer)
      this.matchTimers.delete(matchId)
    }

    logger.info(`[clearQuestionTimer] Cleared timer for match ${matchId}`)
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
        .select('id, display_name, avatar_url')
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

      observability.trackPvPEvent('complete', matchId, undefined, { finalScores: rankedParticipants })

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
      const sanitized = { ...submission, selected_answer: undefined, _correct_answer_id: undefined }
      this.io.to(payload.matchId).emit('submission:received', sanitized)

      // Calculate rank
      const { data: submissions } = await supabaseAdmin
        .from('pvp_submissions')
        .select('*')
        .eq('match_id', payload.matchId)
        .eq('question_id', payload.questionId)
        .order('submitted_at', { ascending: true })

      const rank = (submissions ? submissions.findIndex((s: { user_id: string }) => s.user_id === userId) : -1) + 1 || 1

      // Emit rank
      this.io.to(payload.matchId).emit('submission:ranked', {
        userId,
        questionId: payload.questionId,
        rank,
        pointsEarned: submission.points_earned,
      })

      // Send the correct answer back ONLY to the submitter so they can see what they got wrong
      socket.emit('submission:feedback', {
        questionId: payload.questionId,
        correctAnswerId: submission._correct_answer_id,
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
        await this.clearQuestionTimer(payload.matchId)

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

      const rank = (submissions ? submissions.findIndex((s: { user_id: string }) => s.user_id === userId) : -1) + 1 || 1

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
        await this.clearQuestionTimer(payload.matchId)

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
   * Handle disconnect — pause the match and give the user 30s to reconnect.
   * If they don't reconnect in time, they automatically forfeit (lose).
   */
  private async handleDisconnect(
    socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
  ): Promise<void> {
    const userId = socket.data.userId
    const matchId = socket.data.matchId

    logger.info(`User disconnected: ${userId} (${socket.id})`)

    if (!matchId || !userId) return

    observability.trackPvPEvent('disconnect', matchId, userId)

    // Update participant status
    await supabaseAdmin
      .from('pvp_participants')
      .update({ is_connected: false })
      .eq('match_id', matchId)
      .eq('user_id', userId)

    // Notify other participants
    this.io.to(matchId).emit('participant:disconnected', userId)

    // Check match status
    const { data: match } = await supabaseAdmin
      .from('pvp_matches')
      .select('status')
      .eq('id', matchId)
      .single()

    // If the match is still in waiting, delete the participant record
    // so someone else can join the lobby.
    if (match?.status === 'waiting') {
      await supabaseAdmin
        .from('pvp_participants')
        .delete()
        .eq('match_id', matchId)
        .eq('user_id', userId)
      
      this.io.to(matchId).emit('participant:left', { user_id: userId } as any)
      logger.info(`User ${userId} disconnected from lobby ${matchId} — removed participant`)
      return
    }

    if (!match || match.status !== 'in_progress') return

    // --- PAUSE the match ---
    logger.info(`[Disconnect Grace] Pausing match ${matchId} — waiting 30s for user ${userId}`)

    // Pause the question timer so it doesn't tick while we wait
    await this.clearQuestionTimer(matchId)
    this.pausedMatches.add(matchId)

    // Get display name for the notification
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('display_name')
      .eq('id', userId)
      .single()

    const displayName = profile?.display_name || 'Người chơi'

    // Notify all clients that the match is paused
    this.io.to(matchId).emit('match:paused', {
      disconnectedUserId: userId,
      displayName,
      timeoutSeconds: PvPSocketService.DISCONNECT_GRACE_SECONDS,
    })

    // Start 30s grace timer
    const timerKey = `${matchId}:${userId}`
    const graceTimer = setTimeout(async () => {
      this.disconnectTimers.delete(timerKey)

      // Check if user reconnected in the meantime
      const { data: participant } = await supabaseAdmin
        .from('pvp_participants')
        .select('is_connected')
        .eq('match_id', matchId)
        .eq('user_id', userId)
        .single()

      if (participant?.is_connected) {
        // They reconnected — timer is stale, do nothing
        return
      }

      // --- FORFEIT ---
      logger.info(`[Disconnect Grace] User ${userId} did not reconnect — auto-forfeit`)
      observability.trackPvPEvent('forfeit', matchId, userId)

      this.pausedMatches.delete(matchId)

      // Notify all clients
      this.io.to(matchId).emit('match:forfeit', {
        forfeitUserId: userId,
        displayName,
        reason: 'disconnect_timeout',
      })

      // Set this user's score to 0 and complete the match with the other player winning
      await supabaseAdmin
        .from('pvp_participants')
        .update({ total_score: 0, final_rank: 99 })
        .eq('match_id', matchId)
        .eq('user_id', userId)

      // Complete the match
      await this.completeMatch(matchId)
    }, PvPSocketService.DISCONNECT_GRACE_SECONDS * 1000)

    this.disconnectTimers.set(timerKey, graceTimer)
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
