import { supabaseAdmin } from '../../db/supabase'
import { AppError, errors } from '../../middleware/errorHandler'
import { cmsColumns, cmsReadColumns, mapCmsItem, mapReadOnlyCmsItem } from './model'
import { queryCmsItems } from './query'
import {
  assertCmsWritable,
  canWriteCms,
  cmsSchemaNotReady,
  isMissingCmsRevision,
} from './readiness'

export async function getContentItems(
  category?: string,
  language?: 'vi' | 'en',
  search?: string,
  limit = 50,
  offset = 0
) {
  const writable = await canWriteCms()
  if (writable) {
    try {
      const result = await queryCmsItems(cmsColumns, category, language, search, limit, offset)
      return { items: result.items.map(mapCmsItem), total: result.total, readOnly: false }
    } catch (error) {
      if (!(error instanceof AppError) || error.code !== 'SCHEMA_NOT_READY') throw error
    }
  }
  const result = await queryCmsItems(cmsReadColumns, category, language, search, limit, offset)
  return { items: result.items.map(mapReadOnlyCmsItem), total: result.total, readOnly: true }
}

export async function getContentItem(id: string) {
  await assertCmsWritable()
  const { data, error } = await supabaseAdmin
    .from('content_items')
    .select(cmsColumns)
    .eq('id', id)
    .maybeSingle()
  if (isMissingCmsRevision(error)) throw cmsSchemaNotReady()
  if (error) throw errors.databaseError('Không tải được nội dung CMS.')
  return data ? mapCmsItem(data) : null
}

export async function getCategories() {
  const { data, error } = await supabaseAdmin
    .from('content_categories')
    .select('id,name,description,display_order,created_at,updated_at')
    .order('display_order')
    .order('id')
  if (error || !data) throw errors.databaseError('Không tải được categories CMS.')
  return data.map(row => ({
    id: row.id,
    name: row.name,
    description: row.description,
    displayOrder: row.display_order,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }))
}
