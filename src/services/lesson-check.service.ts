import { RunnerUnavailableError } from './execution/errors'
import { readLessonTestCases } from './lesson-check/test-cases'
import { supabaseAdmin } from '../db/supabase'
import { toPublicRunnerFeedback } from './lesson-check/runner-feedback'
import { logger } from '../utils/logger'
import { validateRules, ValidationRules } from './validators/rule-validator'
import { testRunnerService } from './test-runner.service'
import { AppError, errors } from '../middleware/errorHandler'
import { matchesAnswer, parseCorrectAnswers, selectPrimaryAnswerStep } from './lesson-check/answers'
import { recordLessonCheck } from './lesson-check/completion'

export interface LessonCheckResult {
  submissionId?: string
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

const answerLessonTypes = new Set([
  'true_false',
  'multiple_choice',
  'fill_blank',
  'short_answer',
  'code_output',
])

const conceptAckToken = '__loopy_concept_ack__'

export class LessonCheckService {
  async checkLessonStep(
    lessonId: string,
    stepId: string,
    answer: string | undefined
  ): Promise<{ passed: boolean; message: string }> {
    const { data: step, error } = await supabaseAdmin
      .from('lesson_steps')
      .select('id, type, correct_answer, explanation, hint, lessons!inner(status, lesson_type)')
      .eq('id', stepId)
      .eq('lesson_id', lessonId)
      .eq('lessons.status', 'published')
      .maybeSingle()

    if (error) throw errors.databaseError('Không thể kiểm tra bước học. Vui lòng thử lại.')
    if (!step) throw errors.notFound('Lesson step')

    const parentLesson = Array.isArray(step.lessons) ? step.lessons[0] : step.lessons
    const isOutputQuestion =
      step.type === 'code_prompt' && parentLesson?.lesson_type === 'code_output'
    if (step.type === 'note' || (step.type === 'code_prompt' && !isOutputQuestion)) {
      return { passed: true, message: step.explanation || 'Đã ghi nhận bước này.' }
    }

    const correctAnswers = parseCorrectAnswers(step.correct_answer)
    if (correctAnswers.length === 0) {
      return { passed: false, message: 'Bước học chưa có đáp án để kiểm tra. Vui lòng báo admin.' }
    }

    const passed = matchesAnswer(
      step.correct_answer,
      answer,
      isOutputQuestion || step.type === 'multiple_choice'
    )
    return {
      passed,
      message: passed
        ? step.explanation || 'Đúng rồi. Hãy tiếp tục flow chính của bài học.'
        : step.hint || 'Chưa đúng. Đọc lại prompt và thử lại nhé.',
    }
  }

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
      .select(
        'id, content_revision, lesson_type, validation_type, validation_rules, success_output, failure_hint, hint, grading_mode, chapters!inner(language_id)'
      )
      .eq('id', lessonId)
      .eq('status', 'published')
      .single()

    if (lessonError && lessonError.code !== 'PGRST116') {
      if (lessonError.code === '42703')
        throw new AppError(503, 'SCHEMA_NOT_READY', 'Bài học tạm thời chưa sẵn sàng.')
      throw errors.databaseError('Không tải được bài học để kiểm tra. Vui lòng thử lại.')
    }
    if (!lesson) throw errors.notFound('Lesson')

    const chapter = Array.isArray(lesson.chapters) ? lesson.chapters[0] : lesson.chapters
    if (
      !chapter?.language_id ||
      !Number.isSafeInteger(lesson.content_revision) ||
      lesson.content_revision < 1
    )
      throw errors.databaseError('Bài học chưa sẵn sàng để kiểm tra.')
    if (chapter.language_id !== language)
      throw errors.badRequest('Ngôn ngữ kiểm tra không khớp bài học.')

    const validationType = lesson.validation_type || 'rule'
    const validationRules = (lesson.validation_rules as ValidationRules) || {}
    const successOutput = lesson.success_output || '✓ Trả lời chính xác!'
    const failureHint = lesson.failure_hint || lesson.hint || 'Hãy kiểm tra kỹ yêu cầu bài học.'
    const gradingMode = (lesson.grading_mode as 'stdout' | 'function') || 'stdout'
    const lessonType = lesson.lesson_type || 'code_fix'

    let result: LessonCheckResult

    if (lessonType === 'concept') {
      const passed = code.trim() === conceptAckToken
      result = {
        passed,
        score: passed ? 100 : 0,
        output: passed ? successOutput : '',
        hint: passed ? null : failureHint,
        checks: [
          {
            label: 'Xác nhận đã hiểu khái niệm',
            passed,
            message: passed ? undefined : 'Hãy đọc nội dung bài và bấm xác nhận đã hiểu.',
          },
        ],
      }
    } else if (answerLessonTypes.has(lessonType)) {
      const { data: steps, error: stepsError } = await supabaseAdmin
        .from('lesson_steps')
        .select('id, type, correct_answer, hint, explanation, order_index')
        .eq('lesson_id', lessonId)
        .order('order_index', { ascending: true })

      if (stepsError) {
        logger.error('Failed to fetch lesson steps for answer validation', {
          error: stepsError,
          lessonId,
        })
        throw errors.databaseError('Không tải được câu hỏi để kiểm tra. Vui lòng thử lại.')
      }

      const primaryStep = selectPrimaryAnswerStep(steps || [], lessonType)

      if (!primaryStep || parseCorrectAnswers(primaryStep.correct_answer).length === 0) {
        logger.error('No answer key configured for answer lesson', { lessonId, lessonType })
        result = {
          passed: false,
          score: 0,
          output: '',
          hint: 'Câu hỏi của bài học chưa sẵn sàng để kiểm tra. Vui lòng thử lại sau.',
          checks: [
            {
              label: 'Không tìm thấy đáp án kiểm tra',
              passed: false,
              message: 'Chưa có đáp án kiểm tra hợp lệ cho câu hỏi này.',
            },
          ],
        }
      } else {
        const passed = matchesAnswer(
          primaryStep.correct_answer,
          code,
          lessonType === 'code_output' || primaryStep.type === 'multiple_choice'
        )

        result = {
          passed,
          score: passed ? 100 : 0,
          output: passed ? primaryStep.explanation || successOutput : '',
          hint: passed ? null : primaryStep.hint || failureHint,
          checks: [
            {
              label: 'Kiểm tra câu trả lời',
              passed,
              message: passed ? undefined : primaryStep.hint || failureHint,
            },
          ],
        }
      }
    }

    // 2. Deterministic Static Checking
    else if (
      validationType === 'rule' ||
      validationType === 'exact' ||
      validationType === 'regex'
    ) {
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
      logger.info('Falling back to test runner execution', {
        lessonId,
        validationType,
        gradingMode,
      })

      // Fetch test cases
      const testCases = await readLessonTestCases(lessonId)

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
        throw new RunnerUnavailableError('Bài học chưa có bộ kiểm tra. Vui lòng báo quản trị viên.')
      } else {
        // Run code via test runner
        const runnerResult = await testRunnerService.runTests(
          code,
          mappedTestCases,
          language,
          validationType // 'stdout' or 'function'
        )

        const passed = runnerResult.testScore === 100

        const { checks, output } = toPublicRunnerFeedback(runnerResult)

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

    // Guests can preview checks, but only a committed authenticated check issues a receipt.
    if (userId)
      result.submissionId = await recordLessonCheck(
        userId,
        lessonId,
        lesson.content_revision,
        code,
        result,
        Date.now() - startTime
      )

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
