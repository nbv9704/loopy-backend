import { PracticeService } from '../practice.service'
import { supabaseAdmin } from '../../db/supabase'

jest.mock('../../db/supabase', () => ({ supabaseAdmin: { from: jest.fn(), rpc: jest.fn() } }))
jest.mock('../../utils/contentModeration', () => ({ validateContent: jest.fn() }))

describe('PracticeService transaction adapter', () => {
  const service = new PracticeService()
  const rpc = supabaseAdmin.rpc as jest.Mock
  beforeEach(() => {
    jest.resetAllMocks()
    const from = supabaseAdmin.from as jest.Mock
    from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    })
  })
  it('commits in a single RPC, then reads only feedback for that submitted question', async () => {
    rpc.mockResolvedValue({
      data: {
        submission: {
          id: 'submission',
          attempt_id: 'attempt',
          question_id: 'question',
          user_id: 'actor',
          submitted_at: '2026-10-24T00:00:00Z',
          is_correct: true,
          points_earned: 10,
          correct_answer: 'private',
        },
        attempt: {
          id: 'attempt',
          set_id: 'set',
          user_id: 'actor',
          score: 10,
          max_score: 10,
          started_at: '2026-10-24T00:00:00Z',
          status: 'completed',
        },
      },
      error: null,
    })
    const result = await service.submit('attempt', 'question', 'actor', { selectedAnswer: 'true' })
    expect(rpc).toHaveBeenCalledWith('submit_practice_answer_atomically', {
      p_attempt_id: 'attempt',
      p_question_id: 'question',
      p_actor_id: 'actor',
      p_answer: 'true',
      p_code: null,
    })
    expect(supabaseAdmin.from).toHaveBeenCalledWith('practice_questions')
    const read = (supabaseAdmin.from as jest.Mock).mock.results[0].value
    expect(read.select).toHaveBeenCalledWith('explanation')
    expect(read.eq).toHaveBeenCalledWith('id', 'question')
    expect(read.eq).toHaveBeenCalledWith('set_id', 'set')
    expect(result.submission).not.toHaveProperty('correct_answer')
    expect(result.attempt.score).toBe(10)
  })
  it.each(['PGRST202', '42883'])(
    'fails clearly without unsafe fallback if the RPC is missing (%s)',
    async code => {
      rpc.mockResolvedValue({ data: null, error: { code } })
      await expect(
        service.submit('attempt', 'question', 'actor', { selectedAnswer: 'true' })
      ).rejects.toMatchObject({ statusCode: 503, code: 'SCHEMA_NOT_READY' })
      expect(supabaseAdmin.from).not.toHaveBeenCalled()
    }
  )
  it.each([
    ['42501', 403],
    ['P0002', 404],
    ['22023', 400],
    ['XX000', 500],
  ])('maps SQLSTATE %s to HTTP %s', async (code, status) => {
    rpc.mockResolvedValue({
      data: null,
      error: { code, message: code === 'XX000' ? 'private database detail' : 'Rejected' },
    })
    await expect(
      service.submit('attempt', 'question', 'actor', { selectedAnswer: 'true' })
    ).rejects.toMatchObject({ statusCode: status })
  })
  it('rejects a missing answer before the transaction', async () => {
    await expect(service.submit('attempt', 'question', 'actor', {})).rejects.toMatchObject({
      statusCode: 400,
    })
    expect(rpc).not.toHaveBeenCalled()
  })
  it('creates a set and its questions using one RPC, without delete/compensation queries', async () => {
    const savedId = '11111111-1111-4111-8111-111111111111'
    rpc.mockResolvedValue({ data: savedId, error: null })
    const getSet = jest.spyOn(service, 'getSet').mockResolvedValue({ id: savedId } as never)
    try {
      await service.createSet(
        {
          title: 'Quiz',
          questions: [{ type: 'true_false', prompt: 'Question', correctAnswer: 'true' }],
        },
        'actor'
      )
      expect(rpc).toHaveBeenCalledWith(
        'save_practice_set_atomically',
        expect.objectContaining({
          p_actor_id: 'actor',
          p_set_id: null,
          p_payload: expect.objectContaining({
            questions: [expect.objectContaining({ correct_answer: 'true', order_index: 0 })],
          }),
        })
      )
      expect(supabaseAdmin.from).not.toHaveBeenCalled()
    } finally {
      getSet.mockRestore()
    }
  })
})
