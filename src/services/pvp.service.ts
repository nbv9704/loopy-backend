/**
 * PvP Service
 * Core business logic for PvP matches
 */

import { supabaseAdmin } from '../db/supabase'
import { logger } from '../utils/logger'
import { errors } from '../middleware/errorHandler'
import { testRunnerService } from './test-runner.service'
import { pvpTransactions } from './pvp/transactions'
import { getPvPEligibility } from './pvp/eligibility'
import type {
  PvPMatch,
  PvPQuestion,
  PvPParticipant,
  PvPSubmission,
  PvPUserStats,
  MatchStatus,
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
  getEligibility: getPvPEligibility,
  findMatch: pvpTransactions.matchmake,
  async assertEligible(userId: string): Promise<void> {
    if (!(await getPvPEligibility(userId)).eligible) throw errors.forbidden()
  },
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
    }
    // userId?: string // Unused for now as we removed progress-based filtering
  ): Promise<PvPMatch> {
    try {
      // Select random questions based on criteria
      let query = supabaseAdmin
        .from('practice_questions')
        .select('id, practice_sets!inner(language_id, difficulty, visibility)')
        .eq('practice_sets.visibility', 'official')
        .eq('practice_sets.status', 'published')
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

    if (matchError && matchError.code !== 'PGRST116')
      throw errors.databaseError('Không tải được phòng PvP. Vui lòng thử lại.')
    if (!match) {
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
    const participant = await pvpTransactions.join(matchId, userId)
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('display_name, avatar_url')
      .eq('id', userId)
      .single()
    return { ...participant, display_name: profile?.display_name, avatar_url: profile?.avatar_url }
  },

  markReady: pvpTransactions.ready,
  disconnectMatch: pvpTransactions.disconnect,
  finishMatch: pvpTransactions.finish,
  setQuestionPhase: pvpTransactions.setPhase,

  /**
   * Get current question for match
   */
  async getCurrentQuestion(matchId: string): Promise<PvPQuestion> {
    const { data: match, error: matchError } = await supabaseAdmin
      .from('pvp_matches')
      .select('question_ids, current_question_index')
      .eq('id', matchId)
      .single()

    if (matchError && matchError.code !== 'PGRST116')
      throw errors.databaseError('Không tải được vòng đấu. Vui lòng thử lại.')
    if (!match) {
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

    if (questionError && questionError.code !== 'PGRST116')
      throw errors.databaseError('Không tải được câu hỏi PvP. Vui lòng thử lại.')
    if (!question) {
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

      // Convert array of strings to UI option objects.
      // Multiple choice uses A/B/C ids, but true_false must keep true/false ids
      // because the answer checker compares against the canonical boolean strings.
      if (
        question.type === 'multiple_choice' &&
        Array.isArray(question.options) &&
        typeof question.options[0] === 'string'
      ) {
        const optionIds = ['A', 'B', 'C', 'D', 'E', 'F']
        mapped.options = question.options.map((opt: string, idx: number) => ({
          id: optionIds[idx] || String(idx),
          text: opt,
        }))
      } else if (question.type === 'true_false') {
        mapped.options = ['true', 'false'].map(value => ({
          id: value,
          text: value === 'true' ? 'True' : 'False',
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
    _timeTaken: number
  ): Promise<PvPSubmission> {
    if (
      typeof selectedAnswer !== 'string' ||
      !selectedAnswer.trim() ||
      selectedAnswer.length > 5000
    ) {
      throw errors.validationError('Answer is required and must be at most 5000 characters')
    }
    return pvpTransactions.submit(matchId, userId, questionId, {
      submission_type: 'multiple_choice',
      selected_answer: selectedAnswer,
    })
  },

  /** Legacy code challenges are not currently selected from the answer-based Practice bank. */
  async submitCode(
    matchId: string,
    userId: string,
    questionId: string,
    code: string,
    _timeTaken: number
  ): Promise<PvPSubmission> {
    if (typeof code !== 'string' || !code.trim() || code.length > 10000)
      throw errors.validationError('Invalid code')
    const { data: question, error: questionError } = await supabaseAdmin
      .from('practice_questions')
      .select('*')
      .eq('id', questionId)
      .single()
    if (questionError || !question) throw errors.notFound('Question')
    if (
      question.type !== 'code_challenge' ||
      !Array.isArray(question.test_cases) ||
      question.test_cases.length === 0
    ) {
      throw errors.validationError('This question does not accept code or has no tests')
    }
    const { data: participant, error: participantError } = await supabaseAdmin
      .from('pvp_participants')
      .select('user_id')
      .eq('match_id', matchId)
      .eq('user_id', userId)
      .maybeSingle()
    if (participantError || !participant) throw errors.forbidden()
    const { data: existing } = await supabaseAdmin
      .from('pvp_submissions')
      .select('id')
      .eq('match_id', matchId)
      .eq('user_id', userId)
      .eq('question_id', questionId)
      .maybeSingle()
    if (existing)
      return pvpTransactions.submit(matchId, userId, questionId, {
        submission_type: 'code_challenge',
        code,
      })
    const { data: match, error: matchError } = await supabaseAdmin
      .from('pvp_matches')
      .select('*')
      .eq('id', matchId)
      .single()
    if (
      matchError ||
      !match ||
      match.status !== 'in_progress' ||
      match.question_ids[match.current_question_index] !== questionId
    ) {
      throw errors.validationError('Match or question is no longer active')
    }
    const testResults = await this.runTestCases(
      code,
      question.test_cases,
      match.language_id || 'javascript'
    )
    // The transaction rechecks membership/current question/deadline after potentially slow execution.
    return pvpTransactions.submit(matchId, userId, questionId, {
      submission_type: 'code_challenge',
      code,
      test_results: testResults,
    })
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
