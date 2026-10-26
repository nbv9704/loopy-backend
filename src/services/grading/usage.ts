import { supabaseAdmin } from '../../db/supabase'
import { errors } from '../../middleware/errorHandler'
import { readAllRows } from '../read-all-rows'

/** Recorded events are incomplete provider telemetry, not an account quota meter. */
export async function readGradingUsage(now = new Date()) {
  const start = new Date(now)
  start.setUTCHours(0, 0, 0, 0)
  const end = new Date(start.getTime() + 86400000)
  const logs = await readAllRows<{
    id: string
    total_tokens: number | null
    cache_hit: boolean | null
    response_time: number | null
  }>(
    (offset, last) =>
      supabaseAdmin
        .from('ai_usage_logs')
        .select('id, total_tokens, cache_hit, response_time', { count: 'exact' })
        .gte('created_at', start.toISOString())
        .lt('created_at', end.toISOString())
        .order('id')
        .range(offset, last),
    'Không tải đủ thống kê AI.'
  )
  const valid = (value: number | null) => value === null || (Number.isFinite(value) && value >= 0)
  if (
    logs.some(
      row =>
        !valid(row.total_tokens) ||
        !valid(row.response_time) ||
        (row.cache_hit !== null && typeof row.cache_hit !== 'boolean')
    )
  )
    throw errors.databaseError('Dữ liệu thống kê AI chưa hợp lệ.')
  const measured = logs.filter(row => row.response_time !== null)
  return {
    today: {
      totalRequests: logs.length,
      totalTokens: logs.reduce((sum, row) => sum + (row.total_tokens ?? 0), 0),
      cacheHits: logs.filter(row => row.cache_hit === true).length,
      cacheMisses: logs.filter(row => row.cache_hit === false).length,
      cacheUnknown: logs.filter(row => row.cache_hit === null).length,
      cacheHitRate: logs.some(row => row.cache_hit !== null)
        ? logs.filter(row => row.cache_hit === true).length /
          logs.filter(row => row.cache_hit !== null).length
        : null,
      avgResponseTime: measured.length
        ? Math.round(measured.reduce((sum, row) => sum + row.response_time!, 0) / measured.length)
        : null,
      responseTimeSamples: measured.length,
      tokenSamples: logs.filter(row => row.total_tokens !== null).length,
    },
    period: { start: start.toISOString(), end: end.toISOString(), timezone: 'UTC' },
    limits: { dailyTokenLimit: null, monthlySubmissionLimit: null, tokenUsagePercent: null },
    warnings: ['Chỉ gồm log đã ghi; chưa đo đầy đủ hint/Groq hoặc quota thực tế của nhà cung cấp.'],
  }
}
