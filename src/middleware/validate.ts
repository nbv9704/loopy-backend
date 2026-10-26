import { Request, Response, NextFunction } from 'express'
import { ZodError, ZodType } from 'zod'
import { errors } from './errorHandler'

export const validate = (schema: ZodType<{ body?: any; query?: any; params?: any }>) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      })
      if (parsed.body !== undefined) req.body = parsed.body
      if (parsed.query !== undefined) req.query = parsed.query
      if (parsed.params !== undefined) req.params = parsed.params
      next()
    } catch (error) {
      next(error instanceof ZodError ? errors.validationError(error.issues) : error)
    }
  }
}
