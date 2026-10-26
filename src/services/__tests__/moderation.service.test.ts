import { moderationService } from '../moderation.service'
import { supabaseAdmin } from '../../db/supabase'
import { clearKeywordCache } from '../../utils/contentModeration'
import { moderationSchemas } from '../../schemas/moderation.schemas'

jest.mock('../../db/supabase', () => ({ supabaseAdmin: { from: jest.fn() } }))
jest.mock('../../utils/contentModeration', () => ({ clearKeywordCache: jest.fn() }))
const row = { id: 'id', keyword: 'blocked', category: 'general', language: 'all', is_active: true }
function fixture(data: unknown = row, error: unknown = null) {
  const q = {
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data, error }),
    maybeSingle: jest.fn().mockResolvedValue({ data, error }),
  }
  jest.mocked(supabaseAdmin.from).mockReturnValue(q as never)
  return q
}
beforeEach(() => jest.resetAllMocks())
it('normalizes create and relies on the database unique constraint, not a racy preflight', async () => {
  const q = fixture()
  await expect(moderationService.create({ keyword: ' Blocked ' }, 'admin')).resolves.toEqual(row)
  expect(q.insert).toHaveBeenCalledWith({
    keyword: 'blocked',
    category: 'general',
    language: 'all',
    created_by: 'admin',
  })
  expect(supabaseAdmin.from).toHaveBeenCalledTimes(1)
})
it('a uniqueness race returns 409 without leaking database details', async () => {
  fixture(null, { code: '23505', message: 'private SQL' })
  await expect(moderationService.create({ keyword: 'blocked' }, 'admin')).rejects.toMatchObject({
    statusCode: 409,
    code: 'KEYWORD_EXISTS',
    details: undefined,
  })
})
it('does not report a missing or mismatched create acknowledgement as saved', async () => {
  fixture({ ...row, keyword: 'other' })
  await expect(moderationService.create({ keyword: 'blocked' }, 'admin')).rejects.toMatchObject({
    code: 'DATABASE_ERROR',
  })
})
it('compares the displayed state inside the update and reports a stale state as conflict', async () => {
  const q = fixture(null)
  await expect(
    moderationService.update('id', { is_active: false, expectedActive: true })
  ).rejects.toMatchObject({ code: 'KEYWORD_CHANGED' })
  expect(q.eq.mock.calls).toEqual([
    ['id', 'id'],
    ['is_active', true],
  ])
  expect(q.update).toHaveBeenCalledWith({ is_active: false })
})
it('a successful toggle returns the acknowledged row', async () => {
  fixture({ ...row, is_active: false })
  await expect(
    moderationService.update('id', { is_active: false, expectedActive: true })
  ).resolves.toMatchObject({ is_active: false })
})
it('delete verifies the affected row; an already missing row is not a successful deletion', async () => {
  fixture(null)
  await expect(moderationService.remove('id')).rejects.toMatchObject({ statusCode: 404 })
})
it('a rejected transport invalidates cache because the write may have committed', async () => {
  const q = fixture()
  q.maybeSingle.mockRejectedValue(new Error('network'))
  await expect(moderationService.remove('id')).rejects.toMatchObject({
    code: 'DATABASE_ERROR',
    details: undefined,
    message: 'Không xác nhận được thao tác. Hãy tải lại danh sách trước khi thử lại.',
  })
  expect(clearKeywordCache).toHaveBeenCalledTimes(1)
})
it('rejects empty updates, predicate-only updates and unknown fields, but preserves false', () => {
  const params = { id: '11111111-1111-4111-8111-111111111111' }
  for (const body of [{}, { expectedActive: true }, { unexpected: 'x' }])
    expect(moderationSchemas.updateKeyword.safeParse({ params, body }).success).toBe(false)
  expect(
    moderationSchemas.updateKeyword.parse({
      params,
      body: { is_active: false, expectedActive: true },
    }).body.is_active
  ).toBe(false)
})
