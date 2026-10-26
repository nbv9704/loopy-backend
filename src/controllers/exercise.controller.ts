import { Response, NextFunction } from 'express'
import { supabaseAdmin } from '../db/supabase'
import { AuthRequest } from '../middleware/auth'
import { errors } from '../middleware/errorHandler'
import { keysToCamel } from '../utils/caseConverter'
import { lessonCheckService } from '../services/lesson-check.service'

export const submitExercise = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id
    const { id: exerciseId } = req.params
    const { code } = req.body

    const { data: lesson, error: lessonError } = await supabaseAdmin
      .from('lessons')
      .select('id, chapters(languages(id))')
      .eq('id', exerciseId)
      .eq('status', 'published')
      .single()

    if (lessonError || !lesson) {
      throw errors.notFound('Exercise/Lesson')
    }

    const language = ((lesson.chapters as any)?.languages?.id as string | undefined) || 'javascript'
    const result = await lessonCheckService.checkLesson(exerciseId, userId, code, language)

    const { data: submission, error: submissionError } = await supabaseAdmin
      .from('lesson_submissions')
      .select('id, code, is_correct, submitted_at, execution_time, test_score, final_score, grading_method')
      .eq('user_id', userId)
      .eq('lesson_id', exerciseId)
      .order('submitted_at', { ascending: false })
      .limit(1)
      .single()

    if (submissionError) throw submissionError

    res.json({
      success: true,
      data: keysToCamel({
        submission,
        result: {
          isCorrect: result.passed,
          output: result.output,
          error: result.hint,
          executionTime: submission.execution_time,
          score: result.score,
          checks: result.checks,
        },
      }),
    })
  } catch (error) {
    next(error)
  }
}

export const getSubmissions = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id
    const { id: exerciseId } = req.params

    const { data: lesson, error: lessonError } = await supabaseAdmin
      .from('lessons')
      .select('id')
      .eq('id', exerciseId)
      .eq('status', 'published')
      .single()

    if (lessonError || !lesson) {
      throw errors.notFound('Exercise/Lesson')
    }

    const { data, error } = await supabaseAdmin
      .from('lesson_submissions')
      .select('id, code, is_correct, submitted_at, execution_time')
      .eq('user_id', userId)
      .eq('lesson_id', exerciseId)
      .order('submitted_at', { ascending: false })
      .limit(10)

    if (error) throw error

    res.json({
      success: true,
      data: keysToCamel({
        submissions: data,
      }),
    })
  } catch (error) {
    next(error)
  }
}
