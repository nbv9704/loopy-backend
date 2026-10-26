import { Response } from 'express'
import { bulkImport } from '../bulk-import.controller'
import { AuthRequest } from '../../middleware/auth'
import { supabaseAdmin } from '../../db/supabase'
import { AuditLogService } from '../../services/audit-log.service'
import { ImportHistoryService } from '../../services/import-history.service'

jest.mock('../../db/supabase', () => ({ supabaseAdmin: { from: jest.fn(), rpc: jest.fn() } }))
jest.mock('../../utils/logger', () => ({ logger: { info: jest.fn(), error: jest.fn() } }))
jest.mock('../../services/audit-log.service', () => ({ AuditLogService: { logAction: jest.fn() } }))
jest.mock('../../services/import-history.service', () => ({
  ImportHistoryService: { logImport: jest.fn() },
}))

describe('bulk import requires a confirmed atomic result', () => {
  it('reports an uncertain write if the RPC promise rejects and never retries it', async () => {
    jest.mocked(supabaseAdmin.rpc).mockRejectedValueOnce(new Error('Transport interrupted'))
    await bulkImport(req, res, next)
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'IMPORT_UNCONFIRMED', statusCode: 502 })
    )
    expect(supabaseAdmin.rpc).toHaveBeenCalledTimes(1)
    expect(res.json).not.toHaveBeenCalled()
  })
  let req: AuthRequest
  let res: Response
  let next: jest.Mock
  beforeEach(() => {
    jest.resetAllMocks()
    req = {
      user: { id: 'admin' },
      body: {
        chapterId: '11111111-1111-4111-8111-111111111111',
        lessons: [
          {
            lessonId: 'concept',
            title: 'Concept',
            lessonType: 'concept',
            orderIndex: 0,
            lessonSteps: [{ type: 'note', prompt: 'Read this', orderIndex: 0 }],
          },
        ],
      },
      get: jest.fn(),
    } as unknown as AuthRequest
    res = { json: jest.fn() } as unknown as Response
    next = jest.fn()
    jest.mocked(supabaseAdmin.from).mockImplementation((table: string) => {
      if (table !== 'chapters') throw new Error('Non-atomic direct write attempted')
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: { id: '11111111-1111-4111-8111-111111111111', title: 'Chapter' },
          error: null,
        }),
      } as any
    })
  })

  it.each([null, []])('fails safely for an empty RPC result %j', async data => {
    jest.mocked(supabaseAdmin.rpc).mockResolvedValue({ data, error: null } as never)
    await bulkImport(req, res, next)
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ code: 'IMPORT_UNCONFIRMED' }))
    expect(supabaseAdmin.from).toHaveBeenCalledTimes(1)
    expect(res.json).not.toHaveBeenCalled()
    expect(AuditLogService.logAction).not.toHaveBeenCalled()
    expect(ImportHistoryService.logImport).not.toHaveBeenCalled()
  })

  it.each(['PGRST202', '42883'])(
    'reports schema not ready for %s without a write fallback',
    async code => {
      jest.mocked(supabaseAdmin.rpc).mockResolvedValue({
        data: null,
        error: { code, message: 'private database detail' },
      } as never)
      await bulkImport(req, res, next)
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 503, code: 'SCHEMA_NOT_READY' })
      )
      expect(supabaseAdmin.from).toHaveBeenCalledTimes(1)
      expect(res.json).not.toHaveBeenCalled()
    }
  )

  it('returns and audits counters from one atomic RPC, preserving camelCase import fields', async () => {
    jest.mocked(supabaseAdmin.rpc).mockResolvedValue({
      data: [
        {
          lessons_created: 1,
          steps_created: 1,
          test_cases_created: 0,
          test_cases_replaced: 0,
          steps_replaced: 0,
        },
      ],
      error: null,
    } as never)
    await bulkImport(req, res, next)
    expect(next).not.toHaveBeenCalled()
    expect(supabaseAdmin.from).toHaveBeenCalledTimes(1)
    expect(supabaseAdmin.rpc).toHaveBeenCalledWith('bulk_import_lessons_atomically', {
      p_chapter_id: '11111111-1111-4111-8111-111111111111',
      p_lessons: [
        expect.objectContaining({
          lesson_id: 'concept',
          lesson_type: 'concept',
          steps: [expect.objectContaining({ order_index: 0, prompt: 'Read this' })],
        }),
      ],
    })
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: expect.objectContaining({ lessonsCreated: 1, stepsCreated: 1, errors: [] }),
    })
    expect(AuditLogService.logAction).toHaveBeenCalledTimes(1)
  })

  it('rejects invalid step payloads before calling the RPC', async () => {
    req.body.lessons[0].lessonSteps[0].prompt = ''
    await bulkImport(req, res, next)
    expect(supabaseAdmin.rpc).not.toHaveBeenCalled()
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }))
  })

  it.each([
    { lessons_created: -1 },
    { lessons_created: 1 },
    {
      lessons_created: 2,
      steps_created: 1,
      test_cases_created: 0,
      test_cases_replaced: 0,
      steps_replaced: 0,
    },
    {
      lessons_created: 1,
      steps_created: 0,
      test_cases_created: 0,
      test_cases_replaced: 0,
      steps_replaced: 0,
    },
    {
      lessons_created: 1,
      steps_created: 1,
      test_cases_created: 0,
      test_cases_replaced: -1,
      steps_replaced: 0,
    },
  ])('does not report success or audit a malformed acknowledgement %j', async data => {
    jest.mocked(supabaseAdmin.rpc).mockResolvedValue({ data, error: null } as never)
    await bulkImport(req, res, next)
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ code: 'IMPORT_UNCONFIRMED' }))
    expect(res.json).not.toHaveBeenCalled()
    expect(ImportHistoryService.logImport).not.toHaveBeenCalled()
  })

  it('does not turn a committed import into a failure when optional logging fails', async () => {
    jest.mocked(supabaseAdmin.rpc).mockResolvedValue({
      data: [
        {
          lessons_created: 1,
          steps_created: 1,
          test_cases_created: 0,
          test_cases_replaced: 0,
          steps_replaced: 0,
        },
      ],
      error: null,
    } as never)
    jest.mocked(AuditLogService.logAction).mockRejectedValueOnce(new Error('Audit unavailable'))
    jest
      .mocked(ImportHistoryService.logImport)
      .mockRejectedValueOnce(new Error('History unavailable'))
    await bulkImport(req, res, next)
    expect(next).not.toHaveBeenCalled()
    expect(ImportHistoryService.logImport).toHaveBeenCalledTimes(1)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }))
    expect(supabaseAdmin.rpc).toHaveBeenCalledTimes(1)
  })

  it('separates chapter read failure from a missing chapter and does not write', async () => {
    jest.mocked(supabaseAdmin.from).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest
        .fn()
        .mockResolvedValue({ data: null, error: { message: 'private db detail' } }),
    } as never)
    await bulkImport(req, res, next)
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'DATABASE_ERROR', statusCode: 500 })
    )
    expect(supabaseAdmin.rpc).not.toHaveBeenCalled()
  })
})
