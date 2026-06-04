import { supabaseAdmin } from '../db/supabase'
import { logger } from '../utils/logger'
import { validateRules, ValidationRules } from './validators/rule-validator'
import { testRunnerService } from './test-runner.service'

export interface LessonCheckResult {
  passed: boolean
  score: number
  output: string
  hint: string | null
  validationType?: string
  gradingMode?: string
  checks: Array<{
    label: string
    passed: boolean
    message?: string
  }>
}

export class LessonCheckService {
  /**
   * Deterministically check a lesson submission.
   */
  async checkLesson(
    lessonId: string,
    userId: string | null | undefined,
    code: string,
    language: string
  ): Promise<LessonCheckResult> {
    const startTime = Date.now()

    logger.info('Starting deterministic check', {
      userId,
      lessonId,
      language,
    })

    // 1. Fetch lesson details
    const { data: lesson, error: lessonError } = await supabaseAdmin
      .from('lessons')
      .select('id, validation_type, validation_rules, success_output, failure_hint, hint, grading_mode')
      .eq('id', lessonId)
      .single()

    if (lessonError || !lesson) {
      logger.error('Failed to fetch lesson for validation', { error: lessonError, lessonId })
      throw new Error('Lesson not found')
    }

    const validationType = lesson.validation_type || 'rule'
    const validationRules = (lesson.validation_rules as ValidationRules) || {}
    const successOutput = lesson.success_output || '✓ Trả lời chính xác!'
    const failureHint = lesson.failure_hint || lesson.hint || 'Hãy kiểm tra kỹ yêu cầu bài học.'
    const gradingMode = (lesson.grading_mode as 'stdout' | 'function') || 'stdout'

    let result: LessonCheckResult

    // 2. Deterministic Static Checking
    if (validationType === 'rule' || validationType === 'exact' || validationType === 'regex') {
      // If validation type is exact/regex but rules are not set, synthesize rule object
      const compiledRules: ValidationRules = { ...validationRules }
      if (validationType === 'exact' && !compiledRules.exact) {
        compiledRules.exact = validationRules.exact || ''
      }
      if (validationType === 'regex' && !compiledRules.regex) {
        compiledRules.regex = validationRules.regex || ''
      }

      const ruleResult = validateRules(code, compiledRules, language)

      result = {
        passed: ruleResult.passed,
        score: ruleResult.score,
        output: ruleResult.passed ? successOutput : '',
        hint: ruleResult.passed ? null : failureHint,
        checks: ruleResult.checks,
      }
    } 
    // 3. Fallback to Real Code Execution (test-runner)
    else if (validationType === 'stdout' || validationType === 'function') {
      logger.info('Falling back to test runner execution', { lessonId, validationType, gradingMode })

      // Fetch test cases
      const { data: testCases, error: ltcErr } = await supabaseAdmin
        .from('lesson_test_cases')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('order_index', { ascending: true })

      if (ltcErr) {
        logger.error('Failed to fetch test cases for runner fallback', { error: ltcErr })
      }

      const mappedTestCases = (testCases || []).map((tc: any) => ({
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

      if (mappedTestCases.length === 0) {
        logger.warn('No test cases found for lesson runner execution, passing by default', { lessonId })
        result = {
          passed: true,
          score: 100,
          output: successOutput,
          hint: null,
          checks: [{ label: 'Không tìm thấy test case - Tự động thông qua', passed: true }],
        }
      } else {
        // Run code via test runner
        const runnerResult = await testRunnerService.runTests(
          code,
          mappedTestCases,
          language,
          validationType // 'stdout' or 'function'
        )

        const passed = runnerResult.testScore === 100
        
        // Map individual test results to checks
        const checks = runnerResult.results.map((tr: any) => ({
          label: tr.description || 'Chạy thử kiểm thử',
          passed: tr.passed,
          message: tr.error || undefined,
        }))

        // Collect outputs/errors to display
        let output = ''
        if (runnerResult.results.length > 0) {
          const firstRun = runnerResult.results[0]
          output = firstRun.passed 
            ? `Output: ${firstRun.actualOutput}` 
            : `Lỗi: ${firstRun.error || 'Output không khớp với kết quả mong đợi.'}`
        }

        result = {
          passed,
          score: runnerResult.testScore,
          output: passed ? successOutput : output,
          hint: passed ? null : failureHint,
          checks,
        }
      }
    } else {
      logger.error('Unknown validation type', { validationType, lessonId })
      throw new Error(`Unsupported validation type: ${validationType}`)
    }

    result.validationType = validationType
    result.gradingMode = gradingMode

    // 4. Save submission record in database (for stats and history)
    try {
      const { error: insertError } = await supabaseAdmin
        .from('lesson_submissions')
        .insert({
          user_id: userId || null,
          lesson_id: lessonId,
          code: code,
          is_correct: result.passed,
          execution_time: Date.now() - startTime,
          test_score: result.score,
          final_score: result.score,
          grade_level: result.passed ? 'excellent' : 'poor',
          test_results: { passed: result.passed, checks: result.checks },
          feedback: result.passed ? '✓ Trả lời chính xác!' : result.hint || 'Sai yêu cầu bài học',
          graded_at: new Date().toISOString(),
          grading_method: 'test',
        })

      if (insertError) {
        logger.error('Failed to save lesson check submission', { error: insertError })
      }
    } catch (err) {
      logger.error('Error saving lesson check submission', err)
    }

    logger.info('Lesson check completed', {
      lessonId,
      passed: result.passed,
      score: result.score,
      duration: Date.now() - startTime,
    })

    return result
  }
}

export const lessonCheckService = new LessonCheckService()
