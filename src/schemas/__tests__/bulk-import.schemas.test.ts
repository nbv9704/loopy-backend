import { bulkImportPayloadSchema } from '../bulk-import.schemas'
import { contentSchemas } from '../content.schemas'

const payload = () => ({
  chapterId: '11111111-1111-4111-8111-111111111111',
  lessons: [
    {
      lessonId: 'intro',
      title: 'Intro',
      lessonType: 'concept',
      orderIndex: 0,
    },
  ],
})

describe('bulk import boundary', () => {
  it('is stable when route middleware and service both validate the normalized payload', () => {
    const normalized = bulkImportPayloadSchema.parse(payload())
    expect(bulkImportPayloadSchema.parse(normalized)).toEqual(normalized)
  })
  it('accepts a non-code lesson and preserves absent children', () => {
    const value = bulkImportPayloadSchema.parse(payload()).lessons[0]
    expect(value).toMatchObject({
      lesson_id: 'intro',
      lesson_type: 'concept',
      order_index: 0,
      status: 'draft',
    })
    expect(value).not.toHaveProperty('test_cases')
    expect(value).not.toHaveProperty('steps')
  })
  it('keeps empty children, false, null and zero instead of falling through an alias', () => {
    const body = payload()
    const value = bulkImportPayloadSchema.parse({
      ...body,
      lessons: [
        {
          ...body.lessons[0],
          isAhaLesson: false,
          testCases: [
            { orderIndex: 0, description: 'Null', expectedOutput: null, isHidden: false },
          ],
          lessonSteps: [
            {
              type: 'true_false',
              prompt: 'False?',
              correctAnswer: false,
              isRequired: false,
              orderIndex: 0,
            },
          ],
        },
      ],
    }).lessons[0]
    expect(value.test_cases?.[0]).toMatchObject({
      order_index: 0,
      expected_output: null,
      is_hidden: false,
    })
    expect(value.steps?.[0]).toMatchObject({
      order_index: 0,
      correct_answer: false,
      is_required: false,
    })
    expect(
      bulkImportPayloadSchema.parse({
        ...body,
        lessons: [{ ...body.lessons[0], testCases: [], steps: [] }],
      }).lessons[0]
    ).toMatchObject({ test_cases: [], steps: [] })
  })
  it.each([
    { status: 'publshed' },
    { lessonType: 'unknown' },
    { validationType: 'unknown' },
    { lesson_id: 'conflict' },
    { testCases: null },
    { typo_field: 'not silently discarded' },
    { testCases: [{ orderIndex: 0, description: 'Missing expected output' }] },
    {
      lessonSteps: [
        { type: 'true_false', prompt: 'x', orderIndex: 0, correctAnswer: { value: true } },
      ],
    },
    { lessonSteps: [{ type: 'true_false', prompt: 'x', orderIndex: 0, correctAnswer: [['x']] }] },
    { lessonType: 'code_fix', starterCode: ' ', solutionCode: 'x' },
  ])('rejects malformed lesson fields %j', patch => {
    const body = payload()
    expect(
      bulkImportPayloadSchema.safeParse({ ...body, lessons: [{ ...body.lessons[0], ...patch }] })
        .success
    ).toBe(false)
  })
  it('rejects duplicate lesson identities and child ordering', () => {
    const body = payload()
    expect(
      bulkImportPayloadSchema.safeParse({ ...body, lessons: [...body.lessons, ...body.lessons] })
        .success
    ).toBe(false)
    const step = { type: 'note', prompt: 'Read', orderIndex: 0 }
    expect(
      bulkImportPayloadSchema.safeParse({
        ...body,
        lessons: [{ ...body.lessons[0], steps: [step, step] }],
      }).success
    ).toBe(false)
  })
  it.each([null, [], {}, { ...payload(), lessons: [] }])('rejects invalid root %j', value => {
    expect(bulkImportPayloadSchema.safeParse(value).success).toBe(false)
  })
  it('uses the same answer boundary as the step editor', () => {
    const body = payload()
    for (const key of [false, 0, null, 'false', ['x', 0, false], { x: 1 }, [['x']]]) {
      const step = { type: 'true_false', prompt: 'Check', order_index: 0, correct_answer: key }
      const direct = contentSchemas.lessonStep.safeParse({
        params: { lessonId: body.chapterId },
        body: step,
      })
      const imported = bulkImportPayloadSchema.safeParse({
        ...body,
        lessons: [{ ...body.lessons[0], steps: [step] }],
      })
      expect(imported.success).toBe(direct.success)
    }
  })
})
