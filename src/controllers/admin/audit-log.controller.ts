import { NextFunction, Response } from 'express'
import { AuthRequest } from '../../middleware/auth'
import { AuditLogService } from '../../services/audit-log.service'

export const getAuditLogs = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { action, resourceType, limit = 50, offset = 0 } = req.query
    const result = await AuditLogService.getLogs({
      action: action as string | undefined,
      resourceType: resourceType as string | undefined,
      limit: Number(limit),
      offset: Number(offset),
    })
    res.json({
      success: true,
      data: {
        logs: result.data,
        total: result.count,
        limit: Number(limit),
        offset: Number(offset),
      },
    })
  } catch (error) {
    next(error)
  }
}
