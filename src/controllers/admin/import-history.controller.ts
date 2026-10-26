import { Response, NextFunction } from 'express'
import { AuthRequest } from '../../middleware/auth'
import { ImportHistoryService } from '../../services/import-history.service'
import { errors } from '../../middleware/errorHandler'

export const getImportHistory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user?.id) throw errors.authRequired()
    const { chapterId, status, limit = 50, offset = 0 } = req.query
    const options = {
      chapterId: chapterId as string | undefined,
      status: status as string | undefined,
      limit: Number(limit),
      offset: Number(offset),
    }
    const { data, count } = await ImportHistoryService.getHistory(options)
    res.json({
      success: true,
      data: { imports: data, total: count, limit: options.limit, offset: options.offset },
    })
  } catch (error) {
    next(error)
  }
}

export const getImportStats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user?.id) throw errors.authRequired()
    res.json({ success: true, data: await ImportHistoryService.getStats() })
  } catch (error) {
    next(error)
  }
}
