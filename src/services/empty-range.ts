import { errors } from '../middleware/errorHandler'

/** A PostgREST 416 is only empty when an exact count with the same filters proves it. */
export async function confirmEmptyRange(
  offset: number,
  loadCount: () => PromiseLike<{ count: number | null; error: unknown }>,
  message: string
) {
  if (offset <= 0) throw errors.databaseError(message)
  const result = await loadCount()
  if (
    result.error ||
    result.count === null ||
    !Number.isSafeInteger(result.count) ||
    result.count < 0 ||
    offset < result.count
  )
    throw errors.databaseError(message)
  return result.count
}
