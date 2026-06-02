import { Response } from 'express'
import { AuthRequest } from '../../middleware/auth'
import { ImportHistoryService } from '../../services/import-history.service'
import { logger } from '../../utils/logger'

/**
 * Get import history
 * GET /api/admin/import-history
 * Query params: ?chapterId=xxx&status=success&limit=50&offset=0
 */
export const getImportHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { chapterId, status, limit = '50', offset = '0' } = req.query
    const adminId = req.user?.id

    if (!adminId) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
      })
      return
    }

    const { data, count } = await ImportHistoryService.getHistory({
      chapterId: chapterId as string | undefined,
      status: status as string | undefined,
      limit: Math.min(parseInt(limit as string) || 50, 100),
      offset: parseInt(offset as string) || 0,
    })

    logger.info('Import history fetched', {
      count,
      chapterId,
      status,
    })

    res.json({
      success: true,
      data: {
        imports: data,
        total: count,
        limit: Math.min(parseInt(limit as string) || 50, 100),
        offset: parseInt(offset as string) || 0,
      },
    })
  } catch (error) {
    logger.error('Error fetching import history:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch import history',
      details: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

/**
 * Get import statistics
 * GET /api/admin/import-history/stats
 */
export const getImportStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const adminId = req.user?.id

    if (!adminId) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
      })
      return
    }

    const stats = await ImportHistoryService.getStats()

    logger.info('Import stats fetched', stats)

    res.json({
      success: true,
      data: stats,
    })
  } catch (error) {
    logger.error('Error fetching import stats:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch import stats',
      details: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
