import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/auth'
import { lessonCheckService } from '../services/lesson-check.service'
import { keysToCamel } from '../utils/caseConverter'
import { errors } from '../middleware/errorHandler'

/**
 * Controller to handle deterministic lesson checking
 */
export const checkLesson = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { lessonId } = req.params
    const { code, language } = req.body
    const userId = req.user?.id

    if (!code || typeof code !== 'string') {
      throw errors.badRequest('Missing or invalid parameter: code')
    }

    if (!language || typeof language !== 'string') {
      throw errors.badRequest('Missing or invalid parameter: language')
    }

    const checkResult = await lessonCheckService.checkLesson(
      lessonId,
      userId,
      code,
      language
    )

    res.json({
      success: true,
      data: keysToCamel(checkResult),
    })
  } catch (error) {
    next(error)
  }
}
