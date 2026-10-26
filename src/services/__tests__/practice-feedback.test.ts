import { PracticeService } from '../practice.service'
import { supabaseAdmin } from '../../db/supabase'

jest.mock('../../db/supabase', () => ({ supabaseAdmin: { from: jest.fn(), rpc: jest.fn() } }))
jest.mock('../../utils/contentModeration', () => ({ validateContent: jest.fn() }))
jest.mock('../../utils/logger', () => ({ logger: { warn: jest.fn() } }))

const ack = {
  submission: {
    id: 'saved',
    attempt_id: 'attempt',
    question_id: 'question',
    user_id: 'learner',
    submitted_at: '2026-10-24T00:00:00Z',
    is_correct: true,
    points_earned: 10,
  },
  attempt: {
    id: 'attempt',
    user_id: 'learner',
    set_id: 'set',
    status: 'in_progress',
    score: 10,
    max_score: 10,
    started_at: '2026-10-24T00:00:00Z',
  },
}
const rpc = supabaseAdmin.rpc as jest.Mock
const from = supabaseAdmin.from as jest.Mock
const service = new PracticeService()
const submit = () => service.submit('attempt', 'question', 'learner', { selectedAnswer: 'hello' })

beforeEach(() => jest.resetAllMocks())

it('releases only this question explanation after the actor submission commits', async () => {
  let commit!: (value: unknown) => void
  rpc.mockReturnValue(
    new Promise(resolve => {
      commit = resolve
    })
  )
  const read = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue({
      data: { explanation: 'Saved feedback', correct_answer: 'private' },
      error: null,
    }),
  }
  from.mockReturnValue(read)
  const pending = submit()
  expect(from).not.toHaveBeenCalled()
  commit({ data: ack, error: null })
  const result = await pending
  expect(result.submission.explanation).toBe('Saved feedback')
  expect(JSON.stringify(result)).not.toContain('private')
  expect(read.select).toHaveBeenCalledWith('explanation')
  expect(read.eq).toHaveBeenCalledWith('id', 'question')
  expect(read.eq).toHaveBeenCalledWith('set_id', 'set')
})

it.each(['error', 'throw'])(
  'keeps the committed score successful if optional feedback read fails (%s)',
  async mode => {
    rpc.mockResolvedValue({ data: ack, error: null })
    const maybeSingle =
      mode === 'throw'
        ? jest.fn().mockRejectedValue(new Error('offline'))
        : jest.fn().mockResolvedValue({ data: null, error: { code: '08006' } })
    from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle,
    })
    const result = await submit()
    expect(result.submission).toMatchObject({ isCorrect: true, pointsEarned: 10 })
    expect(result.submission.explanation).toBeUndefined()
    expect(result.attempt.score).toBe(10)
  }
)

it.each([
  { ...ack, attempt: { ...ack.attempt, user_id: 'another-learner' } },
  { ...ack, submission: { ...ack.submission, question_id: 'another-question' } },
])('rejects a mismatched acknowledgement before reading feedback', async data => {
  rpc.mockResolvedValue({ data, error: null })
  await expect(submit()).rejects.toMatchObject({ code: 'DATABASE_ERROR' })
  expect(from).not.toHaveBeenCalled()
})
