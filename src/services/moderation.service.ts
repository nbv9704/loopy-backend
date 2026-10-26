import { z } from 'zod'
import { supabaseAdmin } from '../db/supabase'
import { AppError, errors } from '../middleware/errorHandler'
import { moderationSchemas } from '../schemas/moderation.schemas'
import { clearKeywordCache } from '../utils/contentModeration'
import { readAllRows } from './read-all-rows'

async function invalidateAfter<T>(operation: PromiseLike<T>): Promise<T> {
  try {
    return await operation
  } catch {
    throw errors.databaseError(
      'Không xác nhận được thao tác. Hãy tải lại danh sách trước khi thử lại.'
    )
  } finally {
    clearKeywordCache()
  }
}
const columns = 'id,keyword,category,language,is_active,created_at'
type Create = z.infer<typeof moderationSchemas.createKeyword>['body']
type Update = z.infer<typeof moderationSchemas.updateKeyword>['body']

function writeError(error: { code?: string } | null) {
  if (error?.code === '23505') throw new AppError(409, 'KEYWORD_EXISTS', 'Từ khóa này đã tồn tại.')
  if (error)
    throw errors.databaseError(
      'Không xác nhận được thao tác. Hãy tải lại danh sách trước khi thử lại.'
    )
}

export const moderationService = {
  list() {
    return readAllRows(
      (offset, end) =>
        supabaseAdmin
          .from('content_moderation_keywords')
          .select(columns, { count: 'exact' })
          .order('created_at', { ascending: false })
          .order('id', { ascending: false })
          .range(offset, end),
      'Không tải được danh sách từ khóa.'
    )
  },
  async create(body: Create, actor: string) {
    const { data, error } = await invalidateAfter(
      supabaseAdmin
        .from('content_moderation_keywords')
        .insert({
          ...body,
          keyword: body.keyword.trim().toLowerCase(),
          category: body.category ?? 'general',
          language: body.language ?? 'all',
          created_by: actor,
        })
        .select(columns)
        .single()
    )
    // A write can have committed even if its acknowledgement is missing.
    writeError(error)
    if (
      !data?.id ||
      data.keyword !== body.keyword.trim().toLowerCase() ||
      data.category !== (body.category ?? 'general') ||
      data.language !== (body.language ?? 'all') ||
      data.is_active !== true
    )
      throw errors.databaseError('Chưa xác nhận được từ khóa đã lưu. Hãy tải lại danh sách.')
    return data
  },
  async update(id: string, body: Update) {
    const { expectedActive, ...values } = body
    if (values.keyword) values.keyword = values.keyword.trim().toLowerCase()
    let query = supabaseAdmin.from('content_moderation_keywords').update(values).eq('id', id)
    if (expectedActive !== undefined) query = query.eq('is_active', expectedActive)
    const { data, error } = await invalidateAfter(query.select(columns).maybeSingle())
    writeError(error)
    if (!data)
      throw new AppError(
        409,
        'KEYWORD_CHANGED',
        'Từ khóa đã thay đổi hoặc bị xóa. Hãy tải lại danh sách.'
      )
    if (data.id !== id || (values.is_active !== undefined && data.is_active !== values.is_active))
      throw errors.databaseError('Chưa xác nhận được thay đổi. Hãy tải lại danh sách.')
    return data
  },
  async remove(id: string) {
    const { data, error } = await invalidateAfter(
      supabaseAdmin
        .from('content_moderation_keywords')
        .delete()
        .eq('id', id)
        .select('id')
        .maybeSingle()
    )
    writeError(error)
    if (!data) throw errors.notFound('Từ khóa')
    if (data.id !== id)
      throw errors.databaseError('Chưa xác nhận được từ khóa đã xóa. Hãy tải lại danh sách.')
    return { id }
  },
}
