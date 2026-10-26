import { z } from 'zod'

const keywordParams = z.object({
  id: z.guid('Keyword ID không hợp lệ'),
})

const languageSchema = z.enum(['all', 'vi', 'en']).optional()

export const moderationSchemas = {
  createKeyword: z.object({
    body: z
      .object({
        keyword: z.string().trim().min(1, 'Keyword không được để trống').max(120),
        category: z.string().trim().min(1).max(80).optional(),
        language: languageSchema,
      })
      .strict(),
  }),

  updateKeyword: z.object({
    params: keywordParams,
    body: z
      .object({
        keyword: z.string().trim().min(1).max(120).optional(),
        category: z.string().trim().min(1).max(80).optional(),
        language: languageSchema,
        is_active: z.boolean().optional(),
        expectedActive: z.boolean().optional(),
      })
      .strict()
      .refine(
        body => Object.keys(body).some(key => key !== 'expectedActive'),
        'Cần ít nhất một trường để cập nhật'
      ),
  }),

  keywordParams: z.object({
    params: keywordParams,
  }),
}
