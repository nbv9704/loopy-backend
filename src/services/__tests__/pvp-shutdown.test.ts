import { createServer } from 'http'
import { PvPSocketService } from '../pvp-socket.service'
import { supabaseAdmin } from '../../db/supabase'

jest.mock('socket.io', () => ({ Server: jest.fn(() => ({ use: jest.fn(), on: jest.fn(), close: jest.fn(callback => callback()) })) }))
jest.mock('../pvp.service', () => ({ pvpService: {} }))
jest.mock('../../db/supabase', () => ({ supabaseAdmin: { from: jest.fn() } }))
jest.mock('../../utils/logger', () => ({ logger: { info: jest.fn(), error: jest.fn() } }))
jest.mock('../observability.service', () => ({ observability: { trackPvPEvent: jest.fn() } }))

describe('PvP shutdown lifecycle', () => {
  it('cancels scheduled writes and ignores shutdown disconnects', async () => {
    jest.useFakeTimers()
    try {
      const service = new PvPSocketService(createServer())
      const lifecycle = service as unknown as {
        schedule: (callback: () => void, delay: number) => void
        handleDisconnect: (socket: { data: { userId: string; matchId: string } }) => Promise<void>
      }
      const write = jest.fn()
      lifecycle.schedule(write, 3000)
      await service.close()
      lifecycle.schedule(write, 1000)
      await lifecycle.handleDisconnect({ data: { userId: 'user', matchId: 'match' } })
      jest.advanceTimersByTime(5000)
      expect(write).not.toHaveBeenCalled()
      expect(supabaseAdmin.from).not.toHaveBeenCalled()
    } finally { jest.useRealTimers() }
  })
})
