import type { Request, Response } from 'express'
import { getMyProfile, getPublicProfile } from '../profile.controller'
import { supabaseAdmin } from '../../db/supabase'

jest.mock('../../db/supabase', () => ({ supabaseAdmin: { from: jest.fn() } }))
jest.mock('../../services/progress.service', () => ({ getFreshUserStreak: jest.fn() }))
jest.mock('../../utils/contentModeration', () => ({ validateContent: jest.fn() }))

describe.each([getMyProfile, getPublicProfile])(
  '%p missing profile and database outages',
  controller => {
    it.each([false, true])(
      'distinguishes an absent row from a failed query (error=%s)',
      async failure => {
        jest.mocked(supabaseAdmin.from).mockReturnValue({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: jest
            .fn()
            .mockResolvedValue({
              data: null,
              error: failure ? { message: 'private database details' } : null,
            }),
        } as any)
        const next = jest.fn()
        const res = { json: jest.fn() } as unknown as Response
        await controller(
          { params: { id: 'learner' }, user: { id: 'learner' } } as unknown as Request,
          res,
          next
        )
        expect(next).toHaveBeenCalledWith(
          expect.objectContaining({
            statusCode: failure ? 500 : 404,
            code: failure ? 'DATABASE_ERROR' : 'NOT_FOUND',
          })
        )
        expect(next.mock.calls[0][0].message).not.toContain('private')
        expect(res.json).not.toHaveBeenCalled()
      }
    )
  }
)
