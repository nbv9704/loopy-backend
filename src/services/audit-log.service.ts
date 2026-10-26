import { supabaseAdmin } from '../db/supabase'
import { logger } from '../utils/logger'
import { errors } from '../middleware/errorHandler'
import { confirmEmptyRange } from './empty-range'

export interface AuditLogEntry {
  adminId: string
  action: 'create' | 'update' | 'delete' | 'import' | 'publish' | 'archive'
  resourceType: 'lesson' | 'chapter' | 'test_case' | 'import' | 'content_item' | 'practice_set'
  resourceId?: string
  resourceName?: string
  changes?: Record<string, any>
  metadata?: Record<string, any>
  ipAddress?: string
  userAgent?: string
}

export class AuditLogService {
  /**
   * Log an admin action
   */
  static async logAction(entry: AuditLogEntry): Promise<void> {
    try {
      const { error } = await supabaseAdmin.from('admin_audit_logs').insert({
        admin_id: entry.adminId,
        action: entry.action,
        resource_type: entry.resourceType,
        resource_id: entry.resourceId,
        resource_name: entry.resourceName,
        changes: entry.changes || {},
        metadata: entry.metadata || {},
        ip_address: entry.ipAddress,
        user_agent: entry.userAgent,
      })

      if (error) {
        logger.warn('Error logging audit action:', error)
      } else {
        logger.info('Audit log recorded', {
          action: entry.action,
          resourceType: entry.resourceType,
          resourceId: entry.resourceId,
        })
      }
    } catch (error) {
      logger.error('Exception in audit log service:', error)
    }
  }

  /**
   * Get audit logs with optional filters
   */
  static async getLogs(options?: {
    adminId?: string
    action?: string
    resourceType?: string
    limit?: number
    offset?: number
  }) {
    const limit = options?.limit ?? 50
    const offset = options?.offset ?? 0
    const queryFor = (head = false) => {
      let query = supabaseAdmin
        .from('admin_audit_logs')
        .select('*', { count: 'exact', ...(head ? { head: true } : {}) })
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
      if (options?.adminId) query = query.eq('admin_id', options.adminId)
      if (options?.action) query = query.eq('action', options.action)
      if (options?.resourceType) query = query.eq('resource_type', options.resourceType)
      return query
    }
    const { data, count, error } = await queryFor().range(offset, offset + limit - 1)
    if (error?.code === 'PGRST103')
      return {
        data: [],
        count: await confirmEmptyRange(
          offset,
          () => queryFor(true),
          'Không tải đủ nhật ký hoạt động. Vui lòng thử lại.'
        ),
      }
    if (
      error ||
      !Array.isArray(data) ||
      count === null ||
      !Number.isSafeInteger(count) ||
      count < 0 ||
      data.length !== Math.min(limit, Math.max(0, count - offset))
    )
      throw errors.databaseError('Không tải đủ nhật ký hoạt động. Vui lòng thử lại.')
    return { data, count }
  }
}
