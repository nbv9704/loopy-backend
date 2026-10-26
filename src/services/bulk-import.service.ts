import { z } from 'zod'
import { supabaseAdmin } from '../db/supabase'
import { AppError, errors } from '../middleware/errorHandler'
import { bulkImportPayloadSchema, NormalizedBulkImport } from '../schemas/bulk-import.schemas'

const counter = z.number().int().nonnegative()
const acknowledgement = z.object({
  lessons_created: counter,
  test_cases_created: counter,
  test_cases_replaced: counter,
  steps_created: counter,
  steps_replaced: counter,
})

const unconfirmedImport = () =>
  new AppError(
    502,
    'IMPORT_UNCONFIRMED',
    'Chưa xác nhận được kết quả import. Kiểm tra nội dung chapter trước khi gửi lại.'
  )

async function commitImport(payload: NormalizedBulkImport) {
  try {
    return await supabaseAdmin.rpc('bulk_import_lessons_atomically', {
      p_chapter_id: payload.chapter_id,
      p_lessons: payload.lessons,
    })
  } catch {
    // A rejected transport promise also leaves the commit outcome unknown.
    throw unconfirmedImport()
  }
}

export function parseImportAcknowledgement(data: unknown, payload: NormalizedBulkImport) {
  const row = Array.isArray(data) && data.length === 1 ? data[0] : data
  const parsed = acknowledgement.safeParse(row)
  if (
    !parsed.success ||
    parsed.data.lessons_created !== payload.lessons.length ||
    parsed.data.test_cases_created !==
      payload.lessons.reduce((n, item) => n + (item.test_cases?.length ?? 0), 0) ||
    parsed.data.steps_created !==
      payload.lessons.reduce((n, item) => n + (item.steps?.length ?? 0), 0)
  ) {
    throw unconfirmedImport()
  }
  return {
    lessonsCreated: parsed.data.lessons_created,
    testCasesCreated: parsed.data.test_cases_created,
    testCasesReplaced: parsed.data.test_cases_replaced,
    stepsCreated: parsed.data.steps_created,
    stepsReplaced: parsed.data.steps_replaced,
    errors: [] as string[],
  }
}

/** The only write is migration042's transaction. Omitted children are retained; [] clears them. */
export async function importLessons(input: unknown) {
  const parsed = bulkImportPayloadSchema.safeParse(input)
  if (!parsed.success) throw errors.validationError(parsed.error.issues)
  const payload = parsed.data
  const { data: chapter, error } = await supabaseAdmin
    .from('chapters')
    .select('id, title')
    .eq('id', payload.chapter_id)
    .maybeSingle()
  if (error) throw errors.databaseError('Không tải được chapter để import.')
  if (!chapter) throw errors.notFound('Chapter')

  const { data, error: rpcError } = await commitImport(payload)
  if (rpcError) {
    if (['PGRST202', '42883'].includes(rpcError.code)) {
      throw new AppError(
        503,
        'SCHEMA_NOT_READY',
        'Database chưa sẵn sàng để import. Cần cập nhật migration 042.'
      )
    }
    // A transport failure does not establish whether the database committed.
    throw unconfirmedImport()
  }
  return { chapterId: payload.chapter_id, result: parseImportAcknowledgement(data, payload) }
}
