import { z } from 'zod'

export const exerciseSchemas = {
  submit: z.object({
    body: z.object({
      code: z.string().min(1, 'Code không được để trống'),
    }),
  }),
}
