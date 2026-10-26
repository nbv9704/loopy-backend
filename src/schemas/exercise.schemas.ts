import { z } from 'zod'
import { config } from '../config'

export const exerciseSchemas = {
  params: z.object({
    params: z.object({
      id: z.guid('Exercise ID không hợp lệ'),
    }),
  }),

  submit: z.object({
    params: z.object({
      id: z.guid('Exercise ID không hợp lệ'),
    }),
    body: z.object({
      code: z
        .string()
        .min(1, 'Code không được để trống')
        .max(
          config.codeExecution.maxLength,
          `Code không được vượt quá ${config.codeExecution.maxLength} ký tự`
        ),
    }),
  }),
}
