import { supabaseAdmin } from '../db/supabase'
import { logger } from '../utils/logger'

export interface AuditLogEntry {
  adminId: string
  action: 'create' | 'update' | 'delete' | 'import' | 'publish' | 'archive'
  resourceType: 'lesson' | 'chapter' | 'test_case' | 'import' | 'content_item'
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
    try {
      let query = supabaseAdmin
        .from('admin_audit_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })

      if (options?.adminId) {
        query = query.eq('admin_id', options.adminId)
      }

      if (options?.action) {
        query = query.eq('action', options.action)
      }

      if (options?.resourceType) {
        query = query.eq('resource_type', options.resourceType)
      }

      const limit = options?.limit || 50
      const offset = options?.offset || 0

      query = query.range(offset, offset + limit - 1)

      const { data, count, error } = await query

      if (error) {
        logger.warn('Error fetching audit logs:', error)
        return { data: [], count: 0 }
      }

      return { data: data || [], count: count || 0 }
    } catch (error) {
      logger.error('Exception fetching audit logs:', error)
      return { data: [], count: 0 }
    }
  }
}
