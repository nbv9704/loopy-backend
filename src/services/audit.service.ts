import { supabaseAdmin } from '../db/supabase'

/**
 * AuditService - Audit logging service for admin actions
 *
 * Provides audit trail functionality for all content management operations.
 * Implements Requirements 17.1-17.6 for comprehensive audit logging.
 */

interface AuditLogInput {
  userId: string
  action: string
  resourceType: string
  resourceId: string
  oldValue?: any
  newValue?: any
}

interface AuditLogFilters {
  userId?: string
  resourceType?: string
  startDate?: string
  endDate?: string
  limit?: number
  offset?: number
}

interface AuditLog {
  id: string
  userId: string
  userEmail?: string
  action: string
  resourceType: string
  resourceId: string
  oldValue: any
  newValue: any
  timestamp: string
}

interface GetLogsResult {
  logs: AuditLog[]
  total: number
}

export const auditService = {
  /**
   * Log an admin action to the audit_logs table
   * Requirement 17.2-17.6: Log create, update, delete, status change, and reorder actions
   *
   * @param input - Audit log input data
   */
  async log(input: AuditLogInput): Promise<void> {
    try {
      const { error } = await supabaseAdmin.from('audit_logs').insert({
        user_id: input.userId,
        action: input.action,
        resource_type: input.resourceType,
        resource_id: input.resourceId,
        old_value: input.oldValue || null,
        new_value: input.newValue || null,
      })

      if (error) {
        console.error('Failed to log audit:', error)
        // Don't throw - audit logging should not break the main operation
      }
    } catch (err) {
      console.error('Audit logging error:', err)
      // Silently fail to prevent audit logging from breaking operations
    }
  },

  /**
   * Retrieve audit logs with filtering support
   * Requirement 17.7-17.8: Display audit logs with filtering by user, action type, and date range
   *
   * @param filters - Filter criteria for audit logs
   * @returns Paginated audit logs with total count
   */
  async getLogs(filters: AuditLogFilters = {}): Promise<GetLogsResult> {
    try {
      // Build query with filters
      let query = supabaseAdmin.from('audit_logs').select(
        `
          id,
          user_id,
          action,
          resource_type,
          resource_id,
          old_value,
          new_value,
          timestamp
        `,
        { count: 'exact' }
      )

      // Apply filters
      if (filters.userId) {
        query = query.eq('user_id', filters.userId)
      }
      if (filters.resourceType) {
        query = query.eq('resource_type', filters.resourceType)
      }
      if (filters.startDate) {
        query = query.gte('timestamp', filters.startDate)
      }
      if (filters.endDate) {
        query = query.lte('timestamp', filters.endDate)
      }

      // Apply ordering and pagination
      const limit = filters.limit || 50
      const offset = filters.offset || 0

      query = query.order('timestamp', { ascending: false }).range(offset, offset + limit - 1)

      const { data, error, count } = await query

      if (error) {
        throw error
      }

      // Fetch user emails separately (auth.users is in a different schema)
      const userIds = [...new Set(data?.map(log => log.user_id) || [])]
      const userEmailMap: Record<string, string> = {}

      if (userIds.length > 0) {
        const { data: usersData } = await supabaseAdmin.auth.admin.listUsers()
        if (usersData?.users) {
          usersData.users.forEach((user: any) => {
            userEmailMap[user.id] = user.email || 'Unknown'
          })
        }
      }

      // Map logs with user emails
      const logs: AuditLog[] = (data || []).map(log => ({
        id: log.id,
        userId: log.user_id,
        userEmail: userEmailMap[log.user_id],
        action: log.action,
        resourceType: log.resource_type,
        resourceId: log.resource_id,
        oldValue: log.old_value,
        newValue: log.new_value,
        timestamp: log.timestamp,
      }))

      return {
        logs,
        total: count || 0,
      }
    } catch (error) {
      console.error('Failed to retrieve audit logs:', error)
      throw error
    }
  },
}
