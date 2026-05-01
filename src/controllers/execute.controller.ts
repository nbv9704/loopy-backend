import { Response, NextFunction } from 'express'
import { supabaseAdmin } from '../db/supabase'
import { AuthRequest } from '../middleware/auth'
import { errors } from '../middleware/errorHandler'
import { executeJavaScript } from '../services/codeExecution.service'
import { logger } from '../utils/logger'

export const executeCode = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { language, code } = req.body
    const userId = req.user?.id

    const startTime = Date.now()
    let output = ''
    let error = null

    try {
      if (language === 'javascript') {
        const result = await executeJavaScript(code)
        output = result.output
        error = result.error
      } else {
        throw errors.executionError(
          `Language ${language} is not supported yet. Only JavaScript can run in browser.`
        )
      }
    } catch (err: any) {
      error = err.message
      logger.error('Code execution error:', err)
    }

    const executionTime = Date.now() - startTime

    // Log execution (optional, only if user is authenticated)
    if (userId) {
      try {
        await supabaseAdmin.from('code_executions').insert({
          user_id: userId,
          language,
          code,
          output,
          error,
          execution_time: executionTime,
        })
      } catch (err: any) {
        logger.error('Failed to log execution:', err)
      }
    }

    res.json({
      success: true,
      data: {
        output,
        error,
        executionTime,
      },
    })
  } catch (error) {
    next(error)
  }
}

export const validateCode = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { exerciseId, code } = req.body

    // Get exercise with test cases
    const { data: exercise, error: exerciseError } = await supabaseAdmin
      .from('exercises')
      .select('*')
      .eq('id', exerciseId)
      .single()

    if (exerciseError || !exercise) {
      throw errors.notFound('Exercise')
    }

    // Execute code with test cases
    const startTime = Date.now()
    let isCorrect = false
    let output = ''
    let error = null

    try {
      const result = await executeJavaScript(code)
      output = result.output
      error = result.error

      // TODO: Implement proper test case validation
      // For now, just check if code runs without error
      isCorrect = !result.error
    } catch (err: any) {
      error = err.message
    }

    const executionTime = Date.now() - startTime

    res.json({
      success: true,
      data: {
        isCorrect,
        output,
        error,
        executionTime,
      },
    })
  } catch (error) {
    next(error)
  }
}
