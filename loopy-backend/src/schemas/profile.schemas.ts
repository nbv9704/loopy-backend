import { z } from 'zod'

export const profileSchemas = {
  update: z.object({
    body: z.object({
      displayName: z.string().min(2, 'Tên hiển thị phải có ít nhất 2 ký tự').optional(),
      avatarUrl: z.string().url('URL avatar không hợp lệ').optional(),
      bio: z.string().max(500, 'Bio không được vượt quá 500 ký tự').optional(),
      preferredLanguage: z.enum(['javascript', 'python', 'cpp']).optional(),
      learningGoal: z.string().optional(),
      onboardingCompleted: z.boolean().optional(),
      experienceLevel: z.string().optional(),
      currentPathId: z.string().uuid('ID lộ trình không hợp lệ').optional().nullable(),
    }),
  }),
}
