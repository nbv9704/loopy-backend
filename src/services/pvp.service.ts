/**
 * PvP Service
 * Core business logic for PvP matches
 */

import { supabaseAdmin } from '../db/supabase'
import { logger } from '../utils/logger'
import { errors } from '../middleware/errorHandler'
import type {
  PvPMatch,
  PvPQuestion,
  PvPParticipant,
  PvPSubmission,
  PvPUserStats,
  MatchStatus,
  QuestionType,
} from '../types/pvp.types'

// Helper to generate 6-character alphanumeric room code
const generateRoomCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export const pvpService = {
  /**
   * Create a new PvP match
   */
  async createMatch(config: {
    mode: '1v1' | 'battle_royale'
    language_id?: string
    difficulty?: 'easy' | 'medium' | 'hard'
    max_players: number
    time_per_question: number
    question_count: number
  }): Promise<PvPMatch> {
    try {
      // Select random questions based on criteria
      let query = supabaseAdmin.from('pvp_questions').select('id')

      if (config.language_id) {
        query = query.eq('language_id', config.language_id)
      }

      if (config.difficulty) {
        query = query.eq('difficulty', config.difficulty)
      }

      // Fetch MORE questions than needed to ensure we have enough for random selection
      const { data: questions, error: questionsError } = await query

      if (questionsError) {
        logger.error('Error fetching questions:', questionsError)
        throw errors.databaseError('Failed to fetch questions', questionsError)
      }

      if (!questions || questions.length === 0) {
        logger.error('No questions found with criteria:', config)
        throw errors.notFound('No questions available for the selected criteria')
      }

      if (questions.length < config.question_count) {
        logger.warn(
          `Only ${questions.length} questions available, but ${config.question_count} requested`
        )
      }

      logger.info(`Found ${questions.length} questions, selecting ${config.question_count}`)

      // Fisher-Yates shuffle to ensure no duplicates
      const shuffled = [...questions]
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
      }

      // Take only the number of questions needed (no duplicates possible)
      const selectedQuestions = shuffled.slice(0, config.question_count)
      const questionIds = selectedQuestions.map(q => q.id)

      logger.info('Creating match with question IDs:', questionIds)

      // Generate room code
      let roomCode = generateRoomCode()
      let isUnique = false
      let attempts = 0

      while (!isUnique && attempts < 5) {
        const { data: existing } = await supabaseAdmin
          .from('pvp_matches')
          .select('id')
          .eq('room_code', roomCode)
          .single()

        if (!existing) {
          isUnique = true
        } else {
          roomCode = generateRoomCode()
          attempts++
        }
      }

      // Create match
      const { data: match, error: matchError } = await supabaseAdmin
        .from('pvp_matches')
        .insert({
          mode: config.mode,
          language_id: config.language_id || null,
          max_players: config.max_players,
          time_per_question: config.time_per_question,
          question_ids: questionIds,
          current_question_index: 0,
          status: 'waiting' as MatchStatus,
          room_code: roomCode,
        })
        .select()
        .single()

      if (matchError || !match) {
        logger.error('Error creating match:', matchError)
        throw errors.databaseError('Failed to create match', matchError)
      }

      logger.info('Match created successfully:', match.id)
      return match as PvPMatch
    } catch (error) {
      logger.error('createMatch error:', error)
      throw error
    }
  },

  /**
   * Get match by ID or Room Code with participants
   */
  async getMatch(matchIdOrCode: string): Promise<PvPMatch & { participants: PvPParticipant[] }> {
    const isRoomCode = matchIdOrCode.length === 6

    let query = supabaseAdmin.from('pvp_matches').select('*')
    if (isRoomCode) {
      query = query.eq('room_code', matchIdOrCode.toUpperCase())
    } else {
      query = query.eq('id', matchIdOrCode)
    }

    const { data: match, error: matchError } = await query.single()

    if (matchError || !match) {
      throw errors.notFound('Match')
    }

    const matchId = match.id

    // Get participants with user info
    const { data: participants, error: participantsError } = await supabaseAdmin
      .from('pvp_participants')
      .select('*')
      .eq('match_id', matchId)

    if (participantsError) {
      throw errors.databaseError('Failed to fetch participants', participantsError)
    }

    // Get user profiles for all participants
    const userIds = (participants || []).map((p: any) => p.user_id)
    const { data: profiles } = await supabaseAdmin
      .from('user_profiles')
      .select('id, display_name, avatar_url')
      .in('id', userIds)

    // Create a map of user profiles
    const profileMap = new Map(profiles?.map(p => [p.id, p]) || [])

    // Flatten user info
    const formattedParticipants = (participants || []).map((p: any) => {
      const profile = profileMap.get(p.user_id)
      return {
        ...p,
        display_name: profile?.display_name,
        avatar_url: profile?.avatar_url,
      }
    })

    return {
      ...(match as PvPMatch),
      participants: formattedParticipants,
    }
  },

  /**
   * Join a match
   */
  async joinMatch(matchId: string, userId: string): Promise<PvPParticipant> {
    // Check if match exists and is joinable
    const { data: match, error: matchError } = await supabaseAdmin
      .from('pvp_matches')
      .select('*, pvp_participants(count)')
      .eq('id', matchId)
      .single()

    if (matchError || !match) {
      throw errors.notFound('Match')
    }

    if (match.status !== 'waiting') {
      throw errors.validationError('Match has already started or ended')
    }

    const participantCount = (match as any).pvp_participants?.[0]?.count || 0
    if (participantCount >= match.max_players) {
      throw errors.validationError('Match is full')
    }

    // Check if user already joined
    const { data: existing } = await supabaseAdmin
      .from('pvp_participants')
      .select('*')
      .eq('match_id', matchId)
      .eq('user_id', userId)
      .single()

    if (existing) {
      return existing as PvPParticipant
    }

    // Join match
    const { data: participant, error: participantError } = await supabaseAdmin
      .from('pvp_participants')
      .insert({
        match_id: matchId,
        user_id: userId,
        is_ready: false,
        is_connected: true,
      })
      .select('*')
      .single()

    if (participantError || !participant) {
      throw errors.databaseError('Failed to join match', participantError)
    }

    // Get user profile separately
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('display_name, avatar_url')
      .eq('id', userId)
      .single()

    return {
      ...(participant as PvPParticipant),
      display_name: profile?.display_name,
      avatar_url: profile?.avatar_url,
    }
  },

  /**
   * Mark participant as ready
   */
  async markReady(matchId: string, userId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('pvp_participants')
      .update({ is_ready: true })
      .eq('match_id', matchId)
      .eq('user_id', userId)

    if (error) {
      throw errors.databaseError('Failed to mark ready', error)
    }
  },

  /**
   * Check if all participants are ready and start match
   */
  async checkAndStartMatch(matchId: string): Promise<boolean> {
    const { data: participants, error } = await supabaseAdmin
      .from('pvp_participants')
      .select('is_ready')
      .eq('match_id', matchId)

    if (error || !participants) {
      return false
    }

    const allReady = participants.every(p => p.is_ready)
    if (!allReady) {
      return false
    }

    // Start match
    const { error: updateError } = await supabaseAdmin
      .from('pvp_matches')
      .update({
        status: 'in_progress' as MatchStatus,
        started_at: new Date().toISOString(),
      })
      .eq('id', matchId)

    if (updateError) {
      throw errors.databaseError('Failed to start match', updateError)
    }

    return true
  },

  /**
   * Get current question for match
   */
  async getCurrentQuestion(matchId: string): Promise<PvPQuestion> {
    const { data: match, error: matchError } = await supabaseAdmin
      .from('pvp_matches')
      .select('question_ids, current_question_index')
      .eq('id', matchId)
      .single()

    if (matchError || !match) {
      throw errors.notFound('Match')
    }

    const questionId = match.question_ids[match.current_question_index]
    if (!questionId) {
      throw errors.notFound('Question')
    }

    const { data: question, error: questionError } = await supabaseAdmin
      .from('pvp_questions')
      .select('*')
      .eq('id', questionId)
      .single()

    if (questionError || !question) {
      throw errors.notFound('Question')
    }

    // Hide solution for code challenges
    const sanitized = { ...question }
    if (sanitized.type === 'code_challenge') {
      sanitized.solution_code = undefined
    }
    if (sanitized.type === 'multiple_choice' || sanitized.type === 'true_false') {
      sanitized.correct_answer = undefined
      // NOTE: Options are NOT shuffled here - each client will shuffle independently
      // This ensures different players see different option orders for fairness
    }

    return sanitized as PvPQuestion
  },

  /**
   * Submit answer for multiple choice question
   */
  async submitAnswer(
    matchId: string,
    userId: string,
    questionId: string,
    selectedAnswer: string,
    timeTaken: number
  ): Promise<PvPSubmission> {
    // Get question to check answer
    const { data: question, error: questionError } = await supabaseAdmin
      .from('pvp_questions')
      .select('*')
      .eq('id', questionId)
      .single()

    if (questionError || !question) {
      throw errors.notFound('Question')
    }

    // Get match to verify this is the current active question
    const { data: match } = await supabaseAdmin
      .from('pvp_matches')
      .select('*')
      .eq('id', matchId)
      .single()

    if (!match || match.status !== 'in_progress') {
      throw errors.validationError('Match is not active')
    }

    const activeQuestionId = match.question_ids[match.current_question_index]
    if (questionId !== activeQuestionId) {
      throw errors.validationError('Time is up or invalid question')
    }

    const isCorrect = question.correct_answer === selectedAnswer

    // Check if already submitted
    const { data: existing } = await supabaseAdmin
      .from('pvp_submissions')
      .select('*')
      .eq('match_id', matchId)
      .eq('user_id', userId)
      .eq('question_id', questionId)
      .single()

    if (existing) {
      throw errors.validationError('Already submitted answer for this question')
    }

    // Check if this is the first correct submission (for speed bonus)
    const { data: previousSubmissions } = await supabaseAdmin
      .from('pvp_submissions')
      .select('*')
      .eq('match_id', matchId)
      .eq('question_id', questionId)
      .eq('is_correct', true)
      .order('submitted_at', { ascending: true })

    const isFirstCorrect = isCorrect && (!previousSubmissions || previousSubmissions.length === 0)

    // Calculate points based on question type
    // True/False: 30 points base (easier, 50% chance)
    // Multiple Choice: 50 points base (harder, 25% chance)
    // Speed bonus (first correct): +10 points
    let basePoints = 50 // Default for multiple_choice
    if (question.type === 'true_false') {
      basePoints = 30
    }

    let pointsEarned = 0
    if (isCorrect) {
      pointsEarned = basePoints
      if (isFirstCorrect) {
        pointsEarned += 10 // Speed bonus
      }
    }

    // Create submission
    const { data: submission, error: submissionError } = await supabaseAdmin
      .from('pvp_submissions')
      .insert({
        match_id: matchId,
        user_id: userId,
        question_id: questionId,
        submission_type: 'multiple_choice' as QuestionType,
        selected_answer: selectedAnswer,
        is_correct: isCorrect,
        points_earned: pointsEarned,
        time_taken: timeTaken,
      })
      .select()
      .single()

    if (submissionError || !submission) {
      throw errors.databaseError('Failed to submit answer', submissionError)
    }

    // Update participant score
    await supabaseAdmin.rpc('increment_participant_score', {
      p_match_id: matchId,
      p_user_id: userId,
      p_points: pointsEarned,
      p_is_correct: isCorrect,
    })

    return submission as PvPSubmission
  },

  /**
   * Submit code for code challenge
   */
  async submitCode(
    matchId: string,
    userId: string,
    questionId: string,
    code: string,
    timeTaken: number
  ): Promise<PvPSubmission> {
    // Get question to run tests
    const { data: question, error: questionError } = await supabaseAdmin
      .from('pvp_questions')
      .select('*')
      .eq('id', questionId)
      .single()

    if (questionError || !question) {
      throw errors.notFound('Question')
    }

    // Get match to verify this is the current active question
    const { data: match } = await supabaseAdmin
      .from('pvp_matches')
      .select('*')
      .eq('id', matchId)
      .single()

    if (!match || match.status !== 'in_progress') {
      throw errors.validationError('Match is not active')
    }

    const activeQuestionId = match.question_ids[match.current_question_index]
    if (questionId !== activeQuestionId) {
      throw errors.validationError('Time is up or invalid question')
    }

    // Check if already submitted
    const { data: existing } = await supabaseAdmin
      .from('pvp_submissions')
      .select('*')
      .eq('match_id', matchId)
      .eq('user_id', userId)
      .eq('question_id', questionId)
      .single()

    if (existing) {
      throw errors.validationError('Already submitted code for this question')
    }

    // Run test cases to determine correctness
    const testResults = await this.runTestCases(code, question.test_cases || [])
    const passedCount = testResults.filter(r => r.passed).length
    const totalCount = testResults.length

    // Calculate score based on test case pass rate
    // If no test cases, consider it incorrect (0 points)
    let baseScore = 0
    let isCorrect = false

    if (totalCount > 0) {
      // Score = (passed / total) * 100
      baseScore = Math.round((passedCount / totalCount) * 100)
      isCorrect = passedCount === totalCount // All tests must pass to be correct
    }

    // Check if this is the first submission (for speed bonus)
    const { data: previousSubmissions } = await supabaseAdmin
      .from('pvp_submissions')
      .select('*')
      .eq('match_id', matchId)
      .eq('question_id', questionId)
      .order('submitted_at', { ascending: true })

    const isFirstSubmission = !previousSubmissions || previousSubmissions.length === 0

    // Calculate points
    // Base score: 0-100 points (based on test pass rate)
    // Speed bonus (first submission): +10 points
    let pointsEarned = baseScore
    if (isFirstSubmission) {
      pointsEarned += 10 // Speed bonus
    }

    // Create submission
    const { data: submission, error: submissionError } = await supabaseAdmin
      .from('pvp_submissions')
      .insert({
        match_id: matchId,
        user_id: userId,
        question_id: questionId,
        submission_type: 'code_challenge' as QuestionType,
        code,
        test_results: testResults,
        is_correct: isCorrect,
        points_earned: pointsEarned,
        time_taken: timeTaken,
      })
      .select()
      .single()

    if (submissionError || !submission) {
      throw errors.databaseError('Failed to submit code', submissionError)
    }

    // Update participant score
    await supabaseAdmin.rpc('increment_participant_score', {
      p_match_id: matchId,
      p_user_id: userId,
      p_points: pointsEarned,
      p_is_correct: isCorrect,
    })

    return submission as PvPSubmission
  },

  /**
   * Run test cases for code submission
   */
  async runTestCases(
    code: string,
    testCases: Array<{ input: any[]; expected: any }>
  ): Promise<Array<{ passed: boolean; input: any[]; expected: any; actual: any }>> {
    // TODO: Implement proper sandboxed code execution
    // For now, return mock results
    return testCases.map(tc => ({
      passed: true,
      input: tc.input,
      expected: tc.expected,
      actual: tc.expected,
    }))
  },

  /**
   * Get user stats
   */
  async getUserStats(userId: string): Promise<PvPUserStats> {
    const { data: stats, error } = await supabaseAdmin
      .from('pvp_user_stats')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error || !stats) {
      // Return default stats if not found
      return {
        user_id: userId,
        total_matches: 0,
        matches_won: 0,
        matches_lost: 0,
        total_score: 0,
        total_questions_answered: 0,
        correct_answers: 0,
        current_win_streak: 0,
        longest_win_streak: 0,
        rating: 1000,
        peak_rating: 1000,
        updated_at: new Date().toISOString(),
      }
    }

    return stats as PvPUserStats
  },

  /**
   * Get leaderboard
   */
  async getLeaderboard(
    limit: number = 50,
    sortBy: 'rating' | 'matches_won' | 'accuracy_rate' = 'rating'
  ): Promise<Array<PvPUserStats & { display_name: string; avatar_url: string }>> {
    const { data, error } = await supabaseAdmin
      .from('pvp_user_stats')
      .select('*')
      .order(sortBy, { ascending: false })
      .limit(limit)

    if (error) {
      throw errors.databaseError('Failed to fetch leaderboard', error)
    }

    // Get user profiles for all users in leaderboard
    const userIds = (data || []).map((entry: any) => entry.user_id)
    const { data: profiles } = await supabaseAdmin
      .from('user_profiles')
      .select('id, display_name, avatar_url')
      .in('id', userIds)

    // Create a map of user profiles
    const profileMap = new Map(profiles?.map(p => [p.id, p]) || [])

    return (data || []).map((entry: any) => {
      const profile = profileMap.get(entry.user_id)
      return {
        ...entry,
        display_name: profile?.display_name || 'Anonymous',
        avatar_url: profile?.avatar_url,
      }
    })
  },
}
