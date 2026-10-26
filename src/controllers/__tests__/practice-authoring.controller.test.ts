import { createSet } from '../admin/practice.controller'
import { practiceService } from '../../services/practice.service'
import { AuditLogService } from '../../services/audit-log.service'
import type { AuthRequest } from '../../middleware/auth'
import type { Response } from 'express'
jest.mock('../../services/practice.service', () => ({ practiceService: { createSet: jest.fn() } }))
jest.mock('../../services/audit-log.service', () => ({ AuditLogService: { logAction: jest.fn() } }))
beforeEach(() => jest.resetAllMocks())
it.each(['public', 'private', 'unlisted', 'official'])(
  'respects the admin explicit %s visibility instead of forcing official',
  async visibility => {
    jest
      .mocked(practiceService.createSet)
      .mockResolvedValue({ id: 'set', title: 'Quiz', questions: [] } as never)
    const req = {
      user: { id: 'admin' },
      body: { title: 'Quiz', visibility },
      get: jest.fn(),
    } as unknown as AuthRequest
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as unknown as Response
    const next = jest.fn()
    await createSet(req, res, next)
    expect(practiceService.createSet).toHaveBeenCalledWith(
      expect.objectContaining({ visibility }),
      'admin',
      true
    )
    expect(AuditLogService.logAction).toHaveBeenCalledTimes(1)
    expect(next).not.toHaveBeenCalled()
  }
)
it('defaults new admin sets to official when no visibility is supplied', async () => {
  jest
    .mocked(practiceService.createSet)
    .mockResolvedValue({ id: 'set', title: 'Quiz', questions: [] } as never)
  const req = {
    user: { id: 'admin' },
    body: { title: 'Quiz' },
    get: jest.fn(),
  } as unknown as AuthRequest
  await createSet(
    req,
    { status: jest.fn().mockReturnThis(), json: jest.fn() } as unknown as Response,
    jest.fn()
  )
  expect(practiceService.createSet).toHaveBeenCalledWith(
    expect.objectContaining({ visibility: 'official' }),
    'admin',
    true
  )
})
