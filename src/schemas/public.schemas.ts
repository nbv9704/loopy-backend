import { z } from 'zod'
import { config } from '../config'

const slugSchema = z
  .string()
  .trim()
  .min(1, 'Slug không được để trống')
  .max(120, 'Slug không được vượt quá 120 ký tự')
  .regex(/^[a-z0-9_+-]+$/i, 'Slug không hợp lệ')

const contentKeySchema = z
  .string()
  .trim()
  .min(1, 'Key không được để trống')
  .max(255, 'Key không được vượt quá 255 ký tự')
  .regex(/^[a-z0-9_.:-]+$/i, 'Key không hợp lệ')

const supportedLanguageSchema = z.enum(['vi', 'en'])

const codeLanguageSchema = z.enum([
  'javascript',
  'js',
  'python',
  'py',
  'cpp',
  'c++',
  'java',
  'go',
  'golang',
  'rust',
  'rs',
])

const codeSchema = z
  .string()
  .min(1, 'Code không được để trống')
  .max(
    config.codeExecution.maxLength,
    `Code không được vượt quá ${config.codeExecution.maxLength} ký tự`
  )

export const publicSchemas = {
  uuidIdParam: z.object({
    params: z.object({
      id: z.guid('ID không hợp lệ'),
    }),
  }),

  languageIdParam: z.object({
    params: z.object({
      id: slugSchema,
    }),
  }),

  languageCurriculum: z.object({
    params: z.object({ id: slugSchema }),
    query: z.object({ pathId: z.guid('ID lộ trình không hợp lệ').optional() }),
  }),

  languagePathCurriculum: z.object({
    params: z.object({
      languageId: slugSchema,
      learningPath: slugSchema,
    }),
  }),

  pathGoalParam: z.object({
    params: z.object({
      goalId: slugSchema,
    }),
  }),

  pathQuery: z.object({
    query: z.object({
      languageId: slugSchema.optional(),
      goalId: slugSchema.optional(),
    }),
  }),

  lessonIdParam: z.object({
    params: z.object({
      lessonId: z.guid('ID bài học không hợp lệ'),
    }),
  }),

  lessonCheck: z.object({
    params: z.object({
      lessonId: z.guid('ID bài học không hợp lệ'),
    }),
    body: z.object({
      code: codeSchema,
      language: codeLanguageSchema,
    }),
  }),

  lessonStepCheck: z.object({
    params: z.object({
      lessonId: z.guid('ID bài học không hợp lệ'),
      stepId: z.guid('ID bước học không hợp lệ'),
    }),
    body: z.object({
      answer: z.string().max(5000, 'Câu trả lời không được vượt quá 5000 ký tự').optional(),
    }),
  }),

  lessonHint: z.object({
    params: z.object({
      lessonId: z.guid('ID bài học không hợp lệ'),
    }),
    body: z.object({
      code: codeSchema,
      language: codeLanguageSchema.default('javascript'),
      starterCode: z.string().max(config.codeExecution.maxLength).optional(),
      lessonTitle: z.string().max(200).optional(),
      lessonDescription: z.string().max(5000).optional(),
      lessonInsight: z.string().max(5000).optional(),
      outputLogs: z.array(z.string().max(5000)).max(20).optional(),
    }),
  }),

  contentQuery: z.object({
    query: z.object({
      category: z.string().trim().min(1).max(120).optional(),
      language: supportedLanguageSchema.optional(),
      limit: z.string().transform(Number).pipe(z.number().int().positive().max(100)).optional(),
      offset: z.string().transform(Number).pipe(z.number().int().nonnegative()).optional(),
    }),
  }),

  contentBatch: z.object({
    body: z.object({
      keys: z.array(contentKeySchema).min(1).max(200),
      language: supportedLanguageSchema.default('vi'),
    }),
  }),

  contentKey: z.object({
    params: z.object({
      key: contentKeySchema,
    }),
    query: z.object({
      language: supportedLanguageSchema.default('vi'),
    }),
  }),
}
