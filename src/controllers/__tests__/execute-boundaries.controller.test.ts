import type { Response } from 'express'
import { executeCode, validateCode } from '../execute.controller'
import { executeCode as runProgram } from '../../services/codeExecution.service'
import { lessonCheckService } from '../../services/lesson-check.service'
import { supabaseAdmin } from '../../db/supabase'
import { RunnerUnavailableError } from '../../services/execution/errors'
jest.mock('../../services/codeExecution.service', () => ({ executeCode: jest.fn() }))
jest.mock('../../services/lesson-check.service', () => ({
  lessonCheckService: { checkLesson: jest.fn() },
}))
jest.mock('../../db/supabase', () => ({ supabaseAdmin: { from: jest.fn() } }))
jest.mock('../../utils/logger', () => ({ logger: { error: jest.fn(), warn: jest.fn() } }))
beforeEach(() => jest.resetAllMocks())
const request = () =>
  ({
    body: { exerciseId: 'lesson', language: 'javascript', code: 'source' },
    user: { id: 'owner' },
  }) as never
async function invoke(handler: typeof executeCode) {
  const json = jest.fn(),
    next = jest.fn()
  await handler(request(), { json } as unknown as Response, next)
  return { json, next }
}
it('forwards runner infrastructure failure without logging a fake execution result', async () => {
  jest.mocked(runProgram).mockRejectedValue(new RunnerUnavailableError())
  const { json, next } = await invoke(executeCode)
  expect(json).not.toHaveBeenCalled()
  expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 503 }))
  expect(supabaseAdmin.from).not.toHaveBeenCalled()
})
it('keeps a valid run successful even if optional execution logging fails', async () => {
  jest.mocked(runProgram).mockResolvedValue({ output: '0', error: null, executionTime: 0 })
  jest.mocked(supabaseAdmin.from).mockReturnValue({
    insert: jest.fn().mockResolvedValue({ error: { message: 'Offline' } }),
  } as never)
  const { json, next } = await invoke(executeCode)
  expect(next).not.toHaveBeenCalled()
  expect(json).toHaveBeenCalledWith({
    success: true,
    data: { output: '0', error: null, executionTime: 0 },
  })
})
function lesson(data: unknown, error: unknown = null) {
  jest.mocked(supabaseAdmin.from).mockReturnValue({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue({ data, error }),
  } as never)
}
it('the validation compatibility route handles an array chapter relation and preserves the saved receipt', async () => {
  lesson({ id: 'lesson', chapters: [{ language_id: 'python' }] })
  jest.mocked(lessonCheckService.checkLesson).mockResolvedValue({
    passed: true,
    score: 100,
    output: 'Correct',
    hint: null,
    checks: [],
    submissionId: 'receipt',
  })
  const { json, next } = await invoke(validateCode)
  expect(next).not.toHaveBeenCalled()
  expect(lessonCheckService.checkLesson).toHaveBeenCalledWith('lesson', 'owner', 'source', 'python')
  expect(json.mock.calls[0][0].data).toMatchObject({ submissionId: 'receipt', passed: true })
})
it.each([
  { data: null, error: { code: 'Offline' }, status: 500 },
  { data: null, error: null, status: 404 },
  { data: { chapters: [] }, error: null, status: 500 },
])('does not turn read/configuration errors into a guessed JavaScript check (%j)', async value => {
  lesson(value.data, value.error)
  const { next } = await invoke(validateCode)
  expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: value.status }))
  expect(lessonCheckService.checkLesson).not.toHaveBeenCalled()
})

it('returns the finished run without waiting for optional database telemetry', async () => {
  let release!: (value: unknown) => void
  jest.mocked(runProgram).mockResolvedValue({ output: 'done', error: null, executionTime: 1 })
  jest.mocked(supabaseAdmin.from).mockReturnValue({
    insert: jest.fn().mockReturnValue(
      new Promise(resolve => {
        release = resolve
      })
    ),
  } as never)
  const { json, next } = await invoke(executeCode)
  expect(json).toHaveBeenCalledWith({
    success: true,
    data: { output: 'done', error: null, executionTime: 1 },
  })
  expect(next).not.toHaveBeenCalled()
  release({ error: null })
})
