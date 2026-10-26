import { RunnerUnavailableError } from '../execution/errors'
import { LessonCheckService } from '../lesson-check.service'
import { supabaseAdmin } from '../../db/supabase'
import { testRunnerService } from '../test-runner.service'

jest.mock('../../db/supabase', () => ({ supabaseAdmin: { from: jest.fn(), rpc: jest.fn() } }))
jest.mock('../test-runner.service', () => ({ testRunnerService: { runTests: jest.fn() } }))
jest.mock('../../utils/logger', () => ({ logger: { info: jest.fn(), error: jest.fn() } }))

describe('lesson check acceptance', () => {
  const service = new LessonCheckService()
  const persist = supabaseAdmin.rpc as jest.Mock
  let lesson: Record<string, unknown>
  let testCases: Record<string, unknown>[]

  beforeEach(() => {
    jest.clearAllMocks()
    persist.mockReset().mockImplementation(async (_name, args) => ({
      data: {
        id: 'check',
        user_id: args.p_user_id,
        lesson_id: args.p_lesson_id,
        content_revision: args.p_content_revision,
        passed: args.p_result.passed,
      },
      error: null,
    }))
    lesson = {
      id: 'lesson-1',
      content_revision: 1,
      chapters: { language_id: 'javascript' },
      lesson_type: 'code_build',
      validation_type: 'rule',
      validation_rules: { required: ['console.log'] },
    }
    testCases = []
    ;(supabaseAdmin.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'lessons')
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockImplementation(async () => ({ data: lesson, error: null })),
        }
      if (table === 'lesson_test_cases')
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          range: jest.fn().mockImplementation(async () => ({
            data: testCases,
            count: testCases.length,
            error: null,
          })),
        }
      throw new Error(`Unexpected table: ${table}`)
    })
  })

  it('rejects a client language that does not match the lesson before grading or recording', async () => {
    await expect(
      service.checkLesson('lesson-1', 'user-1', 'console.log(1)', 'python')
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' })
    expect(persist).not.toHaveBeenCalled()
    expect(testRunnerService.runTests).not.toHaveBeenCalled()
  })

  it('does not record a failed attempt when loading the test suite fails', async () => {
    lesson.validation_type = 'stdout'
    const from = supabaseAdmin.from as jest.Mock
    const original = from.getMockImplementation()!
    from.mockImplementation(table =>
      table === 'lesson_test_cases'
        ? {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            range: jest
              .fn()
              .mockResolvedValue({ data: null, count: null, error: { code: '08006' } }),
          }
        : original(table)
    )
    await expect(
      service.checkLesson('lesson-1', 'user-1', 'console.log(1)', 'javascript')
    ).rejects.toMatchObject({ code: 'DATABASE_ERROR' })
    expect(persist).not.toHaveBeenCalled()
  })

  it.each([false, true])(
    'does not expose hidden case input/output/description when a visible case exists: %s',
    async visible => {
      lesson.validation_type = 'stdout'
      lesson.chapters = { language_id: 'python' }
      testCases = [{ id: 'hidden', is_hidden: true }]
      const hidden = {
        testCaseId: 'hidden',
        isHidden: true,
        passed: true,
        actualOutput: 'private-output',
        expectedOutput: 'private-expected',
        error: 'private-error',
        description: 'private-description',
        executionTime: 1,
      }
      const publicCase = {
        ...hidden,
        testCaseId: 'public',
        isHidden: false,
        actualOutput: 'public-output',
        error: null,
        description: 'Visible case',
        passed: false,
      }
      jest.mocked(testRunnerService.runTests).mockResolvedValue({
        testScore: 50,
        results: visible ? [hidden, publicCase] : [hidden],
        totalExecutionTime: 1,
      })
      const result = await service.checkLesson('lesson-1', 'user-1', 'print(input())', 'python')
      expect(result.passed).toBe(false)
      expect(JSON.stringify(result)).not.toContain('private-')
      expect(JSON.stringify(persist.mock.calls)).not.toContain('private-')
      if (visible)
        expect(result.checks).toContainEqual(expect.objectContaining({ label: 'Visible case' }))
    }
  )

  it.each(['rule', 'exact', 'regex'])(
    'does not certify an unconfigured %s lesson',
    async validationType => {
      lesson.validation_type = validationType
      lesson.validation_rules = {}
      const result = await service.checkLesson('lesson-1', 'user-1', 'anything', 'javascript')
      expect(result.passed).toBe(false)
      expect(persist).toHaveBeenCalledWith(
        'record_lesson_check',
        expect.objectContaining({ p_result: expect.objectContaining({ passed: false }) })
      )
    }
  )

  it.each(['returned error', 'thrown error'])(
    'rejects an authenticated check when submission persistence has a %s',
    async failure => {
      if (failure === 'returned error')
        persist.mockResolvedValue({ error: { message: 'private database detail' } })
      else persist.mockRejectedValue(new Error('private database detail'))
      await expect(
        service.checkLesson('lesson-1', 'user-1', 'console.log(1)', 'javascript')
      ).rejects.toThrow('Không lưu được kết quả kiểm tra')
    }
  )

  it('previews anonymous checking without issuing a completion receipt', async () => {
    persist.mockResolvedValue({ error: { message: 'cannot save preview' } })
    const result = await service.checkLesson('lesson-1', null, 'console.log(1)', 'javascript')
    expect(result.passed).toBe(true)
    expect(result.submissionId).toBeUndefined()
    expect(persist).not.toHaveBeenCalled()
  })

  it('accepts an authenticated check only after the receipt transaction resolves', async () => {
    let save: (value: unknown) => void = () => undefined
    persist.mockImplementation(
      () =>
        new Promise(resolve => {
          save = resolve
        })
    )
    let accepted = false
    const check = service
      .checkLesson('lesson-1', 'user-1', 'console.log(1)', 'javascript')
      .then(result => {
        accepted = true
        return result
      })
    await new Promise(resolve => setImmediate(resolve))
    expect(persist).toHaveBeenCalled()
    expect(accepted).toBe(false)
    save({
      data: {
        id: 'check',
        user_id: 'user-1',
        lesson_id: 'lesson-1',
        content_revision: 1,
        passed: true,
      },
      error: null,
    })
    expect((await check).passed).toBe(true)
  })
  it('does not certify only the first capped page of a required test suite', async () => {
    lesson.validation_type = 'stdout'
    testCases = [{ id: 'a' }, { id: 'b' }]
    const original = jest.mocked(supabaseAdmin.from).getMockImplementation()!
    jest.mocked(supabaseAdmin.from).mockImplementation(table =>
      table === 'lesson_test_cases'
        ? ({
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            range: jest.fn(async (start: number) => ({
              data: testCases.slice(start, start + 1),
              count: 2,
              error: null,
            })),
          } as never)
        : original(table)
    )
    jest.mocked(testRunnerService.runTests).mockImplementation(async (_code, cases) => ({
      testScore: cases.length === 2 ? 50 : 100,
      results: [],
      totalExecutionTime: 1,
    }))
    const result = await service.checkLesson('lesson-1', 'user-1', 'console.log(1)', 'javascript')
    expect(result.passed).toBe(false)
    expect(testRunnerService.runTests).toHaveBeenCalledWith(
      expect.anything(),
      [expect.objectContaining({ id: 'a' }), expect.objectContaining({ id: 'b' })],
      'javascript',
      'stdout'
    )
  })
  it('does not issue a receipt when a later test-case page fails', async () => {
    lesson.validation_type = 'stdout'
    const original = jest.mocked(supabaseAdmin.from).getMockImplementation()!
    jest.mocked(supabaseAdmin.from).mockImplementation(table =>
      table === 'lesson_test_cases'
        ? ({
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            range: jest.fn(async (start: number) =>
              start
                ? { data: null, count: null, error: { code: 'Offline' } }
                : { data: [{ id: 'a' }], count: 2, error: null }
            ),
          } as never)
        : original(table)
    )
    await expect(
      service.checkLesson('lesson-1', 'user-1', 'console.log(1)', 'javascript')
    ).rejects.toMatchObject({ code: 'DATABASE_ERROR' })
    expect(persist).not.toHaveBeenCalled()
    expect(testRunnerService.runTests).not.toHaveBeenCalled()
  })
  it('does not record runner infrastructure failure as a wrong attempt', async () => {
    lesson.validation_type = 'stdout'
    testCases = [{ id: 'a' }]
    jest.mocked(testRunnerService.runTests).mockRejectedValue(new RunnerUnavailableError())
    await expect(
      service.checkLesson('lesson-1', 'user-1', 'console.log(1)', 'javascript')
    ).rejects.toMatchObject({ statusCode: 503 })
    expect(persist).not.toHaveBeenCalled()
  })
})
