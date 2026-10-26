import { z } from 'zod'
import { bulkImportPayloadSchema } from './bulk-import.schemas'

const paginationQuery = {
  limit: z.string().transform(Number).pipe(z.number().int().positive().max(100)).optional(),
  offset: z.string().transform(Number).pipe(z.number().int().nonnegative()).optional(),
}

export const adminSchemas = {
  login: z.object({
    body: z.object({
      email: z.string().trim().email().max(254),
      password: z.string().min(1).max(1024),
      remember: z.boolean().optional(),
    }),
  }),
  auditLogsQuery: z.object({
    query: z.object({
      action: z.enum(['create', 'update', 'delete', 'import', 'publish', 'archive']).optional(),
      resourceType: z
        .enum(['lesson', 'chapter', 'test_case', 'import', 'content_item', 'practice_set'])
        .optional(),
      ...paginationQuery,
    }),
  }),

  importHistoryQuery: z.object({
    query: z.object({
      chapterId: z.guid('Chapter ID không hợp lệ').optional(),
      status: z.enum(['success', 'partial', 'failed']).optional(),
      ...paginationQuery,
    }),
  }),

  submissionsQuery: z.object({
    query: z.object({
      ...paginationQuery,
      status: z.enum(['all', 'pass', 'fail']).optional(),
    }),
  }),

  lessonsQuery: z.object({
    query: z.object({
      chapter_id: z.union([z.literal('all'), z.guid('Chapter ID không hợp lệ')]).optional(),
      status: z.enum(['active', 'draft', 'published', 'archived', 'all']).default('active'),
    }),
  }),

  bulkImport: z.object({ body: bulkImportPayloadSchema }),
}
