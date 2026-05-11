/**
 * Bulk Import Controller
 *
 * Allows admins to upload a JSON file containing lessons, exercises,
 * and test cases in bulk, reducing manual data entry.
 *
 * POST /api/admin/import
 */

import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/auth'
import { supabaseAdmin } from '../db/supabase'
import { logger } from '../utils/logger'
import { errors } from '../middleware/errorHandler'

interface ImportExercise {
  title: string
  description: string
  starter_code?: string
  difficulty?: 'easy' | 'medium' | 'hard'
  test_cases?: {
    input: unknown
    expected_output: unknown
    weight?: number
    timeout?: number
    description: string
    is_hidden?: boolean
  }[]
}

interface ImportLesson {
  lesson_id: string
  title: string
  description?: string
  code?: string
  insight?: string
  order_index: number
  exercises?: ImportExercise[]
}

interface ImportPayload {
  chapter_id: string
  lessons: ImportLesson[]
}

/**
 * Bulk import lessons and exercises into a chapter
 * POST /api/admin/import
 */
export const bulkImport = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const payload = req.body as ImportPayload

    if (!payload.chapter_id || !Array.isArray(payload.lessons) || payload.lessons.length === 0) {
      throw errors.validationError('chapter_id and a non-empty lessons array are required')
    }

    // Verify chapter exists
    const { data: chapter, error: chapterErr } = await supabaseAdmin
      .from('chapters')
      .select('id, title')
      .eq('id', payload.chapter_id)
      .single()

    if (chapterErr || !chapter) {
      throw errors.notFound(`Chapter ${payload.chapter_id}`)
    }

    logger.info(`Bulk import: ${payload.lessons.length} lessons into chapter "${chapter.title}"`)

    const results = {
      lessonsCreated: 0,
      exercisesCreated: 0,
      testCasesCreated: 0,
      errors: [] as string[],
    }

    for (const lessonData of payload.lessons) {
      try {
        // Upsert lesson
        const { data: lesson, error: lessonErr } = await supabaseAdmin
          .from('lessons')
          .upsert(
            {
              lesson_id: lessonData.lesson_id,
              title: lessonData.title,
              description: lessonData.description || '',
              code: lessonData.code || '',
              insight: lessonData.insight || '',
              order_index: lessonData.order_index,
              chapter_id: payload.chapter_id,
            },
            { onConflict: 'lesson_id' }
          )
          .select('id')
          .single()

        if (lessonErr || !lesson) {
          results.errors.push(`Lesson "${lessonData.title}": ${lessonErr?.message || 'unknown'}`)
          continue
        }

        results.lessonsCreated++

        // Process exercises if provided
        if (lessonData.exercises && lessonData.exercises.length > 0) {
          for (const [exIndex, exerciseData] of lessonData.exercises.entries()) {
            const { data: exercise, error: exErr } = await supabaseAdmin
              .from('exercises')
              .insert({
                lesson_id: lesson.id,
                title: exerciseData.title,
                description: exerciseData.description,
                starter_code: exerciseData.starter_code || '',
                difficulty: exerciseData.difficulty || 'easy',
                order_index: exIndex,
              })
              .select('id')
              .single()

            if (exErr || !exercise) {
              results.errors.push(
                `Exercise "${exerciseData.title}": ${exErr?.message || 'unknown'}`
              )
              continue
            }

            results.exercisesCreated++

            // Process test cases
            if (exerciseData.test_cases && exerciseData.test_cases.length > 0) {
              const testCaseRows = exerciseData.test_cases.map((tc, tcIndex) => ({
                exercise_id: exercise.id,
                input: tc.input,
                expected_output: tc.expected_output,
                weight: tc.weight || Math.floor(100 / exerciseData.test_cases!.length),
                timeout: tc.timeout || 5000,
                description: tc.description,
                is_hidden: tc.is_hidden || false,
                order_index: tcIndex,
              }))

              const { error: tcErr } = await supabaseAdmin
                .from('test_cases')
                .insert(testCaseRows)

              if (tcErr) {
                results.errors.push(`Test cases for "${exerciseData.title}": ${tcErr.message}`)
              } else {
                results.testCasesCreated += testCaseRows.length
              }
            }
          }
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        results.errors.push(`Lesson "${lessonData.title}": ${msg}`)
      }
    }

    logger.info('Bulk import complete:', results)

    res.json({
      success: true,
      data: results,
    })
  } catch (error) {
    next(error)
  }
}
