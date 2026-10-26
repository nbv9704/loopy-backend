import { avatarUrlSchema } from './profile-values'
import { z } from 'zod'

export const profileSchemas = {
  update: z.object({
    body: z
      .object({
        displayName: z
          .string()
          .trim()
          .min(2, 'Tên hiển thị phải có ít nhất 2 ký tự')
          .max(50, 'Tên hiển thị không được vượt quá 50 ký tự')
          .optional(),
        avatarUrl: avatarUrlSchema.optional(),
        bio: z.string().max(500, 'Bio không được vượt quá 500 ký tự').optional(),
        preferredLanguage: z.enum(['javascript', 'python', 'cpp']).optional(),
        learningPath: z.string().optional(),
        learningGoal: z.string().optional(), // backward compatibility for older clients
        onboardingCompleted: z.boolean().optional(),
        experienceLevel: z.string().optional(),
        currentPathId: z.guid('ID lộ trình không hợp lệ').optional().nullable(),
      })
      .strict()
      .refine(value => Object.keys(value).length > 0, 'Chưa có thay đổi hồ sơ để lưu.')
      .refine(
        value =>
          value.learningGoal === undefined ||
          value.learningPath === undefined ||
          value.learningGoal === value.learningPath,
        'learningGoal và learningPath không khớp.'
      ),
  }),
}
