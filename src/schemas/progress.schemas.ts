import { z } from 'zod'

export const progressSchemas = {
  update: z.object({
    body: z.object({
      status: z.enum(['not_started', 'in_progress', 'completed']),
      timeSpent: z.number().min(0).optional(),
    }),
  }),
}
