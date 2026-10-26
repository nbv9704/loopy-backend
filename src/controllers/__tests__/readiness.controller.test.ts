import { Request, Response } from 'express'
import { readinessCheck } from '../health.controller'
import { supabaseAdmin } from '../../db/supabase'
import { isSessionStoreReady } from '../../middleware/session'

jest.mock('../../db/supabase', () => ({ supabaseAdmin: { from: jest.fn(), rpc: jest.fn() } }))
jest.mock('../../middleware/session', () => ({ isSessionStoreReady: jest.fn() }))

describe('read-only readiness', () => {
  let req: Request
  let res: Response
  beforeEach(() => {
    jest.resetAllMocks()
    req = { app: { locals: {} } } as unknown as Request
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as unknown as Response
    ;(isSessionStoreReady as jest.Mock).mockReturnValue(true)
    ;(supabaseAdmin.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      abortSignal: jest.fn().mockResolvedValue({ data: [], error: null }),
    })
    ;(supabaseAdmin.rpc as jest.Mock).mockReturnValue({
      abortSignal: jest.fn().mockResolvedValue({
        data: {
          progress: true,
          import: true,
          practice: true,
          pvp: true,
          pvpSubmissions: true,
          pvpLifecycle: true,
          pvpMatchmaking: true,
          lessonChecks: true,
          cms: true,
          dataBoundaries: true,
        },
        error: null,
      }),
    })
  })
  it('requires CMS transaction/revision capability before reporting ready', async () => {
    jest.mocked(supabaseAdmin.rpc).mockReturnValue({
      abortSignal: jest.fn().mockResolvedValue({
        data: {
          progress: true,
          import: true,
          practice: true,
          pvp: true,
          pvpSubmissions: true,
          pvpLifecycle: true,
          pvpMatchmaking: true,
          lessonChecks: true,
          dataBoundaries: true,
          cms: false,
        },
        error: null,
      }),
    } as never)
    await readinessCheck(req, res)
    expect(res.status).toHaveBeenCalledWith(503)
  })
  it('only reads metadata and reports ready when all dependencies pass', async () => {
    await readinessCheck(req, res)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(supabaseAdmin.rpc).toHaveBeenCalledWith('loopy_schema_status')
    expect(supabaseAdmin.from).toHaveBeenCalledWith('languages')
  })
  it('reports missing schema without executing a write RPC or leaking errors', async () => {
    jest.mocked(supabaseAdmin.rpc).mockReturnValue({
      abortSignal: jest.fn().mockResolvedValue({
        error: { message: 'private connection detail' },
        data: null,
      }),
    } as any)
    await readinessCheck(req, res)
    expect(res.status).toHaveBeenCalledWith(503)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ checks: expect.objectContaining({ schema: false }) }),
      })
    )
    expect(JSON.stringify((res.json as jest.Mock).mock.calls)).not.toContain('private')
  })
  it('does not report ready while Redis sessions are unavailable', async () => {
    jest.mocked(isSessionStoreReady).mockReturnValue(false)
    await readinessCheck(req, res)
    expect(res.status).toHaveBeenCalledWith(503)
  })
  it('rejects readiness immediately during shutdown', async () => {
    req.app.locals.shuttingDown = true
    await readinessCheck(req, res)
    expect(res.status).toHaveBeenCalledWith(503)
    expect(supabaseAdmin.from).not.toHaveBeenCalled()
  })
  it('rejects a schema that lacks checked completion even if previous capabilities pass', async () => {
    jest.mocked(supabaseAdmin.rpc).mockReturnValue({
      abortSignal: jest.fn().mockResolvedValue({
        data: {
          progress: true,
          import: true,
          practice: true,
          pvp: true,
          pvpSubmissions: true,
          pvpLifecycle: true,
          pvpMatchmaking: true,
          dataBoundaries: true,
        },
        error: null,
      }),
    } as any)
    await readinessCheck(req, res)
    expect(res.status).toHaveBeenCalledWith(503)
  })
  it('reports unavailable when the PvP score RPC or its grants are not ready', async () => {
    jest.mocked(supabaseAdmin.rpc).mockReturnValue({
      abortSignal: jest.fn().mockResolvedValue({
        data: { progress: true, import: true, practice: true, dataBoundaries: true, pvp: false },
        error: null,
      }),
    } as any)
    await readinessCheck(req, res)
    expect(res.status).toHaveBeenCalledWith(503)
  })
  it('rejects an older schema status that lacks atomic PvP submission support', async () => {
    jest.mocked(supabaseAdmin.rpc).mockReturnValue({
      abortSignal: jest.fn().mockResolvedValue({
        data: { progress: true, import: true, practice: true, pvp: true, dataBoundaries: true },
        error: null,
      }),
    } as any)
    await readinessCheck(req, res)
    expect(res.status).toHaveBeenCalledWith(503)
  })
  it('rejects a schema that has submissions but lacks lifecycle transitions', async () => {
    jest.mocked(supabaseAdmin.rpc).mockReturnValue({
      abortSignal: jest.fn().mockResolvedValue({
        data: {
          progress: true,
          import: true,
          practice: true,
          pvp: true,
          pvpSubmissions: true,
          dataBoundaries: true,
        },
        error: null,
      }),
    } as any)
    await readinessCheck(req, res)
    expect(res.status).toHaveBeenCalledWith(503)
  })
})
