import { errors } from '../middleware/errorHandler'

/** A lost transport response does not establish whether the database committed. */
export async function awaitWrite<T>(request: PromiseLike<T>): Promise<T> {
  try {
    return await request
  } catch {
    throw errors.databaseError('Chưa xác nhận được thay đổi. Hãy tải lại trước khi gửi lại.')
  }
}
