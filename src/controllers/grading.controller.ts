/**
 * LEGACY Grading Controller - Student Endpoints
 *
 * This controller belongs to the old/parallel auto-grading experiment.
 * It must not be used as the source of truth for modern Learn completion.
 * Current Learn pass/fail is deterministic via lesson check endpoints, and AI is
 * allowed only as a hint/support layer.
 *
 * @see .kiro/specs/auto-grading-system/design.md
 * Validates Requirements: 12.1, 12.2, 12.3, 13.1, 13.2, 13.3
 */

import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/auth'
import { gradingOrchestratorService } from '../services/grading-orchestrator.service'
import { generateLessonHint } from '../services/grading/hint'
import { readPublishedGradingContext } from '../services/grading/lesson-context'
import { supabaseAdmin } from '../db/supabase'
import { errors } from '../middleware/errorHandler'
import { toPublicTestResults } from '../services/grading/public-test-results'

/**
 * POST /api/exercises/:exerciseId/submit
 * Submit code for grading
 * Requirements: 12.1, 13.1, 13.6, 13.8
 */
export const submitForGrading = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id
    if (!userId) throw errors.authRequired()
    const { exerciseId } = req.params
    const { code, language, gradingMethod, gradingDepth } = req.body
    const result = await gradingOrchestratorService.gradeSubmission({
      userId,
      exerciseId,
      code,
      language,
      gradingMethod,
      gradingDepth,
    })

    // Filter hidden test cases from response for non-admin users (Requirement 13.3)
    const filteredFeedback = {
      ...result.feedback,
      testResults: toPublicTestResults(result.feedback.testResults),
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
 * POST /api/exercises/:exerciseId/hint
 * Request an AI hint for the current code and error
 */
export const getAIHint = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { exerciseId } = req.params
    const { code, language, outputLogs } = req.body
    const result = await generateLessonHint(exerciseId, { code, language, outputLogs })

    res.json({
      success: true,
      data: result,
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
    const userId = req.user?.id
    if (!userId) {
      throw errors.authRequired()
    }
    const { exerciseId } = req.params
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 10

    await readPublishedGradingContext(exerciseId)

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
    const userId = req.user?.id
    if (!userId) {
      throw errors.authRequired()
    }
    const { exerciseId, submissionId } = req.params

    await readPublishedGradingContext(exerciseId)

    const { data: submission, error } = await supabaseAdmin
      .from('lesson_submissions')
      .select(
        'id, code, test_score, ai_score, final_score, grade_level, test_results, ai_analysis, feedback, grading_method, graded_at, submitted_at, execution_time'
      )
      .eq('id', submissionId)
      .eq('lesson_id', exerciseId)
      .eq('user_id', userId)
      .maybeSingle()

    if (error) throw errors.databaseError('Không tải được bài nộp. Vui lòng thử lại.')
    if (!submission) {
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
        testResults: toPublicTestResults(submission.test_results),
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
