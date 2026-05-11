/**
 * Grading Controller - Student Endpoints
 *
 * Handles code submission, grading, and submission history for students.
 *
 * @see .kiro/specs/auto-grading-system/design.md
 * Validates Requirements: 12.1, 12.2, 12.3, 13.1, 13.2, 13.3
 */

import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/auth'
import { gradingOrchestratorService } from '../services/grading-orchestrator.service'
import { supabaseAdmin } from '../db/supabase'
import { errors } from '../middleware/errorHandler'
import {  } from '../utils/logger'

/** Dev fallback userId when not authenticated (must be valid UUID for Postgres) */
const DEV_USER_ID = '00000000-0000-0000-0000-000000000000'
const getDevUserId = (req: AuthRequest) => req.user?.id || DEV_USER_ID

/**
 * POST /api/exercises/:exerciseId/submit
 * Submit code for grading
 * Requirements: 12.1, 13.1, 13.6, 13.8
 */
export const submitForGrading = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = getDevUserId(req)
    const { exerciseId } = req.params
    const {
      code,
      gradingMethod = 'both',
      language = 'javascript',
      starterCode,
      lessonTitle,
      lessonDescription,
      lessonInsight,
      gradingDepth,
    } = req.body

    // Validate input (Requirement 13.6)
    if (!code || typeof code !== 'string') {
      throw errors.validationError({ field: 'code', message: 'Code is required' })
    }

    if (code.length > 10240) {
      throw errors.validationError({
        field: 'code',
        message: 'Code exceeds maximum length of 10KB',
      })
    }

    if (!['test', 'ai', 'both'].includes(gradingMethod)) {
      throw errors.validationError({
        field: 'gradingMethod',
        message: 'gradingMethod must be one of: test, ai, both',
      })
    }

    if (!['javascript', 'python', 'cpp'].includes(language)) {
      throw errors.validationError({
        field: 'language',
        message: 'language must be one of: javascript, python, cpp',
      })
    }

    // Grade submission
    const result = await gradingOrchestratorService.gradeSubmission({
      userId,
      exerciseId,
      code,
      language,
      gradingMethod,
      starterCode: typeof starterCode === 'string' ? starterCode : undefined,
      lessonTitle: typeof lessonTitle === 'string' ? lessonTitle : undefined,
      lessonDescription: typeof lessonDescription === 'string' ? lessonDescription : undefined,
      lessonInsight: typeof lessonInsight === 'string' ? lessonInsight : undefined,
      gradingDepth: ['quick', 'careful', 'thorough'].includes(gradingDepth)
        ? gradingDepth
        : 'quick',
    })

    // Filter hidden test cases from response for non-admin users (Requirement 13.3)
    const filteredFeedback = {
      ...result.feedback,
      testResults: result.feedback.testResults
        ? {
            ...result.feedback.testResults,
            results: result.feedback.testResults.results,
          }
        : null,
    }

    res.json({
      success: true,
      data: {
        submissionId: result.submissionId,
        testScore: result.testScore,
        aiScore: result.aiScore,
        finalScore: result.finalScore,
        gradeLevel: result.gradeLevel,
        feedback: filteredFeedback,
        gradedAt: result.gradedAt,
        executionTime: result.executionTime,
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * GET /api/exercises/:exerciseId/submissions
 * Get submission history for the authenticated user
 * Requirements: 12.2, 13.2
 */
export const getSubmissionHistory = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = getDevUserId(req)
    const { exerciseId } = req.params
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 10

    const history = await gradingOrchestratorService.getSubmissionHistory(
      userId,
      exerciseId,
      page,
      Math.min(limit, 50) // Cap at 50
    )

    res.json({
      success: true,
      data: history,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * GET /api/exercises/:exerciseId/submissions/:submissionId
 * Get detailed submission with feedback
 * Requirements: 12.3, 13.2, 13.3
 */
export const getSubmissionDetail = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = getDevUserId(req)
    const { exerciseId, submissionId } = req.params

    const { data: submission, error } = await supabaseAdmin
      .from('exercise_submissions')
      .select('*')
      .eq('id', submissionId)
      .eq('exercise_id', exerciseId)
      .eq('user_id', userId)
      .single()

    if (error || !submission) {
      throw errors.notFound('Submission')
    }

    res.json({
      success: true,
      data: {
        id: submission.id,
        code: submission.code,
        testScore: submission.test_score,
        aiScore: submission.ai_score,
        finalScore: submission.final_score,
        gradeLevel: submission.grade_level,
        testResults: submission.test_results,
        aiAnalysis: submission.ai_analysis,
        feedback: submission.feedback,
        gradingMethod: submission.grading_method,
        gradedAt: submission.graded_at,
        submittedAt: submission.submitted_at,
        executionTime: submission.execution_time,
      },
    })
  } catch (error) {
    next(error)
  }
}
