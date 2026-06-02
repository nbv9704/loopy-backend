import { Router } from 'express'
import { authenticateSession } from '../middleware/authenticateSession'
import { requireAdmin } from '../middleware/requireAdmin'
import { getDashboardStats } from '../controllers/admin/dashboard.controller'
import { getAuditLogs } from '../controllers/admin/audit-log.controller'
import { getImportHistory, getImportStats } from '../controllers/admin/import-history.controller'
import {
  getContentItems,
  createContentItem,
  updateContentItem,
  deleteContentItem,
  getCategories,
  exportContent,
  importContent,
} from '../controllers/admin/content.controller'
import { bulkImport } from '../controllers/bulk-import.controller'
import { supabaseAdmin } from '../db/supabase'
import { validate } from '../middleware/validate'
import { contentSchemas } from '../schemas/content.schemas'
import { AuditLogService } from '../services/audit-log.service'

/**
 * Admin Routes - Rebuild Phase
 *
 * Following docs/admin_panel_plan.md:
 * - Dashboard (stats and metrics)
 * - Lesson Management
 * - Submission Review
 * - AI Grading Override
 * - PvP Question Bank
 * - Analytics
 * - User Management
 * - System Settings
 */

const router = Router()

// Apply session authentication and admin middleware to all routes
router.use(authenticateSession)
router.use(requireAdmin)

// ============================================================================
// DASHBOARD ROUTES
// ============================================================================

router.get('/stats/overview', getDashboardStats)

// ============================================================================
// AUDIT LOGS
// ============================================================================

router.get('/audit-logs', getAuditLogs)

// ============================================================================
// IMPORT HISTORY
// ============================================================================

router.get('/import-history/stats', getImportStats)
router.get('/import-history', getImportHistory)

// ============================================================================
// SUBMISSION MONITORING
// ============================================================================

router.get('/submissions', async (req, res, next) => {
  try {
    const limitParam = Number(req.query.limit || 50)
    const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 100) : 50
    const status = String(req.query.status || 'all')

    let query = supabaseAdmin
      .from('lesson_submissions')
      .select(`
        id,
        user_id,
        lesson_id,
        code,
        is_correct,
        test_score,
        final_score,
        grade_level,
        feedback,
        execution_time,
        submitted_at,
        lessons (
          id,
          lesson_id,
          title,
          chapters (
            id,
            language_id,
            title
          )
        )
      `)
      .order('submitted_at', { ascending: false })
      .limit(limit)

    if (status === 'pass') query = query.eq('is_correct', true)
    if (status === 'fail') query = query.eq('is_correct', false)

    const { data, error } = await query
    if (error) throw error

    res.json({ success: true, data: data || [] })
  } catch (error) { next(error) }
})

// ============================================================================
// CONTENT MANAGEMENT - CMS Content Items
// ============================================================================

// Admin content management endpoints
// NOTE: Specific routes must come before parameterized routes to avoid conflicts
router.get('/content', getContentItems)
router.post('/content', createContentItem)
router.get('/content/categories', getCategories)
router.get('/content/export', exportContent)
router.post('/content/import', importContent)
router.put('/content/:id', updateContentItem)
router.delete('/content/:id', deleteContentItem)

// ============================================================================
// BULK IMPORT
// ============================================================================

router.post('/import', bulkImport)

// Chapter Management
router.get('/chapters', async (_req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin.from('chapters').select('*').order('language_id').order('order_index')
    if (error) throw error
    res.json({ success: true, data })
  } catch (error) { next(error) }
})

// Lesson Management
router.get('/lessons', async (req, res, next) => {
  try {
    const chapterId = req.query.chapter_id as string | undefined

    let query = supabaseAdmin.from('lessons').select('*')
    if (chapterId && chapterId !== 'all') {
      query = query.eq('chapter_id', chapterId)
    }
    query = query.order('chapter_id').order('order_index')

    const { data, error } = await query
    if (error) throw error

    const lessons = data || []
    const lessonIds = lessons.map(lesson => lesson.id)
    const testCaseCounts = new Map<string, number>()

    if (lessonIds.length > 0) {
      const { data: testCases, error: testCasesError } = await supabaseAdmin
        .from('lesson_test_cases')
        .select('lesson_id')
        .in('lesson_id', lessonIds)

      if (testCasesError) throw testCasesError

      for (const testCase of testCases || []) {
        testCaseCounts.set(testCase.lesson_id, (testCaseCounts.get(testCase.lesson_id) || 0) + 1)
      }
    }

    res.json({
      success: true,
      data: lessons.map(lesson => ({
        ...lesson,
        test_case_count: testCaseCounts.get(lesson.id) || 0,
      })),
    })
  } catch (error) { next(error) }
})

router.get('/lessons/:lessonId', async (req, res, next) => {
  try {
    const { lessonId } = req.params
    const { data, error } = await supabaseAdmin.from('lessons').select('*').eq('id', lessonId).single()
    if (error || !data) throw error
    res.json({ success: true, data })
  } catch (error) { next(error) }
})

// Test Case Management
router.get('/lessons/:lessonId/test-cases', async (req, res, next) => {
  try {
    const { lessonId } = req.params
    const { data, error } = await supabaseAdmin
      .from('lesson_test_cases')
      .select('*')
      .eq('lesson_id', lessonId)
      .order('order_index')
    if (error) throw error
    res.json({ success: true, data: data || [] })
  } catch (error) { next(error) }
})

router.post('/lessons/:lessonId/test-cases', async (req, res, next) => {
  try {
    const { lessonId } = req.params
    const { id, description, input, expected_output, weight, timeout, is_hidden, order_index } = req.body

    if (!description || expected_output === undefined || order_index === undefined) {
      res.status(400).json({
        success: false,
        message: 'description, expected_output, and order_index are required',
      })
      return
    }

    const row = {
      ...(id ? { id } : {}),
      lesson_id: lessonId,
      description,
      input: input ?? [],
      expected_output,
      weight: weight ?? 10,
      timeout: timeout ?? 1000,
      is_hidden: is_hidden ?? false,
      order_index,
    }

    const { data, error } = await supabaseAdmin
      .from('lesson_test_cases')
      .upsert(row)
      .select()
      .single()
    if (error) throw error
    res.json({ success: true, data })
  } catch (error) { next(error) }
})

router.delete('/test-cases/:testCaseId', async (req, res, next) => {
  try {
    const { testCaseId } = req.params
    const { error } = await supabaseAdmin.from('lesson_test_cases').delete().eq('id', testCaseId)
    if (error) throw error
    res.json({ success: true })
  } catch (error) { next(error) }
})

router.post('/lessons', validate(contentSchemas.lesson), async (req, res, next) => {
  try {
    const {
      id,
      chapter_id,
      lesson_id,
      title,
      description,
      starter_code,
      task_description,
      hint,
      common_mistakes,
      solution_code,
      is_aha_lesson,
      difficulty,
      grading_mode,
      order_index,
      status,
      qa_checklist,
      debug_starter_code,
      debug_task_description,
      debug_validation_rules,
      debug_hint,
    } = req.body

    const whitelistedLesson = {
      ...(id ? { id } : {}),
      chapter_id,
      lesson_id,
      title,
      description,
      starter_code,
      task_description,
      hint,
      common_mistakes,
      solution_code,
      is_aha_lesson,
      difficulty,
      grading_mode,
      order_index,
      status,
      qa_checklist: qa_checklist || [],
      debug_starter_code: debug_starter_code || '',
      debug_task_description: debug_task_description || '',
      debug_validation_rules: debug_validation_rules || [],
      debug_hint: debug_hint || '',
    }

    const isCreate = !id
    const { data, error } = await supabaseAdmin.from('lessons').upsert(whitelistedLesson).select().single()
    if (error) throw error

    // Log the action
    const adminId = (req as any).user?.id
    if (adminId) {
      await AuditLogService.logAction({
        adminId,
        action: isCreate ? 'create' : 'update',
        resourceType: 'lesson',
        resourceId: data.id,
        resourceName: title,
        changes: isCreate ? whitelistedLesson : { status, title },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      })
    }

    res.json({ success: true, data })
  } catch (error) { next(error) }
})

router.delete('/lessons/:lessonId', async (req, res, next) => {
  try {
    const { lessonId } = req.params

    // Get lesson info before deleting for audit log
    const { data: lesson } = await supabaseAdmin.from('lessons').select('title').eq('id', lessonId).single()

    const { error } = await supabaseAdmin.from('lessons').delete().eq('id', lessonId)
    if (error) throw error

    // Log the action
    const adminId = (req as any).user?.id
    if (adminId && lesson) {
      await AuditLogService.logAction({
        adminId,
        action: 'delete',
        resourceType: 'lesson',
        resourceId: lessonId,
        resourceName: lesson.title,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      })
    }

    res.json({ success: true })
  } catch (error) { next(error) }
})

// ============================================================================
// SYSTEM HEALTH
// ============================================================================

router.get('/health/metrics', (_req, res) => {
  const mem = process.memoryUsage()
  const uptime = process.uptime()

  res.json({
    success: true,
    data: {
      memory: {
        heapUsedMB: Math.round(mem.heapUsed / 1024 / 1024),
        heapTotalMB: Math.round(mem.heapTotal / 1024 / 1024),
        rssMB: Math.round(mem.rss / 1024 / 1024),
        externalMB: Math.round(mem.external / 1024 / 1024),
      },
      uptime: {
        seconds: Math.round(uptime),
        formatted: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`,
      },
      nodeVersion: process.version,
      platform: process.platform,
      timestamp: new Date().toISOString(),
    },
  })
})

export default router
