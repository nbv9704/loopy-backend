import { Response, NextFunction } from 'express'
import { supabaseAdmin } from '../db/supabase'
import { AuthRequest } from '../middleware/auth'
import { errors } from '../middleware/errorHandler'
import { executeJavaScript } from '../services/codeExecution.service'

export const submitExercise = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id
    const { id: exerciseId } = req.params
    const { code } = req.body

    // Get exercise with test cases
    const { data: exercise, error: exerciseError } = await supabaseAdmin
      .from('exercises')
      .select('*, lessons(chapters(languages(*)))')
      .eq('id', exerciseId)
      .single()

    if (exerciseError || !exercise) {
      throw errors.notFound('Exercise')
    }

    // Execute code and validate
    const startTime = Date.now()
    let isCorrect = false
    let output = ''
    let error = null

    try {
      // For now, only JavaScript is supported in browser
      const language = (exercise.lessons as any).chapters.languages.id

      if (language === 'javascript') {
        const result = await executeJavaScript(code)
        output = result.output
        error = result.error

        // Simple validation: check if code runs without error

        isCorrect = !result.error
      } else {
        throw errors.executionError('Language not supported for execution')
      }
    } catch (err: any) {
      error = err.message
    }

    const executionTime = Date.now() - startTime

    // Save submission
    const { data: submission, error: submissionError } = await supabaseAdmin
      .from('exercise_submissions')
      .insert({
        user_id: userId,
        exercise_id: exerciseId,
        code,
        is_correct: isCorrect,
        execution_time: executionTime,
      })
      .select()
      .single()

    if (submissionError) throw submissionError

    res.json({
      success: true,
      data: {
        submission,
        result: {
          isCorrect,
          output,
          error,
          executionTime,
        },
      },
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
      .from('exercise_submissions')
      .select('id, code, is_correct, submitted_at, execution_time')
      .eq('user_id', userId)
      .eq('exercise_id', exerciseId)
      .order('submitted_at', { ascending: false })
      .limit(10)

    if (error) throw error

    res.json({
      success: true,
      data: {
        submissions: data,
      },
    })
  } catch (error) {
    next(error)
  }
}
