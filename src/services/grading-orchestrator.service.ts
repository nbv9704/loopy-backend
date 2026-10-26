import { readLessonTestCases } from './lesson-check/test-cases'
/**
 * LEGACY Grading Orchestrator Service for Auto-Grading System
 *
 * Coordinates the old/parallel test-based and AI-based grading flow.
 * This service is not the source of truth for modern Learn completion.
 * Learn pass/fail must remain deterministic via lesson-check.service.ts and
 * progress is saved only through completeLesson after backend validation.
 * AI output from this service must not decide Learn completion.
 *
 * @see .kiro/specs/auto-grading-system/design.md
 * Validates Requirements: 2.1, 3.1, 4.1-4.8, 5.1-5.5, 8.1, 9.1-9.6, 10.1-10.6, 14.3
 */

import {
  testRunnerService,
  TestRunnerService,
  TestCase,
  TestRunResult,
} from './test-runner.service'
import { aiAnalyzerService, AIAnalyzerService, AIAnalysis } from './ai-analyzer.service'
import { supabaseAdmin } from '../db/supabase'
import { logger } from '../utils/logger'
import { AppError, errors } from '../middleware/errorHandler'
import { readPublishedGradingContext } from './grading/lesson-context'
import { calculateFinalScore, calculateGradeLevel } from './grading/scores'
import { overrideSubmissionScore } from './grading/score-override'
import { readSubmissionHistory } from './grading/submission-history'
import { observability } from './observability.service'

// ============================================================================
// Types
// ============================================================================

export type GradingMethod = 'test' | 'ai' | 'both'

export type GradeLevel = 'excellent' | 'good' | 'satisfactory' | 'needs_improvement' | 'poor'

export interface GradeSubmissionParams {
  userId: string | null
  exerciseId: string
  code: string
  language: string
  gradingMethod?: GradingMethod
  starterCode?: string
  lessonTitle?: string
  lessonDescription?: string
  lessonInsight?: string
  gradingDepth?: 'quick' | 'careful' | 'thorough'
  gradingMode?: 'stdout' | 'function'
}

export interface GradingResult {
  submissionId: string
  testScore: number
  aiScore: number | null
  finalScore: number
  gradeLevel: GradeLevel
  feedback: GradingFeedback
  gradedAt: Date
  executionTime: number
}

export interface GradingFeedback {
  testResults: TestRunResult | null
  aiAnalysis: AIAnalysis | null
  overallFeedback: string
}

export interface SubmissionHistory {
  submissions: SubmissionSummary[]
  bestScore: number | null
  averageScore: number | null
  totalAttempts: number
  page: number
  limit: number
}

export interface SubmissionSummary {
  id: string
  code: string
  testScore: number | null
  aiScore: number | null
  finalScore: number | null
  gradeLevel: GradeLevel | null
  gradingMethod: GradingMethod | null
  gradedAt: string | null
  submittedAt: string
}

export interface ScoreOverride {
  testScore?: number
  aiScore?: number
  finalScore?: number
  note: string
}

// ============================================================================
// Service
// ============================================================================

export class GradingOrchestratorService {
  private testRunner: TestRunnerService
  private aiAnalyzer: AIAnalyzerService

  constructor(testRunner?: TestRunnerService, aiAnalyzer?: AIAnalyzerService) {
    this.testRunner = testRunner ?? testRunnerService
    this.aiAnalyzer = aiAnalyzer ?? aiAnalyzerService
  }

  /**
   * Grade a code submission
   * Requirements: 2.1, 3.1, 4.1-4.8, 5.1-5.5, 8.1
   */
  async gradeSubmission(params: GradeSubmissionParams): Promise<GradingResult> {
    const startTime = Date.now()
    const gradingMethod = params.gradingMethod || 'both' // Requirement 5.5

    logger.info('Starting grading', {
      userId: params.userId,
      exerciseId: params.exerciseId,
      gradingMethod,
      language: params.language,
    })

    const context = await readPublishedGradingContext(params.exerciseId, params.language)

    let mappedTestCases: TestCase[] = []
    let testResult: TestRunResult | null = null
    let aiAnalysis: AIAnalysis | null = null
    let testScore = 0
    let aiScore: number | null = null

    // Only fetch and run test cases if needed
    if (gradingMethod === 'test' || gradingMethod === 'both') {
      const testCases = await readLessonTestCases(params.exerciseId)

      mappedTestCases = (testCases || []).map((tc: any) => ({
        id: tc.id,
        exerciseId: tc.lesson_id,
        input: tc.input,
        expectedOutput: tc.expected_output,
        weight: tc.weight,
        timeout: tc.timeout,
        description: tc.description,
        isHidden: tc.is_hidden,
        orderIndex: tc.order_index,
      }))

      try {
        if (mappedTestCases.length > 0) {
          testResult = await this.testRunner.runTests(
            params.code,
            mappedTestCases,
            params.language,
            context.gradingMode
          )
          testScore = testResult.testScore
        } else if (gradingMethod === 'test') {
          throw new Error('No test cases configured')
        }
      } catch (error: any) {
        if (error instanceof AppError) throw error
        logger.error('Test execution failed', {
          error: error.message,
          exerciseId: params.exerciseId,
        })
        throw new AppError(
          503,
          'GRADING_UNAVAILABLE',
          'Chưa thể chạy bộ kiểm tra. Vui lòng thử lại sau.'
        )
      }
    }

    // Run AI-based grading (Requirement 14.3 — fallback if fails)
    if (gradingMethod === 'ai' || gradingMethod === 'both') {
      try {
        aiAnalysis = await this.aiAnalyzer.analyzeCode({
          code: params.code,
          language: params.language,
          ...context,
          gradingDepth: params.gradingDepth,
        })
        aiScore = aiAnalysis.aiScore
      } catch (error: any) {
        logger.warn('AI analysis failed, falling back to test-only grading', {
          error: error.message,
          exerciseId: params.exerciseId,
        })
        aiAnalysis = null
        aiScore = null
      }
    }

    // Calculate final score (Requirements 4.1, 5.2, 5.3, 5.4)
    const hasTestCases = mappedTestCases.length > 0
    if (aiScore === null && (gradingMethod === 'ai' || !hasTestCases))
      throw new AppError(503, 'GRADING_UNAVAILABLE', 'Chưa thể chấm bài. Vui lòng thử lại sau.')
    const finalScore = this.calculateFinalScore(testScore, aiScore, gradingMethod, hasTestCases)
    const gradeLevel = this.calculateGradeLevel(finalScore)

    // Generate feedback (Requirement 8.1)
    const feedback: GradingFeedback = {
      testResults: testResult,
      aiAnalysis,
      overallFeedback: this.generateOverallFeedback(finalScore, gradeLevel, testResult, aiAnalysis),
    }

    // Create submission record in database (Requirement 4.7, 4.8)
    const { data: submission, error: insertError } = await supabaseAdmin
      .from('lesson_submissions')
      .insert({
        user_id: params.userId,
        lesson_id: params.exerciseId,
        code: params.code,
        is_correct: finalScore >= 70,
        execution_time: Date.now() - startTime,
        test_score: testScore,
        ai_score: aiScore,
        final_score: finalScore,
        grade_level: gradeLevel,
        test_results: testResult,
        ai_analysis: aiAnalysis,
        feedback: feedback.overallFeedback,
        graded_at: new Date().toISOString(),
        grading_method: gradingMethod,
      })
      .select('id')
      .single()

    if (insertError || !submission?.id) {
      throw errors.databaseError(
        'Chưa xác nhận được bài nộp đã lưu. Hãy tải lại lịch sử trước khi gửi lại.'
      )
    }

    const submissionId = submission.id

    const result: GradingResult = {
      submissionId: submissionId,
      testScore,
      aiScore,
      finalScore,
      gradeLevel,
      feedback,
      gradedAt: new Date(),
      executionTime: Date.now() - startTime,
    }

    logger.info('Submission graded successfully', {
      submissionId: submissionId,
      userId: params.userId,
      exerciseId: params.exerciseId,
      testScore,
      aiScore,
      finalScore,
      gradeLevel,
      executionTime: result.executionTime,
      gradingMethod,
    })

    observability.trackGrading(gradingMethod, result.executionTime, finalScore)

    return result
  }

  /**
   * Get submission history for a user and exercise
   * Requirements: 9.1-9.6
   */
  async getSubmissionHistory(
    userId: string,
    exerciseId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<SubmissionHistory> {
    return readSubmissionHistory(userId, exerciseId, page, limit)
  }

  /**
   * Admin score override
   * Requirements: 10.1-10.6
   */
  async overrideScore(submissionId: string, override: ScoreOverride, adminId: string) {
    return overrideSubmissionScore(submissionId, override, adminId)
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Calculate final score based on grading method
   * Requirements: 4.1, 5.2, 5.3, 5.4
   */
  calculateFinalScore(
    testScore: number,
    aiScore: number | null,
    gradingMethod: GradingMethod,
    hasTestCases = true
  ): number {
    return calculateFinalScore(testScore, aiScore, gradingMethod, hasTestCases)
  }

  calculateGradeLevel(finalScore: number): GradeLevel {
    return calculateGradeLevel(finalScore)
  }

  /**
   * Generate overall feedback text
   */
  private generateOverallFeedback(
    finalScore: number,
    gradeLevel: GradeLevel,
    testResult: TestRunResult | null,
    aiAnalysis: AIAnalysis | null
  ): string {
    const gradeLabelMap: Record<GradeLevel, string> = {
      excellent: 'Xuất sắc',
      good: 'Tốt',
      satisfactory: 'Đạt yêu cầu',
      needs_improvement: 'Cần cải thiện',
      poor: 'Chưa đạt',
    }

    const parts: string[] = []
    parts.push(`Điểm tổng: ${finalScore}/100 — ${gradeLabelMap[gradeLevel]}`)

    if (testResult) {
      const passed = testResult.results.filter(r => r.passed).length
      const total = testResult.results.length
      parts.push(`Test: ${passed}/${total} test cases đạt (${testResult.testScore} điểm)`)
    }

    if (aiAnalysis) {
      parts.push(`AI Analysis: ${aiAnalysis.aiScore} điểm`)
      if (aiAnalysis.feedback) {
        parts.push(aiAnalysis.feedback)
      }
    }

    return parts.join('\n\n')
  }
}

// Export singleton
export const gradingOrchestratorService = new GradingOrchestratorService()
