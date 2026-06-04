import { z } from 'zod'
import { config } from '../config'

export const executeSchemas = {
  execute: z.object({
    body: z.object({
      language: z.enum(['javascript', 'js', 'python', 'py', 'cpp', 'c++', 'java', 'go', 'golang', 'rust', 'rs']),
      code: z
        .string()
        .min(1, 'Code không được để trống')
        .max(
          config.codeExecution.maxLength,
          `Code không được vượt quá ${config.codeExecution.maxLength} ký tự`
        ),
    }),
  }),

  validate: z.object({
    body: z.object({
      exerciseId: z.string().uuid('Exercise ID không hợp lệ'),
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
