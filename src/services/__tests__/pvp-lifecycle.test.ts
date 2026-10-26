import { createServer } from 'http'
import { PvPSocketService } from '../pvp-socket.service'
import { pvpService } from '../pvp.service'
import { supabaseAdmin } from '../../db/supabase'
import { logger } from '../../utils/logger'

const mockBroadcast = jest.fn()
const mockPeers = jest.fn().mockResolvedValue([])
jest.mock('socket.io', () => ({
  Server: jest.fn(() => ({
    use: jest.fn(),
    on: jest.fn(),
    to: jest.fn(() => ({ emit: mockBroadcast })),
    in: jest.fn(() => ({ fetchSockets: mockPeers })),
    close: jest.fn(callback => callback()),
  })),
}))
jest.mock('../pvp.service', () => ({
  pvpService: {
    finishMatch: jest.fn(),
    getMatch: jest.fn(),
    joinMatch: jest.fn(),
    getCurrentQuestion: jest.fn(),
    disconnectMatch: jest.fn(),
  },
}))
jest.mock('../../db/supabase', () => ({ supabaseAdmin: { from: jest.fn() } }))
jest.mock('../../utils/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}))
jest.mock('../observability.service', () => ({ observability: { trackPvPEvent: jest.fn() } }))

describe('PvP lifecycle socket boundaries', () => {
  let service: PvPSocketService
  let internal: any
  const participant = { user_id: 'actor', is_connected: true, total_score: 0, final_rank: 1 }
  const match = {
    id: 'match',
    status: 'in_progress',
    time_per_question: 60,
    participants: [participant],
    current_question_index: 0,
    question_ids: ['question'],
  }
  const socket = () => ({
    id: 'socket',
    data: { userId: 'actor', matchId: 'match' as string | undefined },
    emit: jest.fn(),
    join: jest.fn(),
    leave: jest.fn(),
  })
  beforeEach(() => {
    jest.clearAllMocks()
    mockPeers.mockResolvedValue([])
    jest.mocked(pvpService.getMatch).mockResolvedValue(match as any)
    service = new PvPSocketService(createServer())
    internal = service as any
  })
  afterEach(async () => {
    await service.close()
  })

  it('catches rejected disconnect/typing handlers at the registered event boundary', async () => {
    const connection = (service.getIO().on as jest.Mock).mock.calls.find(
      ([event]) => event === 'connection'
    )![1]
    const current = { ...socket(), on: jest.fn() }
    current.data.matchId = '11111111-1111-4111-8111-111111111111'
    connection(current)
    jest.spyOn(internal, 'handleDisconnect').mockRejectedValueOnce(new Error('offline'))
    jest.spyOn(internal, 'handleTypingStart').mockRejectedValueOnce(new Error('not a participant'))
    await current.on.mock.calls.find(([event]) => event === 'typing:start')![1](
      current.data.matchId
    )
    current.on.mock.calls.find(([event]) => event === 'disconnect')![1]()
    await Promise.resolve()
    await Promise.resolve()
    expect(logger.error).toHaveBeenCalledWith('PvP disconnect failed', expect.any(Error))
    expect(current.emit).toHaveBeenCalledWith('error', {
      message: 'Không thể xử lý thao tác PvP. Vui lòng thử lại.',
    })
  })

  it('waits for the transaction before sending completion and uses committed ranks', async () => {
    let resolve!: (data: any) => void
    jest.mocked(pvpService.finishMatch).mockReturnValueOnce(
      new Promise(done => {
        resolve = done
      })
    )
    const pending = internal.completeMatch('match')
    expect(mockBroadcast).not.toHaveBeenCalled()
    expect(pvpService.getMatch).not.toHaveBeenCalled()
    resolve({ changed: true, forfeited: false })
    await pending
    expect(mockBroadcast).toHaveBeenCalledWith('match:completed', {
      match,
      finalScores: [{ userId: 'actor', displayName: 'Anonymous', score: 0, rank: 1 }],
    })
    expect(supabaseAdmin.from).not.toHaveBeenCalled()
  })

  it('does not emit completion or forfeit when saving the result fails', async () => {
    jest.mocked(pvpService.finishMatch).mockRejectedValueOnce(new Error('DB failed'))
    await internal.completeMatch('match', 'actor')
    expect(mockBroadcast.mock.calls.map(([event]) => event)).toEqual(['error'])
    expect(pvpService.getMatch).not.toHaveBeenCalled()
  })

  it('does not notify twice for a completed transaction retry or a stale forfeit', async () => {
    jest.mocked(pvpService.finishMatch).mockResolvedValueOnce({ changed: false, forfeited: false })
    await internal.completeMatch('match', 'actor')
    expect(mockBroadcast).not.toHaveBeenCalled()
  })

  it('keeps a multi-player match open after one accepted forfeit', async () => {
    jest.mocked(pvpService.finishMatch).mockResolvedValueOnce({ changed: false, forfeited: true })
    jest.mocked(pvpService.getMatch).mockResolvedValueOnce({
      ...match,
      participants: [
        { ...participant, is_connected: false, left_at: 'now' },
        { ...participant, user_id: 'other' },
      ],
    } as any)
    const restart = jest.spyOn(internal, 'startQuestion').mockResolvedValue(undefined)
    await internal.completeMatch('match', 'actor')
    expect(mockBroadcast.mock.calls.some(([event]) => event === 'match:completed')).toBe(false)
    expect(mockBroadcast.mock.calls.some(([event]) => event === 'match:forfeit')).toBe(true)
    expect(restart).toHaveBeenCalledWith('match')
  })

  it('keeps the participant connected when another tab is still in the room', async () => {
    mockPeers.mockResolvedValueOnce([{ id: 'other-tab', data: { userId: 'actor' } }])
    await internal.handleDisconnect(socket())
    expect(pvpService.disconnectMatch).not.toHaveBeenCalled()
    expect(mockBroadcast).not.toHaveBeenCalled()
  })

  it('resolves room codes to the joined UUID before leaving', async () => {
    const current = socket()
    const disconnect = jest.spyOn(internal, 'handleDisconnect').mockResolvedValue(undefined)
    await internal.handleMatchLeave(current, 'ROOM01')
    expect(pvpService.getMatch).toHaveBeenCalledWith('ROOM01')
    expect(current.leave).toHaveBeenCalledWith('match')
    expect(disconnect).toHaveBeenCalledWith(current)
    expect(current.data.matchId).toBeUndefined()
  })

  it('cannot use a leave event to affect another room', async () => {
    jest.mocked(pvpService.getMatch).mockResolvedValueOnce({ ...match, id: 'another' } as any)
    const current = socket()
    await internal.handleMatchLeave(current, 'another')
    expect(current.leave).not.toHaveBeenCalled()
    expect(pvpService.disconnectMatch).not.toHaveBeenCalled()
    expect(current.data.matchId).toBe('match')
  })

  it('existing socket members still pass the ended/forfeited join guard', async () => {
    jest.mocked(pvpService.joinMatch).mockRejectedValueOnce(new Error('Match has ended'))
    const current = socket()
    await internal.handleMatchJoin(current, 'ROOM01')
    expect(pvpService.joinMatch).toHaveBeenCalledWith('match', 'actor')
    expect(current.join).not.toHaveBeenCalled()
    expect(supabaseAdmin.from).not.toHaveBeenCalled()
  })

  it('restores the active question and only the reconnecting users saved score metadata', async () => {
    const saved = { id: 'submission', question_id: 'question', user_id: 'actor', points_earned: 50 }
    const chain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: saved, error: null }),
    }
    ;(supabaseAdmin.from as jest.Mock).mockReturnValue(chain)
    jest.mocked(pvpService.joinMatch).mockResolvedValueOnce(participant as any)
    jest.mocked(pvpService.getCurrentQuestion).mockResolvedValueOnce({ id: 'question' } as any)
    internal.questionStartTimes.set('match', Date.now() - 5000)
    const current = socket()
    await internal.handleMatchJoin(current, 'ROOM01')
    expect(current.emit).toHaveBeenCalledWith(
      'match:question_changed',
      expect.objectContaining({ submission: saved, timeRemaining: expect.any(Number) })
    )
    expect(chain.eq).toHaveBeenCalledWith('user_id', 'actor')
    expect(chain.select.mock.calls[0][0]).not.toMatch(/selected_answer|test_results|code/)
    expect(mockBroadcast.mock.calls.some(([event]) => event === 'match:question_changed')).toBe(
      false
    )
  })

  it('does not start a join after the socket disconnected during lookup', async () => {
    let resolve!: (value: any) => void
    jest.mocked(pvpService.getMatch).mockReturnValueOnce(
      new Promise(done => {
        resolve = done
      })
    )
    const current = { ...socket(), disconnected: false }
    const pending = internal.handleMatchJoin(current, 'ROOM01')
    current.disconnected = true
    resolve(match)
    await pending
    expect(pvpService.joinMatch).not.toHaveBeenCalled()
    expect(current.join).not.toHaveBeenCalled()
  })

  it('runs normal disconnect compensation if membership commits after the socket disconnects', async () => {
    let resolve!: (value: any) => void
    jest.mocked(pvpService.joinMatch).mockReturnValueOnce(
      new Promise(done => {
        resolve = done
      })
    )
    const disconnect = jest.spyOn(internal, 'handleDisconnect').mockResolvedValue(undefined)
    const current = { ...socket(), disconnected: false }
    const pending = internal.handleMatchJoin(current, 'ROOM01')
    await Promise.resolve()
    current.disconnected = true
    resolve(participant)
    await pending
    expect(disconnect).toHaveBeenCalledWith(current)
    expect(current.join).not.toHaveBeenCalled()
    expect(current.data.matchId).toBeUndefined()
  })
})
