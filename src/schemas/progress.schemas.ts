import { z } from 'zod'

export const progressSchemas = {
  complete: z.object({
    params: z.object({ lessonId: z.guid('Lesson ID không hợp lệ') }),
    body: z.object({ submissionId: z.guid('Cần kết quả kiểm tra hợp lệ trước khi lưu') }),
  }),
  lessonParams: z.object({
    params: z.object({
      lessonId: z.guid('Lesson ID không hợp lệ'),
    }),
  }),

  update: z.object({
    params: z.object({
      lessonId: z.guid('Lesson ID không hợp lệ'),
    }),
    body: z.object({
      status: z.enum(['not_started', 'in_progress']),
      timeSpent: z.number().min(0).optional(),
    }),
  }),
}
