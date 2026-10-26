import { z } from 'zod'
import { AppError, errors } from '../../middleware/errorHandler'

export function practiceSavedId(value: unknown, expected?: string): string {
  const parsed = z.guid().safeParse(value)
  if (!parsed.success || (expected && parsed.data !== expected))
    throw errors.databaseError(
      'Không xác nhận được ID bộ bài đã lưu. Hãy tải lại trước khi gửi lại.'
    )
  return parsed.data
}

/** The transaction already committed. Read-back failure must never invite another create. */
export async function readSavedPractice<T extends { id: string }>(
  setId: string,
  read: () => Promise<T>
): Promise<T> {
  try {
    const value = await read()
    if (value.id !== setId) throw errors.databaseError('Wrong saved set')
    return value
  } catch {
    throw new AppError(
      503,
      'PRACTICE_SAVED_READ_FAILED',
      'Bộ bài đã được lưu, nhưng chưa tải lại được kết quả. Hãy tải lại kết quả trước khi chỉnh sửa tiếp.',
      { setId }
    )
  }
}
