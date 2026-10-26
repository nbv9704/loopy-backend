import { Request, Response } from 'express'
import { getChaptersWithLessons, getChaptersWithLessonsByPath } from '../language.controller'
import { supabaseAdmin } from '../../db/supabase'
import { publicSchemas } from '../../schemas/public.schemas'
import { pagedDatabase } from '../../test-utils/paged-database'

jest.mock('../../db/supabase', () => ({ supabaseAdmin: { from: jest.fn() } }))
function fixture() {
  const tables = {
    learning_paths: [{ id: 'path', language_id: 'python', is_active: true }],
    path_chapters: [{ path_id: 'path', chapter_id: 'chapter', order_index: 1 }],
    chapters: [
      { id: 'chapter', language_id: 'python', order_index: 0, learning_path: 'first_steps' },
    ],
    lessons: [{ id: 'lesson', chapter_id: 'chapter', order_index: 0, status: 'published' }],
    lesson_steps: [],
  }
  const db = pagedDatabase(tables)
  jest.mocked(supabaseAdmin.from).mockImplementation(db.from as any)
  const res = { json: jest.fn() } as unknown as Response
  const next = jest.fn()
  const run = (pathId?: string) =>
    getChaptersWithLessons(
      { params: { id: 'python' }, query: pathId ? { pathId } : {} } as unknown as Request,
      res,
      next
    )
  return { db, tables, res, next, run }
}
beforeEach(() => jest.resetAllMocks())
it('validates the active path language and uses its chapter order', async () => {
  const state = fixture()
  await state.run('path')
  expect(state.next).not.toHaveBeenCalled()
  const query = state.db.queries.find(item => item.table === 'learning_paths')!
  expect(query.filters).toEqual(
    expect.arrayContaining([
      ['id', 'path'],
      ['is_active', true],
      ['language_id', 'python'],
    ])
  )
  expect(jest.mocked(state.res.json).mock.calls[0][0].data.chapters[0].orderIndex).toBe(1)
})
it('keeps a missing or wrong-language path distinct from a provider failure', async () => {
  const state = fixture()
  state.tables.learning_paths[0].language_id = 'javascript'
  await state.run('path')
  expect(state.next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }))
})
it.each(['learning_paths', 'path_chapters', 'chapters'])(
  'reports %s query failure instead of a missing/empty curriculum',
  async table => {
    const state = fixture()
    state.db.failures.set(table, 0)
    await state.run('path')
    expect(state.next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 500, code: 'DATABASE_ERROR' })
    )
    expect(state.res.json).not.toHaveBeenCalled()
  }
)
it('rejects an invalid or repeated path query instead of ignoring it', () => {
  const schema = publicSchemas.languageCurriculum
  expect(
    schema.safeParse({ params: { id: 'python' }, query: { pathId: 'not-a-uuid' } }).success
  ).toBe(false)
  expect(
    schema.safeParse({ params: { id: 'python' }, query: { pathId: ['a', 'b'] } }).success
  ).toBe(false)
  expect(schema.safeParse({ params: { id: 'python' }, query: {} }).success).toBe(true)
})
it('keeps an empty mapped path empty instead of loading the whole language', async () => {
  const state = fixture()
  state.tables.path_chapters.length = 0
  await state.run('path')
  expect(state.res.json).toHaveBeenCalledWith({
    success: true,
    data: { chapters: [], lessons: [] },
  })
  expect(state.db.queries.some(query => query.table === 'chapters')).toBe(false)
})
it('preserves the legacy goal filter', async () => {
  const state = fixture()
  await getChaptersWithLessonsByPath(
    { params: { languageId: 'python', learningPath: 'first_steps' } } as unknown as Request,
    state.res,
    state.next
  )
  expect(state.next).not.toHaveBeenCalled()
  expect(state.db.queries.find(query => query.table === 'chapters')!.filters).toContainEqual([
    'learning_path',
    'first_steps',
  ])
  expect(state.db.queries.some(query => query.table === 'learning_paths')).toBe(false)
})
it.each([undefined, 'path'])(
  'does not preload grading answers or explanations (%s)',
  async pathId => {
    const state = fixture()
    await state.run(pathId)
    expect(state.next).not.toHaveBeenCalled()
    for (const query of state.db.queries)
      expect(query.projection).not.toMatch(/correct_answer|solution_code|explanation/)
  }
)
