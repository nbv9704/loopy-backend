import { supabaseAdmin } from '../../db/supabase'
import { errors } from '../../middleware/errorHandler'
import { confirmEmptyRange } from '../empty-range'
import { cmsSchemaNotReady, isMissingCmsRevision } from './readiness'

export async function queryCmsItems(
  columns: string,
  category?: string,
  language?: 'vi' | 'en',
  search?: string,
  limit = 50,
  offset = 0
) {
  const pageSize = Math.min(Math.max(1, limit), 100)
  let categoryId = category
  if (category && !/^[a-f0-9-]{36}$/i.test(category)) {
    const result = await supabaseAdmin
      .from('content_categories')
      .select('id')
      .eq('name', category)
      .maybeSingle()
    if (result.error) throw errors.databaseError('Không tải được category CMS.')
    if (!result.data) return { items: [], total: 0 }
    categoryId = result.data.id
  }
  const queryFor = (head = false) => {
    let query = supabaseAdmin
      .from('content_items')
      .select(columns, { count: 'exact', ...(head ? { head: true } : {}) })
    if (categoryId) query = query.eq('category_id', categoryId)
    if (language) query = query.eq('language', language)
    if (search) {
      // Quoted PostgREST values preserve punctuation; escaped regex avoids wildcard aliases.
      // https://docs.postgrest.org/en/v14/references/api/url_grammar.html#reserved-characters
      const pattern = JSON.stringify(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      query = query.or(`key.imatch.${pattern},value.imatch.${pattern}`)
    }
    return query
  }
  const { data, count, error } = await queryFor()
    .order('updated_at', { ascending: false })
    .order('id', { ascending: false })
    .range(offset, offset + pageSize - 1)
  if (isMissingCmsRevision(error)) throw cmsSchemaNotReady()
  if (error?.code === 'PGRST103')
    return {
      items: [],
      total: await confirmEmptyRange(offset, () => queryFor(true), 'Không tải được nội dung CMS.'),
    }
  if (error || !data || count === null) throw errors.databaseError('Không tải được nội dung CMS.')
  return { items: data, total: count }
}
