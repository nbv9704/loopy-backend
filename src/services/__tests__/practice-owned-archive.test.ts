import { supabaseAdmin } from '../../db/supabase'
import { archiveOwnedPractice } from '../practice/archive'
jest.mock('../../db/supabase', () => ({ supabaseAdmin: { from: jest.fn() } }))
function fixture(data: unknown = { id: 'set', status: 'archived' }, error: unknown = null) {
  const query = {
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue({ data, error }),
  }
  jest.mocked(supabaseAdmin.from).mockReturnValue(query as never)
  return query
}
beforeEach(() => jest.resetAllMocks())
it('binds owner and observed status to the archive write and confirms the selected row', async () => {
  const query = fixture()
  await expect(archiveOwnedPractice('set', 'actor', 'published')).resolves.toEqual({
    success: true,
    data: { id: 'set', status: 'archived' },
  })
  expect(query.eq.mock.calls).toEqual([
    ['id', 'set'],
    ['created_by', 'actor'],
    ['status', 'published'],
  ])
})
it('reports a stale status or missing row as a conflict', async () => {
  fixture(null)
  await expect(archiveOwnedPractice('set', 'actor', 'published')).rejects.toMatchObject({
    code: 'PRACTICE_CHANGED',
    statusCode: 409,
  })
})
it.each([
  { id: 'other', status: 'archived' },
  { id: 'set', status: 'published' },
])('rejects a wrong acknowledgement %#', data => {
  fixture(data)
  return expect(archiveOwnedPractice('set', 'actor', 'published')).rejects.toMatchObject({
    code: 'DATABASE_ERROR',
  })
})
it.each(['error', 'throw'])(
  'does not report success after a failed write response %s',
  async kind => {
    const query = fixture(null, { message: 'private database detail' })
    if (kind === 'throw') query.maybeSingle.mockRejectedValue(new Error('private transport detail'))
    await expect(archiveOwnedPractice('set', 'actor', 'published')).rejects.toMatchObject({
      code: 'DATABASE_ERROR',
    })
  }
)
