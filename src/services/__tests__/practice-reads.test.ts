import { PracticeService } from '../practice.service'
import { supabaseAdmin } from '../../db/supabase'

jest.mock('../../db/supabase', () => ({ supabaseAdmin: { from: jest.fn(), rpc: jest.fn() } }))
jest.mock('../../utils/contentModeration', () => ({ validateContent: jest.fn() }))

const service = new PracticeService()

function mockRead(data: unknown, error: unknown) {
  const from = supabaseAdmin.from as jest.Mock
  from.mockReturnValue({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data, error }),
  })
}

beforeEach(() => jest.resetAllMocks())

for (const [name, read] of [
  ['public details', () => service.getSet('set', 'learner')],
  ['admin details', () => service.getSetForAdmin('set')],
  ['attempt preflight', () => service.startAttempt('set', 'learner')],
] as const) {
  describe(name, () => {
    it('keeps database failures distinct from missing content', async () => {
      mockRead(null, { code: '08006', message: 'Database unavailable' })
      await expect(read()).rejects.toMatchObject({ code: 'DATABASE_ERROR', statusCode: 500 })
      expect(supabaseAdmin.rpc).not.toHaveBeenCalled()
    })
    it.each([null, { code: 'PGRST116' }])(
      'returns 404 only when the row is absent (%j)',
      async error => {
        mockRead(null, error)
        await expect(read()).rejects.toMatchObject({ code: 'NOT_FOUND', statusCode: 404 })
        expect(supabaseAdmin.rpc).not.toHaveBeenCalled()
      }
    )
  })
}

const set = {
  id: 'set',
  created_by: 'owner',
  status: 'published',
  visibility: 'public',
  practice_questions: [
    {
      id: 'question',
      set_id: 'set',
      type: 'fill_blank',
      prompt: 'Question',
      points: 10,
      order_index: 0,
      correct_answer: 'secret',
      explanation: 'secret explanation',
    },
  ],
}

it('still denies a private set to another learner', async () => {
  mockRead({ ...set, visibility: 'private' }, null)
  await expect(service.getSet('set', 'other')).rejects.toMatchObject({ statusCode: 403 })
})

it('still hides the answer and explanation from a public viewer', async () => {
  mockRead(set, null)
  const result = await service.getSet('set', 'other')
  expect(JSON.stringify(result)).not.toContain('secret')
})

it('still includes the answer for the owner editing their set', async () => {
  mockRead(set, null)
  const result = await service.getSet('set', 'owner')
  expect(result.questions[0].correctAnswer).toBe('secret')
  expect(result.questions[0].explanation).toBe('secret explanation')
})

it('preserves explanations for the admin editor', async () => {
  mockRead(set, null)
  expect((await service.getSetForAdmin('set')).questions[0].explanation).toBe('secret explanation')
})

it('does not include answers or explanations in a newly started attempt', async () => {
  mockRead(set, null)
  const rpc = supabaseAdmin.rpc as jest.Mock
  rpc.mockResolvedValue({
    data: {
      attempt: {
        id: 'attempt',
        set_id: 'set',
        user_id: 'learner',
        status: 'in_progress',
        score: 0,
        max_score: 10,
        started_at: '2026-10-24T00:00:00Z',
      },
      questions: set.practice_questions,
    },
    error: null,
  })
  const result = await service.startAttempt('set', 'learner')
  expect(JSON.stringify(result)).not.toContain('secret')
})
