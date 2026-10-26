jest.mock('../lesson-check/completion', () => ({
  recordLessonCheck: jest.fn().mockResolvedValue('check-id'),
}))
import { LessonCheckService } from '../lesson-check.service'
import { supabaseAdmin } from '../../db/supabase'
import { contentSchemas } from '../../schemas/content.schemas'

jest.mock('../../db/supabase', () => ({ supabaseAdmin: { from: jest.fn() } }))
jest.mock('../test-runner.service', () => ({ testRunnerService: { runTests: jest.fn() } }))
jest.mock('../../utils/logger', () => ({ logger: { info: jest.fn(), error: jest.fn() } }))

function fixture(steps: Record<string, unknown>[], lessonType = 'short_answer') {
  const insert = jest.fn().mockResolvedValue({ error: null })
  const chain = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({
      data: {
        id: 'lesson',
        lesson_type: lessonType,
        content_revision: 1,
        chapters: { language_id: 'javascript' },
      },
      error: null,
    }),
    order: jest.fn().mockResolvedValue({ data: steps, error: null }),
    maybeSingle: jest.fn().mockResolvedValue({ data: steps[0], error: null }),
  }
  ;(supabaseAdmin.from as jest.Mock).mockImplementation(table =>
    table === 'lesson_submissions' ? { insert } : chain
  )
  const service = new LessonCheckService()
  return {
    check: (answer: string) => service.checkLesson('lesson', 'learner', answer, 'javascript'),
    mini: (answer?: string) => service.checkLessonStep('lesson', 'step', answer),
    chain,
    insert,
  }
}
beforeEach(() => jest.resetAllMocks())

it.each([{ answer: 'right' }, [['right']]])(
  'rejects malformed answer keys on the admin step write boundary (%j)',
  correct_answer => {
    expect(
      contentSchemas.lessonStep.safeParse({
        params: { lessonId: '11111111-1111-4111-8111-111111111111' },
        body: { type: 'short_answer', prompt: 'Question', order_index: 0, correct_answer },
      }).success
    ).toBe(false)
  }
)

it('checks the first public question, ignoring answer keys on preceding informational notes', async () => {
  const state = fixture([
    { type: 'note', correct_answer: 'not-the-question' },
    { type: 'short_answer', correct_answer: 'right' },
  ])
  await expect(state.check('right')).resolves.toMatchObject({ passed: true })
})

it('does not silently grade a later question when the visible first question has no answer key', async () => {
  const state = fixture([
    { type: 'short_answer', correct_answer: null },
    { type: 'short_answer', correct_answer: 'right' },
  ])
  await expect(state.check('right')).resolves.toMatchObject({ passed: false })
})

it.each([
  { value: { answer: 'right' }, submitted: '[object Object]' },
  { value: [['right']], submitted: 'right' },
])(
  'does not stringify an invalid answer key into a passing answer (%j)',
  async ({ value, submitted }) => {
    const state = fixture([{ type: 'short_answer', correct_answer: value }])
    await expect(state.check(submitted)).resolves.toMatchObject({ passed: false })
    await expect(state.mini(submitted)).resolves.toMatchObject({ passed: false })
  }
)

it('supports a code_output question authored as code_prompt after a note', async () => {
  const state = fixture(
    [
      { type: 'note', correct_answer: '' },
      { type: 'code_prompt', correct_answer: 'Hello' },
    ],
    'code_output'
  )
  await expect(state.check('Hello')).resolves.toMatchObject({ passed: true })
})

it.each([undefined, 'wrong'])(
  'does not reveal an output answer through informational acknowledgement (%s)',
  async answer => {
    const state = fixture(
      [
        {
          type: 'code_prompt',
          correct_answer: 'Hello',
          explanation: 'Private output explanation',
          lessons: { lesson_type: 'code_output' },
        },
      ],
      'code_output'
    )
    const feedback = await state.mini(answer)
    expect(feedback.passed).toBe(false)
    expect(feedback.message).not.toContain('Private output explanation')
  }
)

it('only returns the code_output explanation for a matching case-sensitive answer', async () => {
  const state = fixture(
    [
      {
        type: 'code_prompt',
        correct_answer: 'Hello',
        explanation: 'Output explanation',
        lessons: { lesson_type: 'code_output' },
      },
    ],
    'code_output'
  )
  await expect(state.mini('Hello')).resolves.toEqual({
    passed: true,
    message: 'Output explanation',
  })
  await expect(state.mini('hello')).resolves.toMatchObject({ passed: false })
})

it('keeps multiple choice matching case-sensitive in both mini and full checks', async () => {
  const state = fixture([{ type: 'multiple_choice', correct_answer: 'Answer' }], 'multiple_choice')
  await expect(state.check('answer')).resolves.toMatchObject({ passed: false })
  await expect(state.mini('answer')).resolves.toMatchObject({ passed: false })
})

it.each([
  { key: false, answer: 'false' },
  { key: 0, answer: '0' },
  { key: ['right', 'yes'], answer: ' YES ' },
])('preserves supported scalar/alternative keys (%j)', async ({ key, answer }) => {
  const state = fixture([{ type: 'short_answer', correct_answer: key }])
  await expect(state.check(answer)).resolves.toMatchObject({ passed: true })
})
