import express from 'express'
import request from 'supertest'
import { errorHandler } from '../errorHandler'
import { logger } from '../../utils/logger'

jest.mock('../../utils/logger', () => ({ logger: { error: jest.fn() } }))

function app() {
  const instance = express()
  instance.use(express.json({ limit: '1kb' }))
  instance.post('/payload', (_req, res) => {
    res.json({ success: true })
  })
  instance.use(errorHandler)
  return instance
}

it('returns 400 for malformed JSON without exposing or logging the supplied body', async () => {
  jest.clearAllMocks()
  const response = await request(app())
    .post('/payload')
    .set('Content-Type', 'application/json')
    .send('{"password":"private-body"')
  expect(response.status).toBe(400)
  expect(response.body.error.code).toBe('INVALID_JSON')
  expect(JSON.stringify(response.body)).not.toContain('private-body')
  expect(JSON.stringify((logger.error as jest.Mock).mock.calls)).not.toContain('private-body')
})

it('returns 413 when a payload exceeds the configured parser limit', async () => {
  const response = await request(app())
    .post('/payload')
    .send({ code: 'x'.repeat(2000) })
  expect(response.status).toBe(413)
  expect(response.body.error.code).toBe('PAYLOAD_TOO_LARGE')
})
