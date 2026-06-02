/**
 * Bulk Import Controller
 *
 * Allows admins to upload a JSON file containing lessons and test cases
 * in bulk, reducing manual data entry.
 *
 * POST /api/admin/import
 *
 * NOTE: Fully updated to schema-v2. No longer references legacy
 * `exercises` or `test_cases` tables (both dropped in schema-v2.sql).
 */

import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/auth'
import { supabaseAdmin } from '../db/supabase'
import { logger } from '../utils/logger'
import { errors } from '../middleware/errorHandler'
import { AuditLogService } from '../services/audit-log.service'
import { ImportHistoryService } from '../services/import-history.service'

interface ImportTestCase {
  order_index: number
  description: string
  input?: any
  expected_output: any
  weight?: number
  timeout?: number
  is_hidden?: boolean
}

interface ImportLesson {
  lesson_id?: string
  lessonId?: string
  title: string
  description?: string       // "See" part: explanation
  starter_code?: string      // Initial code to "See"
  starterCode?: string
  task_description?: string  // "Change" part: what to do
  taskDescription?: string
  hint?: string              // "Fix" part: help if stuck
  common_mistakes?: string   // "Fix" part: common beginner errors
  commonMistakes?: string
  solution_code?: string     // "Build" part: final expected code
  solutionCode?: string
  is_aha_lesson?: boolean
  isAhaLesson?: boolean
  difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'easy' | 'medium' | 'hard'
  grading_mode?: 'stdout' | 'function'
  gradingMode?: 'stdout' | 'function'
  status?: string
  order_index?: number
  orderIndex?: number
  test_cases?: ImportTestCase[]
  testCases?: ImportTestCase[]
}

interface ImportPayload {
  chapter_id?: string
  chapterId?: string
  lessons: ImportLesson[]
}

/**
 * Bulk import lessons and test cases into a chapter
 * POST /api/admin/import
 */
export const bulkImport = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const payload = req.body as ImportPayload
    const chapterId = payload.chapter_id || payload.chapterId

    if (!chapterId || !Array.isArray(payload.lessons) || payload.lessons.length === 0) {
      throw errors.validationError('chapter_id and a non-empty lessons array are required')
    }

    // Verify chapter exists
    const { data: chapter, error: chapterErr } = await supabaseAdmin
      .from('chapters')
      .select('id, title')
      .eq('id', chapterId)
      .single()

    if (chapterErr || !chapter) {
      throw errors.notFound(`Chapter ${chapterId}`)
    }

    logger.info(`Bulk import: ${payload.lessons.length} lessons into chapter "${chapter.title}"`)

    const results = {
      lessonsCreated: 0,
      testCasesCreated: 0,
      testCasesReplaced: 0,
      errors: [] as string[],
    }

    for (const lessonData of payload.lessons) {
      try {
        const lessonId = lessonData.lesson_id || lessonData.lessonId
        const starterCode = lessonData.starter_code || lessonData.starterCode
        const solutionCode = lessonData.solution_code || lessonData.solutionCode
        const orderIndex = lessonData.order_index ?? lessonData.orderIndex
        const hasTestCasesPayload =
          Array.isArray(lessonData.test_cases) || Array.isArray(lessonData.testCases)
        const testCases = lessonData.test_cases || lessonData.testCases || []
        const difficultyMap = {
          beginner: 'beginner',
          easy: 'beginner',
          intermediate: 'intermediate',
          medium: 'intermediate',
          advanced: 'advanced',
          hard: 'advanced',
        } as const
        const difficulty = difficultyMap[lessonData.difficulty || 'beginner']

        if (!lessonId || !starterCode || !solutionCode || orderIndex === undefined) {
          results.errors.push(
            `Lesson "${lessonData.title || lessonId || 'unknown'}": missing lesson_id, starter_code, solution_code, or order_index`
          )
          continue
        }

        // Upsert lesson into schema-v2 lessons table
        const { data: lesson, error: lessonErr } = await supabaseAdmin
          .from('lessons')
          .upsert(
            {
              chapter_id: chapterId,
              lesson_id: lessonId,
              title: lessonData.title,
              description: lessonData.description || '',
              starter_code: starterCode,
              task_description: lessonData.task_description || lessonData.taskDescription || '',
              hint: lessonData.hint || '',
              common_mistakes: lessonData.common_mistakes || lessonData.commonMistakes || '',
              solution_code: solutionCode,
              is_aha_lesson: lessonData.is_aha_lesson || lessonData.isAhaLesson || false,
              difficulty,
              grading_mode: lessonData.grading_mode || lessonData.gradingMode || 'stdout',
              order_index: orderIndex,
              status: lessonData.status || 'draft',
            },
            { onConflict: 'chapter_id,lesson_id' }
          )
          .select('id')
          .single()

        if (lessonErr || !lesson) {
          results.errors.push(`Lesson "${lessonData.title}": ${lessonErr?.message || 'unknown'}`)
          continue
        }

        results.lessonsCreated++

        // Replace test cases only when the payload explicitly includes test cases.
        if (hasTestCasesPayload) {
          const { count: existingTestCaseCount, error: countErr } = await supabaseAdmin
            .from('lesson_test_cases')
            .select('id', { count: 'exact', head: true })
            .eq('lesson_id', lesson.id)

          if (countErr) {
            results.errors.push(
              `Test cases for "${lessonData.title}" could not be counted: ${countErr.message}`
            )
            continue
          }

          const { error: deleteErr } = await supabaseAdmin
            .from('lesson_test_cases')
            .delete()
            .eq('lesson_id', lesson.id)

          if (deleteErr) {
            results.errors.push(
              `Test cases for "${lessonData.title}" could not be replaced: ${deleteErr.message}`
            )
            continue
          }

          results.testCasesReplaced += existingTestCaseCount || 0

          for (const tc of testCases) {
            const { error: tcErr } = await supabaseAdmin
              .from('lesson_test_cases')
              .insert({
                lesson_id: lesson.id,
                description: tc.description,
                input: tc.input ?? [],
                expected_output: tc.expected_output,
                weight: tc.weight ?? 10,
                timeout: tc.timeout ?? 1000,
                is_hidden: tc.is_hidden ?? false,
                order_index: tc.order_index,
              })

            if (tcErr) {
              results.errors.push(
                `Test case for "${lessonData.title}" (order ${tc.order_index}): ${tcErr.message}`
              )
              continue
            }

            results.testCasesCreated++
          }
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        results.errors.push(`Lesson "${lessonData.title}": ${msg}`)
      }
    }

    logger.info('Bulk import complete:', results)

    // Log the import action
    await AuditLogService.logAction({
      adminId: req.user?.id || '',
      action: 'import',
      resourceType: 'import',
      resourceName: `Imported ${results.lessonsCreated} lessons into chapter ${chapterId}`,
      metadata: {
        chapterId,
        lessonsCreated: results.lessonsCreated,
        testCasesCreated: results.testCasesCreated,
        testCasesReplaced: results.testCasesReplaced,
        errors: results.errors.length,
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    })

    // Log import history
    await ImportHistoryService.logImport({
      adminId: req.user?.id || '',
      chapterId,
      fileName: 'bulk-import.json',
      lessonsCount: results.lessonsCreated,
      testCasesCount: results.testCasesCreated,
      errorsCount: results.errors.length,
      status: results.errors.length === 0 ? 'success' : results.lessonsCreated > 0 ? 'partial' : 'failed',
      errorMessage: results.errors.length > 0 ? results.errors.slice(0, 3).join('; ') : undefined,
      metadata: {
        testCasesReplaced: results.testCasesReplaced,
        totalErrors: results.errors.length,
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    })

    res.json({
      success: true,
      data: results,
    })
  } catch (error) {
    next(error)
  }
}
