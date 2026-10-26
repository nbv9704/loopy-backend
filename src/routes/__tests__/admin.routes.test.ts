import express from 'express'
import request from 'supertest'
import adminRoutes from '../admin.routes'
import { errorHandler } from '../../middleware/errorHandler'
import { supabaseAdmin } from '../../db/supabase'
import { AuditLogService } from '../../services/audit-log.service'

jest.mock('../../middleware/authenticateSession', () => ({
  authenticateSession: (req: any, _res: any, next: any) => {
    req.user = { id: 'admin-1', email: 'admin@example.com' }
    next()
  },
}))

jest.mock('../../middleware/requireAdmin', () => ({
  requireAdmin: (_req: any, _res: any, next: any) => next(),
}))

jest.mock('../../db/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn(),
  },
}))

jest.mock('../../services/audit-log.service', () => ({
  AuditLogService: {
    logAction: jest.fn(),
  },
}))

jest.mock('../../utils/contentModeration', () => ({
  validateContent: jest.fn(),
}))

const createApp = () => {
  const app = express()
  app.use(express.json())
  app.use('/admin', adminRoutes)
  app.use(errorHandler)
  return app
}

describe('admin lesson routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it.each([null, { code: 'PGRST116' }])(
    'returns 404 for a missing lesson, with DB result %s',
    async error => {
      jest.mocked(supabaseAdmin.from).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error }),
      } as never)
      const response = await request(createApp()).get(
        '/admin/lessons/123e4567-e89b-12d3-a456-426614174000'
      )
      expect(response.status).toBe(404)
      expect(response.body.error.code).toBe('NOT_FOUND')
    }
  )

  it('archives lessons instead of hard-deleting them', async () => {
    const lessonId = '123e4567-e89b-12d3-a456-426614174000'
    const fromMock = supabaseAdmin.from as jest.Mock
    const deleteMock = jest.fn()
    const updateMock = jest.fn().mockReturnThis()
    const archiveChain = {
      update: updateMock,
      delete: deleteMock,
      eq: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({
        data: { id: lessonId, title: 'Variables', status: 'archived' },
        error: null,
      }),
    }
    fromMock.mockReturnValueOnce(archiveChain)

    const response = await request(createApp()).delete(`/admin/lessons/${lessonId}`)

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ success: true, data: { id: lessonId, archived: true } })
    expect(updateMock).toHaveBeenCalledWith({ status: 'archived' })
    expect(deleteMock).not.toHaveBeenCalled()
    expect(AuditLogService.logAction).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'archive',
        resourceType: 'lesson',
        resourceId: lessonId,
        changes: { status: 'archived' },
      })
    )
  })
})

for (const [suffix, body] of [
  ['status', { status: 'published' }],
  ['visibility', { visibility: 'official' }],
] as const) {
  it(`rejects an admin ${suffix} write without the displayed state before any I/O`, async () => {
    jest.clearAllMocks()
    const response = await request(createApp())
      .put(`/admin/practice/sets/123e4567-e89b-12d3-a456-426614174000/${suffix}`)
      .send(body)
    expect(response.status).toBe(400)
    expect(supabaseAdmin.from).not.toHaveBeenCalled()
  })
}
it('rejects an admin archive without expectedStatus before any I/O', async () => {
  jest.clearAllMocks()
  const response = await request(createApp()).delete(
    '/admin/practice/sets/123e4567-e89b-12d3-a456-426614174000'
  )
  expect(response.status).toBe(400)
  expect(supabaseAdmin.from).not.toHaveBeenCalled()
})
