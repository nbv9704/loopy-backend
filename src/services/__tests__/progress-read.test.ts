import { readProgressOverview } from '../progress/read-progress'
import { supabaseAdmin } from '../../db/supabase'
import { pagedDatabase } from '../../test-utils/paged-database'

jest.mock('../../db/supabase', () => ({ supabaseAdmin: { from: jest.fn() } }))
function fixture(size = 1005) {
  const tables = {
    user_progress: Array.from({ length: size }, (_, index) => ({
      id: `progress-${index}`,
      user_id: 'learner',
      lesson_id: `lesson-${index}`,
      status: 'completed',
      updated_at: index,
      lessons: { status: 'published', chapters: { language_id: 'python' } },
    })),
    lessons: Array.from({ length: size }, (_, index) => ({
      id: `lesson-${index}`,
      status: 'published',
    })),
    user_profiles: [{ id: 'learner', points: 0 }],
    user_badges: Array.from({ length: 5 }, (_, index) => ({
      user_id: 'learner',
      badge_id: `badge-${index}`,
      badges: { id: `badge-${index}` },
    })),
    user_streaks: [],
  }
  const db = pagedDatabase(tables, 29)
  jest.mocked(supabaseAdmin.from).mockImplementation(db.from as any)
  return { ...db, tables }
}
beforeEach(() => jest.resetAllMocks())
it('reports all progress and badges past the row cap, preserving a real zero point total', async () => {
  const db = fixture()
  const result = await readProgressOverview('learner')
  expect(result.progress).toHaveLength(1005)
  expect(result.completedLessons).toBe(1005)
  expect(result.summary.python.completed).toBe(1005)
  expect(result.totalLessons).toBe(1005)
  expect(result.totalPoints).toBe(0)
  expect(result.badges).toHaveLength(5)
  expect(
    db.queries
      .filter(query => query.table === 'user_progress')
      .every(query =>
        query.filters.some(([key, value]) => key === 'user_id' && value === 'learner')
      )
  ).toBe(true)
})
it('never mixes another learner or unpublished content into the snapshot', async () => {
  const db = fixture(2)
  db.tables.user_progress.push({ ...db.tables.user_progress[0], id: 'other', user_id: 'another' })
  db.tables.user_progress.push({
    ...db.tables.user_progress[0],
    id: 'draft',
    lessons: { status: 'draft', chapters: { language_id: 'python' } },
  })
  expect((await readProgressOverview('learner')).progress).toHaveLength(2)
})
it('fails without partial totals if a later progress page is unavailable', async () => {
  const db = fixture()
  db.failures.set('user_progress', 29)
  await expect(readProgressOverview('learner')).rejects.toMatchObject({ code: 'DATABASE_ERROR' })
})
it('keeps a missing profile from turning into a fictional zero-point account', async () => {
  const db = fixture(0)
  db.tables.user_profiles.length = 0
  await expect(readProgressOverview('learner')).rejects.toMatchObject({ code: 'DATABASE_ERROR' })
})
