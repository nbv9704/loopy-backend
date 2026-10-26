import { z } from 'zod'
import { validate } from '../validate'
import type { Request, Response } from 'express'

it('preserves paths and structured Zod4 issues for a 400 response', () => {
  const next = jest.fn()
  validate(z.object({ body: z.object({ title: z.string().min(1) }) }))(
    { body: { title: '' } } as Request,
    {} as Response,
    next
  )
  expect(next).toHaveBeenCalledWith(
    expect.objectContaining({
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      details: [expect.objectContaining({ path: ['body', 'title'] })],
    })
  )
})
it('forwards an unexpected validator fault instead of disguising it as user input', () => {
  const failure = new Error('validator unavailable')
  const next = jest.fn()
  const schema = z.object({
    body: z.string().transform(() => {
      throw failure
    }),
  })
  validate(schema)({ body: 'draft' } as Request, {} as Response, next)
  expect(next).toHaveBeenCalledWith(failure)
})
