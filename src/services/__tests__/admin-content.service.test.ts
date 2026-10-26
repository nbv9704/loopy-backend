import { AdminContentService } from '../admin-content.service'
import { supabaseAdmin } from '../../db/supabase'
import { AuditLogService } from '../audit-log.service'

jest.mock('../../db/supabase', () => ({ supabaseAdmin: { from: jest.fn(), rpc: jest.fn() } }))
jest.mock('../../utils/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}))
jest.mock('../audit-log.service', () => ({
  AuditLogService: { logAction: jest.fn().mockResolvedValue(undefined) },
}))

// Stub query responses, not database behavior. No network, inserts, or cleanup on a real DB.
const fromMock = supabaseAdmin.from as jest.Mock
const row = {
  id: 'item-1',
  category_id: '11111111-1111-4111-8111-111111111111',
  key: 'test.title',
  language: 'vi',
  revision: 0,
  value: 'Nội dung',
  description: 'Description',
  type: 'text',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-02T00:00:00Z',
  created_by: 'admin-1',
  updated_by: 'admin-1',
}
const category = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'test',
  display_order: 1,
  created_at: row.created_at,
  updated_at: row.updated_at,
}
const input = { categoryId: category.id, key: row.key, language: 'vi' as const, value: row.value }
const dbFailure = { message: 'database unavailable' }

function queueQuery(data: unknown = null, error: unknown = null, count = 0) {
  const response = { data, error, count }
  const query = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue(response),
    single: jest.fn().mockResolvedValue(response),
    then: (resolve: (value: typeof response) => unknown) => Promise.resolve(response).then(resolve),
  }
  fromMock.mockReturnValueOnce(query)
  return query
}

function mockImportResult(result: unknown) {
  jest
    .mocked(supabaseAdmin.rpc)
    .mockImplementation(
      name =>
        Promise.resolve(
          name === 'loopy_schema_status' ? { data: { cms: true }, error: null } : result
        ) as never
    )
}

describe('AdminContentService (isolated unit tests)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    fromMock.mockReset()
    jest
      .mocked(supabaseAdmin.rpc)
      .mockReset()
      .mockResolvedValue({ data: { cms: true }, error: null } as never)
  })

  describe('getContentItems', () => {
    it('returns an empty collection without inventing a count', async () => {
      queueQuery([])
      expect(await AdminContentService.getContentItems()).toEqual({
        items: [],
        total: 0,
        readOnly: false,
      })
    })
    it('maps snake_case fields and dates', async () => {
      queueQuery([row], null, 8)
      const result = await AdminContentService.getContentItems()
      expect(result.total).toBe(8)
      expect(result.items[0]).toEqual({
        id: row.id,
        categoryId: row.category_id,
        key: row.key,
        language: row.language,
        value: row.value,
        description: row.description,
        type: row.type,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        createdBy: row.created_by,
        updatedBy: row.updated_by,
        revision: 0,
      })
      expect(result.items[0]).not.toHaveProperty('category_id')
    })
    it('applies category and language filters', async () => {
      const query = queueQuery([row], null, 1)
      await AdminContentService.getContentItems(category.id, 'vi')
      expect(query.eq).toHaveBeenCalledWith('category_id', category.id)
      expect(query.eq).toHaveBeenCalledWith('language', 'vi')
    })
    it('searches key and value', async () => {
      const query = queueQuery([])
      await AdminContentService.getContentItems(undefined, undefined, 'search')
      expect(query.or).toHaveBeenCalledWith('key.imatch."search",value.imatch."search"')
    })
    it.each([
      [200, 100],
      [0, 1],
    ])('clamps limit %i to %i and preserves offset', async (limit, expected) => {
      const query = queueQuery([])
      await AdminContentService.getContentItems(undefined, undefined, undefined, limit, 3)
      expect(query.range).toHaveBeenCalledWith(3, 3 + expected - 1)
    })
    it('propagates a database failure', async () => {
      queueQuery(null, dbFailure)
      await expect(AdminContentService.getContentItems()).rejects.toMatchObject({
        code: 'DATABASE_ERROR',
      })
    })
  })

  describe('getContentItem', () => {
    it('returns the item identified by ID', async () => {
      const query = queueQuery(row)
      expect(await AdminContentService.getContentItem(row.id)).toMatchObject({
        id: row.id,
        key: row.key,
      })
      expect(query.eq).toHaveBeenCalledWith('id', row.id)
    })
    it.each([null])('returns null for an absent item (%j)', async error => {
      queueQuery(null, error)
      expect(await AdminContentService.getContentItem('missing')).toBeNull()
    })
    it('does not turn a database outage into not-found', async () => {
      queueQuery(null, dbFailure)
      await expect(AdminContentService.getContentItem(row.id)).rejects.toMatchObject({
        code: 'DATABASE_ERROR',
      })
    })
  })

  describe('createContentItem', () => {
    it('creates text content with audit actor and maps the saved row', async () => {
      queueQuery({ id: category.id })
      const query = queueQuery(row)
      const result = await AdminContentService.createContentItem(input, 'admin-1')
      expect(query.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          category_id: category.id,
          key: row.key,
          type: 'text',
          created_by: 'admin-1',
          updated_by: 'admin-1',
        })
      )
      expect(result).toMatchObject({ id: row.id, createdBy: 'admin-1', value: row.value })
      expect(AuditLogService.logAction).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'create', resourceId: row.id })
      )
    })
    it('rejects a missing category', async () => {
      queueQuery(null)
      await expect(AdminContentService.createContentItem(input, 'admin-1')).rejects.toThrow(
        'Category not found'
      )
      expect(fromMock).toHaveBeenCalledTimes(1)
    })
    it('maps a database uniqueness race to a conflict without auditing', async () => {
      queueQuery({ id: category.id })
      queueQuery(null, { code: '23505' })
      await expect(AdminContentService.createContentItem(input, 'admin-1')).rejects.toMatchObject({
        code: 'CMS_DUPLICATE',
        statusCode: 409,
      })
      expect(AuditLogService.logAction).not.toHaveBeenCalled()
    })
    it('does not audit a failed insert', async () => {
      queueQuery({ id: category.id })
      queueQuery(null, dbFailure)
      await expect(AdminContentService.createContentItem(input, 'admin-1')).rejects.toMatchObject({
        code: 'DATABASE_ERROR',
      })
      expect(AuditLogService.logAction).not.toHaveBeenCalled()
    })
  })

  describe('updateContentItem', () => {
    it('saves updated value and actor and records before/after in audit', async () => {
      queueQuery(row)
      const query = queueQuery({ ...row, value: 'Updated', updated_by: 'admin-2', revision: 1 })
      expect(
        await AdminContentService.updateContentItem(
          row.id,
          { value: 'Updated', expectedRevision: 0 },
          'admin-2'
        )
      ).toMatchObject({ value: 'Updated', updatedBy: 'admin-2' })
      expect(query.update).toHaveBeenCalledWith(
        expect.objectContaining({ value: 'Updated', updated_by: 'admin-2' })
      )
      expect(AuditLogService.logAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'update',
          changes: {
            old: expect.objectContaining({ value: row.value }),
            new: expect.objectContaining({ value: 'Updated' }),
          },
        })
      )
    })
    it('rejects a missing item', async () => {
      queueQuery(null)
      await expect(
        AdminContentService.updateContentItem(
          'missing',
          { value: 'Updated', expectedRevision: 0 },
          'admin-1'
        )
      ).rejects.toThrow('not found')
    })
    it('propagates an update failure without auditing success', async () => {
      queueQuery(row)
      queueQuery(null, dbFailure)
      await expect(
        AdminContentService.updateContentItem(
          row.id,
          { value: 'Updated', expectedRevision: 0 },
          'admin-1'
        )
      ).rejects.toThrow()
      expect(AuditLogService.logAction).not.toHaveBeenCalled()
    })
  })

  describe('deleteContentItem', () => {
    it('deletes only the requested item and audits it', async () => {
      queueQuery(row)
      const query = queueQuery({ id: row.id })
      await AdminContentService.deleteContentItem(row.id, 'admin-1', 0)
      expect(query.delete).toHaveBeenCalledTimes(1)
      expect(query.eq).toHaveBeenCalledWith('id', row.id)
      expect(AuditLogService.logAction).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'delete', resourceId: row.id })
      )
    })
    it('rejects a missing item without deleting anything', async () => {
      queueQuery(null)
      await expect(AdminContentService.deleteContentItem('missing', 'admin-1', 0)).rejects.toThrow(
        'not found'
      )
      expect(fromMock).toHaveBeenCalledTimes(1)
    })
    it('propagates delete failures', async () => {
      queueQuery(row)
      queueQuery(null, dbFailure)
      await expect(
        AdminContentService.deleteContentItem(row.id, 'admin-1', 0)
      ).rejects.toMatchObject({ code: 'DATABASE_ERROR' })
    })
  })

  describe('getCategories', () => {
    it('requests display order and maps category fields', async () => {
      const query = queueQuery([category])
      expect(await AdminContentService.getCategories()).toEqual([
        expect.objectContaining({ name: 'test', displayOrder: 1 }),
      ])
      expect(query.order).toHaveBeenCalledWith('display_order')
    })
    it('propagates failures', async () => {
      queueQuery(null, dbFailure)
      await expect(AdminContentService.getCategories()).rejects.toMatchObject({
        code: 'DATABASE_ERROR',
      })
    })
  })

  describe('exportContent', () => {
    it('filters language and groups values by category', async () => {
      const query = queueQuery([{ ...row, content_categories: { name: 'test' } }], null, 1)
      expect(await AdminContentService.exportContent('vi')).toEqual({
        version: '2.0',
        language: 'vi',
        exportedAt: expect.any(String),
        categories: {
          test: { [row.key]: { value: row.value, type: row.type, description: row.description } },
        },
      })
      expect(query.eq).toHaveBeenCalledWith('language', 'vi')
    })
    it('propagates export failures', async () => {
      queueQuery(null, dbFailure)
      await expect(AdminContentService.exportContent('vi')).rejects.toMatchObject({
        code: 'DATABASE_ERROR',
      })
    })
  })

  describe('atomic importContent', () => {
    const payload = {
      version: '1.0',
      language: 'vi' as const,
      categories: { test: { [row.key]: row.value } },
    }
    it('uses one transaction RPC after readiness and logs only a matching committed result', async () => {
      mockImportResult({ data: { imported: 1, language: 'vi' }, error: null })
      await expect(AdminContentService.importContent(payload, 'admin')).resolves.toEqual({
        imported: 1,
        errors: [],
      })
      expect(supabaseAdmin.rpc).toHaveBeenCalledWith('import_cms_content_atomically', {
        p_actor_id: 'admin',
        p_language: 'vi',
        p_items: [{ category: 'test', key: row.key, value: row.value }],
      })
      expect(fromMock).not.toHaveBeenCalled()
      expect(AuditLogService.logAction).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'import' })
      )
    })
    it.each([null, { imported: 0, language: 'vi' }, { imported: 1, language: 'en' }])(
      'rejects an unconfirmed RPC result %j',
      async data => {
        mockImportResult({ data, error: null })
        await expect(AdminContentService.importContent(payload, 'admin')).rejects.toMatchObject({
          code: 'CMS_IMPORT_UNCONFIRMED',
        })
        expect(AuditLogService.logAction).not.toHaveBeenCalled()
      }
    )
    it('requires the schema and never falls back to individual writes', async () => {
      jest
        .mocked(supabaseAdmin.rpc)
        .mockResolvedValue({ data: null, error: { code: 'PGRST202' } } as never)
      await expect(AdminContentService.importContent(payload, 'admin')).rejects.toMatchObject({
        statusCode: 503,
        code: 'SCHEMA_NOT_READY',
      })
      expect(fromMock).not.toHaveBeenCalled()
    })
    it('does not retry a rejected transport', async () => {
      jest
        .mocked(supabaseAdmin.rpc)
        .mockImplementation(
          name =>
            (name === 'loopy_schema_status'
              ? Promise.resolve({ data: { cms: true }, error: null })
              : Promise.reject(new Error('Offline'))) as never
        )
      await expect(AdminContentService.importContent(payload, 'admin')).rejects.toMatchObject({
        code: 'CMS_IMPORT_UNCONFIRMED',
      })
      expect(
        jest
          .mocked(supabaseAdmin.rpc)
          .mock.calls.filter(([name]) => name === 'import_cms_content_atomically')
      ).toHaveLength(1)
    })
  })
})
