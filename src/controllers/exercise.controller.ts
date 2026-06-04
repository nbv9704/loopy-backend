import { Response, NextFunction } from 'express'
import { supabaseAdmin } from '../db/supabase'
import { AuthRequest } from '../middleware/auth'
import { errors } from '../middleware/errorHandler'
import { keysToCamel } from '../utils/caseConverter'
import { executeCode as executeCodeService } from '../services/codeExecution.service'

export const submitExercise = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id
    const { id: exerciseId } = req.params
    const { code } = req.body

    // Map exerciseId to lesson_id
    const { data: lesson, error: lessonError } = await supabaseAdmin
      .from('lessons')
      .select('*, chapters(languages(*))')
      .eq('id', exerciseId)
      .single()

    if (lessonError || !lesson) {
      throw errors.notFound('Exercise/Lesson')
    }

    // Execute code and validate
    const startTime = Date.now()
    let isCorrect = false
    let output = ''
    let error = null

    try {
      const language = (lesson.chapters as any).languages.id

      const result = await executeCodeService(language, code)
      output = result.output
      error = result.error
      isCorrect = !result.error
    } catch (err: any) {
      error = err.message
    }

    const executionTime = Date.now() - startTime

    // Save submission mapping to lesson_submissions
    const { data: submission, error: submissionError } = await supabaseAdmin
      .from('lesson_submissions')
      .insert({
        user_id: userId,
        lesson_id: exerciseId,
        code,
        is_correct: isCorrect,
        execution_time: executionTime,
      })
      .select()
      .single()

    if (submissionError) throw submissionError

    res.json({
      success: true,
      data: keysToCamel({
        submission,
        result: {
          isCorrect,
          output,
          error,
          executionTime,
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
