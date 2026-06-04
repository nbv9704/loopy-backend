import { Router } from 'express'
import { authenticateSession } from '../middleware/authenticateSession'
import { requireAdmin } from '../middleware/requireAdmin'
import { supabaseAdmin } from '../db/supabase'
import { errors } from '../middleware/errorHandler'
import { clearKeywordCache } from '../utils/contentModeration'

const router = Router()

// All moderation routes require admin access
router.use(authenticateSession)
router.use(requireAdmin)

// Get all keywords
router.get('/keywords', async (_req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('content_moderation_keywords')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw errors.databaseError('Failed to fetch keywords', error)

    res.json({ success: true, data: data || [] })
  } catch (error) {
    next(error)
  }
})

// Add new keyword
router.post('/keywords', async (req, res, next) => {
  try {
    const { keyword, category, language } = req.body

    if (!keyword?.trim()) {
      throw errors.badRequest('Keyword is required')
    }

    const normalizedKeyword = keyword.trim().toLowerCase()

    // Check if exists
    const { data: existing } = await supabaseAdmin
      .from('content_moderation_keywords')
      .select('id')
      .eq('keyword', normalizedKeyword)
      .single()

    if (existing) {
      throw errors.badRequest('Keyword already exists')
    }

    const { data, error } = await supabaseAdmin
      .from('content_moderation_keywords')
      .insert({
        keyword: normalizedKeyword,
        category: category || 'general',
        language: language || 'all',
        created_by: (req as any).user?.id,
      })
      .select()
      .single()

    if (error) throw errors.databaseError('Failed to create keyword', error)

    clearKeywordCache()

    res.status(201).json({ success: true, data })
  } catch (error) {
    next(error)
  }
})

// Update keyword
router.put('/keywords/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    const { keyword, category, language, is_active } = req.body

    const updateData: any = {}
    if (keyword) updateData.keyword = keyword.trim().toLowerCase()
    if (category) updateData.category = category
    if (language) updateData.language = language
    if (is_active !== undefined) updateData.is_active = is_active

    if (Object.keys(updateData).length === 0) {
      throw errors.badRequest('No fields to update')
    }

    const { data, error } = await supabaseAdmin
      .from('content_moderation_keywords')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === '23505') { // Unique violation
        throw errors.badRequest('Keyword already exists')
      }
      throw errors.databaseError('Failed to update keyword', error)
    }

    clearKeywordCache()

    res.json({ success: true, data })
  } catch (error) {
    next(error)
  }
})

// Delete keyword
router.delete('/keywords/:id', async (req, res, next) => {
  try {
    const { id } = req.params

    const { error } = await supabaseAdmin
      .from('content_moderation_keywords')
      .delete()
      .eq('id', id)

    if (error) throw errors.databaseError('Failed to delete keyword', error)

    clearKeywordCache()

    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})

export default router
