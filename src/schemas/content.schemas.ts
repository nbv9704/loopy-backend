import { z } from 'zod'

/**
 * Supported language codes for multilingual content
 */
const supportedLanguageSchema = z.enum(['vi', 'en'], {
  errorMap: () => ({ message: 'Ngôn ngữ phải là vi hoặc en' }),
})

export const contentSchemas = {
  // Language parameter validation (for query strings)
  languageQuery: z.object({
    query: z.object({
      lang: supportedLanguageSchema.optional(),
    }),
  }),

  // Documentation Technology schemas (with multilingual support)
  documentationTechnology: z.object({
    body: z.object({
      name: z.string().min(1, 'Tên tiếng Việt không được để trống'),
      name_en: z.string().optional(),
      icon: z.string().min(1, 'Icon không được để trống'),
      language: z.string().min(1, 'Ngôn ngữ không được để trống'),
      category: z.string().min(1, 'Danh mục không được để trống'),
      status: z.enum(['draft', 'published']).optional(),
    }),
  }),

  updateDocumentationTechnology: z.object({
    body: z.object({
      name: z.string().min(1, 'Tên tiếng Việt không được để trống').optional(),
      name_en: z.string().optional(),
      icon: z.string().min(1, 'Icon không được để trống').optional(),
      language: z.string().min(1, 'Ngôn ngữ không được để trống').optional(),
      category: z.string().min(1, 'Danh mục không được để trống').optional(),
      status: z.enum(['draft', 'published']).optional(),
    }),
  }),

  // Documentation Link schemas (with multilingual support)
  documentationLink: z.object({
    body: z.object({
      technologyId: z.string().uuid('ID công nghệ không hợp lệ'),
      title: z.string().min(1, 'Tiêu đề tiếng Việt không được để trống'),
      title_en: z.string().optional(),
      url: z.string().url('URL không hợp lệ'),
      type: z.enum(['docs', 'video', 'article'], {
        errorMap: () => ({ message: 'Loại phải là docs, video hoặc article' }),
      }),
      description: z.string().optional(),
      description_en: z.string().optional(),
    }),
  }),

  updateDocumentationLink: z.object({
    body: z.object({
      title: z.string().min(1, 'Tiêu đề tiếng Việt không được để trống').optional(),
      title_en: z.string().optional(),
      url: z.string().url('URL không hợp lệ').optional(),
      type: z
        .enum(['docs', 'video', 'article'], {
          errorMap: () => ({ message: 'Loại phải là docs, video hoặc article' }),
        })
        .optional(),
      description: z.string().optional(),
      description_en: z.string().optional(),
    }),
  }),

  // Landing Feature schemas (with multilingual support)
  landingFeature: z.object({
    body: z.object({
      icon: z.string().min(1, 'Icon không được để trống'),
      title: z.string().min(1, 'Tiêu đề tiếng Việt không được để trống'),
      title_en: z.string().optional(),
      description: z.string().min(1, 'Mô tả tiếng Việt không được để trống'),
      description_en: z.string().optional(),
      colorGradient: z.string().min(1, 'Gradient màu không được để trống'),
      status: z.enum(['draft', 'published']).optional(),
    }),
  }),

  updateLandingFeature: z.object({
    body: z.object({
      icon: z.string().min(1, 'Icon không được để trống').optional(),
      title: z.string().min(1, 'Tiêu đề tiếng Việt không được để trống').optional(),
      title_en: z.string().optional(),
      description: z.string().min(1, 'Mô tả tiếng Việt không được để trống').optional(),
      description_en: z.string().optional(),
      colorGradient: z.string().min(1, 'Gradient màu không được để trống').optional(),
      status: z.enum(['draft', 'published']).optional(),
    }),
  }),

  // Landing Stat schemas (with multilingual support)
  landingStat: z.object({
    body: z.object({
      icon: z.string().min(1, 'Icon không được để trống'),
      value: z.string().min(1, 'Giá trị không được để trống'),
      label: z.string().min(1, 'Nhãn tiếng Việt không được để trống'),
      label_en: z.string().optional(),
      status: z.enum(['draft', 'published']).optional(),
    }),
  }),

  updateLandingStat: z.object({
    body: z.object({
      icon: z.string().min(1, 'Icon không được để trống').optional(),
      value: z.string().min(1, 'Giá trị không được để trống').optional(),
      label: z.string().min(1, 'Nhãn tiếng Việt không được để trống').optional(),
      label_en: z.string().optional(),
      status: z.enum(['draft', 'published']).optional(),
    }),
  }),

  // Landing Language schemas (with multilingual support)
  landingLanguage: z.object({
    body: z.object({
      name: z.string().min(1, 'Tên tiếng Việt không được để trống'),
      name_en: z.string().optional(),
      lessonCount: z
        .number()
        .int('Số bài học phải là số nguyên')
        .positive('Số bài học phải là số dương'),
      color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Màu phải là mã hex hợp lệ (ví dụ: #FF5733)'),
      description: z.string().min(1, 'Mô tả tiếng Việt không được để trống'),
      description_en: z.string().optional(),
      icon: z.string().min(1, 'Icon không được để trống'),
      status: z.enum(['draft', 'published']).optional(),
    }),
  }),

  updateLandingLanguage: z.object({
    body: z.object({
      name: z.string().min(1, 'Tên tiếng Việt không được để trống').optional(),
      name_en: z.string().optional(),
      lessonCount: z
        .number()
        .int('Số bài học phải là số nguyên')
        .positive('Số bài học phải là số dương')
        .optional(),
      color: z
        .string()
        .regex(/^#[0-9A-Fa-f]{6}$/, 'Màu phải là mã hex hợp lệ (ví dụ: #FF5733)')
        .optional(),
      description: z.string().min(1, 'Mô tả tiếng Việt không được để trống').optional(),
      description_en: z.string().optional(),
      icon: z.string().min(1, 'Icon không được để trống').optional(),
      status: z.enum(['draft', 'published']).optional(),
    }),
  }),

  // Landing How It Works schemas (with multilingual support)
  landingHowItWorks: z.object({
    body: z.object({
      stepNumber: z.string().min(1, 'Số bước không được để trống'),
      title: z.string().min(1, 'Tiêu đề tiếng Việt không được để trống'),
      title_en: z.string().optional(),
      description: z.string().min(1, 'Mô tả tiếng Việt không được để trống'),
      description_en: z.string().optional(),
      icon: z.string().min(1, 'Icon không được để trống'),
      status: z.enum(['draft', 'published']).optional(),
    }),
  }),

  updateLandingHowItWorks: z.object({
    body: z.object({
      stepNumber: z.string().min(1, 'Số bước không được để trống').optional(),
      title: z.string().min(1, 'Tiêu đề tiếng Việt không được để trống').optional(),
      title_en: z.string().optional(),
      description: z.string().min(1, 'Mô tả tiếng Việt không được để trống').optional(),
      description_en: z.string().optional(),
      icon: z.string().min(1, 'Icon không được để trống').optional(),
      status: z.enum(['draft', 'published']).optional(),
    }),
  }),

  // Navigation Item schemas (with multilingual support and hierarchical structure)
  navigationItem: z.object({
    body: z.object({
      location: z.enum(['header', 'footer'], {
        errorMap: () => ({ message: 'Vị trí phải là header hoặc footer' }),
      }),
      path: z
        .string()
        .min(1, 'Đường dẫn không được để trống')
        .startsWith('/', 'Đường dẫn phải bắt đầu bằng /'),
      label: z.string().min(1, 'Nhãn tiếng Việt không được để trống'),
      label_en: z.string().optional(),
      parent_id: z.string().uuid('ID cha không hợp lệ').nullable().optional(),
      icon: z.string().optional(),
      status: z.enum(['draft', 'published']).optional(),
    }),
  }),

  updateNavigationItem: z.object({
    body: z.object({
      location: z
        .enum(['header', 'footer'], {
          errorMap: () => ({ message: 'Vị trí phải là header hoặc footer' }),
        })
        .optional(),
      path: z
        .string()
        .min(1, 'Đường dẫn không được để trống')
        .startsWith('/', 'Đường dẫn phải bắt đầu bằng /')
        .optional(),
      label: z.string().min(1, 'Nhãn tiếng Việt không được để trống').optional(),
      label_en: z.string().optional(),
      parent_id: z.string().uuid('ID cha không hợp lệ').nullable().optional(),
      icon: z.string().optional(),
      status: z.enum(['draft', 'published']).optional(),
    }),
  }),

  // Reorder schema (used for all content types)
  reorder: z.object({
    body: z.object({
      newOrder: z.number().int('Thứ tự phải là số nguyên').nonnegative('Thứ tự không được âm'),
    }),
  }),

  // Status update schema (used for all content types)
  statusUpdate: z.object({
    body: z.object({
      status: z.enum(['draft', 'published'], {
        errorMap: () => ({ message: 'Trạng thái phải là draft hoặc published' }),
      }),
    }),
  }),

  // Query parameter schemas
  navigationQuery: z.object({
    query: z.object({
      location: z
        .enum(['header', 'footer'], {
          errorMap: () => ({ message: 'Vị trí phải là header hoặc footer' }),
        })
        .optional(),
    }),
  }),

  auditLogsQuery: z.object({
    query: z.object({
      userId: z.string().uuid('ID người dùng không hợp lệ').optional(),
      resourceType: z.string().optional(),
      startDate: z.string().datetime('Ngày bắt đầu không hợp lệ').optional(),
      endDate: z.string().datetime('Ngày kết thúc không hợp lệ').optional(),
      limit: z.string().transform(Number).pipe(z.number().int().positive().max(100)).optional(),
      offset: z.string().transform(Number).pipe(z.number().int().nonnegative()).optional(),
    }),
  }),
}
