import { supabaseAdmin } from '../../db/supabase'
import { completeCheckedLesson, recordLessonCheck } from '../lesson-check/completion'
import { progressSchemas } from '../../schemas/progress.schemas'

jest.mock('../../db/supabase', () => ({ supabaseAdmin: { rpc: jest.fn() } }))
const result = { passed: true, score: 100, checks: [], output: '', hint: null }
const receipt = {
  id: 'check',
  user_id: 'user',
  lesson_id: 'lesson',
  content_revision: 2,
  passed: true,
}
beforeEach(() => jest.resetAllMocks())

it.each([undefined, {}, { submissionId: 'not-a-uuid' }])(
  'requires a receipt on the HTTP completion boundary (%j)',
  body => {
    expect(
      progressSchemas.complete.safeParse({
        params: { lessonId: '11111111-1111-4111-8111-111111111111' },
        body,
      }).success
    ).toBe(false)
  }
)

it('passes the code, actor and content version to one receipt transaction', async () => {
  jest.mocked(supabaseAdmin.rpc).mockResolvedValue({ data: receipt, error: null } as never)
  await expect(recordLessonCheck('user', 'lesson', 2, 'code', result, 10)).resolves.toBe('check')
  expect(supabaseAdmin.rpc).toHaveBeenCalledWith(
    'record_lesson_check',
    expect.objectContaining({
      p_user_id: 'user',
      p_lesson_id: 'lesson',
      p_content_revision: 2,
      p_code: 'code',
      p_result: { passed: true, score: 100, checks: [], hint: null },
    })
  )
})

it.each([
  null,
  {},
  { ...receipt, user_id: 'other' },
  { ...receipt, lesson_id: 'other' },
  { ...receipt, content_revision: 3 },
  { ...receipt, passed: false },
])('rejects an incomplete or mismatched receipt (%j)', async data => {
  jest.mocked(supabaseAdmin.rpc).mockResolvedValue({ data, error: null } as never)
  await expect(recordLessonCheck('user', 'lesson', 2, 'code', result, 10)).rejects.toMatchObject({
    code: 'DATABASE_ERROR',
  })
})

it.each(['P0501', 'P0502', 'PGRST202', '42883', '08006'])(
  'fails closed on transaction error %s without a fallback write',
  async code => {
    jest.mocked(supabaseAdmin.rpc).mockResolvedValue({ data: null, error: { code } } as never)
    await expect(
      completeCheckedLesson('user', 'lesson', 'check', '2026-10-22')
    ).rejects.toMatchObject({
      code: code.startsWith('P050')
        ? 'LESSON_CHECK_STALE'
        : ['PGRST202', '42883'].includes(code)
          ? 'SCHEMA_NOT_READY'
          : 'DATABASE_ERROR',
    })
    expect(supabaseAdmin.rpc).toHaveBeenCalledTimes(1)
  }
)

it('accepts unknown metadata only for an already-completed legacy record', async () => {
  const saved = {
    id: 'legacy',
    status: 'completed',
    completed_at: null,
    time_spent: null,
    was_first_completion: false,
  }
  jest.mocked(supabaseAdmin.rpc).mockResolvedValue({ data: [saved], error: null } as never)
  await expect(completeCheckedLesson('user', 'lesson', 'check', '2026-10-22')).resolves.toEqual(
    saved
  )
  jest
    .mocked(supabaseAdmin.rpc)
    .mockResolvedValue({ data: [{ ...saved, was_first_completion: true }], error: null } as never)
  await expect(
    completeCheckedLesson('user', 'lesson', 'check', '2026-10-22')
  ).rejects.toMatchObject({ code: 'DATABASE_ERROR' })
})

it.each([
  null,
  [],
  [{ status: 'completed' }],
  [
    {
      id: 'progress',
      status: 'completed',
      completed_at: '2026-10-22T00:00:00Z',
      time_spent: 0,
      was_first_completion: 'false',
    },
  ],
])('rejects malformed completion acknowledgements (%j)', async data => {
  jest.mocked(supabaseAdmin.rpc).mockResolvedValue({ data, error: null } as never)
  await expect(
    completeCheckedLesson('user', 'lesson', 'check', '2026-10-22')
  ).rejects.toMatchObject({ code: 'DATABASE_ERROR' })
})
