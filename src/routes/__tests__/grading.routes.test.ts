import express from 'express'
import request from 'supertest'
import router from '../grading.routes'
import { errorHandler } from '../../middleware/errorHandler'
import { supabaseAdmin } from '../../db/supabase'
import { generateLessonHint } from '../../services/grading/hint'
import { gradingOrchestratorService } from '../../services/grading-orchestrator.service'

jest.mock('../../middleware/auth', () => ({
  authenticate: (req: any, _res: any, next: any) => {
    req.user = { id: 'owner' }
    next()
  },
}))
jest.mock('../../middleware/authenticateSession', () => ({
  authenticateSession: (req: any, _res: any, next: any) => {
    req.user = { id: 'admin' }
    next()
  },
}))
jest.mock('../../middleware/requireAdmin', () => ({
  requireAdmin: (_req: any, _res: any, next: any) => next(),
}))
jest.mock('../../middleware/rateLimiter', () => ({
  submissionRateLimiter: (_req: any, _res: any, next: any) => next(),
}))
jest.mock('../../utils/logger', () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn() },
}))
jest.mock('../../db/supabase', () => ({ supabaseAdmin: { from: jest.fn() } }))
jest.mock('../../services/grading/hint', () => ({ generateLessonHint: jest.fn() }))
jest.mock('../../services/grading-orchestrator.service', () => ({
  gradingOrchestratorService: { gradeSubmission: jest.fn(), overrideScore: jest.fn() },
}))
jest.mock('../../services/audit-log.service', () => ({ AuditLogService: { logAction: jest.fn() } }))
const id = '123e4567-e89b-12d3-a456-426614174000'
function app() {
  const server = express()
  server.use(express.json())
  server.use('/api/grading', router)
  server.use(errorHandler)
  return server
}
beforeEach(() => jest.resetAllMocks())

it.each([
  { finalScore: '100', note: 'Review' },
  { finalScore: true, note: 'Review' },
  { finalScore: 101, note: 'Review' },
  { finalScore: 0, note: '  ' },
  { note: 'No score' },
  { finalScore: 1, note: 'Review', is_correct: true },
])('rejects malformed overrides before grading or database I/O (%j)', async body => {
  const result = await request(app())
    .put(`/api/grading/admin/submissions/${id}/override`)
    .send(body)
  expect(result.status).toBe(400)
  expect(gradingOrchestratorService.overrideScore).not.toHaveBeenCalled()
  expect(supabaseAdmin.from).not.toHaveBeenCalled()
})
it('preserves a valid explicit zero override and normalizes the note', async () => {
  jest
    .mocked(gradingOrchestratorService.overrideScore)
    .mockResolvedValue({ submissionId: id } as never)
  const result = await request(app())
    .put(`/api/grading/admin/submissions/${id}/override`)
    .send({ finalScore: 0, note: ' Review ' })
  expect(result.status).toBe(200)
  expect(gradingOrchestratorService.overrideScore).toHaveBeenCalledWith(
    id,
    { finalScore: 0, note: 'Review' },
    'admin'
  )
})
it.each([
  { input: [], description: 'Test' },
  { expectedOutput: 0, description: 'Test' },
  { input: [], expectedOutput: false, description: 'Test', isHidden: 'false' },
  { input: [], expectedOutput: false, description: 'Test', timeout: 1000000 },
])('validates legacy test-case writes before business I/O (%j)', async body => {
  const result = await request(app())
    .post(`/api/grading/admin/exercises/${id}/test-cases`)
    .send(body)
  expect(result.status).toBe(400)
  expect(supabaseAdmin.from).not.toHaveBeenCalled()
})
it('accepts null input, false expected output and zero ordering without coercion', async () => {
  const row = { id: 'case', lesson_id: id, input: null, expected_output: false, order_index: 0 }
  const q = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    maybeSingle: jest
      .fn()
      .mockResolvedValueOnce({ data: { id }, error: null })
      .mockResolvedValueOnce({ data: row, error: null }),
  }
  jest.mocked(supabaseAdmin.from).mockReturnValue(q as never)
  const result = await request(app())
    .post(`/api/grading/admin/exercises/${id}/test-cases`)
    .send({ input: null, expectedOutput: false, description: 'Test', orderIndex: 0 })
  expect(result.status).toBe(201)
  expect(q.insert).toHaveBeenCalledWith(
    expect.objectContaining({ input: null, expected_output: false, order_index: 0, lesson_id: id })
  )
  expect(result.body.data).toMatchObject({ input: null, expectedOutput: false, orderIndex: 0 })
})
it('forwards only runtime evidence to the hint service, ignoring client lesson context', async () => {
  jest.mocked(generateLessonHint).mockResolvedValue({ hint: 'Think?' })
  const result = await request(app())
    .post(`/api/grading/exercises/${id}/hint`)
    .send({
      code: 'student()',
      language: 'javascript',
      lessonTitle: 'Forged',
      starterCode: 'Forged',
      outputLogs: ['log'],
    })
  expect(result.status).toBe(200)
  expect(generateLessonHint).toHaveBeenCalledWith(id, {
    code: 'student()',
    language: 'javascript',
    outputLogs: ['log'],
  })
})
