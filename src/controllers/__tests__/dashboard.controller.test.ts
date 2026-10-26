import { Request, Response } from 'express'
import { getDashboardStats } from '../admin/dashboard.controller'
import { supabase, supabaseAdmin } from '../../db/supabase'

jest.mock('../../db/supabase', () => ({
  supabase: { from: jest.fn() },
  supabaseAdmin: { from: jest.fn() },
}))
jest.mock('../../utils/logger', () => ({ logger: { error: jest.fn() } }))

it('admin statistics use only the service client and forward read failures to the error handler', async () => {
  const q = {
    select: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    range: jest.fn().mockResolvedValue({ data: [], count: 0, error: null }),
    then: (resolve: (value: unknown) => unknown) =>
      Promise.resolve({ count: 3, error: null }).then(resolve),
  }
  jest.mocked(supabaseAdmin.from).mockReturnValue(q as never)
  jest.mocked(supabase.from).mockImplementation(() => {
    throw new Error('Anon cannot read private tables')
  })
  const res = { json: jest.fn() } as unknown as Response
  const next = jest.fn()
  await getDashboardStats({} as Request, res, next)
  expect(supabase.from).not.toHaveBeenCalled()
  expect(res.json).toHaveBeenCalledWith(
    expect.objectContaining({
      success: true,
      data: expect.objectContaining({ totalUsers: 3, totalLessons: 0, totalSubmissions: 0 }),
    })
  )
  q.range.mockResolvedValue({ data: [], count: 0, error: { message: 'private' } } as never)
  res.json = jest.fn()
  await getDashboardStats({} as Request, res, next)
  expect(res.json).not.toHaveBeenCalled()
  expect(next).toHaveBeenCalledWith(
    expect.objectContaining({ code: 'DATABASE_ERROR', details: undefined })
  )
})
