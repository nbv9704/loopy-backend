import { AdminContentService as cms } from '../admin-content.service'
import { supabaseAdmin } from '../../db/supabase'

jest.mock('../../db/supabase', () => ({ supabaseAdmin: { from: jest.fn(), rpc: jest.fn() } }))
jest.mock('../audit-log.service', () => ({ AuditLogService: { logAction: jest.fn() } }))
const row = {
  id: 'item',
  category_id: '11111111-1111-4111-8111-111111111111',
  key: 'title',
  language: 'vi',
  value: 'Legacy',
  type: 'text',
  created_at: null,
  updated_at: null,
}
const query = (data: unknown, count: number | null, error: unknown = null) => {
  const result = { data, count, error }
  const q = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    then: (resolve: (value: typeof result) => unknown) => Promise.resolve(result).then(resolve),
  }
  jest.mocked(supabaseAdmin.from).mockReturnValueOnce(q as never)
  return q
}
beforeEach(() => jest.resetAllMocks())

it('reads the legacy list without inventing a revision when readiness RPC is not installed', async () => {
  jest
    .mocked(supabaseAdmin.rpc)
    .mockResolvedValue({ data: null, error: { code: 'PGRST202' } } as never)
  const q = query([row], 1)
  const result = await cms.getContentItems(row.category_id, 'vi')
  expect(result).toMatchObject({
    total: 1,
    readOnly: true,
    items: [{ value: 'Legacy', revision: null }],
  })
  expect(q.select.mock.calls[0][0].split(',')).not.toContain('revision')
  expect(q.eq).toHaveBeenCalledWith('category_id', row.category_id)
  expect(q.eq).toHaveBeenCalledWith('language', 'vi')
  expect(q.range).toHaveBeenCalledWith(0, 49)
})
it('keeps an empty legacy category read-only too', async () => {
  jest.mocked(supabaseAdmin.rpc).mockResolvedValue({ data: { cms: false }, error: null } as never)
  query([], 0)
  expect(await cms.getContentItems()).toEqual({ items: [], total: 0, readOnly: true })
})
it('reads a migrated list with real revision and write capability', async () => {
  jest.mocked(supabaseAdmin.rpc).mockResolvedValue({ data: { cms: true }, error: null } as never)
  query([{ ...row, revision: 5 }], 1)
  expect(await cms.getContentItems()).toMatchObject({ readOnly: false, items: [{ revision: 5 }] })
})
it('handles a stale readiness response when revision is actually absent', async () => {
  jest.mocked(supabaseAdmin.rpc).mockResolvedValue({ data: { cms: true }, error: null } as never)
  query(null, null, { code: '42703', message: 'column content_items.revision does not exist' })
  query([row], 1)
  expect(await cms.getContentItems()).toMatchObject({ readOnly: true, items: [{ revision: null }] })
  expect(supabaseAdmin.from).toHaveBeenCalledTimes(2)
})
it('does not turn a real read outage into an empty list or a fallback query', async () => {
  jest.mocked(supabaseAdmin.rpc).mockResolvedValue({ data: { cms: true }, error: null } as never)
  query(null, null, { code: 'XX000', message: 'private failure' })
  await expect(cms.getContentItems()).rejects.toMatchObject({ code: 'DATABASE_ERROR' })
  expect(supabaseAdmin.from).toHaveBeenCalledTimes(1)
})
it('distinguishes a readiness service outage from a missing migration', async () => {
  jest
    .mocked(supabaseAdmin.rpc)
    .mockResolvedValue({ data: null, error: { code: 'XX000' } } as never)
  await expect(cms.getContentItems()).rejects.toMatchObject({
    statusCode: 503,
    code: 'CMS_UNAVAILABLE',
  })
  expect(supabaseAdmin.from).not.toHaveBeenCalled()
})
it.each(['create', 'update', 'delete', 'import'] as const)(
  'blocks %s before any row writes when CMS is not ready',
  async operation => {
    jest
      .mocked(supabaseAdmin.rpc)
      .mockResolvedValue({ data: null, error: { code: 'PGRST202' } } as never)
    const actions = {
      create: () =>
        cms.createContentItem(
          { categoryId: row.category_id, key: 'title', language: 'vi', value: 'No write' },
          'admin'
        ),
      update: () =>
        cms.updateContentItem('item', { value: 'No write', expectedRevision: 0 }, 'admin'),
      delete: () => cms.deleteContentItem('item', 'admin', 0),
      import: () =>
        cms.importContent(
          { version: '1.0', language: 'vi', categories: { header: { title: 'No write' } } },
          'admin'
        ),
    }
    await expect(actions[operation]()).rejects.toMatchObject({
      statusCode: 503,
      code: 'SCHEMA_NOT_READY',
    })
    expect(supabaseAdmin.from).not.toHaveBeenCalled()
    expect(supabaseAdmin.rpc).toHaveBeenCalledTimes(1)
    expect(supabaseAdmin.rpc).toHaveBeenCalledWith('loopy_schema_status')
  }
)
