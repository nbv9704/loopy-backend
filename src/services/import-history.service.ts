import { supabaseAdmin } from '../db/supabase'
import { logger } from '../utils/logger'
import { errors } from '../middleware/errorHandler'
import { confirmEmptyRange } from './empty-range'

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
    const limit = options?.limit ?? 50
    const offset = options?.offset ?? 0
    const queryFor = (head = false) => {
      let query = supabaseAdmin
        .from('import_history')
        .select('*, chapters (id, title, language_id)', {
          count: 'exact',
          ...(head ? { head: true } : {}),
        })
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
      if (options?.chapterId) query = query.eq('chapter_id', options.chapterId)
      if (options?.status) query = query.eq('status', options.status)
      return query
    }
    const { data, count, error } = await queryFor().range(offset, offset + limit - 1)
    if (error?.code === 'PGRST103')
      return {
        data: [],
        count: await confirmEmptyRange(
          offset,
          () => queryFor(true),
          'Không tải được lịch sử import.'
        ),
      }
    if (error || !data || count === null || !Number.isSafeInteger(count) || count < 0)
      throw errors.databaseError('Không tải được lịch sử import.')
    return { data, count }
  }

  /** Page through the API row cap instead of silently counting only the first 1000 rows. */
  static async getStats() {
    const stats = {
      totalImports: 0,
      successfulImports: 0,
      failedImports: 0,
      totalLessonsImported: 0,
      totalTestCasesImported: 0,
    }
    const pageSize = 500
    let expectedTotal: number | null = null
    for (let offset = 0; ;) {
      const { data, count, error } = await supabaseAdmin
        .from('import_history')
        .select('id, status, lessons_count, test_cases_count', { count: 'exact' })
        .order('id', { ascending: true })
        .range(offset, offset + pageSize - 1)
      if (
        error ||
        !data ||
        count === null ||
        !Number.isSafeInteger(count) ||
        count < 0 ||
        (expectedTotal !== null && count !== expectedTotal)
      ) {
        throw errors.databaseError('Không tải được thống kê import. Vui lòng thử lại.')
      }
      expectedTotal = count
      for (const entry of data) {
        if (
          ![entry.lessons_count ?? 0, entry.test_cases_count ?? 0].every(
            value => Number.isSafeInteger(value) && value >= 0
          )
        ) {
          throw errors.databaseError('Số liệu lịch sử import không hợp lệ.')
        }
        stats.totalImports++
        if (entry.status === 'success' || entry.status === 'partial') stats.successfulImports++
        else if (entry.status === 'failed') stats.failedImports++
        else throw errors.databaseError('Trạng thái lịch sử import không hợp lệ.')
        stats.totalLessonsImported += entry.lessons_count ?? 0
        stats.totalTestCasesImported += entry.test_cases_count ?? 0
      }
      if (stats.totalImports === expectedTotal) return stats
      if (data.length === 0 || stats.totalImports > expectedTotal) {
        throw errors.databaseError('Thống kê import chưa đầy đủ. Vui lòng thử lại.')
      }
      offset += data.length
    }
  }
}
