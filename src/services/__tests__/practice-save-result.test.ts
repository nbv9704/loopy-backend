import { supabaseAdmin } from '../../db/supabase'
import { PracticeService } from '../practice.service'
import { practiceSavedId, readSavedPractice } from '../practice/save-result'
jest.mock('../../db/supabase', () => ({ supabaseAdmin: { from: jest.fn(), rpc: jest.fn() } }))
jest.mock('../../utils/contentModeration', () => ({ validateContent: jest.fn() }))
const id = '11111111-1111-4111-8111-111111111111'
const payload = {
  title: 'Quiz',
  questions: [{ type: 'fill_blank' as const, prompt: 'Say hello', correctAnswer: 'hello' }],
}
beforeEach(() => jest.resetAllMocks())
it.each([null, {}, '', 'not-a-uuid', ['wrong']])(
  'refuses an untrusted RPC set ID before read-back %#',
  value => {
    expect(() => practiceSavedId(value)).toThrow()
  }
)
it('rejects a save result for another set', () => {
  expect(() => practiceSavedId(id, '22222222-2222-4222-8222-222222222222')).toThrow()
})
it('marks a read-back failure as committed with a safe recovery reference', async () => {
  await expect(
    readSavedPractice(id, async () => {
      throw new Error('private SQL detail')
    })
  ).rejects.toMatchObject({
    statusCode: 503,
    code: 'PRACTICE_SAVED_READ_FAILED',
    details: { setId: id },
  })
})
it('does not confirm a read for another set after a known commit', async () => {
  await expect(readSavedPractice(id, async () => ({ id: 'foreign' }))).rejects.toMatchObject({
    code: 'PRACTICE_SAVED_READ_FAILED',
  })
})
it('runs one create transaction and exposes read-only recovery when the subsequent read fails', async () => {
  jest.mocked(supabaseAdmin.rpc).mockResolvedValue({ data: id, error: null } as never)
  const service = new PracticeService()
  const read = jest.spyOn(service, 'getSet').mockRejectedValue(new Error('offline'))
  await expect(service.createSet(payload, 'actor')).rejects.toMatchObject({
    code: 'PRACTICE_SAVED_READ_FAILED',
  })
  expect(supabaseAdmin.rpc).toHaveBeenCalledTimes(1)
  expect(read).toHaveBeenCalledWith(id, 'actor')
  expect(supabaseAdmin.from).not.toHaveBeenCalled()
})
it('does not run read-back for an invalid acknowledgement', async () => {
  jest.mocked(supabaseAdmin.rpc).mockResolvedValue({ data: { id }, error: null } as never)
  const service = new PracticeService()
  const read = jest.spyOn(service, 'getSet')
  await expect(service.createSet(payload, 'actor')).rejects.toMatchObject({
    code: 'DATABASE_ERROR',
  })
  expect(read).not.toHaveBeenCalled()
})
it('does not turn role-query failures into a false non-admin result', async () => {
  const query = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: { code: '08006' } }),
  }
  jest.mocked(supabaseAdmin.from).mockReturnValue(query as never)
  await expect(new PracticeService().checkIsAdmin('actor')).rejects.toMatchObject({
    code: 'DATABASE_ERROR',
  })
})

it('preserves the same committed-read boundary for admin updates', async () => {
  jest.mocked(supabaseAdmin.rpc).mockResolvedValue({ data: id, error: null } as never)
  const service = new PracticeService()
  jest.spyOn(service, 'getSetForAdmin').mockRejectedValue(new Error('offline'))
  await expect(service.updateSetForAdmin(id, payload, 'admin')).rejects.toMatchObject({
    code: 'PRACTICE_SAVED_READ_FAILED',
    details: { setId: id },
  })
  expect(supabaseAdmin.rpc).toHaveBeenCalledTimes(1)
})
