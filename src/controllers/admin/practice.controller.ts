import { Response, NextFunction } from 'express'
import { AuthRequest } from '../../middleware/auth'
import { practiceService } from '../../services/practice.service'
import { AuditLogService } from '../../services/audit-log.service'

/**
 * List all practice sets (admin view - includes all visibility/status)
 */
export const listAllSets = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await practiceService.listAllSets({
      languageId: req.query.languageId as string | undefined,
      difficulty: req.query.difficulty as 'easy' | 'medium' | 'hard' | undefined,
      status: req.query.status as 'active' | 'draft' | 'published' | 'archived' | 'all' | undefined,
      visibility: req.query.visibility as
        'public' | 'private' | 'unlisted' | 'official' | undefined,
      createdBy: req.query.createdBy as string | undefined,
      limit: req.query.limit as number | undefined,
      offset: req.query.offset as number | undefined,
    })

    res.json({ success: true, data: result })
  } catch (error) {
    next(error)
  }
}

/**
 * Get detailed practice set info (admin view)
 */
export const getSet = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await practiceService.getSetForAdmin(req.params.setId)
    res.json({ success: true, data: result })
  } catch (error) {
    next(error)
  }
}

/**
 * Create official practice set (admin only)
 */
export const createSet = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const adminId = req.user!.id
    const result = await practiceService.createSet(
      { ...req.body, visibility: req.body.visibility ?? 'official' },
      adminId,
      true // isAdmin
    )

    // Log action
    await AuditLogService.logAction({
      adminId,
      action: 'create',
      resourceType: 'practice_set',
      resourceId: result.id,
      resourceName: result.title,
      metadata: {
        visibility: 'official',
        questionCount: result.questions?.length || 0,
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    })

    res.status(201).json({ success: true, data: result })
  } catch (error) {
    next(error)
  }
}

/**
 * Update practice set (admin can edit any set)
 */
export const updateSet = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const adminId = req.user!.id
    const setId = req.params.setId

    // Get current set for audit logging
    const currentSet = await practiceService.getSetForAdmin(setId)

    const result = await practiceService.updateSetForAdmin(setId, req.body, adminId)

    // Log action
    await AuditLogService.logAction({
      adminId,
      action: 'update',
      resourceType: 'practice_set',
      resourceId: setId,
      resourceName: result.title,
      changes: {
        title: result.title !== currentSet.title ? result.title : undefined,
        status: result.status !== currentSet.status ? result.status : undefined,
        visibility: result.visibility !== currentSet.visibility ? result.visibility : undefined,
        difficulty: result.difficulty !== currentSet.difficulty ? result.difficulty : undefined,
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    })

    res.json({ success: true, data: result })
  } catch (error) {
    next(error)
  }
}

/**
 * Archive practice set (admin can archive any set without deleting attempts/submissions)
 */
export const deleteSet = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const adminId = req.user!.id
    const setId = req.params.setId

    // Get set info before archiving for audit log
    const set = await practiceService.getSetForAdmin(setId)

    const result = await practiceService.deleteSetForAdmin(
      setId,
      adminId,
      req.query.expectedStatus as string
    )

    // Log action
    await AuditLogService.logAction({
      adminId,
      action: 'archive',
      resourceType: 'practice_set',
      resourceId: setId,
      resourceName: set.title,
      metadata: {
        visibility: set.visibility,
        status: set.status,
        createdBy: set.createdBy,
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    })

    res.json(result)
  } catch (error) {
    next(error)
  }
}

/**
 * Change practice set status (draft/published/archived)
 */
export const updateStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const adminId = req.user!.id
    const setId = req.params.setId
    const { status } = req.body

    if (!['draft', 'published', 'archived'].includes(status)) {
      res.status(400).json({ success: false, message: 'Invalid status' })
      return
    }

    const currentSet = await practiceService.getSetForAdmin(setId)
    const result = await practiceService.updateSetStatus(
      setId,
      status,
      adminId,
      req.body.expectedStatus
    )

    // Log action
    await AuditLogService.logAction({
      adminId,
      action: 'update',
      resourceType: 'practice_set',
      resourceId: setId,
      resourceName: result.title,
      metadata: {
        statusChange: `${currentSet.status} → ${status}`,
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    })

    res.json({ success: true, data: result })
  } catch (error) {
    next(error)
  }
}

/**
 * Change practice set visibility (make official or change visibility)
 */
export const updateVisibility = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const adminId = req.user!.id
    const setId = req.params.setId
    const { visibility } = req.body

    if (!['public', 'private', 'unlisted', 'official'].includes(visibility)) {
      res.status(400).json({ success: false, message: 'Invalid visibility' })
      return
    }

    const currentSet = await practiceService.getSetForAdmin(setId)
    const result = await practiceService.updateSetVisibility(
      setId,
      visibility,
      adminId,
      req.body.expectedVisibility
    )

    // Log action
    await AuditLogService.logAction({
      adminId,
      action: 'update',
      resourceType: 'practice_set',
      resourceId: setId,
      resourceName: result.title,
      metadata: {
        visibilityChange: `${currentSet.visibility} → ${visibility}`,
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    })

    res.json({ success: true, data: result })
  } catch (error) {
    next(error)
  }
}

/**
 * Get practice sets statistics
 */
export const getStats = async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await practiceService.getPracticeStats()
    res.json({ success: true, data: result })
  } catch (error) {
    next(error)
  }
}
