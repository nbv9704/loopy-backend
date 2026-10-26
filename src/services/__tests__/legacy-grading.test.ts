import { GradingOrchestratorService } from '../grading-orchestrator.service'
import { supabaseAdmin } from '../../db/supabase'
import { TestRunnerService } from '../test-runner.service'
import { AIAnalyzerService } from '../ai-analyzer.service'

jest.mock('../../db/supabase', () => ({ supabaseAdmin: { from: jest.fn() } }))
const runTests = jest.fn()
const analyzeCode = jest.fn()
const service = new GradingOrchestratorService(
  { runTests } as unknown as TestRunnerService,
  { analyzeCode } as unknown as AIAnalyzerService
)
const params = {
  userId: 'owner',
  exerciseId: 'lesson',
  language: 'javascript',
  code: 'student()',
  lessonTitle: 'Forged',
  starterCode: 'Forged',
  gradingMode: 'stdout' as const,
}

function database(options: { testError?: boolean; saved?: unknown; saveError?: boolean } = {}) {
  const insert = jest.fn().mockReturnThis()
  jest.mocked(supabaseAdmin.from).mockImplementation(table => {
    const q = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      insert,
      maybeSingle: jest.fn().mockResolvedValue({
        data: {
          title: 'Server',
          task_description: 'Task',
          starter_code: 'server()',
          grading_mode: 'function',
          chapters: { language_id: 'javascript' },
        },
        error: null,
      }),
      single: jest.fn().mockResolvedValue({
        data: options.saved === undefined ? { id: 'saved' } : options.saved,
        error: options.saveError ? { message: 'Offline' } : null,
      }),
      range: jest.fn((start: number) =>
        Promise.resolve({
          data: [
            { id: 'first', lesson_id: 'lesson' },
            { id: 'second', lesson_id: 'lesson' },
          ].slice(start, start + 1),
          count: 2,
          error: options.testError ? { message: 'Offline' } : null,
        })
      ),
    }
    expect(['lessons', 'lesson_test_cases', 'lesson_submissions']).toContain(table)
    return q as never
  })
  return { insert }
}
beforeEach(() => {
  jest.resetAllMocks()
  runTests.mockResolvedValue({ testScore: 100, results: [], totalExecutionTime: 1 })
  analyzeCode.mockResolvedValue({ aiScore: 100 })
})
it('uses server grading mode/context even with a client title, and reads every capped test page', async () => {
  const { insert } = database()
  await expect(service.gradeSubmission(params)).resolves.toMatchObject({
    submissionId: 'saved',
    finalScore: 100,
  })
  expect(runTests).toHaveBeenCalledWith(
    'student()',
    expect.arrayContaining([
      expect.objectContaining({ id: 'first' }),
      expect.objectContaining({ id: 'second' }),
    ]),
    'javascript',
    'function'
  )
  expect(analyzeCode).toHaveBeenCalledWith(
    expect.objectContaining({
      exerciseTitle: 'Server',
      exerciseQuestion: 'Task',
      starterCode: 'server()',
    })
  )
  expect(insert).toHaveBeenCalledWith(
    expect.objectContaining({ user_id: 'owner', lesson_id: 'lesson' })
  )
})
it('does not treat a failed test-case read as no configured tests and award an AI-only score', async () => {
  const { insert } = database({ testError: true })
  await expect(service.gradeSubmission(params)).rejects.toMatchObject({ code: 'DATABASE_ERROR' })
  expect(runTests).not.toHaveBeenCalled()
  expect(analyzeCode).not.toHaveBeenCalled()
  expect(insert).not.toHaveBeenCalled()
})
it.each([{ saved: null }, { saved: {} }, { saveError: true }])(
  'requires a persisted submission acknowledgement (%j)',
  async options => {
    database(options)
    await expect(service.gradeSubmission(params)).rejects.toMatchObject({ code: 'DATABASE_ERROR' })
  }
)

it('does not save a zero grade when the runner infrastructure throws', async () => {
  const { insert } = database()
  runTests.mockRejectedValue(new Error('Executor unavailable'))
  await expect(service.gradeSubmission(params)).rejects.toMatchObject({
    statusCode: 503,
    code: 'GRADING_UNAVAILABLE',
  })
  expect(insert).not.toHaveBeenCalled()
})
it('does not save a zero grade for AI-only requests when AI is unavailable', async () => {
  const { insert } = database()
  analyzeCode.mockRejectedValue(new Error('Provider unavailable'))
  await expect(service.gradeSubmission({ ...params, gradingMethod: 'ai' })).rejects.toMatchObject({
    statusCode: 503,
  })
  expect(insert).not.toHaveBeenCalled()
})
it('retains genuine test results if the optional AI analysis fails', async () => {
  database()
  analyzeCode.mockRejectedValue(new Error('Provider unavailable'))
  await expect(service.gradeSubmission(params)).resolves.toMatchObject({
    testScore: 100,
    aiScore: null,
    finalScore: 100,
  })
})
