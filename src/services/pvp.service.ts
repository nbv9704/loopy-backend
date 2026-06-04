/**
 * PvP Service
 * Core business logic for PvP matches
 */

import { supabaseAdmin } from '../db/supabase'
import { logger } from '../utils/logger'
import { errors } from '../middleware/errorHandler'
import { testRunnerService } from './test-runner.service'
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
  async createMatch(
    config: {
      mode: '1v1' | 'battle_royale'
      language_id?: string
      difficulty?: 'easy' | 'medium' | 'hard'
      max_players: number
      time_per_question: number
      question_count: number
    },
    // userId?: string // Unused for now as we removed progress-based filtering
  ): Promise<PvPMatch> {
    try {
      // Select random questions based on criteria
      let query = supabaseAdmin
        .from('practice_questions')
        .select('id, practice_sets!inner(language_id, difficulty, visibility)')
        .eq('practice_sets.visibility', 'official')
        .in('type', ['multiple_choice', 'true_false']) // Only take types suitable for PvP

      if (config.language_id) {
        query = query.eq('practice_sets.language_id', config.language_id)
      }

      if (config.difficulty) {
        query = query.eq('practice_sets.difficulty', config.difficulty)
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
          difficulty: config.difficulty || 'medium',
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
    const userIds = (participants || []).map((p: { user_id: string }) => p.user_id)
    const { data: profiles } = await supabaseAdmin
      .from('user_profiles')
      .select('id, display_name, avatar_url')
      .in('id', userIds)

    // Create a map of user profiles
    const profileMap = new Map(profiles?.map(p => [p.id, p]) || [])

    // Flatten user info
    const formattedParticipants = (participants || []).map((p: PvPParticipant) => {
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

    // 1. Check if user already joined
    const { data: existing } = await supabaseAdmin
      .from('pvp_participants')
      .select('*')
      .eq('match_id', matchId)
      .eq('user_id', userId)
      .maybeSingle()

    if (existing) {
      // Allow re-joining even if in_progress or starting
      // But block if already completed or cancelled
      if (match.status === 'completed' || match.status === 'cancelled') {
        throw errors.validationError('Match has already ended')
      }

      // Mark as connected if they were disconnected
      if (!existing.is_connected) {
        await supabaseAdmin
          .from('pvp_participants')
          .update({ is_connected: true })
          .eq('match_id', matchId)
          .eq('user_id', userId)
      }
      return { ...existing, is_connected: true } as PvPParticipant
    }

    // 2. For NEW players, they can only join if match is 'waiting'
    if (match.status !== 'waiting') {
      throw errors.validationError('Match has already started or ended')
    }

    // 2. Check if match is full
    const participantCount = (match as any).pvp_participants?.[0]?.count || 0
    if (participantCount >= match.max_players) {
      throw errors.validationError('Match is full')
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
      .from('practice_questions')
      .select('*, practice_sets!inner(language_id, difficulty)')
      .eq('id', questionId)
      .single()

    if (questionError || !question) {
      throw errors.notFound('Question')
    }

    // Map practice_questions to PvPQuestion format
    const mapped: any = {
      id: question.id,
      type: question.type,
      language_id: question.practice_sets?.language_id || null,
      difficulty: question.practice_sets?.difficulty || 'medium',
      time_limit: 60, // Default for practice_questions
      points: question.points || 10,
      tags: [], // Tags not supported on practice_questions directly
      created_at: question.created_at,
      updated_at: question.updated_at,
    }

    if (question.type === 'code_challenge') {
      mapped.problem_title = question.title
      mapped.problem_description = question.prompt
      mapped.starterCode = question.starter_code
      // Hide solution
      mapped.solution_code = undefined
    } else {
      mapped.question_text = question.prompt
      
      // Convert array of strings to array of {id, text} objects for multiple choice
      if (Array.isArray(question.options) && typeof question.options[0] === 'string') {
        const optionIds = ['A', 'B', 'C', 'D', 'E', 'F']
        mapped.options = question.options.map((opt: string, idx: number) => ({
          id: optionIds[idx] || String(idx),
          text: opt
        }))
      } else {
        mapped.options = question.options
      }
      
      // Hide answer
      mapped.correct_answer = undefined
    }

    return mapped as PvPQuestion
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
      .from('practice_questions')
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

    let processedAnswer = selectedAnswer
    
    // For multiple choice, map "A", "B" back to the actual option text
    if (question.type === 'multiple_choice' && Array.isArray(question.options) && typeof question.options[0] === 'string') {
      const optionIds = ['A', 'B', 'C', 'D', 'E', 'F']
      const index = optionIds.indexOf(selectedAnswer)
      if (index !== -1 && question.options[index]) {
        processedAnswer = question.options[index]
      }
    }

    // Compare case-insensitively
    const isCorrect = String(question.correct_answer).trim().toLowerCase() === String(processedAnswer).trim().toLowerCase()

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

    // Map the actual correct_answer string back to "A", "B", "C", "D" or "true", "false"
    let correctAnswerId = String(question.correct_answer)
    if (question.type === 'multiple_choice' && Array.isArray(question.options) && typeof question.options[0] === 'string') {
      const optionIds = ['A', 'B', 'C', 'D', 'E', 'F']
      const correctIndex = question.options.findIndex((opt: unknown) => String(opt).trim().toLowerCase() === String(question.correct_answer).trim().toLowerCase())
      if (correctIndex !== -1) {
        correctAnswerId = optionIds[correctIndex]
      }
    } else if (question.type === 'true_false') {
      correctAnswerId = String(question.correct_answer).toLowerCase()
    }

    return {
      ...submission,
      _correct_answer_id: correctAnswerId,
    } as any
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
      .from('practice_questions')
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
    const languageId = match.language_id || 'javascript'
    const testResults = await this.runTestCases(code, question.test_cases || [], languageId)
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
    testCases: Array<{ input: unknown[]; expected: unknown }>,
    language: string
  ): Promise<Array<{ passed: boolean; input: unknown[]; expected: unknown; actual: unknown }>> {
    // Map to TestCase format for testRunnerService
    const mappedTestCases = testCases.map((tc, idx) => ({
      id: `tc-${idx}`,
      exerciseId: 'pvp-match',
      input: tc.input,
      expectedOutput: tc.expected,
      weight: 10, // All tests weighted equally in PvP for now
      timeout: 3000,
      description: `Test Case ${idx + 1}`,
      isHidden: false,
      orderIndex: idx,
    }))

    const testRunResult = await testRunnerService.runTests(code, mappedTestCases, language)

    return testRunResult.results.map(r => ({
      passed: r.passed,
      input: mappedTestCases.find(tc => tc.id === r.testCaseId)?.input as unknown[],
      expected: r.expectedOutput,
      actual: r.actualOutput,
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
    const userIds = (data || []).map((entry: { user_id: string }) => entry.user_id)
    const { data: profiles } = await supabaseAdmin
      .from('user_profiles')
      .select('id, display_name, avatar_url')
      .in('id', userIds)

    // Create a map of user profiles
    const profileMap = new Map(profiles?.map(p => [p.id, p]) || [])

    return (data || []).map((entry: PvPUserStats) => {
      const profile = profileMap.get(entry.user_id)
      return {
        ...entry,
        display_name: profile?.display_name || 'Anonymous',
        avatar_url: profile?.avatar_url,
      }
    })
  },
}
