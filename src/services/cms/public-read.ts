import { supabaseAdmin } from '../../db/supabase'
import { AppError, errors } from '../../middleware/errorHandler'
import { readAllRows } from '../read-all-rows'
import { queryCmsItems } from './query'
import { selectPublicContent } from './public-selection'

// Public reads must work independently of admin revision/audit migrations.
const columns = 'id,category_id,key,language,value,description,type,created_at,updated_at'
const publicItem = (row: Record<string, any>) => ({
  id: row.id,
  categoryId: row.category_id,
  key: row.key,
  language: row.language,
  value: row.value,
  description: row.description,
  type: row.type,
  createdAt: row.created_at ? new Date(row.created_at) : null,
  updatedAt: row.updated_at ? new Date(row.updated_at) : null,
})

export async function getPublicContentItems(
  category?: string,
  language?: 'vi' | 'en',
  limit = 50,
  offset = 0
) {
  const result = await queryCmsItems(columns, category, language, undefined, limit, offset)
  return { items: result.items.map(publicItem), total: result.total }
}

export async function getPublicContentByKey(key: string, language: 'vi' | 'en') {
  const rows = await readAllRows<PublicKeyRow>(
    (offset, end) =>
      supabaseAdmin
        .from('content_items')
        .select(`${columns},content_categories(name)`, { count: 'exact' })
        .eq('key', key)
        .eq('language', language)
        .order('id')
        .range(offset, end),
    'Không tải được nội dung CMS đầy đủ.'
  )
  const { item, ambiguous } = selectPublicContent(key, rows)
  if (ambiguous) throw new AppError(409, 'CMS_KEY_AMBIGUOUS', 'CMS có key trùng giữa các category.')
  return item ? publicItem(item) : null
}

interface PublicKeyRow extends Record<string, any> {
  id: string
  key: string
  value: string
  content_categories?: unknown
}

/** Resolve namespace ownership; omit duplicates without a unique owner. */
export async function getPublicContentItemsByKeys(keys: string[], language: 'vi' | 'en') {
  const unique = [...new Set(keys.map(key => key.trim()).filter(Boolean))]
  const items: Record<string, string> = Object.create(null)
  const ambiguous = new Set<string>()
  if (unique.length) {
    const rows = await readAllRows<PublicKeyRow>(
      (offset, end) =>
        supabaseAdmin
          .from('content_items')
          .select('id,key,value,content_categories(name)', { count: 'exact' })
          .eq('language', language)
          .in('key', unique)
          .order('id')
          .range(offset, end),
      'Không tải được nội dung CMS đầy đủ.'
    )
    const grouped = new Map<string, PublicKeyRow[]>()
    for (const row of rows) {
      if (!unique.includes(row.key) || typeof row.value !== 'string')
        throw errors.databaseError('Nội dung CMS không hợp lệ.')
      const group = grouped.get(row.key) ?? []
      group.push(row)
      grouped.set(row.key, group)
    }
    for (const [key, group] of grouped) {
      const { item, ambiguous: conflict } = selectPublicContent(key, group)
      if (conflict) ambiguous.add(key)
      else if (item) items[key] = item.value
    }
  }
  return {
    items,
    missingKeys: unique.filter(
      key => !ambiguous.has(key) && !Object.prototype.hasOwnProperty.call(items, key)
    ),
    ambiguousKeys: unique.filter(key => ambiguous.has(key)),
  }
}
