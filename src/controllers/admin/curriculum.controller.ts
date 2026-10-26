import type { RequestHandler } from 'express'
import { supabaseAdmin } from '../../db/supabase'
import { AuditLogService } from '../../services/audit-log.service'
import { validateContent } from '../../utils/contentModeration'
import { errors } from '../../middleware/errorHandler'
import {
  readAdminChapters,
  readAdminLessons,
  readLessonDetails,
  saveLessonDetail,
  removeLessonDetail,
  archiveAdminLesson,
} from '../../services/admin-curriculum.service'

export const getChapters: RequestHandler = async (_req, res, next) => {
  try {
    res.json({ success: true, data: await readAdminChapters() })
  } catch (error) {
    next(error)
  }
}
export const listLessons: RequestHandler = async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: await readAdminLessons(
        req.query.chapter_id as string | undefined,
        String(req.query.status || 'active')
      ),
    })
  } catch (error) {
    next(error)
  }
}

export const getLesson: RequestHandler = async (req, res, next) => {
  try {
    const { lessonId } = req.params
    const { data, error } = await supabaseAdmin
      .from('lessons')
      .select('*')
      .eq('id', lessonId)
      .single()
    if (error?.code === 'PGRST116' || (!error && !data)) throw errors.notFound('Lesson')
    if (error) throw error
    res.json({ success: true, data })
  } catch (error) {
    next(error)
  }
}

export const listTestCases: RequestHandler = async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: await readLessonDetails('lesson_test_cases', req.params.lessonId),
    })
  } catch (error) {
    next(error)
  }
}

export const saveTestCase: RequestHandler = async (req, res, next) => {
  try {
    const { lessonId } = req.params
    const { id, description, input, expected_output, weight, timeout, is_hidden, order_index } =
      req.body

    const row = {
      lesson_id: lessonId,
      description,
      input: input ?? [],
      expected_output,
      weight: weight ?? 10,
      timeout: timeout ?? 1000,
      is_hidden: is_hidden ?? false,
      order_index,
    }

    const data = await saveLessonDetail('lesson_test_cases', lessonId, id, row)
    res.json({ success: true, data })
  } catch (error) {
    next(error)
  }
}

export const deleteTestCase: RequestHandler = async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: await removeLessonDetail('lesson_test_cases', req.params.testCaseId),
    })
  } catch (error) {
    next(error)
  }
}
export const listSteps: RequestHandler = async (req, res, next) => {
  try {
    res.json({ success: true, data: await readLessonDetails('lesson_steps', req.params.lessonId) })
  } catch (error) {
    next(error)
  }
}

export const saveStep: RequestHandler = async (req, res, next) => {
  try {
    const { lessonId } = req.params
    const {
      id,
      type,
      title,
      prompt,
      options,
      correct_answer,
      explanation,
      hint,
      is_required,
      order_index,
    } = req.body

    await validateContent([title, prompt, explanation, hint])

    const row = {
      lesson_id: lessonId,
      type,
      title: title || '',
      prompt,
      options: options ?? [],
      correct_answer: correct_answer ?? null,
      explanation: explanation || '',
      hint: hint || '',
      is_required: is_required ?? false,
      order_index,
    }

    const data = await saveLessonDetail('lesson_steps', lessonId, id, row)
    res.json({ success: true, data })
  } catch (error) {
    next(error)
  }
}

export const deleteStep: RequestHandler = async (req, res, next) => {
  try {
    res.json({ success: true, data: await removeLessonDetail('lesson_steps', req.params.stepId) })
  } catch (error) {
    next(error)
  }
}

export const saveLesson: RequestHandler = async (req, res, next) => {
  try {
    const {
      id,
      chapter_id,
      lesson_id,
      title,
      lesson_type,
      description,
      starter_code,
      task_description,
      hint,
      hint_level_1,
      hint_level_2,
      hint_level_3,
      common_mistakes,
      solution_code,
      is_aha_lesson,
      difficulty,
      grading_mode,
      validation_type,
      validation_rules,
      success_output,
      failure_hint,
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
      lesson_type,
      description,
      starter_code,
      task_description,
      hint,
      hint_level_1,
      hint_level_2,
      hint_level_3,
      common_mistakes,
      solution_code,
      is_aha_lesson,
      difficulty,
      grading_mode,
      validation_type,
      validation_rules,
      success_output,
      failure_hint,
      order_index,
      status,
      qa_checklist: qa_checklist || [],
      debug_starter_code: debug_starter_code || '',
      debug_task_description: debug_task_description || '',
      debug_validation_rules: debug_validation_rules || [],
      debug_hint: debug_hint || '',
    }

    const isCreate = !id

    // Check for banned keywords (admin bypass with audit log)
    try {
      await validateContent([
        title,
        description,
        task_description,
        hint,
        hint_level_1,
        hint_level_2,
        hint_level_3,
        common_mistakes,
        success_output,
        failure_hint,
        debug_task_description,
        debug_hint,
      ])
    } catch (moderationError: any) {
      const adminId = (req as any).user?.id
      if (adminId) {
        await AuditLogService.logAction({
          adminId,
          action: isCreate ? 'create' : 'update',
          resourceType: 'lesson',
          resourceId: id || 'new',
          resourceName: title,
          metadata: {
            reason: 'Content moderation flagged',
            error: moderationError.message,
          },
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        })
      }
    }

    const { data, error } = await supabaseAdmin
      .from('lessons')
      .upsert(whitelistedLesson)
      .select()
      .single()
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
  } catch (error) {
    next(error)
  }
}

export const archiveLesson: RequestHandler = async (req, res, next) => {
  try {
    const { lessonId } = req.params

    const lesson = await archiveAdminLesson(lessonId)

    // Log the action
    const adminId = (req as any).user?.id
    if (adminId) {
      await AuditLogService.logAction({
        adminId,
        action: 'archive',
        resourceType: 'lesson',
        resourceId: lessonId,
        resourceName: lesson.title,
        changes: { status: 'archived' },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      })
    }

    res.json({ success: true, data: { id: lessonId, archived: true } })
  } catch (error) {
    next(error)
  }
}
