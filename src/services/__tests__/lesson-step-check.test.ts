import { LessonCheckService } from '../lesson-check.service'
import { supabaseAdmin } from '../../db/supabase'

jest.mock('../../db/supabase', () => ({ supabaseAdmin: { from: jest.fn() } }))
jest.mock('../test-runner.service', () => ({ testRunnerService: { runTests: jest.fn() } }))
jest.mock('../../utils/logger', () => ({ logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() } }))

describe('server-side mini checkpoint', () => {
  const service = new LessonCheckService()
  const chain = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), maybeSingle: jest.fn() }
  beforeEach(() => {
    jest.clearAllMocks()
    ;(supabaseAdmin.from as jest.Mock).mockReturnValue(chain)
  })

  it('scopes the step to its published lesson and returns feedback without the answer key', async () => {
    chain.maybeSingle.mockResolvedValue({ data: { type: 'quiz', correct_answer: ['Hello World', 'hi'], explanation: 'Good' }, error: null })
    await expect(service.checkLessonStep('lesson', 'step', '  HELLO   world ')).resolves.toEqual({ passed: true, message: 'Good' })
    expect(chain.eq.mock.calls).toEqual([['id', 'step'], ['lesson_id', 'lesson'], ['lessons.status', 'published']])
    expect(supabaseAdmin.from).toHaveBeenCalledTimes(1)
    expect(supabaseAdmin.from).toHaveBeenCalledWith('lesson_steps')
  })
  it('returns the hint for a wrong answer without creating a completion or submission', async () => {
    chain.maybeSingle.mockResolvedValue({ data: { type: 'quiz', correct_answer: 'right', hint: 'Try again' }, error: null })
    await expect(service.checkLessonStep('lesson', 'step', 'wrong')).resolves.toEqual({ passed: false, message: 'Try again' })
    expect(supabaseAdmin.from).toHaveBeenCalledTimes(1)
  })
  it.each([null, [], '', '   ', ['', ' ']])('fails closed for an absent/blank answer configuration (%j)', async correct_answer => {
    chain.maybeSingle.mockResolvedValue({ data: { type: 'quiz', correct_answer }, error: null })
    await expect(service.checkLessonStep('lesson', 'step', undefined)).resolves.toMatchObject({ passed: false })
  })
  it.each(['note', 'code_prompt'])('acknowledges informational %s steps without an answer', async type => {
    chain.maybeSingle.mockResolvedValue({ data: { type, correct_answer: null }, error: null })
    await expect(service.checkLessonStep('lesson', 'step', undefined)).resolves.toMatchObject({ passed: true })
  })
  it('does not pass a step absent from the published lesson', async () => {
    chain.maybeSingle.mockResolvedValue({ data: null, error: null })
    await expect(service.checkLessonStep('lesson', 'step', 'anything')).rejects.toMatchObject({ statusCode: 404 })
  })
  it('propagates a database read failure rather than returning a failed quiz', async () => {
    chain.maybeSingle.mockResolvedValue({ data: null, error: { message: 'private DB detail' } })
    await expect(service.checkLessonStep('lesson', 'step', 'anything')).rejects.toMatchObject({ code: 'DATABASE_ERROR' })
  })
})
