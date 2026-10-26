import express from 'express'
import request from 'supertest'
import { getSubmissions } from '../admin/submissions.controller'
import { adminSchemas } from '../../schemas/admin.schemas'
import { validate } from '../../middleware/validate'
import { errorHandler } from '../../middleware/errorHandler'
import {
  readAdminSubmissions,
  readAdminSubmissionsPage,
} from '../../services/admin-submissions.service'

jest.mock('../../services/admin-submissions.service', () => ({
  readAdminSubmissions: jest.fn(),
  readAdminSubmissionsPage: jest.fn(),
}))
jest.mock('../../utils/logger', () => ({ logger: { error: jest.fn() } }))
const app = express()
app.get('/submissions', validate(adminSchemas.submissionsQuery), getSubmissions)
app.use(errorHandler)
beforeEach(() => jest.resetAllMocks())

it('returns a filtered page when an explicit offset is supplied', async () => {
  const page = { items: [], total: 0, limit: 20, offset: 80 }
  jest.mocked(readAdminSubmissionsPage).mockResolvedValue(page)
  const response = await request(app).get('/submissions?status=fail&limit=20&offset=80')
  expect(response.status).toBe(200)
  expect(response.body).toEqual({ success: true, data: page })
  expect(readAdminSubmissionsPage).toHaveBeenCalledWith('fail', 20, 80)
  expect(readAdminSubmissions).not.toHaveBeenCalled()
})

it('preserves the bounded legacy array contract without offset', async () => {
  jest.mocked(readAdminSubmissions).mockResolvedValue([])
  const response = await request(app).get('/submissions?status=all&limit=75')
  expect(response.body).toEqual({ success: true, data: [] })
  expect(readAdminSubmissions).toHaveBeenCalledWith('all', 75)
  expect(readAdminSubmissionsPage).not.toHaveBeenCalled()
})

it.each(['-1', '1.5', 'bad'])('rejects invalid offset %s before querying', async offset => {
  const response = await request(app).get(`/submissions?offset=${offset}`)
  expect(response.status).toBe(400)
  expect(readAdminSubmissions).not.toHaveBeenCalled()
  expect(readAdminSubmissionsPage).not.toHaveBeenCalled()
})
