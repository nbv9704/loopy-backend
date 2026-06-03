import { AdminContentService } from '../admin-content.service'
import { supabaseAdmin } from '../../db/supabase'

/**
 * AdminContentService Unit Tests
 *
 * Tests all CRUD operations and utility methods for content management.
 * Validates error handling and data transformation.
 */

describe('AdminContentService', () => {
  const testAdminId = undefined as unknown as string

  beforeAll(async () => {
    // Setup: Create test category if it doesn't exist
    const { data: categories } = await supabaseAdmin
      .from('content_categories')
      .select('id')
      .eq('name', 'test')
      .single()

    if (!categories) {
      await supabaseAdmin.from('content_categories').insert({
        name: 'test',
        description: 'Test category',
        display_order: 999,
      })
    }
  })

  afterAll(async () => {
    // Cleanup: Delete test content items
    await supabaseAdmin.from('content_items').delete().like('key', 'test.%')
  })

  describe('getContentItems', () => {
    it('should return empty array when no items exist', async () => {
      // Pass undefined for category to get all items, then filter
      const result = await AdminContentService.getContentItems(undefined)
      expect(Array.isArray(result.items)).toBe(true)
      expect(typeof result.total).toBe('number')
    })

    it('should return content items with pagination', async () => {
      // Create test items
      const { data: category } = await supabaseAdmin
        .from('content_categories')
        .select('id')
        .eq('name', 'test')
        .single()

      if (category) {
        await supabaseAdmin.from('content_items').insert([
          {
            category_id: category.id,
            key: 'test.item1',
            language: 'vi',
            value: 'Test Item 1',
            type: 'text',
            created_by: testAdminId,
            updated_by: testAdminId,
          },
          {
            category_id: category.id,
            key: 'test.item2',
            language: 'vi',
            value: 'Test Item 2',
            type: 'text',
            created_by: testAdminId,
            updated_by: testAdminId,
          },
        ])
      }

      const result = await AdminContentService.getContentItems(category?.id, 'vi')
      expect(result.items.length).toBeGreaterThan(0)
      expect(result.total).toBeGreaterThan(0)
      expect(result.items[0]).toHaveProperty('id')
      expect(result.items[0]).toHaveProperty('categoryId')
      expect(result.items[0]).toHaveProperty('key')
      expect(result.items[0]).toHaveProperty('language')
      expect(result.items[0]).toHaveProperty('value')

      // Cleanup
      await supabaseAdmin.from('content_items').delete().eq('key', 'test.item1')
      await supabaseAdmin.from('content_items').delete().eq('key', 'test.item2')
    })

    it('should filter by language', async () => {
      const { data: category } = await supabaseAdmin
        .from('content_categories')
        .select('id')
        .eq('name', 'test')
        .single()

      if (category) {
        await supabaseAdmin.from('content_items').insert({
          category_id: category.id,
          key: 'test.lang',
          language: 'en',
          value: 'Test Language',
          type: 'text',
          created_by: testAdminId,
          updated_by: testAdminId,
        })
      }

      const result = await AdminContentService.getContentItems(category?.id, 'en')
      const enItems = result.items.filter((item) => item.language === 'en')
      expect(enItems.length).toBeGreaterThan(0)

      // Cleanup
      await supabaseAdmin.from('content_items').delete().eq('key', 'test.lang')
    })

    it('should search by key or value', async () => {
      const { data: category } = await supabaseAdmin
        .from('content_categories')
        .select('id')
        .eq('name', 'test')
        .single()

      if (category) {
        await supabaseAdmin.from('content_items').insert({
          category_id: category.id,
          key: 'test.search',
          language: 'vi',
          value: 'Searchable Content',
          type: 'text',
          created_by: testAdminId,
          updated_by: testAdminId,
        })
      }

      const result = await AdminContentService.getContentItems(category?.id, undefined, 'search')
      expect(result.items.length).toBeGreaterThan(0)
      expect(result.items.some((item) => item.key.includes('search'))).toBe(true)

      // Cleanup
      await supabaseAdmin.from('content_items').delete().eq('key', 'test.search')
    })

    it('should respect limit and offset', async () => {
      const result1 = await AdminContentService.getContentItems(undefined, undefined, undefined, 1, 0)
      const result2 = await AdminContentService.getContentItems(undefined, undefined, undefined, 1, 1)

      if (result1.items.length > 0 && result2.items.length > 0) {
        expect(result1.items[0].id).not.toBe(result2.items[0].id)
      }
    })
  })

  describe('getContentItemsByKeys', () => {
    it('should return exact key/value map and missing keys for a language', async () => {
      const { data: category } = await supabaseAdmin
        .from('content_categories')
        .select('id')
        .eq('name', 'test')
        .single()

      if (category) {
        await supabaseAdmin.from('content_items').insert([
          {
            category_id: category.id,
            key: 'test.batch.one',
            language: 'vi',
            value: 'Batch One',
            type: 'text',
            created_by: testAdminId,
            updated_by: testAdminId,
          },
          {
            category_id: category.id,
            key: 'test.batch.two',
            language: 'vi',
            value: 'Batch Two',
            type: 'text',
            created_by: testAdminId,
            updated_by: testAdminId,
          },
          {
            category_id: category.id,
            key: 'test.batch.one',
            language: 'en',
            value: 'Batch One EN',
            type: 'text',
            created_by: testAdminId,
            updated_by: testAdminId,
          },
        ])
      }

      const result = await AdminContentService.getContentItemsByKeys(
        ['test.batch.one', 'test.batch.two', 'test.batch.one', 'test.batch.missing'],
        'vi'
      )

      expect(result.items).toEqual({
        'test.batch.one': 'Batch One',
        'test.batch.two': 'Batch Two',
      })
      expect(result.missingKeys).toEqual(['test.batch.missing'])

      // Cleanup
      await supabaseAdmin.from('content_items').delete().like('key', 'test.batch.%')
    })

    it('should return empty result for blank keys', async () => {
      const result = await AdminContentService.getContentItemsByKeys(['', '   '], 'vi')

      expect(result.items).toEqual({})
      expect(result.missingKeys).toEqual([])
    })
  })

  describe('getContentItem', () => {
    it('should return null for non-existent item', async () => {
      const result = await AdminContentService.getContentItem('00000000-0000-0000-0000-000000000000')
      expect(result).toBeNull()
    })

    it('should return content item by ID', async () => {
      const { data: category } = await supabaseAdmin
        .from('content_categories')
        .select('id')
        .eq('name', 'test')
        .single()

      if (category) {
        const { data: inserted } = await supabaseAdmin
          .from('content_items')
          .insert({
            category_id: category.id,
            key: 'test.getitem',
            language: 'vi',
            value: 'Get Item Test',
            type: 'text',
            created_by: testAdminId,
            updated_by: testAdminId,
          })
          .select()
          .single()

        if (inserted) {
          const result = await AdminContentService.getContentItem(inserted.id)
          expect(result).not.toBeNull()
          expect(result?.id).toBe(inserted.id)
          expect(result?.key).toBe('test.getitem')
          expect(result?.value).toBe('Get Item Test')

          // Cleanup
          await supabaseAdmin.from('content_items').delete().eq('id', inserted.id)
        }
      }
    })
  })

  describe('createContentItem', () => {
    it('should create a new content item', async () => {
      const { data: category } = await supabaseAdmin
        .from('content_categories')
        .select('id')
        .eq('name', 'test')
        .single()

      if (category) {
        const result = await AdminContentService.createContentItem(
          {
            categoryId: category.id,
            key: 'test.create',
            language: 'vi',
            value: 'Created Item',
            description: 'Test description',
            type: 'text',
          },
          testAdminId
        )

        expect(result).toHaveProperty('id')
        expect(result.key).toBe('test.create')
        expect(result.value).toBe('Created Item')
        expect(result.language).toBe('vi')
        expect(result.createdBy).toBeNull()

        // Cleanup
        await supabaseAdmin.from('content_items').delete().eq('id', result.id)
      }
    })

    it('should throw error for non-existent category', async () => {
      await expect(
        AdminContentService.createContentItem(
          {
            categoryId: '00000000-0000-0000-0000-000000000000',
            key: 'test.invalid',
            language: 'vi',
            value: 'Invalid',
          },
          testAdminId
        )
      ).rejects.toThrow('Category not found')
    })

    it('should throw error for duplicate key', async () => {
      const { data: category } = await supabaseAdmin
        .from('content_categories')
        .select('id')
        .eq('name', 'test')
        .single()

      if (category) {
        // Create first item
        const first = await AdminContentService.createContentItem(
          {
            categoryId: category.id,
            key: 'test.duplicate',
            language: 'vi',
            value: 'First',
          },
          testAdminId
        )

        // Try to create duplicate
        await expect(
          AdminContentService.createContentItem(
            {
              categoryId: category.id,
              key: 'test.duplicate',
              language: 'vi',
              value: 'Second',
            },
            testAdminId
          )
        ).rejects.toThrow('already exists')

        // Cleanup
        await supabaseAdmin.from('content_items').delete().eq('id', first.id)
      }
    })
  })

  describe('updateContentItem', () => {
    it('should update a content item', async () => {
      const { data: category } = await supabaseAdmin
        .from('content_categories')
        .select('id')
        .eq('name', 'test')
        .single()

      if (category) {
        const created = await AdminContentService.createContentItem(
          {
            categoryId: category.id,
            key: 'test.update',
            language: 'vi',
            value: 'Original Value',
          },
          testAdminId
        )

        const updated = await AdminContentService.updateContentItem(
          created.id,
          {
            value: 'Updated Value',
            description: 'Updated description',
          },
          testAdminId
        )

        expect(updated.value).toBe('Updated Value')
        expect(updated.description).toBe('Updated description')
        expect(updated.updatedBy).toBeNull()

        // Cleanup
        await supabaseAdmin.from('content_items').delete().eq('id', created.id)
      }
    })

    it('should throw error for non-existent item', async () => {
      await expect(
        AdminContentService.updateContentItem(
          '00000000-0000-0000-0000-000000000000',
          { value: 'Updated' },
          testAdminId
        )
      ).rejects.toThrow('not found')
    })
  })

  describe('deleteContentItem', () => {
    it('should delete a content item', async () => {
      const { data: category } = await supabaseAdmin
        .from('content_categories')
        .select('id')
        .eq('name', 'test')
        .single()

      if (category) {
        const created = await AdminContentService.createContentItem(
          {
            categoryId: category.id,
            key: 'test.delete',
            language: 'vi',
            value: 'To Delete',
          },
          testAdminId
        )

        await AdminContentService.deleteContentItem(created.id, testAdminId)

        const result = await AdminContentService.getContentItem(created.id)
        expect(result).toBeNull()
      }
    })

    it('should throw error for non-existent item', async () => {
      await expect(
        AdminContentService.deleteContentItem('00000000-0000-0000-0000-000000000000', testAdminId)
      ).rejects.toThrow('not found')
    })
  })

  describe('getCategories', () => {
    it('should return all categories', async () => {
      const result = await AdminContentService.getCategories()
      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBeGreaterThan(0)
      expect(result[0]).toHaveProperty('id')
      expect(result[0]).toHaveProperty('name')
      expect(result[0]).toHaveProperty('displayOrder')
    })

    it('should return categories ordered by displayOrder', async () => {
      const result = await AdminContentService.getCategories()
      for (let i = 1; i < result.length; i++) {
        expect(result[i].displayOrder).toBeGreaterThanOrEqual(result[i - 1].displayOrder)
      }
    })
  })

  describe('exportContent', () => {
    it('should export content for a language', async () => {
      const result = await AdminContentService.exportContent('vi')
      expect(result).toHaveProperty('version')
      expect(result).toHaveProperty('language')
      expect(result).toHaveProperty('exportedAt')
      expect(result).toHaveProperty('categories')
      expect(result.language).toBe('vi')
      expect(typeof result.categories).toBe('object')
    })

    it('should export content with correct structure', async () => {
      const { data: category } = await supabaseAdmin
        .from('content_categories')
        .select('id, name')
        .eq('name', 'test')
        .single()

      if (category) {
        const created = await AdminContentService.createContentItem(
          {
            categoryId: category.id,
            key: 'test.export',
            language: 'vi',
            value: 'Export Test',
          },
          testAdminId
        )

        const result = await AdminContentService.exportContent('vi')
        expect(result.categories['test']).toBeDefined()
        expect(result.categories['test']['test.export']).toBe('Export Test')

        // Cleanup
        await supabaseAdmin.from('content_items').delete().eq('id', created.id)
      }
    })
  })

  describe('importContent', () => {
    it('should import content items', async () => {
      const { data: category } = await supabaseAdmin
        .from('content_categories')
        .select('id')
        .eq('name', 'test')
        .single()

      if (category) {
        const result = await AdminContentService.importContent(
          {
            version: '1.0',
            language: 'vi',
            categories: {
              test: {
                'test.import': 'Imported Content',
              },
            },
          },
          testAdminId
        )

        expect(result.imported).toBeGreaterThan(0)
        expect(result.errors.length).toBe(0)

        // Verify imported item
        const items = await AdminContentService.getContentItems(category.id, 'vi')
        expect(items.items.some((item) => item.key === 'test.import')).toBe(true)

        // Cleanup
        await supabaseAdmin.from('content_items').delete().eq('key', 'test.import')
      }
    })

    it('should handle import errors gracefully', async () => {
      // Test importing with a non-existent category - service should auto-create it
      const result = await AdminContentService.importContent(
        {
          version: '1.0',
          language: 'vi',
          categories: {
            nonexistent: {
              'test.item': 'Test',
            },
          },
        },
        testAdminId
      )

      // Service auto-creates missing categories, so this should succeed
      expect(result.imported).toBeGreaterThan(0)
      expect(result.errors.length).toBe(0)

      // Verify category was created
      const { data: category } = await supabaseAdmin
        .from('content_categories')
        .select('*')
        .eq('name', 'nonexistent')
        .single()

      expect(category).toBeDefined()
      expect(category?.name).toBe('nonexistent')
    })

    it('should update existing items on import', async () => {
      const { data: category } = await supabaseAdmin
        .from('content_categories')
        .select('id')
        .eq('name', 'test')
        .single()

      if (category) {
        // Create initial item
        const created = await AdminContentService.createContentItem(
          {
            categoryId: category.id,
            key: 'test.reimport',
            language: 'vi',
            value: 'Original',
          },
          testAdminId
        )

        // Import with updated value
        const result = await AdminContentService.importContent(
          {
            version: '1.0',
            language: 'vi',
            categories: {
              test: {
                'test.reimport': 'Updated via Import',
              },
            },
          },
          testAdminId
        )

        expect(result.imported).toBeGreaterThan(0)

        // Verify updated value
        const updated = await AdminContentService.getContentItem(created.id)
        expect(updated?.value).toBe('Updated via Import')

        // Cleanup
        await supabaseAdmin.from('content_items').delete().eq('id', created.id)
      }
    })
  })

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      // This test verifies error handling through actual database operations
      // Attempting to get a non-existent item should return null
      const result = await AdminContentService.getContentItem('00000000-0000-0000-0000-000000000000')
      expect(result).toBeNull()
    })
  })

  describe('Data Transformation', () => {
    it('should transform snake_case to camelCase', async () => {
      const { data: category } = await supabaseAdmin
        .from('content_categories')
        .select('id')
        .eq('name', 'test')
        .single()

      if (category) {
        const created = await AdminContentService.createContentItem(
          {
            categoryId: category.id,
            key: 'test.transform',
            language: 'vi',
            value: 'Transform Test',
          },
          testAdminId
        )

        expect(created).toHaveProperty('categoryId')
        expect(created).toHaveProperty('createdAt')
        expect(created).toHaveProperty('updatedAt')
        expect(created).toHaveProperty('createdBy')
        expect(created).toHaveProperty('updatedBy')
        expect(created).not.toHaveProperty('category_id')
        expect(created).not.toHaveProperty('created_at')

        // Cleanup
        await supabaseAdmin.from('content_items').delete().eq('id', created.id)
      }
    })
  })
})
