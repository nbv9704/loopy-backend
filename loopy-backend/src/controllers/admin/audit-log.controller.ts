import { Response } from 'express'
import { AuthRequest } from '../../middleware/auth'
import { AuditLogService } from '../../services/audit-log.service'
import { logger } from '../../utils/logger'

/**
 * Get audit logs
 * GET /api/admin/audit-logs
 * Query params: ?action=create&resourceType=lesson&limit=50&offset=0
 */
export const getAuditLogs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { action, resourceType, limit = '50', offset = '0' } = req.query
    const adminId = req.user?.id

    if (!adminId) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
      })
      return
    }

    const { data, count } = await AuditLogService.getLogs({
      action: action as string | undefined,
      resourceType: resourceType as string | undefined,
      limit: Math.min(parseInt(limit as string) || 50, 100),
      offset: parseInt(offset as string) || 0,
    })

    logger.info('Audit logs fetched', {
      count,
      action,
      resourceType,
    })

    res.json({
      success: true,
      data: {
        logs: data,
        total: count,
        limit: Math.min(parseInt(limit as string) || 50, 100),
        offset: parseInt(offset as string) || 0,
      },
    })
  } catch (error) {
    logger.error('Error fetching audit logs:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch audit logs',
      details: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
