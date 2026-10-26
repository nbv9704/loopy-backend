import type { Response } from 'express'
import { getSubmissionDetail } from '../grading.controller'
import { supabaseAdmin } from '../../db/supabase'

jest.mock('../../db/supabase', () => ({ supabaseAdmin: { from: jest.fn() } }))
jest.mock('../../services/grading-orchestrator.service', () => ({ gradingOrchestratorService: {} }))
jest.mock('../../services/ai-analyzer.service', () => ({ aiAnalyzerService: {} }))

async function read(testResults: unknown) {
  const chain = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    maybeSingle: jest
      .fn()
      .mockResolvedValue({ data: { id: 'submission', test_results: testResults }, error: null }),
  }
  jest
    .mocked(supabaseAdmin.from)
    .mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({
        data: { grading_mode: 'stdout', chapters: { language_id: 'javascript' } },
        error: null,
      }),
    } as never)
    .mockReturnValueOnce(chain as never)
  const req = {
    user: { id: 'owner' },
    params: { exerciseId: 'lesson', submissionId: 'submission' },
  } as unknown as Parameters<typeof getSubmissionDetail>[0]
  const json = jest.fn()
  const next = jest.fn()
  await getSubmissionDetail(req, { json } as unknown as Response, next)
  expect(next).not.toHaveBeenCalled()
  expect(chain.eq).toHaveBeenCalledWith('user_id', 'owner')
  return json.mock.calls[0][0].data.testResults
}

it('does not expose historical checks whose hidden/public provenance was not saved', async () => {
  const result = await read({
    passed: false,
    checks: [{ label: 'private-case-input', message: 'private-diagnostic' }],
  })
  expect(result).toBeNull()
})

it('returns only explicitly public legacy runner cases', async () => {
  const result = await read({
    testScore: 50,
    results: [
      { isHidden: true, actualOutput: 'private-hidden' },
      { actualOutput: 'private-unknown-visibility' },
      { isHidden: false, actualOutput: 'visible' },
    ],
  })
  expect(result.results).toEqual([{ isHidden: false, actualOutput: 'visible' }])
})

it('does not return unrecognized grading JSON as public test feedback', async () => {
  expect(await read({ privatePayload: 'private-data' })).toBeNull()
})
