import { z } from 'zod'
import { config } from '../config'

const exerciseParams = z.object({
  exerciseId: z.guid('Exercise ID không hợp lệ'),
})

const codeSchema = z
  .string()
  .min(1, 'Code không được để trống')
  .max(
    config.codeExecution.maxLength,
    `Code không được vượt quá ${config.codeExecution.maxLength} ký tự`
  )

const lessonContextSchema = {
  starterCode: z.string().max(config.codeExecution.maxLength).optional(),
  lessonTitle: z.string().max(200).optional(),
  lessonDescription: z.string().max(5000).optional(),
  lessonInsight: z.string().max(5000).optional(),
}

export const gradingSchemas = {
  submit: z.object({
    params: exerciseParams,
    body: z.object({
      code: codeSchema,
      language: z.enum(['javascript', 'python', 'cpp']).optional().default('javascript'),
      gradingMethod: z.enum(['test', 'ai', 'both']).optional().default('both'),
      gradingDepth: z.enum(['quick', 'careful', 'thorough']).optional().default('quick'),
      ...lessonContextSchema,
    }),
  }),

  hint: z.object({
    params: exerciseParams,
    body: z.object({
      code: codeSchema,
      language: z.enum(['javascript', 'python', 'cpp']).optional().default('javascript'),
      outputLogs: z.array(z.string().max(5000)).max(20).optional(),
      ...lessonContextSchema,
    }),
  }),

  history: z.object({
    params: exerciseParams,
    query: z.object({
      page: z.coerce.number().int().min(1).max(1000).optional(),
      limit: z.coerce.number().int().min(1).max(50).optional(),
    }),
  }),

  adminOverride: z.object({
    params: z.object({ submissionId: z.guid() }),
    body: z
      .object({
        testScore: z.number().finite().min(0).max(100).optional(),
        aiScore: z.number().finite().min(0).max(100).optional(),
        finalScore: z.number().finite().min(0).max(100).optional(),
        note: z.string().trim().min(1).max(2000),
      })
      .strict()
      .refine(
        body =>
          body.testScore !== undefined ||
          body.aiScore !== undefined ||
          body.finalScore !== undefined,
        'Cần ít nhất một điểm để điều chỉnh.'
      ),
  }),
  adminTestCases: z.object({ params: exerciseParams }),
  adminCreateTestCase: z.object({
    params: exerciseParams,
    body: z
      .object({
        input: z.unknown().refine(value => value !== undefined, 'Input là bắt buộc.'),
        expectedOutput: z
          .unknown()
          .refine(value => value !== undefined, 'Expected output là bắt buộc.'),
        description: z.string().trim().min(1).max(5000),
        weight: z.number().int().min(1).max(100).default(10),
        timeout: z.number().int().min(1).max(60000).default(1000),
        isHidden: z.boolean().default(false),
        orderIndex: z.number().int().nonnegative().default(0),
      })
      .strict(),
  }),

  detail: z.object({
    params: exerciseParams.extend({
      submissionId: z.guid('Submission ID không hợp lệ'),
    }),
  }),
}
