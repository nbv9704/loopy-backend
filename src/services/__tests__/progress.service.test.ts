jest.mock('../../db/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn(),
  },
}))

import {
  calculateUserStreak,
  getStudyDateKey,
  normalizeUserStreak,
  getFreshUserStreak,
  handleGamification,
} from '../progress.service'
import { supabaseAdmin } from '../../db/supabase'

describe('ProgressService streak logic', () => {
  it('keeps cached streaks intact when study history cannot be read after a committed completion', async () => {
    const query = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(),
      gt: jest.fn().mockResolvedValue({ data: null, error: { message: 'DB unavailable' } }) }
    const upsert = jest.fn()
    const from = supabaseAdmin.from as jest.Mock
    from.mockClear()
    from.mockImplementation(table => table === 'user_daily_activity' ? query : { upsert })
    const log = jest.spyOn(console, 'error').mockImplementation(() => {})
    try {
      await expect(handleGamification('user', 'lesson', true, true)).resolves.toMatchObject({ pointsEarned: 100 })
      expect(upsert).not.toHaveBeenCalled()
      expect(from).toHaveBeenCalledTimes(1)
    } finally { log.mockRestore() }
  })
  it('does not write a stale cached streak from a GET over a concurrent completion', async () => {
    const chain = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: { current_streak: 5, longest_streak: 8, last_activity_date: '2000-01-01' }, error: null }) }
    const update = jest.fn().mockReturnValue({ eq: jest.fn() })
    ;(supabaseAdmin.from as jest.Mock).mockReturnValue({ ...chain, update })
    expect(await getFreshUserStreak('user')).toMatchObject({ current_streak: 0, longest_streak: 8 })
    expect(update).not.toHaveBeenCalled()
  })

  it('does not present an unavailable streak query as a real zero', async () => {
    const chain = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: { message: 'DB unavailable' } }) }
    ;(supabaseAdmin.from as jest.Mock).mockReturnValue(chain)
    await expect(getFreshUserStreak('user')).rejects.toMatchObject({ code: 'DATABASE_ERROR' })
  })

  it('uses the Vietnam day for timestamp completions and ignores future activity', () => {
    expect(calculateUserStreak([{ completed_at: '2026-10-21T18:00:00Z' }], '2026-10-23')).toEqual({ current: 1, longest: 1 })
    expect(calculateUserStreak([{ completed_at: '2026-10-25' }], '2026-10-22')).toEqual({ current: 0, longest: 0 })
  })
  describe('getStudyDateKey', () => {
    it('uses Vietnam study timezone instead of UTC date', () => {
      const date = new Date('2026-07-13T18:00:00.000Z')

      expect(getStudyDateKey(date)).toBe('2026-07-14')
    })
  })

  describe('calculateUserStreak', () => {
    it('counts consecutive daily activity dates once per day', () => {
      const result = calculateUserStreak(
        [
          { completed_at: '2026-07-13' },
          { completed_at: '2026-07-13' },
          { completed_at: '2026-07-12' },
          { completed_at: '2026-07-11' },
        ],
        '2026-07-13'
      )

      expect(result).toEqual({ current: 3, longest: 3 })
    })

    it('keeps current streak active when last activity was yesterday', () => {
      const result = calculateUserStreak(
        [
          { completed_at: '2026-07-12' },
          { completed_at: '2026-07-11' },
        ],
        '2026-07-13'
      )

      expect(result).toEqual({ current: 2, longest: 2 })
    })

    it('breaks current streak when last activity is older than yesterday', () => {
      const result = calculateUserStreak(
        [
          { completed_at: '2026-07-10' },
          { completed_at: '2026-07-09' },
          { completed_at: '2026-07-08' },
        ],
        '2026-07-13'
      )

      expect(result).toEqual({ current: 0, longest: 3 })
    })
  })

  describe('normalizeUserStreak', () => {
    it('returns zero current streak when cached streak is stale', () => {
      const result = normalizeUserStreak(
        {
          current_streak: 5,
          longest_streak: 8,
          last_activity_date: '2026-07-10',
        },
        '2026-07-13'
      )

      expect(result).toEqual({
        current_streak: 0,
        longest_streak: 8,
        last_activity_date: '2026-07-10',
      })
    })

    it('keeps current streak when cached streak is still active', () => {
      const result = normalizeUserStreak(
        {
          current_streak: 5,
          longest_streak: 8,
          last_activity_date: '2026-07-12',
        },
        '2026-07-13'
      )

      expect(result).toEqual({
        current_streak: 5,
        longest_streak: 8,
        last_activity_date: '2026-07-12',
      })
    })
  })
})
