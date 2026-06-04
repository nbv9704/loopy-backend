import { Response } from 'express'
import { AuthRequest } from '../../middleware/auth'
import { AdminContentService } from '../../services/admin-content.service'
import { logger } from '../../utils/logger'

/**
 * ContentController - Admin content management endpoints
 *
 * Provides API endpoints for managing content items and categories.
 * All endpoints require admin authentication.
 * Implements Task 1.4 - Create ContentController
 */

// ============================================================================
// ADMIN ENDPOINTS (Protected)
// ============================================================================

/**
 * GET /api/admin/content
 * Get content items with optional filtering and pagination
 * Query params: ?category=header&language=vi&search=nav&limit=50&offset=0
 */
export const getContentItems = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { category, language, search, limit = '50', offset = '0' } = req.query
    const adminId = req.user?.id

    if (!adminId) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
      })
      return
    }

    const result = await AdminContentService.getContentItems(
      category as string | undefined,
      language as 'vi' | 'en' | undefined,
      search as string | undefined,
      Math.min(parseInt(limit as string) || 50, 100),
      parseInt(offset as string) || 0
    )

    logger.info('Content items fetched', {
      count: result.items.length,
      total: result.total,
      category,
      language,
    })

    res.json({
      success: true,
      data: {
        items: result.items,
        total: result.total,
        limit: Math.min(parseInt(limit as string) || 50, 100),
        offset: parseInt(offset as string) || 0,
      },
    })
  } catch (error) {
    logger.error('Error fetching content items:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch content items',
      details: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

/**
 * POST /api/admin/content
 * Create a new content item
 * Body: { categoryId, key, language, value, description?, type? }
 */
export const createContentItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const adminId = req.user?.id

    if (!adminId) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
      })
      return
    }

    const { categoryId, key, language, value, description, type } = req.body

    // Validate required fields
    if (!categoryId || !key || !language || !value) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: categoryId, key, language, value',
      })
      return
    }

    const newItem = await AdminContentService.createContentItem(
      {
        categoryId,
        key,
        language,
        value,
        description,
        type,
      },
      adminId
    )

    logger.info('Content item created', {
      id: newItem.id,
      key: newItem.key,
      category: newItem.categoryId,
      language: newItem.language,
    })

    res.status(201).json({
      success: true,
      data: newItem,
    })
  } catch (error) {
    logger.error('Error creating content item:', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    // Handle specific error cases
    if (errorMessage.includes('already exists')) {
      res.status(409).json({
        success: false,
        error: 'Duplicate key',
        details: errorMessage,
      })
      return
    }

    if (errorMessage.includes('Category not found')) {
      res.status(404).json({
        success: false,
        error: 'Category not found',
      })
      return
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create content item',
      details: errorMessage,
    })
  }
}

/**
 * PUT /api/admin/content/:id
 * Update a content item
 * Body: { value, description?, type? }
 */
export const updateContentItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const adminId = req.user?.id

    if (!adminId) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
      })
      return
    }

    if (!id) {
      res.status(400).json({
        success: false,
        error: 'Missing required parameter: id',
      })
      return
    }

    const { value, description, type } = req.body

    // Validate required fields
    if (!value) {
      res.status(400).json({
        success: false,
        error: 'Missing required field: value',
      })
      return
    }

    const updatedItem = await AdminContentService.updateContentItem(
      id,
      {
        value,
        description,
        type,
      },
      adminId
    )

    logger.info('Content item updated', {
      id: updatedItem.id,
      key: updatedItem.key,
    })

    res.json({
      success: true,
      data: updatedItem,
    })
  } catch (error) {
    logger.error('Error updating content item:', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    if (errorMessage.includes('not found')) {
      res.status(404).json({
        success: false,
        error: 'Content item not found',
      })
      return
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update content item',
      details: errorMessage,
    })
  }
}

/**
 * DELETE /api/admin/content/:id
 * Delete a content item
 */
export const deleteContentItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const adminId = req.user?.id

    if (!adminId) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
      })
      return
    }

    if (!id) {
      res.status(400).json({
        success: false,
        error: 'Missing required parameter: id',
      })
      return
    }

    await AdminContentService.deleteContentItem(id, adminId)

    logger.info('Content item deleted', {
      id,
    })

    res.json({
      success: true,
      message: 'Content item deleted successfully',
    })
  } catch (error) {
    logger.error('Error deleting content item:', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    if (errorMessage.includes('not found')) {
      res.status(404).json({
        success: false,
        error: 'Content item not found',
      })
      return
    }

    res.status(500).json({
      success: false,
      error: 'Failed to delete content item',
      details: errorMessage,
    })
  }
}

/**
 * GET /api/admin/content/categories
 * Get all content categories
 */
export const getCategories = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const adminId = req.user?.id

    if (!adminId) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
      })
      return
    }

    const categories = await AdminContentService.getCategories()

    logger.info('Categories fetched', {
      count: categories.length,
    })

    res.json({
      success: true,
      data: categories,
    })
  } catch (error) {
    logger.error('Error fetching categories:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch categories',
      details: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

/**
 * GET /api/admin/content/export
 * Export content items for a specific language
 * Query params: ?language=vi
 */
export const exportContent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { language } = req.query
    const adminId = req.user?.id

    if (!adminId) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
      })
      return
    }

    if (!language || (language !== 'vi' && language !== 'en')) {
      res.status(400).json({
        success: false,
        error: 'Missing or invalid required parameter: language (must be vi or en)',
      })
      return
    }

    const exportedContent = await AdminContentService.exportContent(language as 'vi' | 'en')

    logger.info('Content exported', {
      language,
      categories: Object.keys(exportedContent.categories).length,
    })

    // Set response headers for file download
    const filename = `content-${language}-${new Date().getTime()}.json`
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)

    res.json(exportedContent)
  } catch (error) {
    logger.error('Error exporting content:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to export content',
      details: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

/**
 * POST /api/admin/content/import
 * Import content items from a JSON file
 * Body: { version, language, categories }
 */
export const importContent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const adminId = req.user?.id

    if (!adminId) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
      })
      return
    }

    const { version, language, categories } = req.body

    // Validate required fields
    if (!version || !language || !categories) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: version, language, categories',
      })
      return
    }

    if (language !== 'vi' && language !== 'en') {
      res.status(400).json({
        success: false,
        error: 'Invalid language: must be vi or en',
      })
      return
    }

    const result = await AdminContentService.importContent(
      {
        version,
        language,
        categories,
      },
      adminId
    )

    logger.info('Content imported', {
      imported: result.imported,
      errors: result.errors.length,
      language,
    })

    res.json({
      success: true,
      data: {
        imported: result.imported,
        errors: result.errors,
      },
    })
  } catch (error) {
    logger.error('Error importing content:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to import content',
      details: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

// ============================================================================
// PUBLIC ENDPOINTS (No authentication required)
// ============================================================================

/**
 * GET /api/content
 * Get public content items with optional filtering
 * Query params: ?category=header&language=vi&limit=50&offset=0
 */
export const getPublicContent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { category, language, limit = '50', offset = '0' } = req.query

    const result = await AdminContentService.getContentItems(
      category as string | undefined,
      language as 'vi' | 'en' | undefined,
      undefined,
      Math.min(parseInt(limit as string) || 50, 100),
      parseInt(offset as string) || 0
    )

    logger.info('Public content fetched', {
      count: result.items.length,
      total: result.total,
      category,
      language,
    })

    res.json({
      success: true,
      data: {
        items: result.items,
        total: result.total,
        limit: Math.min(parseInt(limit as string) || 50, 100),
        offset: parseInt(offset as string) || 0,
      },
    })
  } catch (error) {
    logger.error('Error fetching public content:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch content',
      details: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

/**
 * POST /api/content/batch
 * Get multiple content items by exact keys
 * Body: { keys: string[], language?: 'vi' | 'en' }
 */
export const getPublicContentBatch = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { keys, language = 'vi' } = req.body

    if (!Array.isArray(keys) || keys.length === 0) {
      res.status(400).json({
        success: false,
        error: 'Missing or invalid required field: keys must be a non-empty array',
      })
      return
    }

    if (keys.length > 200) {
      res.status(400).json({
        success: false,
        error: 'Too many keys requested: maximum is 200',
      })
      return
    }

    if (!keys.every((key) => typeof key === 'string')) {
      res.status(400).json({
        success: false,
        error: 'Invalid keys: every key must be a string',
      })
      return
    }

    if (language !== 'vi' && language !== 'en') {
      res.status(400).json({
        success: false,
        error: 'Invalid language parameter: must be vi or en',
      })
      return
    }

    const result = await AdminContentService.getContentItemsByKeys(keys, language)

    logger.info('Public content batch fetched', {
      requested: keys.length,
      found: Object.keys(result.items).length,
      missing: result.missingKeys.length,
      language,
    })

    res.json({
      success: true,
      data: result,
    })
  } catch (error) {
    logger.error('Error fetching public content batch:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch content batch',
      details: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

/**
 * GET /api/content/:key
 * Get a specific content item by key
 * Query params: ?language=vi
 */
export const getPublicContentByKey = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { key } = req.params
    const { language = 'vi' } = req.query

    if (!key) {
      res.status(400).json({
        success: false,
        error: 'Missing required parameter: key',
      })
      return
    }

    if (language !== 'vi' && language !== 'en') {
      res.status(400).json({
        success: false,
        error: 'Invalid language parameter: must be vi or en',
      })
      return
    }

    // Search for content item by key
    const result = await AdminContentService.getContentItems(
      undefined,
      language as 'vi' | 'en',
      key as string,
      10,  // Increase limit to get more results for exact matching
      0
    )

    if (result.items.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Content item not found',
      })
      return
    }

    // Find the exact match (search uses ilike, so we need exact match)
    const item = result.items.find((i) => i.key === key)

    if (!item) {
      res.status(404).json({
        success: false,
        error: 'Content item not found',
      })
      return
    }

    logger.info('Public content item fetched', {
      key,
      language,
    })

    res.json({
      success: true,
      data: item,
    })
  } catch (error) {
    logger.error('Error fetching public content item:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch content',
      details: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
