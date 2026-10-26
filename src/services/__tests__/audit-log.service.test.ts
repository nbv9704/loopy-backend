import { AuditLogService } from '../audit-log.service'
import { supabaseAdmin } from '../../db/supabase'
jest.mock('../../db/supabase', () => ({ supabaseAdmin: { from: jest.fn() } }))
jest.mock('../../utils/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}))
function fixture(data: unknown, count: number | null, error: unknown = null) {
  const q = {
    select: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    range: jest.fn().mockResolvedValue({ data, count, error }),
    insert: jest.fn().mockResolvedValue({ error }),
  }
  jest.mocked(supabaseAdmin.from).mockReturnValue(q as never)
  return q
}
beforeEach(() => jest.resetAllMocks())
it.each([
  [null, 0, null],
  [[], null, null],
  [[], 2, null],
  [[], 0, { message: 'private' }],
])('does not disguise a broken audit read as empty (%#)', async (data, count, error) => {
  fixture(data, count as number | null, error)
  await expect(AuditLogService.getLogs()).rejects.toMatchObject({
    code: 'DATABASE_ERROR',
    details: undefined,
  })
})
it('uses deterministic pagination and allows a confirmed empty page', async () => {
  const q = fixture([], 0)
  await expect(
    AuditLogService.getLogs({ action: 'update', resourceType: 'content_item' })
  ).resolves.toEqual({ data: [], count: 0 })
  expect(q.order).toHaveBeenCalledWith('id', { ascending: false })
  expect(q.range).toHaveBeenCalledWith(0, 49)
  expect(q.eq.mock.calls).toEqual([
    ['action', 'update'],
    ['resource_type', 'content_item'],
  ])
})
it('keeps audit writes best effort after the business operation committed', async () => {
  fixture(null, null, { message: 'audit unavailable' })
  await expect(
    AuditLogService.logAction({ adminId: 'admin', action: 'create', resourceType: 'lesson' })
  ).resolves.toBeUndefined()
})
