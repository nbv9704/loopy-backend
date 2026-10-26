import { Request, Response } from 'express'
import { supabaseAdmin } from '../db/supabase'
import { isSessionStoreReady } from '../middleware/session'
import { schemaCapabilities } from '../db/schema-capabilities'

/**
 * Health check controller
 * Extracted from inline endpoint in index.ts
 */
export const healthCheck = (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
  })
}

export const readinessCheck = async (req: Request, res: Response): Promise<void> => {
  if (req.app.locals.shuttingDown) {
    res.status(503).json({ success: false, data: { status: 'shutting_down' } })
    return
  }
  const controller = new AbortController()
  const deadline = setTimeout(() => controller.abort(), 2000)
  try {
    const [database, schema] = await Promise.all([
      supabaseAdmin.from('languages').select('id').limit(1).abortSignal(controller.signal),
      supabaseAdmin.rpc('loopy_schema_status').abortSignal(controller.signal),
    ])
    const checks = {
      database: !database.error,
      schema: !schema.error && schemaCapabilities.every(key => schema.data?.[key] === true),
      adminSessions: isSessionStoreReady(),
    }
    const ready = Object.values(checks).every(Boolean)
    res
      .status(ready ? 200 : 503)
      .json({ success: ready, data: { status: ready ? 'ready' : 'not_ready', checks } })
  } catch {
    res.status(503).json({ success: false, data: { status: 'not_ready' } })
  } finally {
    clearTimeout(deadline)
  }
}
