/**
 * Content Moderation Utility
 * 
 * Provides centralized content validation against banned keywords.
 * Implements caching for performance and supports Vietnamese text normalization.
 */

import { supabaseAdmin } from '../db/supabase'
import { errors } from '../middleware/errorHandler'
import { logger } from './logger'

let keywordCache: string[] | null = null
let cacheExpiry: number = 0
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

/**
 * Normalize text for comparison
 * - Converts to lowercase
 * - Removes Vietnamese diacritics
 * - Converts đ/Đ to d/D
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/đ/g, 'd')  // Vietnamese đ → d
    .replace(/Đ/g, 'D')  // Vietnamese Đ → D (though already lowercased)
    .normalize('NFD')     // Decompose combined characters
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
}

/**
 * Load banned keywords from database with caching
 * Returns empty array if no keywords found (Decision 2A: allow all when empty)
 */
export async function loadKeywords(): Promise<string[]> {
  const now = Date.now()
  
  // Return cached keywords if still valid
  if (keywordCache && now < cacheExpiry) {
    return keywordCache
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('content_moderation_keywords')
      .select('keyword')
      .eq('is_active', true)

    if (error) {
      logger.error('Failed to load moderation keywords:', error)
      // Decision 2A: On error, allow content (don't block everything)
      return []
    }

    keywordCache = (data || []).map(row => row.keyword.toLowerCase())
    cacheExpiry = now + CACHE_TTL_MS

    logger.info(`Loaded ${keywordCache.length} active moderation keywords`)
    return keywordCache
  } catch (error) {
    logger.error('Exception loading moderation keywords:', error)
    // Decision 2A: On exception, allow content
    return []
  }
}

/**
 * Check if text contains any banned keywords
 * Returns list of matched keywords
 */
export async function containsBannedKeywords(text: string): Promise<{
  found: boolean
  matches: string[]
}> {
  const keywords = await loadKeywords()
  
  // Decision 2A: Empty keyword list = allow all content
  if (keywords.length === 0) {
    return { found: false, matches: [] }
  }

  const normalized = normalizeText(text)
  const matches: string[] = []

  for (const keyword of keywords) {
    // Use word boundary regex to avoid false positives
    // Matches keyword at start/end or surrounded by non-alphanumeric chars
    const pattern = new RegExp(`(^|[^a-z0-9])${keyword}([^a-z0-9]|$)`, 'i')
    if (pattern.test(normalized)) {
      matches.push(keyword)
    }
  }

  return { found: matches.length > 0, matches }
}

/**
 * Validate content fields against banned keywords
 * Throws badRequest error if violations found
 * 
 * @param fields - Array of text fields to validate (null/undefined values are filtered out)
 * @throws {errors.badRequest} When banned keywords are detected
 */
export async function validateContent(fields: (string | undefined | null)[]): Promise<void> {
  // Filter out empty values and join all text
  const allText = fields.filter(Boolean).join(' ')
  
  // Skip validation if no content to check
  if (!allText.trim()) {
    return
  }

  const result = await containsBannedKeywords(allText)

  if (result.found) {
    const displayMatches = result.matches.slice(0, 3).join(', ')
    const additional = result.matches.length > 3 ? ` (và ${result.matches.length - 3} từ khác)` : ''
    
    logger.warn('Content validation failed - banned keywords detected:', {
      matchCount: result.matches.length,
      matches: result.matches,
    })

    throw errors.badRequest(
      `Nội dung chứa từ khóa không được phép: ${displayMatches}${additional}. Vui lòng chỉnh sửa và thử lại.`
    )
  }
}

/**
 * Clear keyword cache
 * Called after admin adds/removes/updates keywords
 */
export function clearKeywordCache(): void {
  keywordCache = null
  cacheExpiry = 0
  logger.info('Moderation keyword cache cleared')
}

/**
 * Check if content would be blocked (without throwing error)
 * Useful for preview/warning UI
 */
export async function previewValidation(fields: (string | undefined | null)[]): Promise<{
  valid: boolean
  matches: string[]
}> {
  const allText = fields.filter(Boolean).join(' ')
  
  if (!allText.trim()) {
    return { valid: true, matches: [] }
  }

  const result = await containsBannedKeywords(allText)
  
  return {
    valid: !result.found,
    matches: result.matches,
  }
}
