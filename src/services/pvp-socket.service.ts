/**
 * PvP Socket Service
 * Real-time WebSocket communication for PvP matches
 */

import { Server as SocketIOServer, Socket } from 'socket.io'
import { Server as HTTPServer } from 'http'
import { logger } from '../utils/logger'
import { pvpService } from './pvp.service'
import { supabaseAdmin } from '../db/supabase'
import { getAllowedOrigins } from '../utils/origins'
import { observability } from './observability.service'
import { createPvPSocketBoundary, pvpSocketSchemas } from './pvp/socket-boundary'
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
  PvPSubmission,
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
  private pendingTimers = new Set<NodeJS.Timeout>()
  private stopping = false

  private static readonly DISCONNECT_GRACE_SECONDS = 30

  private schedule(task: () => void | Promise<void>, delay: number): NodeJS.Timeout {
    const timer = setTimeout(() => {
      this.pendingTimers.delete(timer)
      if (!this.stopping) {
        Promise.resolve()
          .then(task)
          .catch(error => logger.error('PvP scheduled task failed', error))
      }
    }, delay)
    if (this.stopping) clearTimeout(timer)
    else this.pendingTimers.add(timer)
    return timer
  }

  public async close(): Promise<void> {
    this.stopping = true
    for (const timer of this.pendingTimers) clearTimeout(timer)
    this.pendingTimers.clear()
    this.matchTimers.clear()
    this.disconnectTimers.clear()
    this.questionStartTimes.clear()
    await new Promise<void>(resolve => this.io.close(() => resolve()))
  }

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: getAllowedOrigins(),
        credentials: true,
      },
      path: '/socket.io',
      maxHttpBufferSize: 64 * 1024,
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
        const boundary = createPvPSocketBoundary({
          emitError: message => socket.emit('error', { message }),
          currentRoom: () => socket.data.matchId,
          isStopping: () => this.stopping,
        })

        // Match lifecycle events
        socket.on(
          'match:join',
          boundary.bind(pvpSocketSchemas.room, matchId => this.handleMatchJoin(socket, matchId), {
            serial: true,
            minIntervalMs: 250,
          })
        )
        socket.on(
          'match:leave',
          boundary.bind(pvpSocketSchemas.room, matchId => this.handleMatchLeave(socket, matchId), {
            serial: true,
          })
        )
        socket.on(
          'match:ready',
          boundary.bind(
            pvpSocketSchemas.matchId,
            matchId => this.handleMatchReady(socket, matchId),
            { serial: true, room: id => id, minIntervalMs: 500 }
          )
        )

        // Submission events
        socket.on(
          'submission:answer',
          boundary.bind(
            pvpSocketSchemas.answer,
            payload => this.handleSubmitAnswer(socket, payload),
            { room: value => value.matchId, group: 'submission' }
          )
        )
        socket.on(
          'submission:code',
          boundary.bind(pvpSocketSchemas.code, payload => this.handleSubmitCode(socket, payload), {
            room: value => value.matchId,
            group: 'submission',
          })
        )

        // Reaction events
        socket.on(
          'reaction:send',
          boundary.bind(
            pvpSocketSchemas.reaction,
            payload => this.handleSendReaction(socket, payload),
            { room: value => value.matchId, minIntervalMs: 750 }
          )
        )

        // Typing indicators
        socket.on(
          'typing:start',
          boundary.bind(
            pvpSocketSchemas.matchId,
            matchId => this.handleTypingStart(socket, matchId),
            { room: id => id, minIntervalMs: 300 }
          )
        )
        socket.on(
          'typing:stop',
          boundary.bind(
            pvpSocketSchemas.matchId,
            matchId => this.handleTypingStop(socket, matchId),
            { room: id => id, minIntervalMs: 300 }
          )
        )

        // Disconnect
        socket.on('disconnect', () => {
          boundary.close()
          void this.handleDisconnect(socket).catch(error =>
            logger.error('PvP disconnect failed', error)
          )
        })
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
      if (socket.disconnected || this.stopping) return

      if (socket.data.matchId && socket.data.matchId !== matchId) {
        await this.handleMatchLeave(socket, socket.data.matchId)
        if (socket.data.matchId) return
      }
      // Reconnects must pass the same ended/forfeited guards as REST joins.
      const participant = await pvpService.joinMatch(matchId, userId)
      if (socket.disconnected) {
        socket.data.matchId = matchId
        await this.handleDisconnect(socket)
        socket.data.matchId = undefined
        return
      }

      // Join socket room
      await socket.join(matchId)
      socket.data.matchId = matchId
      this.io.to(matchId).emit('participant:joined', participant)

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

        // If match was paused, unpause and restart the question timer
        if (
          this.pausedMatches.has(matchId) &&
          match.participants.every(player => player.is_connected || player.left_at)
        ) {
          this.pausedMatches.delete(matchId)
          this.io.to(matchId).emit('match:resumed', {
            reconnectedUserId: userId,
            displayName: reconProfile?.display_name || 'Người chơi',
          })
          await this.startQuestion(matchId)
        }
      }

      // Restore the current round privately on reload/reconnect, without reopening its clock.
      if (match.status === 'in_progress' && !this.pausedMatches.has(matchId)) {
        const startedAt = this.questionStartTimes.get(matchId)
        if (startedAt !== undefined) {
          const question = await pvpService.getCurrentQuestion(matchId)
          if (question.id !== match.question_ids[match.current_question_index]) return
          const { data: submission, error: snapshotError } = await supabaseAdmin
            .from('pvp_submissions')
            .select(
              'id,match_id,user_id,question_id,submission_type,is_correct,points_earned,time_taken,submission_rank,submitted_at'
            )
            .eq('match_id', matchId)
            .eq('user_id', userId)
            .eq('question_id', question.id)
            .maybeSingle()
          if (snapshotError) throw snapshotError
          socket.emit('match:question_changed', {
            match,
            question,
            submission: submission || undefined,
            timeRemaining: Math.max(
              0,
              match.time_per_question - Math.floor((Date.now() - startedAt) / 1000)
            ),
          })
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
      const canonicalId = socket.data.matchId
      if (!canonicalId) return
      const match = await pvpService.getMatch(matchId)
      if (match.id !== canonicalId) throw new Error('Bạn không thuộc phòng PvP này')
      await socket.leave(canonicalId)
      await this.handleDisconnect(socket)
      socket.data.matchId = undefined
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
      if (socket.data.matchId !== matchId) throw new Error('Bạn không thuộc phòng PvP này')
      const started = await pvpService.markReady(matchId, userId)

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

      // Persist the phase using the database clock before showing the question.
      const phase = await pvpService.setQuestionPhase(matchId, match.current_question_index, true)
      if (!phase?.changed) return
      this.questionStartTimes.set(matchId, Date.parse(phase.started_at))

      // 2. Schedule timer FIRST to ensure the match progresses even if emission fails
      await this.clearQuestionTimer(matchId)
      const timer = this.schedule(async () => {
        await this.endQuestion(matchId, match.current_question_index)
      }, delayMs)
      this.matchTimers.set(matchId, timer)

      // 3. Emit question changed event
      this.io.to(matchId).emit('match:question_changed', {
        match,
        question,
        timeRemaining: match.time_per_question,
      })

      logger.info(
        `[startQuestion] Question ${match.current_question_index + 1} started for match ${matchId} (${delayMs}ms)`
      )
    } catch (error) {
      logger.error('Error starting question:', error)
      this.io.to(matchId).emit('error', { message: 'Không thể mở câu hỏi. Vui lòng thử lại sau.' })
    }
  }

  /**
   * End current question and move to next or complete match
   */
  private async endQuestion(matchId: string, expectedIndex?: number): Promise<void> {
    // Mutex guard: prevent double calls
    const phaseKey = `${matchId}:${expectedIndex ?? 'current'}`
    if (this.endingQuestions.has(phaseKey)) {
      logger.warn(
        `[endQuestion] Already ending question for match ${matchId}, skipping duplicate call`
      )
      return
    }
    this.endingQuestions.add(phaseKey)

    try {
      logger.info(`[endQuestion] Starting for match ${matchId}`)

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
        logger.warn(
          `[endQuestion] Match ${matchId} is not in a state to end question: ${match.status}. Check if match was already completed or cancelled.`
        )
        return
      }

      if (expectedIndex !== undefined && match.current_question_index !== expectedIndex) return
      const phase = await pvpService.setQuestionPhase(matchId, match.current_question_index, false)
      if (!phase?.changed) return
      await this.clearQuestionTimer(matchId)
      this.questionStartTimes.delete(matchId)

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
        this.schedule(async () => {
          try {
            logger.info(`[cooldown] Transitioning to question ${nextIndex} for match ${matchId}`)
            const { data: advanced, error: advanceError } = await supabaseAdmin
              .from('pvp_matches')
              .update({ current_question_index: nextIndex })
              .eq('id', matchId)
              .eq('current_question_index', match.current_question_index)
              .eq('status', 'in_progress')
              .select('id')
              .maybeSingle()
            if (advanceError) throw advanceError
            if (!advanced) return
            await this.startQuestion(matchId)
          } catch (e) {
            logger.error('[cooldown] Error transitioning to next question:', e)
            this.io
              .to(matchId)
              .emit('error', { message: 'Không thể chuyển câu hỏi. Vui lòng thử lại sau.' })
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
        this.schedule(async () => {
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
      try {
        this.io
          .to(matchId)
          .emit('error', { message: 'Không thể lưu trạng thái vòng đấu. Vui lòng thử lại sau.' })
      } catch {
        // Ignore errors if socket channel is already destroyed
      }
    } finally {
      // Release mutex after a short delay to cover the cooldown scheduling
      this.schedule(() => {
        this.endingQuestions.delete(phaseKey)
      }, 1000)
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
  private async completeMatch(matchId: string, forfeitActor?: string): Promise<void> {
    try {
      const outcome = await pvpService.finishMatch(matchId, forfeitActor)
      if (!outcome.changed && !outcome.forfeited) return
      const match = await pvpService.getMatch(matchId)
      if (outcome.forfeited) {
        observability.trackPvPEvent('forfeit', matchId, forfeitActor)
        this.io.to(matchId).emit('match:forfeit', {
          forfeitUserId: forfeitActor!,
          displayName:
            match.participants.find(p => p.user_id === forfeitActor)?.display_name || 'Người chơi',
          reason: 'disconnect_timeout',
        })
      }
      if (!outcome.changed) {
        if (match.participants.every(p => p.is_connected || p.left_at)) {
          this.pausedMatches.delete(matchId)
          this.io
            .to(matchId)
            .emit('match:resumed', { reconnectedUserId: forfeitActor!, displayName: 'Người chơi' })
          await this.startQuestion(matchId)
        }
        this.io.to(matchId).emit('match:updated', { match })
        return
      }
      await this.clearQuestionTimer(matchId)
      this.questionStartTimes.delete(matchId)
      this.pausedMatches.delete(matchId)
      for (const [key, timer] of this.disconnectTimers) {
        if (key.startsWith(matchId + ':')) {
          clearTimeout(timer)
          this.disconnectTimers.delete(key)
        }
      }
      const finalScores = match.participants.map(p => ({
        userId: p.user_id,
        displayName: p.display_name || 'Anonymous',
        score: p.total_score,
        rank: p.final_rank || 1,
      }))
      this.io.to(matchId).emit('match:completed', { match, finalScores })
      observability.trackPvPEvent('complete', matchId, undefined, { finalScores })
    } catch (error) {
      logger.error('Error completing match:', error)
      this.io
        .to(matchId)
        .emit('error', { message: 'Không thể lưu kết quả trận đấu. Vui lòng thử lại sau.' })
    }
  }

  /**
   * Handle answer submission
   */
  private async notifySubmission(
    socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
    submission: PvPSubmission,
    answerFeedback: boolean
  ): Promise<void> {
    const {
      id,
      match_id,
      user_id,
      question_id,
      submission_type,
      is_correct,
      points_earned,
      time_taken,
      submission_rank,
      submitted_at,
    } = submission
    const safe = {
      id,
      match_id,
      user_id,
      question_id,
      submission_type,
      is_correct,
      points_earned,
      time_taken,
      submission_rank,
      submitted_at,
    }
    const ranked = {
      userId: user_id,
      questionId: question_id,
      rank: submission_rank || 1,
      pointsEarned: points_earned,
    }
    if (submission._replayed) {
      // Acknowledge the sender again without rebroadcasting or scheduling another transition.
      socket.emit('submission:received', safe)
      socket.emit('submission:ranked', ranked)
    } else {
      this.io.to(match_id).emit('submission:received', safe)
      this.io.to(match_id).emit('submission:ranked', ranked)
    }
    if (answerFeedback)
      socket.emit('submission:feedback', {
        questionId: question_id,
        correctAnswerId: submission._correct_answer_id,
      })
    if (submission._replayed) return
    const participantCount = submission._participant_count || 0
    if (participantCount > 0 && (submission._submission_count || 0) >= participantCount) {
      // Keep the deadline timer until endQuestion verifies the expected round.
      // A delayed response from an old round must not clear the next round's timer.
      this.schedule(() => this.endQuestion(match_id, submission._question_index), 2000)
    }
  }

  private async handleSubmitAnswer(
    socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
    payload: { matchId: string; questionId: string; answer: string; timeTaken?: number }
  ): Promise<void> {
    try {
      const submission = await pvpService.submitAnswer(
        payload.matchId,
        socket.data.userId!,
        payload.questionId,
        payload.answer,
        payload.timeTaken || 0
      )
      await this.notifySubmission(socket, submission, true)
    } catch (error: any) {
      logger.error('Error submitting answer:', error)
      socket.emit('error', { message: error.message || 'Failed to submit answer' })
    }
  }

  private async handleSubmitCode(
    socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
    payload: { matchId: string; questionId: string; code: string; timeTaken?: number }
  ): Promise<void> {
    try {
      const submission = await pvpService.submitCode(
        payload.matchId,
        socket.data.userId!,
        payload.questionId,
        payload.code,
        payload.timeTaken || 0
      )
      await this.notifySubmission(socket, submission, false)
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
      await this.assertParticipant(payload.matchId, userId)

      if (payload.targetUserId) {
        await this.assertParticipant(payload.matchId, payload.targetUserId)
      }

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
    await this.assertParticipant(matchId, userId)

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
  private async handleTypingStop(
    socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
    matchId: string
  ): Promise<void> {
    const userId = socket.data.userId!
    await this.assertParticipant(matchId, userId)

    // Broadcast to others in match
    socket.to(matchId).emit('typing:user_stopped', { userId })
  }

  private async assertParticipant(matchId: string, userId: string): Promise<void> {
    const { data, error } = await supabaseAdmin
      .from('pvp_participants')
      .select('user_id')
      .eq('match_id', matchId)
      .eq('user_id', userId)
      .maybeSingle()

    if (error || !data) {
      throw new Error('Bạn không thuộc phòng PvP này')
    }
  }

  /**
   * Handle disconnect — pause the match and give the user 30s to reconnect.
   * If they don't reconnect in time, they automatically forfeit (lose).
   */
  private async handleDisconnect(
    socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
  ): Promise<void> {
    if (this.stopping) return
    const userId = socket.data.userId
    const matchId = socket.data.matchId

    logger.info(`User disconnected: ${userId} (${socket.id})`)

    if (!matchId || !userId) return

    observability.trackPvPEvent('disconnect', matchId, userId)

    // A second tab still in this room keeps the participant connected.
    const peers = await this.io.in(matchId).fetchSockets()
    if (peers.some(peer => peer.id !== socket.id && peer.data.userId === userId)) return
    const outcome = await pvpService.disconnectMatch(matchId, userId)
    if (!outcome.changed) return
    this.io.to(matchId).emit('participant:disconnected', userId)
    if (outcome.status === 'waiting') {
      this.io.to(matchId).emit('participant:left', { user_id: userId } as any)
      return
    }
    if (outcome.status !== 'in_progress') return

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
    const graceTimer = this.schedule(async () => {
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

      // Recheck connection and commit ranks/status/stats together before notifying players.
      await this.completeMatch(matchId, userId)
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
