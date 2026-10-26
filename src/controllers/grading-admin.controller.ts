import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/auth'
import { supabaseAdmin } from '../db/supabase'
import { gradingOrchestratorService } from '../services/grading-orchestrator.service'
import { readLessonDetails, saveLessonDetail } from '../services/admin-curriculum.service'
import { readGradingUsage } from '../services/grading/usage'
import { errors } from '../middleware/errorHandler'
import { AuditLogService } from '../services/audit-log.service'

export const overrideScore = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await gradingOrchestratorService.overrideScore(
      req.params.submissionId,
      req.body,
      req.user!.id
    )
    res.json({ success: true, data: result })
  } catch (error) {
    next(error)
  }
}

const testCaseResponse = (row: Record<string, any>) => ({
  id: row.id,
  exerciseId: row.lesson_id,
  input: row.input,
  expectedOutput: row.expected_output,
  weight: row.weight,
  timeout: row.timeout,
  description: row.description,
  isHidden: row.is_hidden,
  orderIndex: row.order_index,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})

export const getTestCases = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const rows = await readLessonDetails('lesson_test_cases', req.params.exerciseId)
    res.json({ success: true, data: { testCases: rows.map(testCaseResponse) } })
  } catch (error) {
    next(error)
  }
}

export const createTestCase = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { exerciseId } = req.params
    const { input, expectedOutput, weight, timeout, description, isHidden, orderIndex } = req.body
    const { data: lesson, error } = await supabaseAdmin
      .from('lessons')
      .select('id')
      .eq('id', exerciseId)
      .maybeSingle()
    if (error) throw errors.databaseError('Không tải được lesson để thêm test case.')
    if (!lesson) throw errors.notFound('Lesson')
    const saved = await saveLessonDetail('lesson_test_cases', exerciseId, undefined, {
      input,
      expected_output: expectedOutput,
      weight,
      timeout,
      description,
      is_hidden: isHidden,
      order_index: orderIndex,
    })
    await AuditLogService.logAction({
      adminId: req.user!.id,
      action: 'create',
      resourceType: 'test_case',
      resourceId: saved.id,
      metadata: { lessonId: exerciseId },
      ipAddress: req.ip,
    })
    res.status(201).json({ success: true, data: testCaseResponse(saved) })
  } catch (error) {
    next(error)
  }
}

export const getUsageStats = async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    res.json({ success: true, data: await readGradingUsage() })
  } catch (error) {
    next(error)
  }
}
