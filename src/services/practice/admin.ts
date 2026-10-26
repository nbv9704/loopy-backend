import { supabaseAdmin } from '../../db/supabase'
import { AppError, errors } from '../../middleware/errorHandler'
import { readAllRows } from '../read-all-rows'
import { toSet } from './model'
import { awaitAdminWrite } from '../admin-write'

export interface AdminPracticeQuery {
  languageId?: string
  difficulty?: 'easy' | 'medium' | 'hard'
  status?: 'active' | 'draft' | 'published' | 'archived' | 'all'
  visibility?: 'public' | 'private' | 'unlisted' | 'official'
  createdBy?: string
  limit?: number
  offset?: number
}
const unavailable = 'Không tải đủ dữ liệu Practice. Vui lòng thử lại.'

export async function listAdminPracticeSets(params: AdminPracticeQuery) {
  const limit = params.limit ?? 20,
    offset = params.offset ?? 0
  let query = supabaseAdmin
    .from('practice_sets')
    .select('*,practice_questions(count)', { count: 'exact' })
  if (!params.status || params.status === 'active') query = query.neq('status', 'archived')
  else if (params.status !== 'all') query = query.eq('status', params.status)
  if (params.visibility) query = query.eq('visibility', params.visibility)
  if (params.languageId) query = query.eq('language_id', params.languageId)
  if (params.difficulty) query = query.eq('difficulty', params.difficulty)
  if (params.createdBy) query = query.eq('created_by', params.createdBy)
  const { data, count, error } = await query
    .order('updated_at', { ascending: false })
    .order('id', { ascending: false })
    .range(offset, offset + limit - 1)
  if (
    error ||
    !Array.isArray(data) ||
    count === null ||
    !Number.isSafeInteger(count) ||
    count < 0 ||
    (data.length === 0 && offset < count) ||
    data.length > Math.min(limit, Math.max(0, count - offset))
  )
    throw errors.databaseError(unavailable)
  const items = data.map(row => {
    const questionCount = row.practice_questions?.[0]?.count
    if (!Number.isSafeInteger(questionCount) || questionCount < 0)
      throw errors.databaseError(unavailable)
    return toSet(row)
  })
  return { items, total: count, limit, offset }
}

export async function getAdminPracticeStats() {
  const sets = await readAllRows<{ id: string; visibility: string; status: string }>(
    (offset, end) =>
      supabaseAdmin
        .from('practice_sets')
        .select('id,visibility,status', { count: 'exact' })
        .order('id', { ascending: true })
        .range(offset, end),
    unavailable
  )
  const counts = await Promise.all(
    ['practice_attempts', 'practice_submissions'].map(async table => {
      const { count, error } = await supabaseAdmin
        .from(table)
        .select('id', { count: 'exact', head: true })
      if (error || count === null || !Number.isSafeInteger(count) || count < 0)
        throw errors.databaseError(unavailable)
      return count
    })
  )
  return {
    totalSets: sets.length,
    officialSets: sets.filter(row => row.visibility === 'official').length,
    publishedSets: sets.filter(row => row.status === 'published').length,
    draftSets: sets.filter(row => row.status === 'draft').length,
    totalAttempts: counts[0],
    totalSubmissions: counts[1],
  }
}

/** The predicate belongs to the write; preflight alone cannot protect a stale status selection. */
export async function patchAdminPracticeSet(
  id: string,
  values: { status?: string; visibility?: string; owner_type?: string },
  expected: { status: string; visibility?: never } | { visibility: string; status?: never }
) {
  let query = supabaseAdmin.from('practice_sets').update(values).eq('id', id)
  if (expected.status !== undefined) query = query.eq('status', expected.status)
  if (expected.visibility !== undefined) query = query.eq('visibility', expected.visibility)
  const { data, error } = await awaitAdminWrite(
    query.select('*,practice_questions(count)').maybeSingle()
  )
  if (error) throw errors.databaseError('Không xác nhận được thay đổi. Tải lại trước khi thử tiếp.')
  if (!data)
    throw new AppError(
      409,
      'PRACTICE_CHANGED',
      'Practice set đã thay đổi hoặc bị xóa. Hãy tải lại.'
    )
  if (data.id !== id || Object.entries(values).some(([key, value]) => data[key] !== value))
    throw errors.databaseError('Chưa xác nhận đúng thay đổi. Hãy tải lại trước khi gửi lại.')
  return toSet(data)
}
