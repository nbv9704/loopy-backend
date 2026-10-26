import { createServer } from 'http'
import { PvPSocketService } from '../pvp-socket.service'
import { supabaseAdmin } from '../../db/supabase'
import type { PvPSubmission } from '../../types/pvp.types'

const mockBroadcast = jest.fn()
jest.mock('socket.io', () => ({ Server: jest.fn(() => ({ use: jest.fn(), on: jest.fn(),
  to: jest.fn(() => ({ emit: mockBroadcast })), close: jest.fn(callback => callback()) })) }))
jest.mock('../pvp.service', () => ({ pvpService: {} }))
jest.mock('../../db/supabase', () => ({ supabaseAdmin: { from: jest.fn(), rpc: jest.fn() } }))
jest.mock('../../utils/logger', () => ({ logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() } }))
jest.mock('../observability.service', () => ({ observability: { trackPvPEvent: jest.fn() } }))

type Internals = {
  notifySubmission: (socket: unknown, submission: PvPSubmission, feedback: boolean) => Promise<void>
  endQuestion: (matchId: string, expectedIndex: number) => Promise<void>
  matchTimers: Map<string, NodeJS.Timeout>
}
const submission = { id: 'saved', match_id: 'match', user_id: 'actor', question_id: 'question',
  submission_type: 'multiple_choice', selected_answer: 'B', code: 'secret', test_results: [{ passed: true }],
  is_correct: true, points_earned: 60, time_taken: 2, submission_rank: 1, submitted_at: 'now',
  _correct_answer_id: 'B', _replayed: false, _question_index: 0, _participant_count: 2, _submission_count: 2,
} as PvPSubmission

describe('PvP socket submission delivery', () => {
  let service: PvPSocketService
  let internals: Internals
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    service = new PvPSocketService(createServer())
    internals = service as unknown as Internals
  })
  afterEach(async () => { await service.close(); jest.useRealTimers() })

  it('broadcasts only score metadata and sends answer feedback only to its sender', async () => {
    const socket = { emit: jest.fn() }
    await internals.notifySubmission(socket, submission, true)
    const received = mockBroadcast.mock.calls.find(([event]) => event === 'submission:received')![1]
    expect(received).toEqual({ id: 'saved', match_id: 'match', user_id: 'actor', question_id: 'question',
      submission_type: 'multiple_choice', is_correct: true, points_earned: 60, time_taken: 2, submission_rank: 1, submitted_at: 'now' })
    expect(socket.emit).toHaveBeenCalledWith('submission:feedback', { questionId: 'question', correctAnswerId: 'B' })
    expect(mockBroadcast.mock.calls.some(([event]) => event === 'submission:feedback')).toBe(false)
  })

  it('acknowledges retries privately without another broadcast or round transition', async () => {
    const socket = { emit: jest.fn() }
    const end = jest.spyOn(internals, 'endQuestion').mockResolvedValue()
    await internals.notifySubmission(socket, { ...submission, _replayed: true }, true)
    await jest.advanceTimersByTimeAsync(3000)
    expect(socket.emit).toHaveBeenCalledWith('submission:received', expect.objectContaining({ id: 'saved' }))
    expect(mockBroadcast).not.toHaveBeenCalled()
    expect(end).not.toHaveBeenCalled()
  })

  it('keeps the deadline timer and carries the original round index to delayed transitions', async () => {
    const timer = setTimeout(() => {}, 60000)
    internals.matchTimers.set('match', timer)
    const end = jest.spyOn(internals, 'endQuestion').mockResolvedValue()
    await internals.notifySubmission({ emit: jest.fn() }, submission, false)
    expect(internals.matchTimers.get('match')).toBe(timer)
    await jest.advanceTimersByTimeAsync(2000)
    expect(end).toHaveBeenCalledWith('match', 0)
  })

  it('ignores an old round callback without clearing the new round timer', async () => {
    const timer = setTimeout(() => {}, 60000)
    internals.matchTimers.set('match', timer)
    const chain = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: { status: 'in_progress', current_question_index: 1 }, error: null }) }
    ;(supabaseAdmin.from as jest.Mock).mockReturnValue(chain)
    await internals.endQuestion('match', 0)
    expect(supabaseAdmin.rpc).not.toHaveBeenCalled()
    expect(internals.matchTimers.get('match')).toBe(timer)
    expect(mockBroadcast).not.toHaveBeenCalled()
  })
})
