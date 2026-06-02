import { supabaseAdmin } from '../db/supabase'
import { logger } from '../utils/logger'
import { AuditLogService } from './audit-log.service'
import { execSync } from 'child_process'
import path from 'path'

/**
 * AdminContentService - Admin content management service
 *
 * Provides CRUD operations for managing content items and categories.
 * All operations are admin-only and logged for audit trail.
 * Implements Requirements 1.3 for ContentService.
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface ContentCategory {
  id: string
  name: string
  description?: string
  displayOrder: number
  createdAt: Date
  updatedAt: Date
}

export interface ContentItem {
  id: string
  categoryId: string
  key: string
  language: 'vi' | 'en'
  value: string
  description?: string
  type: 'text' | 'markdown' | 'html'
  createdAt: Date
  updatedAt: Date
  createdBy?: string
  updatedBy?: string
}

export interface CreateContentItemInput {
  categoryId: string
  key: string
  language: 'vi' | 'en'
  value: string
  description?: string
  type?: 'text' | 'markdown' | 'html'
}

export interface UpdateContentItemInput {
  value: string
  description?: string
  type?: 'text' | 'markdown' | 'html'
}

export interface ExportedContent {
  version: string
  language: 'vi' | 'en'
  exportedAt: Date
  categories: {
    [categoryName: string]: {
      [key: string]: string
    }
  }
}

export interface ImportedContent {
  version: string
  language: 'vi' | 'en'
  categories: {
    [categoryName: string]: {
      [key: string]: string
    }
  }
}

export interface GetContentItemsResult {
  items: ContentItem[]
  total: number
}

export interface GetContentItemsByKeysResult {
  items: Record<string, string>
  missingKeys: string[]
}

// ============================================================================
// SERVICE IMPLEMENTATION
// ============================================================================

export class AdminContentService {
  /**
   * Get content items with optional filtering and pagination
   * Supports filtering by category, language, and search query
   *
   * @param category - Optional category name to filter by
   * @param language - Optional language to filter by (vi, en)
   * @param search - Optional search query to filter by key or value
   * @param limit - Number of items to return (default: 50, max: 100)
   * @param offset - Number of items to skip (default: 0)
   * @returns Object containing items array and total count
   */
  static async getContentItems(
    category?: string,
    language?: 'vi' | 'en',
    search?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<GetContentItemsResult> {
    try {
      // Validate limit
      const validLimit = Math.min(Math.max(1, limit), 100)

      // Build query
      let query = supabaseAdmin
        .from('content_items')
        .select(
          `
          id,
          category_id,
          key,
          language,
          value,
          description,
          type,
          created_at,
          updated_at,
          created_by,
          updated_by,
          content_categories(name)
        `,
          { count: 'exact' }
        )

      // Apply category filter (by category_id, not name)
      if (category) {
        query = query.eq('category_id', category)
      }

      // Apply language filter
      if (language) {
        query = query.eq('language', language)
      }

      // Apply search filter (search in key or value)
      if (search) {
        query = query.or(`key.ilike.%${search}%,value.ilike.%${search}%`)
      }

      // Apply ordering and pagination
      query = query.order('updated_at', { ascending: false }).range(offset, offset + validLimit - 1)

      const { data, count, error } = await query

      if (error) {
        logger.error('Error fetching content items:', error)
        logger.error('Query details:', { category, language, search, limit, offset })
        throw new Error(`Failed to fetch content items: ${error.message}`)
      }

      logger.info('Content items fetched successfully', {
        count: count,
        dataLength: data?.length || 0,
        category,
        language,
        search,
      })

      // Transform data from snake_case to camelCase
      const items: ContentItem[] = (data || []).map((item: any) => ({
        id: item.id,
        categoryId: item.category_id,
        key: item.key,
        language: item.language,
        value: item.value,
        description: item.description,
        type: item.type,
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at),
        createdBy: item.created_by,
        updatedBy: item.updated_by,
      }))

      return {
        items,
        total: count || 0,
      }
    } catch (error) {
      logger.error('Exception in getContentItems:', error)
      throw error
    }
  }

  /**
   * Get multiple content item values by exact keys for one language.
   * Used by public V2 pages to preload CMS content with one batch request.
   *
   * @param keys - Content keys to fetch
   * @param language - Language to filter by (vi, en)
   * @returns Map of found key/value pairs and list of missing keys
   */
  static async getContentItemsByKeys(
    keys: string[],
    language: 'vi' | 'en'
  ): Promise<GetContentItemsByKeysResult> {
    try {
      const uniqueKeys = Array.from(
        new Set(keys.map((key) => key.trim()).filter((key) => key.length > 0))
      )

      if (uniqueKeys.length === 0) {
        return {
          items: {},
          missingKeys: [],
        }
      }

      const { data, error } = await supabaseAdmin
        .from('content_items')
        .select('key, value')
        .eq('language', language)
        .in('key', uniqueKeys)

      if (error) {
        logger.error('Error fetching content items by keys:', error)
        logger.error('Batch query details:', { keys: uniqueKeys, language })
        throw new Error(`Failed to fetch content items by keys: ${error.message}`)
      }

      const items = (data || []).reduce<Record<string, string>>((acc, item: any) => {
        acc[item.key] = item.value
        return acc
      }, {})

      const missingKeys = uniqueKeys.filter((key) => !(key in items))

      logger.info('Content items fetched by keys successfully', {
        requested: uniqueKeys.length,
        found: Object.keys(items).length,
        missing: missingKeys.length,
        language,
      })

      return {
        items,
        missingKeys,
      }
    } catch (error) {
      logger.error('Exception in getContentItemsByKeys:', error)
      throw error
    }
  }

  /**
   * Get a single content item by ID
   *
   * @param id - Content item ID
   * @returns Content item or null if not found
   */
  static async getContentItem(id: string): Promise<ContentItem | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('content_items')
        .select(
          `
          id,
          category_id,
          key,
          language,
          value,
          description,
          type,
          created_at,
          updated_at,
          created_by,
          updated_by
        `
        )
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // Not found
          return null
        }
        logger.error('Error fetching content item:', error)
        throw new Error(`Failed to fetch content item: ${error.message}`)
      }

      if (!data) {
        return null
      }

      // Transform data from snake_case to camelCase
      return {
        id: data.id,
        categoryId: data.category_id,
        key: data.key,
        language: data.language,
        value: data.value,
        description: data.description,
        type: data.type,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        createdBy: data.created_by,
        updatedBy: data.updated_by,
      }
    } catch (error) {
      logger.error('Exception in getContentItem:', error)
      throw error
    }
  }

  /**
   * Create a new content item
   *
   * @param data - Content item data
   * @param adminId - ID of admin user creating the item
   * @returns Created content item
   */
  static async createContentItem(
    data: CreateContentItemInput,
    adminId: string
  ): Promise<ContentItem> {
    try {
      // Check if category exists
      const { data: category, error: categoryError } = await supabaseAdmin
        .from('content_categories')
        .select('id')
        .eq('id', data.categoryId)
        .single()

      if (categoryError || !category) {
        throw new Error('Category not found')
      }

      // Check for duplicate key in category+language combination
      const { data: existing } = await supabaseAdmin
        .from('content_items')
        .select('id')
        .eq('category_id', data.categoryId)
        .eq('key', data.key)
        .eq('language', data.language)
        .single()

      if (existing) {
        throw new Error(
          `Content item with key "${data.key}" already exists for this category and language`
        )
      }

      // Create the content item
      const { data: newItem, error } = await supabaseAdmin
        .from('content_items')
        .insert({
          category_id: data.categoryId,
          key: data.key,
          language: data.language,
          value: data.value,
          description: data.description,
          type: data.type || 'text',
          created_by: adminId,
          updated_by: adminId,
        })
        .select(
          `
          id,
          category_id,
          key,
          language,
          value,
          description,
          type,
          created_at,
          updated_at,
          created_by,
          updated_by
        `
        )
        .single()

      if (error) {
        logger.error('Error creating content item:', error)
        throw new Error(`Failed to create content item: ${error.message}`)
      }

      if (!newItem) {
        throw new Error('Failed to create content item')
      }

      // Log audit action
      await AuditLogService.logAction({
        adminId,
        action: 'create',
        resourceType: 'content_item',
        resourceId: newItem.id,
        resourceName: newItem.key,
        changes: {
          key: newItem.key,
          category_id: newItem.category_id,
          language: newItem.language,
          value: newItem.value,
          type: newItem.type,
        },
        metadata: {
          category_id: newItem.category_id,
        },
      })

      // Transform data from snake_case to camelCase
      return {
        id: newItem.id,
        categoryId: newItem.category_id,
        key: newItem.key,
        language: newItem.language,
        value: newItem.value,
        description: newItem.description,
        type: newItem.type,
        createdAt: new Date(newItem.created_at),
        updatedAt: new Date(newItem.updated_at),
        createdBy: newItem.created_by,
        updatedBy: newItem.updated_by,
      }
    } catch (error) {
      logger.error('Exception in createContentItem:', error)
      throw error
    }
  }

  /**
   * Update a content item
   *
   * @param id - Content item ID
   * @param data - Updated content item data
   * @param adminId - ID of admin user updating the item
   * @returns Updated content item
   */
  static async updateContentItem(
    id: string,
    data: UpdateContentItemInput,
    adminId: string
  ): Promise<ContentItem> {
    try {
      // Check if item exists
      const existing = await this.getContentItem(id)
      if (!existing) {
        throw new Error('Content item not found')
      }

      // Update the content item
      const { data: updatedItem, error } = await supabaseAdmin
        .from('content_items')
        .update({
          value: data.value,
          description: data.description,
          type: data.type,
          updated_by: adminId,
        })
        .eq('id', id)
        .select(
          `
          id,
          category_id,
          key,
          language,
          value,
          description,
          type,
          created_at,
          updated_at,
          created_by,
          updated_by
        `
        )
        .single()

      if (error) {
        logger.error('Error updating content item:', error)
        throw new Error(`Failed to update content item: ${error.message}`)
      }

      if (!updatedItem) {
        throw new Error('Failed to update content item')
      }

      // Log audit action
      await AuditLogService.logAction({
        adminId,
        action: 'update',
        resourceType: 'content_item',
        resourceId: updatedItem.id,
        resourceName: updatedItem.key,
        changes: {
          old: {
            value: existing.value,
            description: existing.description,
            type: existing.type,
          },
          new: {
            value: updatedItem.value,
            description: updatedItem.description,
            type: updatedItem.type,
          },
        },
        metadata: {
          category_id: updatedItem.category_id,
        },
      })

      // Trigger i18n sync after successful update
      await this.triggerI18nSync()

      // Transform data from snake_case to camelCase
      return {
        id: updatedItem.id,
        categoryId: updatedItem.category_id,
        key: updatedItem.key,
        language: updatedItem.language,
        value: updatedItem.value,
        description: updatedItem.description,
        type: updatedItem.type,
        createdAt: new Date(updatedItem.created_at),
        updatedAt: new Date(updatedItem.updated_at),
        createdBy: updatedItem.created_by,
        updatedBy: updatedItem.updated_by,
      }
    } catch (error) {
      logger.error('Exception in updateContentItem:', error)
      throw error
    }
  }

  /**
   * Delete a content item
   *
   * @param id - Content item ID
   * @param adminId - ID of admin user deleting the item
   */
  static async deleteContentItem(id: string, adminId: string): Promise<void> {
    try {
      // Check if item exists
      const existing = await this.getContentItem(id)
      if (!existing) {
        throw new Error('Content item not found')
      }

      // Delete the content item
      const { error } = await supabaseAdmin.from('content_items').delete().eq('id', id)

      if (error) {
        logger.error('Error deleting content item:', error)
        throw new Error(`Failed to delete content item: ${error.message}`)
      }

      // Log audit action
      await AuditLogService.logAction({
        adminId,
        action: 'delete',
        resourceType: 'content_item',
        resourceId: existing.id,
        resourceName: existing.key,
        changes: {
          key: existing.key,
          category_id: existing.categoryId,
          language: existing.language,
        },
        metadata: {
          category_id: existing.categoryId,
        },
      })
    } catch (error) {
      logger.error('Exception in deleteContentItem:', error)
      throw error
    }
  }

  /**
   * Get all content categories
   *
   * @returns Array of content categories
   */
  static async getCategories(): Promise<ContentCategory[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('content_categories')
        .select(
          `
          id,
          name,
          description,
          display_order,
          created_at,
          updated_at
        `
        )
        .order('display_order', { ascending: true })

      if (error) {
        logger.error('Error fetching categories:', error)
        throw new Error(`Failed to fetch categories: ${error.message}`)
      }

      // Transform data from snake_case to camelCase
      return (data || []).map((category: any) => ({
        id: category.id,
        name: category.name,
        description: category.description,
        displayOrder: category.display_order,
        createdAt: new Date(category.created_at),
        updatedAt: new Date(category.updated_at),
      }))
    } catch (error) {
      logger.error('Exception in getCategories:', error)
      throw error
    }
  }

  /**
   * Export content items for a specific language
   * Returns all content items grouped by category
   *
   * @param language - Language to export (vi, en)
   * @returns Exported content object
   */
  static async exportContent(language: 'vi' | 'en'): Promise<ExportedContent> {
    try {
      // Fetch all content items for the language
      const { data, error } = await supabaseAdmin
        .from('content_items')
        .select(
          `
          key,
          language,
          value,
          content_categories(name)
        `
        )
        .eq('language', language)
        .order('updated_at', { ascending: false })

      if (error) {
        logger.error('Error exporting content:', error)
        throw new Error(`Failed to export content: ${error.message}`)
      }

      // Group content by category
      const categories: { [categoryName: string]: { [key: string]: string } } = {}

      ;(data || []).forEach((item: any) => {
        const categoryName = item.content_categories?.name || 'unknown'
        if (!categories[categoryName]) {
          categories[categoryName] = {}
        }
        categories[categoryName][item.key] = item.value
      })

      return {
        version: '1.0',
        language,
        exportedAt: new Date(),
        categories,
      }
    } catch (error) {
      logger.error('Exception in exportContent:', error)
      throw error
    }
  }

  /**
   * Import content items from an exported content object
   * Creates or updates content items based on the imported data
   *
   * @param data - Imported content data
   * @param adminId - ID of admin user importing the content
   * @returns Import result with counts and errors
   */
  static async importContent(
    data: ImportedContent,
    adminId: string
  ): Promise<{ imported: number; errors: string[] }> {
    try {
      let imported = 0
      const errors: string[] = []

      // Iterate through categories and items
      for (const [categoryName, items] of Object.entries(data.categories)) {
        // Find category by name
        const { data: category, error: categoryError } = await supabaseAdmin
          .from('content_categories')
          .select('id')
          .eq('name', categoryName)
          .single()

        if (categoryError || !category) {
          errors.push(`Category "${categoryName}" not found`)
          continue
        }

        // Import each item
        for (const [key, value] of Object.entries(items)) {
          try {
            // Check if item already exists
            const { data: existing } = await supabaseAdmin
              .from('content_items')
              .select('id')
              .eq('category_id', category.id)
              .eq('key', key)
              .eq('language', data.language)
              .single()

            if (existing) {
              // Update existing item
              const { error: updateError } = await supabaseAdmin
                .from('content_items')
                .update({
                  value,
                  updated_by: adminId,
                })
                .eq('id', existing.id)

              if (updateError) {
                errors.push(`Failed to update item "${key}": ${updateError.message}`)
              } else {
                imported++
              }
            } else {
              // Create new item
              const { error: insertError } = await supabaseAdmin
                .from('content_items')
                .insert({
                  category_id: category.id,
                  key,
                  language: data.language,
                  value,
                  type: 'text',
                  created_by: adminId,
                  updated_by: adminId,
                })

              if (insertError) {
                errors.push(`Failed to create item "${key}": ${insertError.message}`)
              } else {
                imported++
              }
            }
          } catch (error) {
            errors.push(`Error processing item "${key}": ${error instanceof Error ? error.message : 'Unknown error'}`)
          }
        }
      }

      // Log audit action for import
      await AuditLogService.logAction({
        adminId,
        action: 'import',
        resourceType: 'content_item',
        resourceName: `Content import (${data.language})`,
        changes: {
          language: data.language,
          categories: Object.keys(data.categories),
          itemCount: Object.values(data.categories).reduce((sum, cat) => sum + Object.keys(cat).length, 0),
        },
        metadata: {
          imported,
          errors: errors.length,
          language: data.language,
        },
      })

      logger.info('Content import completed', {
        imported,
        errors: errors.length,
        language: data.language,
      })

      return { imported, errors }
    } catch (error) {
      logger.error('Exception in importContent:', error)
      throw error
    }
  }

  /**
   * Trigger i18n sync script to update translation files
   * This is called automatically after content updates
   *
   * The sync script:
   * 1. Fetches content from the API
   * 2. Converts flat content items to nested i18n structure
   * 3. Merges with existing i18n files
   * 4. Saves updated i18n JSON files
   *
   * @returns Promise that resolves when sync is triggered
   */
  static async triggerI18nSync(): Promise<void> {
    try {
      // Get the frontend directory path
      // Assuming backend is at loopy-backend and frontend is at loopy-frontend
      const backendDir = process.cwd()
      const frontendDir = path.resolve(backendDir, '../loopy-frontend')

      logger.info('Triggering i18n sync', { frontendDir })

      // Run the sync script using npm
      // The script is defined in loopy-frontend/package.json as "sync:content"
      const command = `cd "${frontendDir}" && npm run sync:content`

      try {
        const output = execSync(command, {
          encoding: 'utf-8',
          stdio: 'pipe',
          timeout: 30000, // 30 second timeout
        })

        logger.info('i18n sync completed successfully', { output: output.substring(0, 500) })
      } catch (execError: any) {
        // Log the error but don't throw - we don't want to fail the content update
        // if the sync script fails
        logger.warn('i18n sync script failed', {
          error: execError.message,
          stderr: execError.stderr?.toString().substring(0, 500),
          stdout: execError.stdout?.toString().substring(0, 500),
        })
      }
    } catch (error) {
      logger.warn('Exception in triggerI18nSync:', error)
      // Don't throw - sync failure should not block content updates
    }
  }
}
