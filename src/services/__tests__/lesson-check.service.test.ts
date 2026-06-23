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
          order: jest.fn().mockResolvedValue({ data: [], error: null }),
        }
      }

      if (table === 'lesson_submissions') {
        return {
          insert: jest.fn().mockResolvedValue({ error: null }),
        }
      }

      throw new Error(`Unexpected table ${table}`)
    })

    const result = await service.checkLesson(
      'lesson-1',
      'user-1',
      'console.log("hello")',
      'javascript'
    )

    expect(result.passed).toBe(false)
    expect(result.score).toBe(0)
    expect(result.output).toBe('')
    expect(result.hint).toContain('test case')
    expect(result.checks).toEqual([
      expect.objectContaining({
        passed: false,
      }),
    ])
  })
})
