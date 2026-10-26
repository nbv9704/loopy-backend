import { Request, Response } from 'express'
import { getLessonById } from '../lesson.controller'
import { supabaseAdmin } from '../../db/supabase'

jest.mock('../../db/supabase', () => ({ supabaseAdmin: { from: jest.fn() } }))

function fixture(options: { lessonError?: unknown; stepsError?: unknown; missing?: boolean } = {}) {
  const lesson = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({
      data: options.missing ? null : { id: 'lesson' },
      error: options.lessonError || null,
    }),
  }
  const steps = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    range: jest.fn().mockResolvedValue({ data: [], count: 0, error: options.stepsError || null }),
  }
  ;(supabaseAdmin.from as jest.Mock).mockImplementation(table =>
    table === 'lessons' ? lesson : steps
  )
  const res = { json: jest.fn() } as unknown as Response
  const next = jest.fn()
  return {
    lesson,
    steps,
    res,
    next,
    run: () => getLessonById({ params: { id: 'lesson' } } as unknown as Request, res, next),
  }
}
beforeEach(() => jest.resetAllMocks())

it('does not preload checkpoint explanation or the answer key in public lesson content', async () => {
  const state = fixture()
  await state.run()
  expect(state.steps.select).toHaveBeenCalled()
  expect(state.steps.select.mock.calls[0][0]).not.toMatch(/\b(explanation|correct_answer)\b/)
  expect(state.lesson.eq).toHaveBeenCalledWith('status', 'published')
})

it.each(['lessonError', 'stepsError'] as const)(
  'reports a %s read failure as database unavailable',
  async field => {
    const state = fixture({ [field]: { code: '08006' } })
    await state.run()
    expect(state.next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 500, code: 'DATABASE_ERROR' })
    )
    expect(state.res.json).not.toHaveBeenCalled()
  }
)

it.each([{ missing: true }, { missing: true, lessonError: { code: 'PGRST116' } }])(
  'keeps a real missing lesson a 404 (%j)',
  async options => {
    const state = fixture(options)
    await state.run()
    expect(state.next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }))
    expect(state.steps.select).not.toHaveBeenCalled()
  }
)
