import { Request, Response, NextFunction } from 'express'
import { ZodSchema } from 'zod'
import { errors } from './errorHandler'

export const validate = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      })
      next()
    } catch (error: any) {
      next(errors.validationError(error.errors))
    }
  }
}
