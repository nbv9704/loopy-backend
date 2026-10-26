import { supabaseAdmin } from '../../db/supabase'
import { readPracticeCatalog } from '../practice/catalog'
import { PracticeService } from '../practice.service'

jest.mock('../../db/supabase', () => ({ supabaseAdmin: { from: jest.fn() } }))
jest.mock('../../utils/contentModeration', () => ({ validateContent: jest.fn() }))
const timestamp = '2026-10-24T00:00:00Z'
function fixture(setCount = 50, cap = 37) {
  const sets = Array.from({ length: setCount }, (_, i) => ({
    id: `set-${String(i).padStart(4, '0')}`,
    updated_at: timestamp,
    created_by: 'owner',
    status: 'published',
    visibility: 'public',
    title: i === 0 ? 'metadata-match' : 'Title',
    practice_questions: [{ count: 30 }],
  }))
  const questions = sets.flatMap(set =>
    Array.from({ length: 30 }, (_, i) => ({
      id: `${set.id}-q${String(i).padStart(2, '0')}`,
      set_id: set.id,
      order_index: 29 - i,
      type: 'fill_blank',
      points: 10,
      prompt: 'Match',
      correct_answer: 'secret',
      explanation: 'secret',
    }))
  )
  const calls: Array<{ table: string; filters: unknown[]; range?: number[] }> = []
  let failQuestionOffset: number | null = null
  let emptyRange = false
  let missingCount = false
  jest.mocked(supabaseAdmin.from).mockImplementation(((table: string) => {
    const filters: Array<[string, unknown, unknown?]> = []
    const call = { table, filters: filters as unknown[], range: undefined as number[] | undefined }
    calls.push(call)
    let head = false
    const query: any = {
      select: jest.fn((_columns, options) => {
        head = Boolean(options?.head)
        return query
      }),
      eq: jest.fn((key, value) => {
        filters.push(['eq', key, value])
        return query
      }),
      neq: jest.fn((key, value) => {
        filters.push(['neq', key, value])
        return query
      }),
      in: jest.fn((key, value) => {
        filters.push(['in', key, value])
        return query
      }),
      or: jest.fn(value => {
        filters.push(['or', value])
        return query
      }),
      order: jest.fn().mockReturnThis(),
      range: jest.fn((offset, end) => {
        call.range = [offset, end]
        return Promise.resolve(result(offset, end))
      }),
      then: (resolve: (value: unknown) => unknown) => Promise.resolve(result(0, 0)).then(resolve),
    }
    function result(offset: number, end: number) {
      let rows: any[] = table === 'practice_sets' ? sets : questions
      for (const [kind, key, value] of filters) {
        if (kind === 'eq') rows = rows.filter(row => row[key as string] === value)
        if (kind === 'neq') rows = rows.filter(row => row[key as string] !== value)
        if (kind === 'in')
          rows = rows.filter(row => (value as unknown[]).includes(row[key as string]))
        if (kind === 'or' && table === 'practice_sets' && String(key).includes('.imatch.'))
          rows = rows.filter(row => row.title === 'metadata-match')
      }
      if (table === 'practice_questions' && offset === failQuestionOffset)
        return { data: null, count: null, error: { code: '08006' } }
      if (table === 'practice_sets' && emptyRange && !head)
        return { data: null, count: null, error: { code: 'PGRST103' } }
      return {
        data: head ? null : rows.slice(offset, Math.min(end + 1, offset + cap)),
        count: missingCount ? null : rows.length,
        error: null,
      }
    }
    return query
  }) as any)
  return {
    sets,
    questions,
    calls,
    failAt: (offset: number) => {
      failQuestionOffset = offset
    },
    exceed: () => {
      emptyRange = true
    },
    noCount: () => {
      missingCount = true
    },
  }
}
beforeEach(() => jest.resetAllMocks())

it('question search filters before the result limit, including a match after question twenty', async () => {
  const service = new PracticeService()
  const questions = Array.from({ length: 30 }, (_, i) => ({
    id: `q-${i}`,
    prompt: i === 29 ? 'Unique needle' : 'Unrelated',
  }))
  const list = jest
    .spyOn(service, 'listSets')
    .mockResolvedValue({
      items: [{ id: 'set', title: 'Set', questions }],
      total: 1,
      limit: 20,
      offset: 0,
    } as never)
  try {
    const result = await service.searchQuestions({ userId: 'owner', keyword: 'needle', limit: 20 })
    expect(result.map(item => item.question.id)).toEqual(['q-29'])
  } finally {
    list.mockRestore()
  }
})

it('reads all 1500 questions behind a row cap and restores question ordering without leaking answers', async () => {
  fixture(50, 50)
  const result = await readPracticeCatalog({ limit: 50, includeQuestions: true })
  expect(result.items).toHaveLength(50)
  expect(result.items.flatMap(row => row.questions || [])).toHaveLength(1500)
  expect(result.items[0].questions?.map((row: { orderIndex: number }) => row.orderIndex)).toEqual(
    Array.from({ length: 30 }, (_, i) => i)
  )
  expect(JSON.stringify(result)).not.toContain('secret')
})
it('fails instead of publishing a partial question list when a later page fails', async () => {
  const state = fixture(2, 15)
  state.failAt(15)
  await expect(readPracticeCatalog({ includeQuestions: true })).rejects.toMatchObject({
    code: 'DATABASE_ERROR',
  })
})
it('searches beyond the first question page, batches matching set IDs and paginates the full union', async () => {
  const state = fixture(121, 17)
  const result = await readPracticeCatalog({ keyword: 'Match', offset: 120, limit: 1 })
  expect(result.total).toBe(121)
  expect(result.items.map(row => row.id)).toEqual(['set-0000'])
  const idFilters = state.calls
    .filter(call => call.table === 'practice_sets')
    .flatMap(call => call.filters)
    .filter((filter: any) => filter[0] === 'in' && filter[1] === 'id') as Array<
    [string, string, string[]]
  >
  expect(idFilters.length).toBeGreaterThan(1)
  expect(Math.max(...idFilters.map(filter => filter[2].length))).toBeLessThanOrEqual(100)
})
it('quotes punctuation and escapes regex instead of treating input as filter grammar or a pattern', async () => {
  const state = fixture(1)
  const keyword = 'c++,(title.eq.hidden)\\"%_'
  await readPracticeCatalog({ keyword })
  const expected = JSON.stringify(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  expect(state.calls.flatMap(call => call.filters)).toContainEqual([
    'or',
    `title.imatch.${expected},prompt.imatch.${expected}`,
  ])
})
it('does not expose another owner private questions when searching', async () => {
  const state = fixture(2)
  state.sets[1].visibility = 'private'
  const result = await readPracticeCatalog({ keyword: 'Match' })
  expect(result.items.map(row => row.id)).toEqual(['set-0000'])
  expect(JSON.stringify(result)).not.toContain('secret')
})
it('does not turn missing totals into an empty successful catalog', async () => {
  const state = fixture()
  state.noCount()
  await expect(readPracticeCatalog({})).rejects.toMatchObject({ code: 'DATABASE_ERROR' })
})
it('confirms a 416 page past the end using the same filters and an exact HEAD count', async () => {
  const state = fixture(1)
  state.exceed()
  const result = await readPracticeCatalog({ offset: 100, mine: true, userId: 'owner' })
  expect(result).toEqual({ items: [], total: 1, offset: 100, limit: 20 })
  expect(state.calls).toHaveLength(2)
  expect(state.calls[0].filters).toEqual(state.calls[1].filters)
})
