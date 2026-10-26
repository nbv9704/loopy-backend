import { supabaseAdmin } from '../../db/supabase'
import { AppError } from '../../middleware/errorHandler'

export const cmsSchemaNotReady = () =>
  new AppError(
    503,
    'SCHEMA_NOT_READY',
    'CMS đang ở chế độ chỉ xem. Database cần cập nhật schema CMS trước khi chỉnh sửa hoặc import.'
  )

export async function canWriteCms(): Promise<boolean> {
  let result
  try {
    result = await supabaseAdmin.rpc('loopy_schema_status')
  } catch {
    throw new AppError(
      503,
      'CMS_UNAVAILABLE',
      'Không kiểm tra được trạng thái CMS. Vui lòng thử lại.'
    )
  }
  if (result.error) {
    if (['PGRST202', '42883'].includes(result.error.code)) return false
    throw new AppError(
      503,
      'CMS_UNAVAILABLE',
      'Không kiểm tra được trạng thái CMS. Vui lòng thử lại.'
    )
  }
  return result.data?.cms === true
}
export async function assertCmsWritable() {
  if (!(await canWriteCms())) throw cmsSchemaNotReady()
}
export function isMissingCmsRevision(error: { code?: string; message?: string } | null) {
  return (
    !!error &&
    ['42703', 'PGRST204'].includes(error.code || '') &&
    /\brevision\b/i.test(error.message || '')
  )
}
