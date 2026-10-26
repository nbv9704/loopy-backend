import express from 'express'
import request from 'supertest'
import adminRoutes from '../admin.routes'
import moderationRoutes from '../moderation.routes'
import { errorHandler } from '../../middleware/errorHandler'
import { supabaseAdmin } from '../../db/supabase'

jest.mock('../../db/supabase', () => ({ supabaseAdmin: { from: jest.fn() } }))
jest.mock('../../utils/logger', () => ({ logger: { info: jest.fn(), error: jest.fn() } }))

function app(sessionUser?: string) {
  const instance = express()
  instance.use((req, _res, next) => {
    req.session = { userId: sessionUser } as never
    next()
  })
  instance.use('/api/admin/moderation', moderationRoutes)
  instance.use('/api/admin', adminRoutes)
  instance.use(errorHandler)
  return instance
}

beforeEach(() => jest.clearAllMocks())
const paths = [
  '/stats/overview',
  '/audit-logs',
  '/submissions',
  '/lessons',
  '/content',
  '/content/11111111-1111-4111-8111-111111111111',
  '/practice/sets',
  '/health/metrics',
  '/moderation/keywords',
]

it.each(paths)('rejects a guest before reading admin data at %s', async path => {
  const response = await request(app()).get(`/api/admin${path}`)
  expect(response.status).toBe(401)
  expect(supabaseAdmin.from).not.toHaveBeenCalled()
})

it.each(paths)('rejects a learner session before reading admin data at %s', async path => {
  const from = supabaseAdmin.from as jest.Mock
  from.mockReturnValue({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: { is_admin: false }, error: null }),
  })
  const response = await request(app('learner')).get(`/api/admin${path}`)
  expect(response.status).toBe(403)
  expect(supabaseAdmin.from).toHaveBeenCalledTimes(1)
  expect(supabaseAdmin.from).toHaveBeenCalledWith('user_profiles')
})

it.each(['post', 'put', 'delete'] as const)(
  'blocks a guest moderation %s before database access',
  async method => {
    const path = method === 'post' ? '/keywords' : '/keywords/11111111-1111-4111-8111-111111111111'
    const response = await request(app())[method](`/api/admin/moderation${path}`)
    expect(response.status).toBe(401)
    expect(supabaseAdmin.from).not.toHaveBeenCalled()
  }
)

it.each(['post', 'put', 'delete'] as const)(
  'blocks a learner moderation %s before mutation',
  async method => {
    jest.mocked(supabaseAdmin.from).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: { is_admin: false }, error: null }),
    } as never)
    const path = method === 'post' ? '/keywords' : '/keywords/11111111-1111-4111-8111-111111111111'
    const response = await request(app('learner'))[method](`/api/admin/moderation${path}`)
    expect(response.status).toBe(403)
    expect(supabaseAdmin.from).toHaveBeenCalledTimes(1)
    expect(supabaseAdmin.from).toHaveBeenCalledWith('user_profiles')
  }
)
