import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/auth'
import { logger } from '../utils/logger'
import { errors } from '../middleware/errorHandler'
import { AuditLogService } from '../services/audit-log.service'
import { ImportHistoryService } from '../services/import-history.service'
import { importLessons } from '../services/bulk-import.service'

/** POST /api/admin/import — validate/commit first, then optional activity logs. */
export const bulkImport = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.id) throw errors.authRequired()
    const { chapterId, result: results } = await importLessons(req.body)
    // Observability is best effort after the committed acknowledgement.
    const audit = () =>
      AuditLogService.logAction({
        adminId: req.user?.id || '',
        action: 'import',
        resourceType: 'import',
        resourceName: `Imported ${results.lessonsCreated} lessons into chapter ${chapterId}`,
        metadata: {
          chapterId,
          lessonsCreated: results.lessonsCreated,
          testCasesCreated: results.testCasesCreated,
          testCasesReplaced: results.testCasesReplaced,
          stepsCreated: results.stepsCreated,
          stepsReplaced: results.stepsReplaced,
        },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      })

    const history = () =>
      ImportHistoryService.logImport({
        adminId: req.user?.id || '',
        chapterId,
        fileName: 'bulk-import.json',
        lessonsCount: results.lessonsCreated,
        testCasesCount: results.testCasesCreated,
        errorsCount: 0,
        status: 'success',
        metadata: {
          testCasesReplaced: results.testCasesReplaced,
          stepsCreated: results.stepsCreated,
          stepsReplaced: results.stepsReplaced,
        },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      })

    for (const record of [audit, history]) {
      try {
        await record()
      } catch {
        logger.error('Import committed but an activity log could not be recorded', { chapterId })
      }
    }

    res.json({ success: true, data: results })
  } catch (error) {
    next(error)
  }
}
