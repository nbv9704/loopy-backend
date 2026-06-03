import { z } from 'zod'

const difficulty = z.enum(['easy', 'medium', 'hard'])
const visibility = z.enum(['public', 'private', 'unlisted'])
const questionType = z.enum(['true_false', 'multiple_choice', 'multiple_select', 'fill_blank'])

const requirementSchema = z
  .object({
    type: z.enum(['completed_lessons_count']).optional(),
    languageId: z.string().min(1).optional(),
    count: z.number().int().min(1).max(999).optional(),
  })
  .passthrough()
  .optional()

const questionSchema = z.object({
  type: questionType,
  title: z.string().trim().min(1).max(200).optional(),
  prompt: z.string().trim().min(1).max(5000),
  options: z.array(z.string().trim().min(1)).max(12).optional(),
  correctAnswer: z.string().trim().min(1).optional(),
  starterCode: z.string().max(20000).optional(),
  testCases: z.array(z.record(z.any())).max(30).optional(),
  solutionCode: z.string().max(20000).optional(),
  explanation: z.string().max(5000).optional(),
  points: z.number().int().min(1).max(100).optional(),
  orderIndex: z.number().int().min(0).optional(),
})

export const practiceSchemas = {
  listSets: z.object({
    query: z.object({
      languageId: z.string().optional(),
      difficulty: difficulty.optional(),
      topic: z.string().optional(),
      keyword: z.string().trim().min(1).max(120).optional(),
      includeQuestions: z
        .enum(['true', 'false'])
        .optional()
        .transform((value) => value === 'true'),
      mine: z
        .enum(['true', 'false'])
        .optional()
        .transform((value) => value === 'true'),
      limit: z.coerce.number().int().min(1).max(50).optional(),
      offset: z.coerce.number().int().min(0).optional(),
    }),
  }),

  getSet: z.object({
    params: z.object({
      setId: z.string().uuid(),
    }),
  }),

  searchQuestions: z.object({
    query: z.object({
      keyword: z.string().trim().min(1).max(120),
      limit: z.coerce.number().int().min(1).max(50).optional(),
    }),
  }),

  createSet: z.object({
    body: z.object({
      title: z.string().trim().min(1).max(160),
      description: z.string().trim().max(2000).optional(),
      topic: z.string().trim().max(120).optional(),
      languageId: z.string().trim().min(1).optional(),
      difficulty: difficulty.optional(),
      visibility: visibility.optional(),
      status: z.enum(['draft', 'published']).optional(),
      requirements: requirementSchema,
      questions: z.array(questionSchema).min(1).max(30),
    }),
  }),

  startAttempt: z.object({
    params: z.object({
      setId: z.string().uuid(),
    }),
  }),

  submit: z.object({
    params: z.object({
      attemptId: z.string().uuid(),
      questionId: z.string().uuid(),
    }),
    body: z.object({
      selectedAnswer: z.string().optional(),
      code: z.string().max(20000).optional(),
    }),
  }),
}
