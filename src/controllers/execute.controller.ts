import { Response, NextFunction } from 'express'
import { supabaseAdmin } from '../db/supabase'
import { AuthRequest } from '../middleware/auth'
import { executeCode as executeCodeService } from '../services/codeExecution.service'
import { logCodeExecution } from '../services/execution/log'
import { executionCapabilities } from '../services/execution/languages'
import { errors } from '../middleware/errorHandler'
import { lessonCheckService } from '../services/lesson-check.service'

export const getCapabilities = async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    res.json({ success: true, data: { capabilities: executionCapabilities() } })
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
    const executionTime = result.executionTime

    if (userId) void logCodeExecution({ userId, language, code, output, error, executionTime })

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
    const userId = _req.user?.id

    const { data: lesson, error: lessonError } = await supabaseAdmin
      .from('lessons')
      .select('id, chapters!inner(language_id)')
      .eq('id', exerciseId)
      .eq('status', 'published')
      .maybeSingle()

    if (lessonError) throw errors.databaseError('Không tải được bài học để kiểm tra.')
    if (!lesson) throw errors.notFound('Lesson')
    const chapter = Array.isArray(lesson.chapters) ? lesson.chapters[0] : lesson.chapters
    if (!chapter?.language_id) throw errors.databaseError('Bài học chưa có ngôn ngữ hợp lệ.')
    const language = chapter.language_id
    const result = await lessonCheckService.checkLesson(exerciseId, userId, code, language)

    res.json({
      success: true,
      data: {
        submissionId: result.submissionId,
        isCorrect: result.passed,
        passed: result.passed,
        score: result.score,
        output: result.output,
        error: result.hint,
        checks: result.checks,
      },
    })
  } catch (error) {
    next(error)
  }
}
