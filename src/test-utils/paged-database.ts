type Row = Record<string, any>
interface Query {
  table: string
  projection?: string
  filters: Array<[string, unknown]>
  groups: Array<[string, string[]]>
  orders: Array<[string, boolean]>
  start: number
  end: number
  head: boolean
}

/** Simulates a PostgREST row cap independently of the requested range. */
export function pagedDatabase(tables: Record<string, Row[]>, cap = 2) {
  const queries: Query[] = []
  const failures = new Map<string, number>()
  const value = (row: Row, field: string): any =>
    field.split('.').reduce<any>((item, key) => item?.[key], row)
  const from = jest.fn((table: string) => {
    const state: Query = {
      table,
      filters: [],
      groups: [],
      orders: [],
      start: 0,
      end: Infinity,
      head: false,
    }
    queries.push(state)
    const resolve = () => {
      if (failures.has(table) && state.start >= failures.get(table)!)
        return {
          data: null,
          count: null,
          error: { code: '08006', message: 'private database failure' },
        }
      const rows = (tables[table] || []).filter(
        row =>
          state.filters.every(([key, expected]) => value(row, key) === expected) &&
          state.groups.every(([key, ids]) => ids.includes(value(row, key)))
      )
      rows.sort((a, b) => {
        for (const [field, ascending] of state.orders) {
          const first = value(a, field),
            second = value(b, field)
          if (first !== second) return (first < second ? -1 : 1) * (ascending ? 1 : -1)
        }
        return 0
      })
      return {
        data: state.head
          ? null
          : rows.slice(state.start, Math.min(state.end + 1, state.start + cap)),
        count: rows.length,
        error: null,
      }
    }
    const chain: Record<string, any> = {
      select: jest.fn((projection: string, options?: { head?: boolean }) => {
        state.projection = projection
        state.head = !!options?.head
        return chain
      }),
      eq: jest.fn((field: string, expected: unknown) => {
        state.filters.push([field, expected])
        return chain
      }),
      in: jest.fn((field: string, ids: string[]) => {
        state.groups.push([field, ids])
        return chain
      }),
      order: jest.fn((field: string, options?: { ascending?: boolean }) => {
        state.orders.push([field, options?.ascending !== false])
        return chain
      }),
      range: jest.fn((start: number, end: number) => {
        state.start = start
        state.end = end
        return chain
      }),
      returns: jest.fn(() => chain),
      maybeSingle: jest.fn(async () => {
        const result = resolve()
        return { ...result, data: result.data?.[0] || null }
      }),
      single: jest.fn(async () => {
        const result = resolve()
        return {
          ...result,
          data: result.data?.[0] || null,
          error: result.error || (result.count === 0 ? { code: 'PGRST116' } : null),
        }
      }),
      then: (done: (result: ReturnType<typeof resolve>) => unknown) =>
        Promise.resolve(resolve()).then(done),
    }
    return chain
  })
  return { from, queries, failures }
}
