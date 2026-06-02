import { contentSchemas } from '../content.schemas'

describe('Content Schemas', () => {
  describe('ContentCategorySchema', () => {
    it('should validate a valid content category', () => {
      const validCategory = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'header',
        description: 'Header navigation content',
        displayOrder: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const result = contentSchemas.contentCategory.safeParse(validCategory)
      expect(result.success).toBe(true)
    })

    it('should reject invalid UUID for id', () => {
      const invalidCategory = {
        id: 'invalid-uuid',
        name: 'header',
        displayOrder: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const result = contentSchemas.contentCategory.safeParse(invalidCategory)
      expect(result.success).toBe(false)
    })

    it('should reject empty name', () => {
      const invalidCategory = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: '',
        displayOrder: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const result = contentSchemas.contentCategory.safeParse(invalidCategory)
      expect(result.success).toBe(false)
    })

    it('should reject negative displayOrder', () => {
      const invalidCategory = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'header',
        displayOrder: -1,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const result = contentSchemas.contentCategory.safeParse(invalidCategory)
      expect(result.success).toBe(false)
    })
  })

  describe('ContentItemSchema', () => {
    it('should validate a valid content item', () => {
      const validItem = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        categoryId: '550e8400-e29b-41d4-a716-446655440001',
        key: 'nav.learn',
        language: 'vi',
        value: 'Học tập',
        description: 'Navigation item for learn page',
        type: 'text',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const result = contentSchemas.contentItem.safeParse(validItem)
      expect(result.success).toBe(true)
    })

    it('should reject invalid language', () => {
      const invalidItem = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        categoryId: '550e8400-e29b-41d4-a716-446655440001',
        key: 'nav.learn',
        language: 'fr',
        value: 'Apprendre',
        type: 'text',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const result = contentSchemas.contentItem.safeParse(invalidItem)
      expect(result.success).toBe(false)
    })

    it('should reject empty value', () => {
      const invalidItem = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        categoryId: '550e8400-e29b-41d4-a716-446655440001',
        key: 'nav.learn',
        language: 'vi',
        value: '',
        type: 'text',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const result = contentSchemas.contentItem.safeParse(invalidItem)
      expect(result.success).toBe(false)
    })

    it('should reject value exceeding 5000 characters', () => {
      const invalidItem = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        categoryId: '550e8400-e29b-41d4-a716-446655440001',
        key: 'nav.learn',
        language: 'vi',
        value: 'a'.repeat(5001),
        type: 'text',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const result = contentSchemas.contentItem.safeParse(invalidItem)
      expect(result.success).toBe(false)
    })

    it('should reject invalid type', () => {
      const invalidItem = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        categoryId: '550e8400-e29b-41d4-a716-446655440001',
        key: 'nav.learn',
        language: 'vi',
        value: 'Học tập',
        type: 'invalid',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const result = contentSchemas.contentItem.safeParse(invalidItem)
      expect(result.success).toBe(false)
    })

    it('should allow optional fields', () => {
      const validItem = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        categoryId: '550e8400-e29b-41d4-a716-446655440001',
        key: 'nav.learn',
        language: 'vi',
        value: 'Học tập',
        type: 'text',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const result = contentSchemas.contentItem.safeParse(validItem)
      expect(result.success).toBe(true)
    })
  })

  describe('CreateContentItemSchema', () => {
    it('should validate a valid create request', () => {
      const validRequest = {
        body: {
          categoryId: '550e8400-e29b-41d4-a716-446655440001',
          key: 'nav.learn',
          language: 'vi',
          value: 'Học tập',
          description: 'Navigation item for learn page',
          type: 'text',
        },
      }

      const result = contentSchemas.createContentItem.safeParse(validRequest)
      expect(result.success).toBe(true)
    })

    it('should reject missing required fields', () => {
      const invalidRequest = {
        body: {
          categoryId: '550e8400-e29b-41d4-a716-446655440001',
          key: 'nav.learn',
          language: 'vi',
          // missing value
        },
      }

      const result = contentSchemas.createContentItem.safeParse(invalidRequest)
      expect(result.success).toBe(false)
    })

    it('should reject invalid categoryId', () => {
      const invalidRequest = {
        body: {
          categoryId: 'invalid-uuid',
          key: 'nav.learn',
          language: 'vi',
          value: 'Học tập',
        },
      }

      const result = contentSchemas.createContentItem.safeParse(invalidRequest)
      expect(result.success).toBe(false)
    })

    it('should allow optional type field', () => {
      const validRequest = {
        body: {
          categoryId: '550e8400-e29b-41d4-a716-446655440001',
          key: 'nav.learn',
          language: 'vi',
          value: 'Học tập',
        },
      }

      const result = contentSchemas.createContentItem.safeParse(validRequest)
      expect(result.success).toBe(true)
    })
  })

  describe('UpdateContentItemSchema', () => {
    it('should validate a valid update request', () => {
      const validRequest = {
        body: {
          value: 'Học tập cập nhật',
          description: 'Updated description',
          type: 'markdown',
        },
      }

      const result = contentSchemas.updateContentItem.safeParse(validRequest)
      expect(result.success).toBe(true)
    })

    it('should reject empty value', () => {
      const invalidRequest = {
        body: {
          value: '',
        },
      }

      const result = contentSchemas.updateContentItem.safeParse(invalidRequest)
      expect(result.success).toBe(false)
    })

    it('should reject value exceeding 5000 characters', () => {
      const invalidRequest = {
        body: {
          value: 'a'.repeat(5001),
        },
      }

      const result = contentSchemas.updateContentItem.safeParse(invalidRequest)
      expect(result.success).toBe(false)
    })

    it('should allow partial updates', () => {
      const validRequest = {
        body: {
          value: 'Học tập cập nhật',
        },
      }

      const result = contentSchemas.updateContentItem.safeParse(validRequest)
      expect(result.success).toBe(true)
    })

    it('should reject invalid type', () => {
      const invalidRequest = {
        body: {
          value: 'Học tập',
          type: 'invalid',
        },
      }

      const result = contentSchemas.updateContentItem.safeParse(invalidRequest)
      expect(result.success).toBe(false)
    })
  })

  describe('ImportContentSchema', () => {
    it('should validate a valid import request', () => {
      const validRequest = {
        body: {
          version: '1.0',
          language: 'vi',
          categories: {
            header: {
              'nav.learn': 'Học tập',
              'nav.playground': 'Sân chơi',
            },
            footer: {
              'footer.copyright': '© 2024 Loopy',
            },
          },
        },
      }

      const result = contentSchemas.importContent.safeParse(validRequest)
      expect(result.success).toBe(true)
    })

    it('should reject missing version', () => {
      const invalidRequest = {
        body: {
          language: 'vi',
          categories: {
            header: {
              'nav.learn': 'Học tập',
            },
          },
        },
      }

      const result = contentSchemas.importContent.safeParse(invalidRequest)
      expect(result.success).toBe(false)
    })

    it('should reject invalid language', () => {
      const invalidRequest = {
        body: {
          version: '1.0',
          language: 'fr',
          categories: {
            header: {
              'nav.learn': 'Apprendre',
            },
          },
        },
      }

      const result = contentSchemas.importContent.safeParse(invalidRequest)
      expect(result.success).toBe(false)
    })

    it('should reject empty content values', () => {
      const invalidRequest = {
        body: {
          version: '1.0',
          language: 'vi',
          categories: {
            header: {
              'nav.learn': '',
            },
          },
        },
      }

      const result = contentSchemas.importContent.safeParse(invalidRequest)
      expect(result.success).toBe(false)
    })

    it('should reject content values exceeding 5000 characters', () => {
      const invalidRequest = {
        body: {
          version: '1.0',
          language: 'vi',
          categories: {
            header: {
              'nav.learn': 'a'.repeat(5001),
            },
          },
        },
      }

      const result = contentSchemas.importContent.safeParse(invalidRequest)
      expect(result.success).toBe(false)
    })
  })

  describe('ContentQuerySchema', () => {
    it('should validate a valid query with all parameters', () => {
      const validQuery = {
        query: {
          category: 'header',
          language: 'vi',
          search: 'nav',
          limit: '50',
          offset: '0',
        },
      }

      const result = contentSchemas.contentQuery.safeParse(validQuery)
      expect(result.success).toBe(true)
    })

    it('should validate a query with no parameters', () => {
      const validQuery = {
        query: {},
      }

      const result = contentSchemas.contentQuery.safeParse(validQuery)
      expect(result.success).toBe(true)
    })

    it('should reject invalid language', () => {
      const invalidQuery = {
        query: {
          language: 'fr',
        },
      }

      const result = contentSchemas.contentQuery.safeParse(invalidQuery)
      expect(result.success).toBe(false)
    })

    it('should reject invalid limit (non-positive)', () => {
      const invalidQuery = {
        query: {
          limit: '0',
        },
      }

      const result = contentSchemas.contentQuery.safeParse(invalidQuery)
      expect(result.success).toBe(false)
    })

    it('should reject limit exceeding 100', () => {
      const invalidQuery = {
        query: {
          limit: '101',
        },
      }

      const result = contentSchemas.contentQuery.safeParse(invalidQuery)
      expect(result.success).toBe(false)
    })

    it('should reject negative offset', () => {
      const invalidQuery = {
        query: {
          offset: '-1',
        },
      }

      const result = contentSchemas.contentQuery.safeParse(invalidQuery)
      expect(result.success).toBe(false)
    })
  })

  describe('ExportContentQuerySchema', () => {
    it('should validate a valid export query', () => {
      const validQuery = {
        query: {
          language: 'vi',
        },
      }

      const result = contentSchemas.exportContentQuery.safeParse(validQuery)
      expect(result.success).toBe(true)
    })

    it('should reject missing language', () => {
      const invalidQuery = {
        query: {},
      }

      const result = contentSchemas.exportContentQuery.safeParse(invalidQuery)
      expect(result.success).toBe(false)
    })

    it('should reject invalid language', () => {
      const invalidQuery = {
        query: {
          language: 'fr',
        },
      }

      const result = contentSchemas.exportContentQuery.safeParse(invalidQuery)
      expect(result.success).toBe(false)
    })
  })

  describe('Error Messages', () => {
    it('should provide clear error message for invalid UUID', () => {
      const invalidItem = {
        id: 'invalid-uuid',
        categoryId: '550e8400-e29b-41d4-a716-446655440001',
        key: 'nav.learn',
        language: 'vi',
        value: 'Học tập',
        type: 'text',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const result = contentSchemas.contentItem.safeParse(invalidItem)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('UUID')
      }
    })

    it('should provide clear error message for invalid language', () => {
      const invalidItem = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        categoryId: '550e8400-e29b-41d4-a716-446655440001',
        key: 'nav.learn',
        language: 'fr',
        value: 'Apprendre',
        type: 'text',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const result = contentSchemas.contentItem.safeParse(invalidItem)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('vi hoặc en')
      }
    })

    it('should provide clear error message for empty value', () => {
      const invalidRequest = {
        body: {
          categoryId: '550e8400-e29b-41d4-a716-446655440001',
          key: 'nav.learn',
          language: 'vi',
          value: '',
        },
      }

      const result = contentSchemas.createContentItem.safeParse(invalidRequest)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('không được để trống')
      }
    })

    it('should provide clear error message for value exceeding max length', () => {
      const invalidRequest = {
        body: {
          categoryId: '550e8400-e29b-41d4-a716-446655440001',
          key: 'nav.learn',
          language: 'vi',
          value: 'a'.repeat(5001),
        },
      }

      const result = contentSchemas.createContentItem.safeParse(invalidRequest)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('5000')
      }
    })
  })
})
