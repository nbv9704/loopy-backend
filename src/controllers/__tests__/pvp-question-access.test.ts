import { Response } from 'express'
import { AuthRequest } from '../../middleware/auth'
import { getCurrentQuestion } from '../pvp.controller'
import { pvpService } from '../../services/pvp.service'

jest.mock('../../services/pvp.service', () => ({
  pvpService: { getMatch: jest.fn(), getCurrentQuestion: jest.fn(), assertEligible: jest.fn() },
}))
jest.mock('../../db/supabase', () => ({ supabaseAdmin: {} }))
jest.mock('../../utils/logger', () => ({ logger: { info: jest.fn() } }))
const open = {
  id: 'match',
  status: 'in_progress',
  current_question_index: 0,
  question_started_index: 0,
  question_started_at: '2026-10-22T00:00:00Z',
  question_closed_at: null,
  participants: [{ user_id: 'actor' }],
}
beforeEach(() => jest.resetAllMocks())

it.each([
  { ...open, status: 'waiting' },
  { ...open, question_started_at: null },
  { ...open, question_closed_at: '2026-10-22T00:00:30Z' },
  { ...open, question_started_index: 1 },
])('cannot peek at a question before its round opens or after it closes (%j)', async snapshot => {
  jest.mocked(pvpService.getMatch).mockResolvedValue(snapshot as never)
  const next = jest.fn()
  const res = { json: jest.fn() } as unknown as Response
  await getCurrentQuestion(
    { params: { matchId: 'match' }, user: { id: 'actor' } } as unknown as AuthRequest,
    res,
    next
  )
  expect(next).toHaveBeenCalledWith(
    expect.objectContaining({ code: 'PVP_QUESTION_NOT_OPEN', statusCode: 409 })
  )
  expect(pvpService.getCurrentQuestion).not.toHaveBeenCalled()
  expect(res.json).not.toHaveBeenCalled()
})
it.each(
  [[], [{ user_id: 'other' }], [{ user_id: 'actor', left_at: '2026-10-22T00:00:01Z' }]].map(
    participants => ({ participants })
  )
)(
  'rejects outsiders and forfeited participants before reading questions (%j)',
  async ({ participants }) => {
    jest.mocked(pvpService.getMatch).mockResolvedValue({ ...open, participants } as never)
    const next = jest.fn()
    await getCurrentQuestion(
      { params: { matchId: 'match' }, user: { id: 'actor' } } as unknown as AuthRequest,
      { json: jest.fn() } as unknown as Response,
      next
    )
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ code: 'FORBIDDEN' }))
    expect(pvpService.getCurrentQuestion).not.toHaveBeenCalled()
  }
)
it('serves only an open round to its active participant without re-gating an already-started match on points/progress', async () => {
  jest.mocked(pvpService.getMatch).mockResolvedValue(open as never)
  jest.mocked(pvpService.getCurrentQuestion).mockResolvedValue({ id: 'question' } as never)
  const res = { json: jest.fn() } as unknown as Response
  const next = jest.fn()
  await getCurrentQuestion(
    { params: { matchId: 'match' }, user: { id: 'actor' } } as unknown as AuthRequest,
    res,
    next
  )
  expect(res.json).toHaveBeenCalledWith({ success: true, data: { question: { id: 'question' } } })
  expect(pvpService.assertEligible).not.toHaveBeenCalled()
  expect(next).not.toHaveBeenCalled()
})
