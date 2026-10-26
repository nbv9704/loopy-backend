import { errors } from '../middleware/errorHandler'

interface Page<T> {
  data: T[] | null
  count: number | null
  error: unknown
}

/** The caller must order by a unique key. Never treat a row cap as the end of a collection. */
export async function readAllRows<T extends { id: string }>(
  page: (offset: number, end: number) => PromiseLike<Page<T>>,
  message: string
): Promise<T[]> {
  return readAllRowsByKey(page, message, row => row.id)
}

/** Composite-key tables supply the unique key within the query's fixed scope. */
export async function readAllRowsByKey<T>(
  page: (offset: number, end: number) => PromiseLike<Page<T>>,
  message: string,
  key: (row: T) => string
): Promise<T[]> {
  const rows: T[] = []
  const ids = new Set<string>()
  let total: number | null = null
  for (;;) {
    const result = await page(rows.length, rows.length + 499)
    if (
      result.error ||
      !Array.isArray(result.data) ||
      result.count === null ||
      !Number.isSafeInteger(result.count) ||
      result.count < 0 ||
      (total !== null && total !== result.count)
    )
      throw errors.databaseError(message)
    total = result.count
    for (const row of result.data) {
      const id = key(row)
      if (typeof id !== 'string' || !id.trim() || ids.has(id)) throw errors.databaseError(message)
      ids.add(id)
      rows.push(row)
    }
    if (rows.length === total) return rows
    if (result.data.length === 0 || rows.length > total) throw errors.databaseError(message)
  }
}

/** Bound IN filters so a large curriculum cannot exceed the HTTP URL limit. */
export async function readRowsForIds<T extends { id: string }>(
  ids: string[],
  page: (ids: string[], offset: number, end: number) => PromiseLike<Page<T>>,
  message: string
): Promise<T[]> {
  const unique = [...new Set(ids)]
  const rows: T[] = []
  const seen = new Set<string>()
  for (let index = 0; index < unique.length; index += 100) {
    const batch = unique.slice(index, index + 100)
    const result = await readAllRows((offset, end) => page(batch, offset, end), message)
    for (const row of result) {
      if (seen.has(row.id)) throw errors.databaseError(message)
      seen.add(row.id)
      rows.push(row)
    }
  }
  return rows
}
