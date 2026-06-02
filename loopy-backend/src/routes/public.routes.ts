import { Router } from 'express'
import { supabaseAdmin } from '../db/supabase'
import { keysToCamel } from '../utils/caseConverter'
import {
  getPublicContent,
  getPublicContentBatch,
  getPublicContentByKey,
} from '../controllers/admin/content.controller'

const router = Router()

/**
 * Get a sample lesson for non-authenticated users
 */
router.get('/sample-lesson', async (_req, res, next) => {
  try {
    // Fetch the first "Aha!" lesson (marked as is_aha_lesson = true)
    // We'll pick one from JavaScript as it's the most common for web
    const { data, error } = await supabaseAdmin
      .from('lessons')
      .select('id, title, description, starter_code, task_description, is_aha_lesson, chapters(language_id)')
      .eq('is_aha_lesson', true)
      .eq('chapters.language_id', 'javascript')
      .order('order_index')
      .limit(1)
      .single()

    if (error) throw error

    res.json({
      success: true,
      data: keysToCamel(data)
    })
  } catch (error) {
    next(error)
  }
})

/**
 * Public content management endpoints
 */

/**
 * GET /api/public/content
 * Get public content items with optional filtering
 */
router.get('/content', getPublicContent)

/**
 * POST /api/public/content/batch
 * Get multiple public content items by exact keys
 */
router.post('/content/batch', getPublicContentBatch)

/**
 * GET /api/public/content/:key
 * Get a specific content item by key
 */
router.get('/content/:key', getPublicContentByKey)

export default router
