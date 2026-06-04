import { Response, NextFunction } from 'express'
import { supabaseAdmin } from '../db/supabase'
import { AuthRequest } from '../middleware/auth'
import { executeCode as executeCodeService } from '../services/codeExecution.service'
import { logger } from '../utils/logger'
import { config } from '../config'
import { PISTON_LANGUAGE_CONFIG } from '../services/piston-executor.service'

export const getCapabilities = async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const isPistonEnabled = !!config.piston.apiUrl
    const isGlotEnabled = !!config.glot.apiToken
    const externalRunner = isPistonEnabled ? 'piston' : (isGlotEnabled ? 'glot' : 'piston')
    const externalRunnerSupported = isPistonEnabled || isGlotEnabled
    const externalRunnerReason = externalRunnerSupported
      ? null
      : 'Cần cấu hình PISTON_API_URL hoặc GLOT_API_TOKEN để bật runner cho ngôn ngữ này.'

    const pistonCapabilities = Object.keys(PISTON_LANGUAGE_CONFIG).reduce<Record<string, { supported: boolean; runner: 'piston' | 'glot'; requiresRunner: boolean; reason: string | null }>>((acc, language) => {
      acc[language] = {
        supported: externalRunnerSupported,
        runner: externalRunner,
        requiresRunner: true,
        reason: externalRunnerReason,
      }
      return acc
    }, {})

    res.json({
      success: true,
      data: {
        capabilities: {
          javascript: {
            supported: true,
            runner: 'local',
            requiresRunner: false,
            reason: null,
          },
          ...pistonCapabilities,
        },
      },
    })
  } catch (error) {
    next(error)
  }
}

export const executeCode = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { language, code } = req.body
    const userId = req.user?.id

    const result = await executeCodeService(language, code)
    const output = result.output
    const error = result.error
    const executionTime = result.executionTime ?? 0

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
      } catch (err: unknown) {
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

export const validateCode = async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { exerciseId, code } = _req.body

    const { data: lesson, error: lessonError } = await supabaseAdmin
      .from('lessons')
      .select('id, chapters(languages(id))')
      .eq('id', exerciseId)
      .single()

    if (lessonError || !lesson) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Exercise/Lesson not found',
        },
      })
      return
    }

    const language = ((lesson.chapters as any)?.languages?.id as string | undefined) || 'javascript'
    const result = await executeCodeService(language, code)

    res.json({
      success: true,
      data: {
        isCorrect: !result.error,
        output: result.output,
        error: result.error,
        executionTime: result.executionTime ?? 0,
      },
    })
  } catch (error) {
    next(error)
  }
}
