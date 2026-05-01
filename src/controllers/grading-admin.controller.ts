/**
 * Grading Admin Controller
 *
 * Handles admin operations: score overrides, test case management, usage stats.
 *
 * @see .kiro/specs/auto-grading-system/design.md
 * Validates Requirements: 12.4, 12.5, 12.6, 13.4, 13.5, 18.5
 */

import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/auth'
import { supabaseAdmin } from '../db/supabase'
import { gradingOrchestratorService } from '../services/grading-orchestrator.service'
import { errors } from '../middleware/errorHandler'
import { logger } from '../utils/logger'

/**
 * PUT /api/admin/submissions/:submissionId/override
 * Override submission scores
 * Requirements: 12.4, 13.4, 13.5
 */
export const overrideScore = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const adminId = req.user!.id
    const { submissionId } = req.params
    const { testScore, aiScore, finalScore, note } = req.body

    // Validate
    if (!note || typeof note !== 'string') {
      throw errors.validationError({ field: 'note', message: 'Override note is required' })
    }

    if (testScore !== undefined && (testScore < 0 || testScore > 100)) {
      throw errors.validationError({ field: 'testScore', message: 'testScore must be 0-100' })
    }

    if (aiScore !== undefined && (aiScore < 0 || aiScore > 100)) {
      throw errors.validationError({ field: 'aiScore', message: 'aiScore must be 0-100' })
    }

    if (finalScore !== undefined && (finalScore < 0 || finalScore > 100)) {
      throw errors.validationError({
        field: 'finalScore',
        message: 'finalScore must be 0-100',
      })
    }

    const result = await gradingOrchestratorService.overrideScore(
      submissionId,
      { testScore, aiScore, finalScore, note },
      adminId
    )

    res.json({
      success: true,
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * GET /api/admin/exercises/:exerciseId/test-cases
 * Get all test cases including hidden ones
 * Requirements: 12.5, 13.4
 */
export const getTestCases = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { exerciseId } = req.params

    const { data: testCases, error } = await supabaseAdmin
      .from('test_cases')
      .select('*')
      .eq('exercise_id', exerciseId)
      .order('order_index', { ascending: true })

    if (error) {
      throw error
    }

    res.json({
      success: true,
      data: {
        testCases: (testCases || []).map((tc: any) => ({
          id: tc.id,
          exerciseId: tc.exercise_id,
          input: tc.input,
          expectedOutput: tc.expected_output,
          weight: tc.weight,
          timeout: tc.timeout,
          description: tc.description,
          isHidden: tc.is_hidden,
          orderIndex: tc.order_index,
          createdAt: tc.created_at,
          updatedAt: tc.updated_at,
        })),
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * POST /api/admin/exercises/:exerciseId/test-cases
 * Create a new test case
 * Requirements: 12.6, 13.4
 */
export const createTestCase = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { exerciseId } = req.params
    const {
      input,
      expectedOutput,
      weight = 10,
      timeout = 1000,
      description,
      isHidden = false,
      orderIndex = 0,
    } = req.body

    // Validate (Requirements 1.6, 1.7)
    if (!description || typeof description !== 'string') {
      throw errors.validationError({ field: 'description', message: 'Description is required' })
    }

    if (typeof weight !== 'number' || weight < 0 || weight > 100) {
      throw errors.validationError({
        field: 'weight',
        message: 'Weight must be between 0 and 100',
      })
    }

    if (typeof timeout !== 'number' || timeout <= 0 || !Number.isInteger(timeout)) {
      throw errors.validationError({
        field: 'timeout',
        message: 'Timeout must be a positive integer',
      })
    }

    if (input === undefined) {
      throw errors.validationError({ field: 'input', message: 'Input is required' })
    }

    if (expectedOutput === undefined) {
      throw errors.validationError({
        field: 'expectedOutput',
        message: 'Expected output is required',
      })
    }

    // Verify exercise exists
    const { data: exercise, error: exError } = await supabaseAdmin
      .from('exercises')
      .select('id')
      .eq('id', exerciseId)
      .single()

    if (exError || !exercise) {
      throw errors.notFound('Exercise')
    }

    // Insert test case
    const { data: testCase, error: insertError } = await supabaseAdmin
      .from('test_cases')
      .insert({
        exercise_id: exerciseId,
        input,
        expected_output: expectedOutput,
        weight,
        timeout,
        description,
        is_hidden: isHidden,
        order_index: orderIndex,
      })
      .select()
      .single()

    if (insertError) {
      logger.error('Failed to create test case', { error: insertError })
      throw new Error('Failed to create test case')
    }

    res.status(201).json({
      success: true,
      data: {
        id: testCase.id,
        exerciseId: testCase.exercise_id,
        input: testCase.input,
        expectedOutput: testCase.expected_output,
        weight: testCase.weight,
        timeout: testCase.timeout,
        description: testCase.description,
        isHidden: testCase.is_hidden,
        orderIndex: testCase.order_index,
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * GET /api/admin/grading/usage
 * Get AI grading usage statistics
 * Requirements: 18.1, 18.2, 18.5
 */
export const getUsageStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const today = new Date().toISOString().split('T')[0]

    // Get today's usage
    const { data: todayLogs, error: todayError } = await supabaseAdmin
      .from('ai_usage_logs')
      .select('total_tokens, cache_hit, response_time')
      .gte('created_at', `${today}T00:00:00Z`)

    if (todayError) {
      throw todayError
    }

    const logs = todayLogs || []
    const totalRequests = logs.length
    const totalTokens = logs.reduce((sum: number, l: any) => sum + (l.total_tokens || 0), 0)
    const cacheHits = logs.filter((l: any) => l.cache_hit).length
    const cacheMisses = totalRequests - cacheHits
    const cacheHitRate = totalRequests > 0 ? cacheHits / totalRequests : 0
    const avgResponseTime =
      logs.length > 0
        ? Math.round(
            logs.reduce((sum: number, l: any) => sum + (l.response_time || 0), 0) / logs.length
          )
        : 0

    // Free tier limits
    const dailyTokenLimit = 1_000_000
    const monthlySubmissionLimit = 60_000
    const tokenUsagePercent = ((totalTokens / dailyTokenLimit) * 100).toFixed(1)

    const warnings: string[] = []
    if (totalTokens > dailyTokenLimit * 0.8) {
      warnings.push(`AI API usage at ${tokenUsagePercent}% of daily token limit`)
    }

    res.json({
      success: true,
      data: {
        today: {
          totalRequests,
          totalTokens,
          cacheHits,
          cacheMisses,
          cacheHitRate: parseFloat(cacheHitRate.toFixed(4)),
          avgResponseTime,
        },
        limits: {
          dailyTokenLimit,
          monthlySubmissionLimit,
          tokenUsagePercent: parseFloat(tokenUsagePercent),
        },
        warnings,
      },
    })
  } catch (error) {
    next(error)
  }
}
