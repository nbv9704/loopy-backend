import { pvpService } from '../pvp.service'
import { supabaseAdmin } from '../../db/supabase'
import { testRunnerService } from '../test-runner.service'
import { pvpTransactions } from '../pvp/transactions'

jest.mock('../../db/supabase', () => ({ supabaseAdmin: { rpc: jest.fn(), from: jest.fn() } }))
jest.mock('../test-runner.service', () => ({ testRunnerService: { runTests: jest.fn() } }))
jest.mock('../../utils/logger', () => ({ logger: { info: jest.fn(), error: jest.fn() } }))
const rpc = supabaseAdmin.rpc as jest.Mock
const savedSubmission = {
  id: 'saved', match_id: 'match', user_id: 'actor', question_id: 'question',
  submission_type: 'multiple_choice', is_correct: true, points_earned: 60, time_taken: 3,
  submitted_at: '2026-10-21T00:00:00Z', _replayed: false, _question_index: 0, _participant_count: 2, _submission_count: 1,
}

describe('PvP submission transaction adapter', () => {
  beforeEach(() => jest.clearAllMocks())

  it('uses the join transaction result and only reads profile decoration afterward', async () => {
    rpc.mockResolvedValue({ data: { id: 'participant', match_id: 'match', user_id: 'actor', is_connected: true,
      joined_at: '2026-10-21T00:00:00Z' }, error: null })
    const chain = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), single: jest.fn().mockResolvedValue({ data: { display_name: 'Learner' } }) }
    ;(supabaseAdmin.from as jest.Mock).mockReturnValue(chain)
    await expect(pvpService.joinMatch('match', 'actor')).resolves.toMatchObject({ id: 'participant', display_name: 'Learner' })
    expect(rpc).toHaveBeenCalledWith('join_pvp_match_atomically', { p_match_id: 'match', p_actor_id: 'actor' })
    expect(supabaseAdmin.from).toHaveBeenCalledTimes(1)
    expect(supabaseAdmin.from).toHaveBeenCalledWith('user_profiles')
  })

  it.each(['markReady', 'disconnectMatch', 'finishMatch'] as const)('%s fails closed for a missing schema RPC', async method => {
    rpc.mockResolvedValue({ data: null, error: { code: 'PGRST202' } })
    await expect(pvpService[method]('match', 'actor')).rejects.toMatchObject({ statusCode: 503, code: 'SCHEMA_NOT_READY' })
    expect(supabaseAdmin.from).not.toHaveBeenCalled()
  })

  it.each(['markReady', 'disconnectMatch', 'finishMatch'] as const)('%s rejects malformed transaction acknowledgements', async method => {
    rpc.mockResolvedValue({ data: {}, error: null })
    await expect(pvpService[method]('match', 'actor')).rejects.toMatchObject({ code: 'DATABASE_ERROR' })
  })

  it('delegates answer scoring and timing entirely to the atomic RPC', async () => {
    rpc.mockResolvedValue({ data: savedSubmission, error: null })
    await expect(pvpService.submitAnswer('match', 'actor', 'question', 'B', -999)).resolves.toMatchObject({ id: 'saved' })
    expect(supabaseAdmin.rpc).toHaveBeenCalledTimes(1)
    expect(supabaseAdmin.rpc).toHaveBeenCalledWith('submit_pvp_answer_atomically', {
      p_match_id: 'match', p_actor_id: 'actor', p_question_id: 'question',
      p_payload: { submission_type: 'multiple_choice', selected_answer: 'B' },
    })
    expect(supabaseAdmin.from).not.toHaveBeenCalled()
  })

  it.each(['PGRST202', '42883'])('fails closed when the RPC is unavailable (%s)', async code => {
    rpc.mockResolvedValue({ data: null, error: { code } })
    await expect(pvpService.submitAnswer('match', 'actor', 'question', 'B', 0)).rejects.toMatchObject({ statusCode: 503, code: 'SCHEMA_NOT_READY' })
    expect(supabaseAdmin.from).not.toHaveBeenCalled()
  })

  it.each([['42501', 403], ['P0002', 404], ['22023', 400], ['XX000', 500]])('maps database failure %s without a second write', async (code, statusCode) => {
    rpc.mockResolvedValue({ data: null, error: { code } })
    const result = pvpService.submitAnswer('match', 'actor', 'question', 'B', 0)
    await expect(result).rejects.toMatchObject({ statusCode })
    if (code === '22023') {
      await expect(result).rejects.toMatchObject({
        message: 'Câu hỏi đã đóng hoặc đáp án không hợp lệ.',
      })
    }
    expect(supabaseAdmin.rpc).toHaveBeenCalledTimes(1)
  })

  it('does not report success for an empty RPC result', async () => {
    rpc.mockResolvedValue({ data: null, error: null })
    await expect(pvpService.submitAnswer('match', 'actor', 'question', 'B', 0)).rejects.toMatchObject({ code: 'DATABASE_ERROR' })
  })

  it.each([{ ...savedSubmission, _submission_count: -1 }, { ...savedSubmission, is_correct: null }, { id: 'saved', points_earned: 60 }])('rejects incomplete or impossible submission acknowledgements', async data => {
    rpc.mockResolvedValue({ data, error: null })
    await expect(pvpService.submitAnswer('match', 'actor', 'question', 'B', 0)).rejects.toMatchObject({ code: 'DATABASE_ERROR' })
  })

  it('exposes score metadata without returning private submission content', async () => {
    rpc.mockResolvedValue({ data: { ...savedSubmission, selected_answer: 'B', code: 'private code', test_results: [{ expected: 'secret' }] }, error: null })
    const result = await pvpService.submitAnswer('match', 'actor', 'question', 'B', 0)
    expect(result).toEqual(savedSubmission)
  })

  it('validates round opening time before scheduling a question', async () => {
    rpc.mockResolvedValueOnce({ data: { changed: true }, error: null })
      .mockResolvedValueOnce({ data: { changed: true, started_at: '2026-10-21T00:00:00+00:00' }, error: null })
      .mockResolvedValueOnce({ data: { changed: false }, error: null })
    await expect(pvpTransactions.setPhase('match', 0, true)).rejects.toMatchObject({ code: 'DATABASE_ERROR' })
    await expect(pvpTransactions.setPhase('match', 0, true)).resolves.toMatchObject({ changed: true })
    await expect(pvpTransactions.setPhase('match', 0, false)).resolves.toEqual({ changed: false })
  })

  it.each(['', ' '.repeat(5), 'A'.repeat(5001)])('rejects invalid answers before accessing the database', async answer => {
    await expect(pvpService.submitAnswer('match', 'actor', 'question', answer, 0)).rejects.toMatchObject({ statusCode: 400 })
    expect(supabaseAdmin.rpc).not.toHaveBeenCalled()
  })

  it.each([
    { type: 'multiple_choice', test_cases: [{ input: [], expected: true }] },
    { type: 'code_challenge', test_cases: [] },
  ])('rejects code against answer questions or absent tests before execution', async question => {
    const chain = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), single: jest.fn().mockResolvedValue({ data: question, error: null }) }
    ;(supabaseAdmin.from as jest.Mock).mockReturnValue(chain)
    await expect(pvpService.submitCode('match', 'actor', 'question', 'true', 0)).rejects.toMatchObject({ statusCode: 400 })
    expect(testRunnerService.runTests).not.toHaveBeenCalled()
    expect(supabaseAdmin.rpc).not.toHaveBeenCalled()
  })
})
