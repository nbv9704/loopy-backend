import { Response } from 'express'
import { completeLesson, getUserProgress } from '../progress.controller'
import { AuthRequest } from '../../middleware/auth'
import { supabaseAdmin } from '../../db/supabase'
import { handleGamification } from '../../services/progress.service'

jest.mock('../../db/supabase', () => ({ supabaseAdmin: { from: jest.fn(), rpc: jest.fn() } }))
jest.mock('../../services/progress.service', () => ({
  getStudyDateKey: () => '2026-10-21',
  getFreshUserStreak: jest.fn().mockResolvedValue({ current_streak: 0, longest_streak: 0 }),
  groupProgressByLanguage: jest.fn().mockReturnValue({}),
  handleGamification: jest.fn().mockResolvedValue({ pointsEarned: 100, newBadges: [] }),
}))

const dbFrom = supabaseAdmin.from as jest.Mock
const dbRpc = supabaseAdmin.rpc as jest.Mock

function query(result: Record<string, unknown>) {
  return {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue(result),
    limit: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue(result),
    then: (resolve: (value: typeof result) => unknown) => Promise.resolve(result).then(resolve),
  }
}

describe('progress API business boundaries', () => {
  const req = {
    user: { id: 'user-1' },
    params: { lessonId: 'lesson-1' },
    body: { submissionId: 'check-1' },
  } as unknown as AuthRequest
  let res: Response
  let next: jest.Mock
  beforeEach(() => {
    jest.clearAllMocks()
    dbFrom.mockReset()
    dbRpc.mockReset()
    res = { json: jest.fn() } as unknown as Response
    next = jest.fn()
  })

  const saved = {
    id: 'progress-1',
    status: 'completed',
    completed_at: '2026-10-22T00:00:00Z',
    time_spent: 0,
    was_first_completion: true,
  }

  it('delegates proof ownership/latest/content checks and rewards to a single transaction', async () => {
    dbRpc.mockResolvedValue({ data: [saved], error: null })
    await completeLesson(req, res, next)
    expect(supabaseAdmin.from).not.toHaveBeenCalled()
    expect(supabaseAdmin.rpc).toHaveBeenCalledWith(
      'complete_checked_lesson_atomically',
      expect.objectContaining({
        p_user_id: 'user-1',
        p_lesson_id: 'lesson-1',
        p_submission_id: 'check-1',
      })
    )
    expect(handleGamification).toHaveBeenCalledWith('user-1', 'lesson-1', true, true)
    expect(next).not.toHaveBeenCalled()
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }))
  })

  it('uses the committed boolean for retry reward eligibility', async () => {
    dbRpc.mockResolvedValue({
      data: [{ ...saved, was_first_completion: false }],
      error: null,
    })
    await completeLesson(req, res, next)
    expect(handleGamification).toHaveBeenCalledWith('user-1', 'lesson-1', false, true)
  })

  it.each(['P0502', '08006', 'PGRST202'])(
    'never celebrates or rewards a rejected transaction (%s)',
    async code => {
      dbRpc.mockResolvedValue({ data: null, error: { code } })
      await completeLesson(req, res, next)
      expect(next).toHaveBeenCalledWith(expect.any(Error))
      expect(handleGamification).not.toHaveBeenCalled()
      expect(res.json).not.toHaveBeenCalled()
    }
  )

  it.each([{}, { status: 'in_progress' }, { ...saved, was_first_completion: 'false' }])(
    'does not acknowledge or reward an invalid atomic completion result (%j)',
    async completion => {
      dbRpc.mockResolvedValue({ data: [completion], error: null })
      await completeLesson(req, res, next)
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ code: 'DATABASE_ERROR' }))
      expect(handleGamification).not.toHaveBeenCalled()
      expect(res.json).not.toHaveBeenCalled()
    }
  )

  it.each([false, true])(
    'does not fabricate catalog statistics (count query failed: %s)',
    async failed => {
      const tables = {
        user_progress: query({ data: [], count: 0, error: null }),
        lessons: query({
          count: failed ? null : 0,
          error: failed ? new Error('count failed') : null,
        }),
        user_profiles: query({ data: { points: 0 }, error: null }),
        user_badges: query({ data: [], count: 0, error: null }),
      }
      dbFrom.mockImplementation((table: keyof typeof tables) => tables[table])
      await getUserProgress(req, res, next)
      if (failed) {
        expect(next).toHaveBeenCalledWith(expect.any(Error))
        expect(res.json).not.toHaveBeenCalled()
      } else {
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({ data: expect.objectContaining({ totalLessons: 0 }) })
        )
      }
    }
  )

  it.each(['user_profiles', 'user_badges'])(
    'propagates %s read failures instead of fabricated zero/empty totals',
    async failedTable => {
      const tables = {
        user_progress: query({ data: [], count: 0, error: null }),
        lessons: query({ count: 1, error: null }),
        user_profiles: query({
          data: failedTable === 'user_profiles' ? null : { points: 0 },
          error: failedTable === 'user_profiles' ? new Error('offline') : null,
        }),
        user_badges: query({
          data: [], count: 0,
          error: failedTable === 'user_badges' ? new Error('offline') : null,
        }),
      }
      dbFrom.mockImplementation((table: keyof typeof tables) => tables[table])
      await getUserProgress(req, res, next)
      expect(next).toHaveBeenCalledWith(expect.any(Error))
      expect(res.json).not.toHaveBeenCalled()
    }
  )
})
