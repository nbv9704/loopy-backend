import { z } from 'zod'
import { supabaseAdmin } from '../../db/supabase'
import { AppError, errors } from '../../middleware/errorHandler'
import { createCmsItem, updateCmsItem } from '../../schemas/cms.schemas'
import { AuditLogService, AuditLogEntry } from '../audit-log.service'
import { logger } from '../../utils/logger'
import { cmsColumns, mapCmsItem } from './model'
import { getContentItem } from './read'
import { assertCmsWritable } from './readiness'

export async function logCmsAction(entry: AuditLogEntry) {
  try {
    await AuditLogService.logAction(entry)
  } catch {
    logger.error('CMS write confirmed but audit log failed')
  }
}
const conflict = () =>
  new AppError(
    409,
    'CMS_CONFLICT',
    'Nội dung đã thay đổi hoặc bị xóa. Tải lại trước khi tiếp tục; bản nháp được giữ lại.'
  )
export async function createContentItem(input: z.input<typeof createCmsItem>, actor: string) {
  const data = createCmsItem.parse(input)
  await assertCmsWritable()
  const category = await supabaseAdmin
    .from('content_categories')
    .select('id')
    .eq('id', data.categoryId)
    .maybeSingle()
  if (category.error) throw errors.databaseError('Không tải được category CMS.')
  if (!category.data) throw errors.notFound('Category')
  const { data: saved, error } = await supabaseAdmin
    .from('content_items')
    .insert({
      category_id: data.categoryId,
      key: data.key,
      language: data.language,
      value: data.value,
      description: data.description,
      type: data.type,
      created_by: actor,
      updated_by: actor,
    })
    .select(cmsColumns)
    .single()
  if (error?.code === '23505')
    throw new AppError(409, 'CMS_DUPLICATE', 'Key đã tồn tại trong category và ngôn ngữ này.')
  if (error || !saved)
    throw errors.databaseError(
      'Chưa xác nhận được nội dung vừa tạo. Kiểm tra danh sách trước khi gửi lại.'
    )
  const item = mapCmsItem(saved)
  await logCmsAction({
    adminId: actor,
    action: 'create',
    resourceType: 'content_item',
    resourceId: item.id,
    resourceName: item.key,
  })
  return item
}
export async function updateContentItem(
  id: string,
  input: z.input<typeof updateCmsItem>,
  actor: string
) {
  const data = updateCmsItem.parse(input)
  const existing = await getContentItem(id)
  if (!existing) throw errors.notFound('Content item')
  if (existing.revision !== data.expectedRevision) throw conflict()
  const { data: saved, error } = await supabaseAdmin
    .from('content_items')
    .update({
      value: data.value,
      description: data.description,
      type: data.type,
      updated_by: actor,
    })
    .eq('id', id)
    .eq('revision', data.expectedRevision)
    .select(cmsColumns)
    .maybeSingle()
  if (error)
    throw errors.databaseError(
      'Chưa xác nhận được lần lưu CMS. Tải lại để kiểm tra trước khi gửi lại.'
    )
  if (!saved) throw conflict()
  const item = mapCmsItem(saved)
  if (item.id !== id || item.revision !== data.expectedRevision + 1)
    throw errors.databaseError('CMS không trả đúng phiên bản đã lưu.')
  await logCmsAction({
    adminId: actor,
    action: 'update',
    resourceType: 'content_item',
    resourceId: id,
    resourceName: item.key,
    changes: {
      old: { value: existing.value, description: existing.description, type: existing.type },
      new: { value: item.value, description: item.description, type: item.type },
    },
  })
  return item
}
export async function deleteContentItem(id: string, actor: string, revision: number) {
  const existing = await getContentItem(id)
  if (!existing) throw errors.notFound('Content item')
  if (existing.revision !== revision) throw conflict()
  const { data, error } = await supabaseAdmin
    .from('content_items')
    .delete()
    .eq('id', id)
    .eq('revision', revision)
    .select('id')
    .maybeSingle()
  if (error) throw errors.databaseError('Chưa xác nhận được lần xóa CMS. Tải lại để kiểm tra.')
  if (!data || data.id !== id) throw conflict()
  await logCmsAction({
    adminId: actor,
    action: 'delete',
    resourceType: 'content_item',
    resourceId: id,
    resourceName: existing.key,
  })
  return { id, deleted: true as const }
}
