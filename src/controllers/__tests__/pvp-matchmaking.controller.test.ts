import { Response } from 'express'
import { AuthRequest } from '../../middleware/auth'
import { findMatch } from '../pvp.controller'
import { pvpService } from '../../services/pvp.service'
import { supabaseAdmin } from '../../db/supabase'

jest.mock('../../services/pvp.service', () => ({ pvpService: { findMatch: jest.fn() } }))
jest.mock('../../db/supabase', () => ({ supabaseAdmin: { from: jest.fn() } }))
jest.mock('../../utils/logger', () => ({ logger: { warn: jest.fn() } }))

beforeEach(() => jest.resetAllMocks())
it.each([false, true])(
  'returns the committed snapshot and only notifies for a new membership (replay=%s)',
  async replayed => {
    const emit = jest.fn()
    const req = {
      user: { id: 'actor' },
      body: { mode: '1v1' },
      app: { get: () => ({ to: () => ({ emit }) }) },
    } as unknown as AuthRequest
    const res = { json: jest.fn() } as unknown as Response
    const next = jest.fn()
    const result = {
      match: { id: 'match', room_code: 'ROOM01' },
      participant: { user_id: 'actor' },
      replayed,
    }
    jest.mocked(pvpService.findMatch).mockResolvedValue(result as never)
    await findMatch(req, res, next)
    expect(pvpService.findMatch).toHaveBeenCalledWith('actor', req.body)
    expect(supabaseAdmin.from).not.toHaveBeenCalled()
    expect(emit).toHaveBeenCalledTimes(replayed ? 0 : 1)
    expect(res.json).toHaveBeenCalledWith({ success: true, data: { match: result.match } })
    expect(next).not.toHaveBeenCalled()
  }
)

it('does not turn a committed match into a failed HTTP response when notification fails', async () => {
  const req = {
    user: { id: 'actor' },
    body: {},
    app: {
      get: () => {
        throw new Error('socket transport stopped')
      },
    },
  } as unknown as AuthRequest
  const res = { json: jest.fn() } as unknown as Response
  const next = jest.fn()
  jest
    .mocked(pvpService.findMatch)
    .mockResolvedValue({ match: { id: 'match' }, participant: {}, replayed: false } as never)
  await findMatch(req, res, next)
  expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }))
  expect(next).not.toHaveBeenCalled()
})
