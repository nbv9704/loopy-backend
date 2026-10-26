import { z } from 'zod'
import { supabaseAdmin } from '../../db/supabase'
import { AppError, errors } from '../../middleware/errorHandler'
import { cmsExportSchema, cmsTransferSchema, flattenCmsTransfer } from '../../schemas/cms.schemas'
import { logCmsAction } from './mutations'
import { assertCmsWritable } from './readiness'

export async function exportContent(language: 'vi' | 'en') {
  const categories: Record<
    string,
    Record<string, { value: string; type: string; description: string | null }>
  > = Object.create(null)
  let total: number | null = null
  for (let offset = 0; ;) {
    const { data, error, count } = await supabaseAdmin
      .from('content_items')
      .select('id,key,value,type,description,content_categories(name)', { count: 'exact' })
      .eq('language', language)
      .order('id')
      .range(offset, offset + 499)
    if (error || !data || count === null || (total !== null && count !== total))
      throw errors.databaseError('Export CMS chưa đầy đủ. Vui lòng thử lại.')
    total = count
    for (const item of data) {
      const category = (item.content_categories as unknown as { name: string } | null)?.name
      if (!category || category === '__proto__' || item.key === '__proto__')
        throw errors.databaseError('CMS có category/key không thể export an toàn.')
      if (!Object.prototype.hasOwnProperty.call(categories, category))
        categories[category] = Object.create(null)
      if (Object.prototype.hasOwnProperty.call(categories[category], item.key))
        throw errors.databaseError('CMS có key trùng; không thể export đầy đủ.')
      categories[category][item.key] = {
        value: item.value,
        type: item.type,
        description: item.description ?? null,
      }
    }
    offset += data.length
    if (offset === total) {
      const output = cmsExportSchema.safeParse({
        version: '2.0',
        language,
        exportedAt: new Date().toISOString(),
        categories,
      })
      if (!output.success)
        throw errors.databaseError('Export CMS vượt giới hạn hoặc có nội dung không hợp lệ.')
      return output.data
    }
    if (!data.length || offset > total)
      throw errors.databaseError('Export CMS chưa đầy đủ. Vui lòng thử lại.')
  }
}

const unconfirmed = () =>
  new AppError(
    502,
    'CMS_IMPORT_UNCONFIRMED',
    'Chưa xác nhận được import CMS. Kiểm tra nội dung trước khi gửi lại.'
  )
export async function importContent(input: unknown, actor: string) {
  const parsed = cmsTransferSchema.safeParse(input)
  if (!parsed.success) throw errors.validationError(parsed.error.issues)
  const payload = parsed.data
  const items = flattenCmsTransfer(payload)
  await assertCmsWritable()
  let response
  try {
    response = await supabaseAdmin.rpc('import_cms_content_atomically', {
      p_actor_id: actor,
      p_language: payload.language,
      p_items: items,
    })
  } catch {
    throw unconfirmed()
  }
  if (response.error) {
    if (['PGRST202', '42883'].includes(response.error.code))
      throw new AppError(503, 'SCHEMA_NOT_READY', 'CMS cần migration052 trước khi import.')
    throw unconfirmed()
  }
  const ack = z
    .object({ imported: z.number().int().nonnegative(), language: z.enum(['vi', 'en']) })
    .safeParse(response.data)
  if (!ack.success || ack.data.imported !== items.length || ack.data.language !== payload.language)
    throw unconfirmed()
  await logCmsAction({
    adminId: actor,
    action: 'import',
    resourceType: 'content_item',
    resourceName: `CMS ${payload.language}`,
    metadata: { imported: items.length, version: payload.version },
  })
  return { imported: items.length, errors: [] as string[] }
}
