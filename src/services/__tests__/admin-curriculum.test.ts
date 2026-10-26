import { supabaseAdmin } from '../../db/supabase'
import {
  archiveAdminLesson,
  readAdminLessons,
  saveLessonDetail,
  removeLessonDetail,
} from '../admin-curriculum.service'
jest.mock('../../db/supabase', () => ({ supabaseAdmin: { from: jest.fn() } }))

function write(data: unknown, error: unknown = null) {
  const q = {
    update: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue({ data, error }),
  }
  jest.mocked(supabaseAdmin.from).mockReturnValue(q as never)
  return q
}
beforeEach(() => jest.resetAllMocks())
it('reads all lesson and test-case pages rather than reporting missing cases after a row cap', async () => {
  jest.mocked(supabaseAdmin.from).mockImplementation(table => {
    const rows =
      table === 'lessons'
        ? [{ id: 'a' }, { id: 'b' }]
        : [
            { id: 'c1', lesson_id: 'a' },
            { id: 'c2', lesson_id: 'a' },
            { id: 'c3', lesson_id: 'b' },
          ]
    const q = {
      select: jest.fn().mockReturnThis(),
      neq: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      range: jest.fn((offset: number) =>
        Promise.resolve({ data: rows.slice(offset, offset + 1), count: rows.length, error: null })
      ),
    }
    return q as never
  })
  await expect(readAdminLessons('all', 'all')).resolves.toEqual([
    { id: 'a', test_case_count: 2 },
    { id: 'b', test_case_count: 1 },
  ])
})
it.each(['lesson_steps', 'lesson_test_cases'] as const)(
  'does not reparent an existing %s row when its ID belongs to another lesson',
  async table => {
    const q = write(null)
    await expect(
      saveLessonDetail(table, 'target', 'foreign-id', { prompt: 'Draft' })
    ).rejects.toMatchObject({ code: 'LESSON_DETAIL_CHANGED', statusCode: 409 })
    expect(q.eq.mock.calls).toEqual([
      ['id', 'foreign-id'],
      ['lesson_id', 'target'],
    ])
    expect(q.insert).not.toHaveBeenCalled()
  }
)
it('inserts a new detail without choosing a client ID and confirms its parent', async () => {
  const q = write({ id: 'generated', lesson_id: 'target', order_index: 0 })
  await expect(
    saveLessonDetail('lesson_steps', 'target', undefined, { prompt: 'Question', order_index: 0 })
  ).resolves.toMatchObject({ id: 'generated' })
  expect(q.insert).toHaveBeenCalledWith({ prompt: 'Question', order_index: 0, lesson_id: 'target' })
  expect(q.update).not.toHaveBeenCalled()
})
it('does not accept a saved row for another parent', async () => {
  write({ id: 'row', lesson_id: 'other' })
  await expect(saveLessonDetail('lesson_test_cases', 'target', 'row', {})).rejects.toMatchObject({
    code: 'DATABASE_ERROR',
  })
})

it('the reusable write boundary owns parent and primary key even when values contain another identity', async () => {
  const q = write({ id: 'row', lesson_id: 'target', order_index: 0 })
  await saveLessonDetail('lesson_steps', 'target', 'row', {
    id: 'other-id',
    lesson_id: 'other-parent',
    order_index: 0,
    is_required: false,
  })
  expect(q.update).toHaveBeenCalledWith({ lesson_id: 'target', order_index: 0, is_required: false })
})
it('does not call an absent detail successfully deleted', async () => {
  write(null)
  await expect(removeLessonDetail('lesson_steps', 'missing')).rejects.toMatchObject({
    statusCode: 404,
  })
})
it('requires an acknowledgement for the selected delete ID', async () => {
  write({ id: 'other' })
  await expect(removeLessonDetail('lesson_test_cases', 'id')).rejects.toMatchObject({
    code: 'DATABASE_ERROR',
  })
})
it('distinguishes a database archive failure from a missing lesson and never leaks SQL', async () => {
  write(null, { message: 'private SQL' })
  await expect(archiveAdminLesson('id')).rejects.toMatchObject({
    statusCode: 500,
    details: undefined,
  })
})
it('archives a confirmed row without deleting progress or relying on a preflight', async () => {
  const q = write({ id: 'id', title: 'Lesson', status: 'archived' })
  await expect(archiveAdminLesson('id')).resolves.toMatchObject({ id: 'id', status: 'archived' })
  expect(q.update).toHaveBeenCalledWith({ status: 'archived' })
  expect(q.delete).not.toHaveBeenCalled()
  expect(supabaseAdmin.from).toHaveBeenCalledTimes(1)
})

it('limits test-case ID batches so a large catalog does not exceed the PostgREST URL size', async () => {
  const batches: string[][] = []
  const rows = Array.from({ length: 201 }, (_, index) => ({ id: `lesson-${index}` }))
  jest.mocked(supabaseAdmin.from).mockImplementation(
    table =>
      ({
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        in: (_key: string, ids: string[]) => {
          batches.push(ids)
          return {
            order: jest.fn().mockReturnThis(),
            range: async () => ({ data: [], count: 0, error: null }),
          }
        },
        range: async () => ({
          data: table === 'lessons' ? rows : [],
          count: table === 'lessons' ? rows.length : 0,
          error: null,
        }),
      }) as never
  )
  await expect(readAdminLessons('all', 'all')).resolves.toHaveLength(201)
  expect(batches.map(batch => batch.length)).toEqual([100, 100, 1])
})

it('a rejected write transport says unconfirmed rather than claiming rollback or success', async () => {
  const q = write(null)
  q.maybeSingle.mockRejectedValue(new Error('connection lost'))
  await expect(archiveAdminLesson('id')).rejects.toMatchObject({
    code: 'DATABASE_ERROR',
    details: undefined,
    message: 'Chưa xác nhận được thay đổi. Hãy tải lại trước khi gửi lại.',
  })
})
