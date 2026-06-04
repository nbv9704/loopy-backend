/**
 * Grading Orchestrator Service for Auto-Grading System
 *
 * Coordinates test-based and AI-based grading, calculates final scores,
 * manages submission history, and handles admin score overrides.
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
  bestScore: number
  averageScore: number
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
  gradingMethod: GradingMethod
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

    // Get exercise/lesson details for AI context
    // Priority: client-provided metadata > DB exercises > DB lessons
    let exerciseTitle = params.lessonTitle || 'Bài tập'
    let exerciseQuestion = params.lessonDescription || ''
    let lessonInsight = params.lessonInsight || ''
    let lessonGradingMode: 'stdout' | 'function' = params.gradingMode || 'stdout'

    if (!params.lessonTitle) {
      const { data: lesson } = await supabaseAdmin
        .from('lessons')
        .select('id, lesson_id, title, description, task_description, insight, grading_mode')
        .eq('id', params.exerciseId)
        .single()

      if (lesson) {
        exerciseTitle = lesson.title || lesson.lesson_id || 'Bài tập'
        exerciseQuestion = lesson.task_description || lesson.description || ''
        lessonInsight = lesson.insight || ''
        if (lesson.grading_mode) lessonGradingMode = lesson.grading_mode as 'stdout' | 'function'
        
        logger.info('Using lesson as exercise context', {
          lessonId: lesson.id,
          title: exerciseTitle,
          gradingMode: lessonGradingMode
        })
      } else {
        logger.warn('Neither exercise nor lesson found, proceeding with AI-only context', {
          exerciseId: params.exerciseId,
        })
      }
    } else {
      logger.info('Using client-provided lesson context', { title: exerciseTitle })
    }

    let mappedTestCases: TestCase[] = []
    let testResult: TestRunResult | null = null
    let aiAnalysis: AIAnalysis | null = null
    let testScore = 0
    let aiScore: number | null = null

    // Only fetch and run test cases if needed
    if (gradingMethod === 'test' || gradingMethod === 'both') {
      const { data: testCases, error: ltcErr } = await supabaseAdmin
        .from('lesson_test_cases')
        .select('*')
        .eq('lesson_id', params.exerciseId)
        .order('order_index', { ascending: true })

      if (ltcErr) {
        logger.error('Failed to fetch test cases', { error: ltcErr })
      }

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
          testResult = await this.testRunner.runTests(params.code, mappedTestCases, params.language, lessonGradingMode)
          testScore = testResult.testScore
        } else {
          testScore = 0
          testResult = { testScore: 0, results: [], totalExecutionTime: 0 }
        }
      } catch (error: any) {
        logger.error('Test execution failed', {
          error: error.message,
          exerciseId: params.exerciseId,
        })
        testResult = { testScore: 0, results: [], totalExecutionTime: 0 }
      }
    }

    // Run AI-based grading (Requirement 14.3 — fallback if fails)
    if (gradingMethod === 'ai' || gradingMethod === 'both') {
      try {
        aiAnalysis = await this.aiAnalyzer.analyzeCode({
          code: params.code,
          language: params.language,
          exerciseTitle,
          exerciseQuestion,
          starterCode: params.starterCode,
          lessonInsight,
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

    if (insertError) {
      logger.error('Failed to save submission', { error: insertError })
      throw new Error('Failed to save submission')
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
    const offset = (page - 1) * limit

    // Get paginated submissions (Requirement 9.2, 9.6)
    const { data: submissions, error } = await supabaseAdmin
      .from('lesson_submissions')
      .select(
        'id, code, test_score, ai_score, final_score, grade_level, grading_method, graded_at, submitted_at'
      )
      .eq('user_id', userId)
      .eq('lesson_id', exerciseId)
      .order('submitted_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      logger.error('Failed to fetch submission history', { error })
      throw new Error('Failed to fetch submission history')
    }

    // Get total count (Requirement 9.5)
    const { count } = await supabaseAdmin
      .from('lesson_submissions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('lesson_id', exerciseId)

    // Get stats (Requirement 9.3, 9.4)
    const { data: stats } = await supabaseAdmin
      .from('lesson_submissions')
      .select('final_score')
      .eq('user_id', userId)
      .eq('lesson_id', exerciseId)
      .not('final_score', 'is', null)

    const scores = (stats || [])
      .map((s: any) => s.final_score)
      .filter((s: number | null) => s !== null)
    const bestScore = scores.length > 0 ? Math.max(...scores) : 0
    const averageScore =
      scores.length > 0
        ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length)
        : 0

    return {
      submissions: (submissions || []).map((s: any) => ({
        id: s.id,
        code: s.code,
        testScore: s.test_score,
        aiScore: s.ai_score,
        finalScore: s.final_score,
        gradeLevel: s.grade_level,
        gradingMethod: s.grading_method || 'both',
        gradedAt: s.graded_at,
        submittedAt: s.submitted_at,
      })),
      bestScore,
      averageScore,
      totalAttempts: count || 0,
      page,
      limit,
    }
  }

  /**
   * Admin score override
   * Requirements: 10.1-10.6
   */
  async overrideScore(
    submissionId: string,
    override: ScoreOverride,
    adminId: string
  ): Promise<GradingResult> {
    // Get current submission
    const { data: submission, error: fetchError } = await supabaseAdmin
      .from('lesson_submissions')
      .select('*')
      .eq('id', submissionId)
      .single()

    if (fetchError || !submission) {
      throw new Error('Submission not found')
    }

    // Apply overrides (Requirements 10.1, 10.2, 10.3)
    const newTestScore = override.testScore ?? submission.test_score ?? 0
    const newAiScore = override.aiScore ?? submission.ai_score
    const gradingMethod = submission.grading_method || 'both'

    // Recalculate final score (Requirement 10.4)
    let newFinalScore: number
    if (override.finalScore !== undefined) {
      newFinalScore = override.finalScore
    } else {
      newFinalScore = this.calculateFinalScore(newTestScore, newAiScore, gradingMethod)
    }

    const newGradeLevel = this.calculateGradeLevel(newFinalScore)

    // Update submission (Requirements 10.5, 10.6)
    const overrideFeedback = submission.feedback
      ? `${submission.feedback}\n\n[Admin Override] ${override.note}`
      : `[Admin Override] ${override.note}`

    const { error: updateError } = await supabaseAdmin
      .from('lesson_submissions')
      .update({
        test_score: newTestScore,
        ai_score: newAiScore,
        final_score: newFinalScore,
        grade_level: newGradeLevel,
        feedback: overrideFeedback,
        override_by: adminId,
        override_at: new Date().toISOString(),
        override_note: override.note,
      })
      .eq('id', submissionId)

    if (updateError) {
      logger.error('Failed to override score', { error: updateError })
      throw new Error('Failed to override score')
    }

    logger.info('Score overridden', {
      submissionId,
      adminId,
      newTestScore,
      newAiScore,
      newFinalScore,
      newGradeLevel,
      note: override.note,
    })

    return {
      submissionId,
      testScore: newTestScore,
      aiScore: newAiScore,
      finalScore: newFinalScore,
      gradeLevel: newGradeLevel,
      feedback: {
        testResults: submission.test_results,
        aiAnalysis: submission.ai_analysis,
        overallFeedback: overrideFeedback,
      },
      gradedAt: new Date(),
      executionTime: 0,
    }
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
    hasTestCases: boolean = true
  ): number {
    switch (gradingMethod) {
      case 'test':
        return testScore

      case 'ai':
        return aiScore ?? 0

      case 'both':
      default:
        if (aiScore === null) {
          // AI failed — use test score only (graceful degradation)
          return testScore
        }
        if (!hasTestCases) {
          // No test cases configured — use AI score only
          return aiScore
        }
        return Math.round(testScore * 0.7 + aiScore * 0.3)
    }
  }

  /**
   * Calculate grade level from final score
   * Requirements: 4.2, 4.3, 4.4, 4.5, 4.6
   */
  calculateGradeLevel(finalScore: number): GradeLevel {
    if (finalScore >= 90) return 'excellent'
    if (finalScore >= 80) return 'good'
    if (finalScore >= 70) return 'satisfactory'
    if (finalScore >= 60) return 'needs_improvement'
    return 'poor'
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
