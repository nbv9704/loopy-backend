jest.mock('../lesson-check/completion', () => ({
  recordLessonCheck: jest.fn().mockResolvedValue('check-id'),
}))
import { LessonCheckService } from '../lesson-check.service'
import { supabaseAdmin } from '../../db/supabase'

jest.mock('../../db/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn(),
  },
}))

jest.mock('../test-runner.service', () => ({
  testRunnerService: {
    runTests: jest.fn(),
  },
}))

jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}))

describe('LessonCheckService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('rejects unpublished or missing lessons before saving a submission', async () => {
    const service = new LessonCheckService()
    const fromMock = supabaseAdmin.from as jest.Mock
    const insertMock = jest.fn()

    fromMock.mockImplementation((table: string) => {
      if (table === 'lessons') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116', message: 'No rows returned' },
          }),
        }
      }

      if (table === 'lesson_submissions') {
        return { insert: insertMock }
      }

      throw new Error(`Unexpected table ${table}`)
    })

    await expect(
      service.checkLesson('draft-lesson', 'user-1', 'console.log("x")', 'javascript')
    ).rejects.toThrow('Lesson not found')
    expect(insertMock).not.toHaveBeenCalled()
  })

  it('does not pass stdout lessons when no test cases are configured', async () => {
    const service = new LessonCheckService()
    const fromMock = supabaseAdmin.from as jest.Mock

    fromMock.mockImplementation((table: string) => {
      if (table === 'lessons') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: {
              content_revision: 1,
              chapters: { language_id: 'javascript' },
              id: 'lesson-1',
              validation_type: 'stdout',
              validation_rules: {},
              success_output: 'OK',
              failure_hint: 'Check your code',
              hint: 'Use console.log',
              grading_mode: 'stdout',
            },
            error: null,
          }),
        }
      }

      if (table === 'lesson_test_cases') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          range: jest.fn().mockResolvedValue({ data: [], count: 0, error: null }),
        }
      }

      if (table === 'lesson_submissions') {
        return {
          insert: jest.fn().mockResolvedValue({ error: null }),
        }
      }

      throw new Error(`Unexpected table ${table}`)
    })

    await expect(
      service.checkLesson('lesson-1', 'user-1', 'console.log("hello")', 'javascript')
    ).rejects.toMatchObject({ code: 'RUNNER_UNAVAILABLE', statusCode: 503 })
  })

  it('checks answer-based lessons against lesson step correct_answer on the backend', async () => {
    const service = new LessonCheckService()
    const fromMock = supabaseAdmin.from as jest.Mock

    fromMock.mockImplementation((table: string) => {
      if (table === 'lessons') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: {
              content_revision: 1,
              chapters: { language_id: 'python' },
              id: 'lesson-quiz',
              lesson_type: 'multiple_choice',
              validation_type: 'rule',
              validation_rules: {},
              success_output: 'Correct',
              failure_hint: 'Try again',
              hint: 'Pick the output',
              grading_mode: 'stdout',
            },
            error: null,
          }),
        }
      }

      if (table === 'lesson_steps') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({
            data: [
              {
                id: 'step-1',
                type: 'multiple_choice',
                correct_answer: 'Chao ban!',
                hint: 'Output does not include quotes.',
                explanation: 'Output is the printed text.',
                order_index: 1,
              },
            ],
            error: null,
          }),
        }
      }

      if (table === 'lesson_submissions') {
        return {
          insert: jest.fn().mockResolvedValue({ error: null }),
        }
      }

      throw new Error(`Unexpected table ${table}`)
    })

    const result = await service.checkLesson('lesson-quiz', 'user-1', 'Chao ban!', 'python')

    expect(result.passed).toBe(true)
    expect(result.score).toBe(100)
    expect(result.output).toBe('Output is the printed text.')
  })

  it('does not pass answer-based lessons when the submitted answer is wrong', async () => {
    const service = new LessonCheckService()
    const fromMock = supabaseAdmin.from as jest.Mock

    fromMock.mockImplementation((table: string) => {
      if (table === 'lessons') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: {
              content_revision: 1,
              chapters: { language_id: 'python' },
              id: 'lesson-quiz',
              lesson_type: 'fill_blank',
              validation_type: 'rule',
              validation_rules: {},
              success_output: 'Correct',
              failure_hint: 'Try again',
              hint: 'Use lowercase',
              grading_mode: 'stdout',
            },
            error: null,
          }),
        }
      }

      if (table === 'lesson_steps') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({
            data: [
              {
                id: 'step-1',
                type: 'fill_blank',
                correct_answer: 'print',
                hint: 'Write the command name only.',
                explanation: 'Correct.',
                order_index: 1,
              },
            ],
            error: null,
          }),
        }
      }

      if (table === 'lesson_submissions') {
        return {
          insert: jest.fn().mockResolvedValue({ error: null }),
        }
      }

      throw new Error(`Unexpected table ${table}`)
    })

    const result = await service.checkLesson('lesson-quiz', 'user-1', 'printf', 'python')

    expect(result.passed).toBe(false)
    expect(result.score).toBe(0)
    expect(result.hint).toBe('Write the command name only.')
  })

  it('requires the concept acknowledgement token for concept lessons', async () => {
    const service = new LessonCheckService()
    const fromMock = supabaseAdmin.from as jest.Mock

    fromMock.mockImplementation((table: string) => {
      if (table === 'lessons') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: {
              content_revision: 1,
              chapters: { language_id: 'python' },
              id: 'lesson-concept',
              lesson_type: 'concept',
              validation_type: 'rule',
              validation_rules: {},
              success_output: 'Concept acknowledged.',
              failure_hint: 'Read the concept first.',
              hint: 'Read the concept first.',
              grading_mode: 'stdout',
            },
            error: null,
          }),
        }
      }

      if (table === 'lesson_submissions') {
        return {
          insert: jest.fn().mockResolvedValue({ error: null }),
        }
      }

      throw new Error(`Unexpected table ${table}`)
    })

    const wrong = await service.checkLesson('lesson-concept', 'user-1', 'anything', 'python')
    const acknowledged = await service.checkLesson(
      'lesson-concept',
      'user-1',
      '__loopy_concept_ack__',
      'python'
    )

    expect(wrong.passed).toBe(false)
    expect(acknowledged.passed).toBe(true)
    expect(acknowledged.output).toBe('Concept acknowledged.')
  })
})
