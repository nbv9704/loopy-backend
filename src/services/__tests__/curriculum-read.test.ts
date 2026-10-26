import { supabaseAdmin } from '../../db/supabase'
import { getCurriculum } from '../curriculum.service'
import { readPathOverview, readPaths } from '../curriculum/catalog-read'
import { pagedDatabase } from '../../test-utils/paged-database'

jest.mock('../../db/supabase', () => ({ supabaseAdmin: { from: jest.fn() } }))

function fixture(size = 4, cap = 2) {
  const chapters = Array.from({ length: size }, (_, index) => ({
    id: `chapter-${index}`,
    language_id: 'python',
    order_index: index,
    learning_path: 'beginner',
  }))
  const tables = {
    learning_paths: [{ id: 'path', language_id: 'python', title: 'Path', is_active: true }],
    path_chapters: chapters.map((chapter, index) => ({
      path_id: 'path',
      chapter_id: chapter.id,
      order_index: size - index,
    })),
    chapters,
    lessons: chapters.flatMap(chapter => [
      { id: `${chapter.id}-a`, chapter_id: chapter.id, status: 'published', order_index: 1 },
      { id: `${chapter.id}-b`, chapter_id: chapter.id, status: 'published', order_index: 1 },
      { id: `${chapter.id}-draft`, chapter_id: chapter.id, status: 'draft', order_index: 0 },
    ]),
    lesson_steps: chapters.flatMap(chapter =>
      Array.from({ length: 5 }, (_, index) => ({
        id: `${chapter.id}-step-${index}`,
        lesson_id: `${chapter.id}-a`,
        order_index: index,
        type: 'note',
        prompt: 'Public text',
      }))
    ),
  }
  const db = pagedDatabase(tables, cap)
  jest.mocked(supabaseAdmin.from).mockImplementation(db.from as any)
  return { ...db, tables }
}

beforeEach(() => jest.resetAllMocks())

it('loads every mapped chapter, published lesson and step past the independent row caps', async () => {
  const db = fixture()
  const result = await getCurriculum('python', { pathId: 'path' })
  expect(result.chapters.map(row => row.id)).toEqual([
    'chapter-3',
    'chapter-2',
    'chapter-1',
    'chapter-0',
  ])
  expect(result.lessons).toHaveLength(8)
  expect(result.lessons[0]).toMatchObject({ id: 'chapter-3-a', lesson_steps: expect.any(Array) })
  expect(result.lessons[0].lesson_steps).toHaveLength(5)
  expect(result.lessons.flatMap(row => row.lesson_steps)).toHaveLength(20)
  expect(db.queries.filter(query => query.table === 'lesson_steps').length).toBeGreaterThan(1)
  for (const query of db.queries)
    expect(query.projection).not.toMatch(/correct_answer|solution_code|explanation/)
})

it('splits large parent lists into bounded filters while still reading all children', async () => {
  const db = fixture(120, 37)
  const result = await getCurriculum('python', { pathId: 'path' })
  expect(result.chapters).toHaveLength(120)
  expect(result.lessons).toHaveLength(240)
  expect(result.lessons.flatMap(row => row.lesson_steps)).toHaveLength(600)
  expect(db.queries.flatMap(query => query.groups).every(([, ids]) => ids.length <= 100)).toBe(true)
})

it.each(['path_chapters', 'chapters', 'lessons', 'lesson_steps'])(
  'never returns a partial curriculum if a later %s page fails',
  async table => {
    const db = fixture()
    db.failures.set(table, 2)
    await expect(getCurriculum('python', { pathId: 'path' })).rejects.toMatchObject({
      code: 'DATABASE_ERROR',
    })
  }
)

it('fails explicitly when a path references a chapter from another language', async () => {
  const db = fixture()
  db.tables.chapters[0].language_id = 'javascript'
  await expect(getCurriculum('python', { pathId: 'path' })).rejects.toMatchObject({
    code: 'DATABASE_ERROR',
  })
})

it('counts every published lesson in path previews instead of treating a row cap as completion', async () => {
  fixture(120, 31)
  const result = await readPathOverview('path')
  expect(result.chapters).toHaveLength(120)
  expect(result.chapters.every(chapter => chapter.lesson_count === 2)).toBe(true)
})

it('keeps filtered active path lists complete and ignores inactive and foreign paths', async () => {
  const db = fixture()
  db.tables.learning_paths.push({
    id: 'inactive',
    language_id: 'python',
    title: 'Hidden',
    is_active: false,
  })
  expect(await readPaths({ languageId: 'python' })).toHaveLength(1)
  expect(await readPaths({ languageId: 'javascript' })).toEqual([])
})
