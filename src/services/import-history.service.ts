import { supabaseAdmin } from '../db/supabase'
import { logger } from '../utils/logger'

export interface ImportHistoryEntry {
  adminId: string
  chapterId: string
  fileName: string
  fileSize?: number
  lessonsCount: number
  testCasesCount: number
  errorsCount: number
  status: 'success' | 'partial' | 'failed'
  errorMessage?: string
  metadata?: Record<string, any>
  ipAddress?: string
  userAgent?: string
}

export class ImportHistoryService {
  /**
   * Log an import action
   */
  static async logImport(entry: ImportHistoryEntry): Promise<void> {
    try {
      const { error } = await supabaseAdmin.from('import_history').insert({
        admin_id: entry.adminId,
        chapter_id: entry.chapterId,
        file_name: entry.fileName,
        file_size: entry.fileSize,
        lessons_count: entry.lessonsCount,
        test_cases_count: entry.testCasesCount,
        errors_count: entry.errorsCount,
        status: entry.status,
        error_message: entry.errorMessage,
        metadata: entry.metadata || {},
        ip_address: entry.ipAddress,
        user_agent: entry.userAgent,
      })

      if (error) {
        logger.error('Error logging import history:', {
          error: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          chapterId: entry.chapterId,
          adminId: entry.adminId,
        })
      } else {
        logger.info('Import history recorded', {
          chapterId: entry.chapterId,
          lessonsCount: entry.lessonsCount,
          status: entry.status,
        })
      }
    } catch (error) {
      logger.error('Exception in import history service:', error)
    }
  }

  /**
   * Get import history with optional filters
   */
  static async getHistory(options?: {
    chapterId?: string
    status?: string
    limit?: number
    offset?: number
  }) {
    try {
      let query = supabaseAdmin
        .from('import_history')
        .select(`
          *,
          chapters (
            id,
            title,
            language_id
          )
        `, { count: 'exact' })
        .order('created_at', { ascending: false })

      if (options?.chapterId) {
        query = query.eq('chapter_id', options.chapterId)
      }

      if (options?.status) {
        query = query.eq('status', options.status)
      }

      const limit = options?.limit || 50
      const offset = options?.offset || 0

      query = query.range(offset, offset + limit - 1)

      const { data, count, error } = await query

      if (error) {
        logger.warn('Error fetching import history:', error)
        return { data: [], count: 0 }
      }

      return { data: data || [], count: count || 0 }
    } catch (error) {
      logger.error('Exception fetching import history:', error)
      return { data: [], count: 0 }
    }
  }

  /**
   * Get import statistics
   */
  static async getStats() {
    try {
      const { data: allImports, error: allError } = await supabaseAdmin
        .from('import_history')
        .select('*')

      if (allError) {
        logger.warn('Error fetching import stats:', allError)
        return {
          totalImports: 0,
          successfulImports: 0,
          failedImports: 0,
          totalLessonsImported: 0,
          totalTestCasesImported: 0,
        }
      }

      const imports = allImports || []
      const successful = imports.filter(i => i.status === 'success' || i.status === 'partial')
      const failed = imports.filter(i => i.status === 'failed')

      return {
        totalImports: imports.length,
        successfulImports: successful.length,
        failedImports: failed.length,
        totalLessonsImported: imports.reduce((sum, i) => sum + (i.lessons_count || 0), 0),
        totalTestCasesImported: imports.reduce((sum, i) => sum + (i.test_cases_count || 0), 0),
      }
    } catch (error) {
      logger.error('Exception fetching import stats:', error)
      return {
        totalImports: 0,
        successfulImports: 0,
        failedImports: 0,
        totalLessonsImported: 0,
        totalTestCasesImported: 0,
      }
    }
  }
}
