import { Request, Response, NextFunction } from 'express'
import * as cms from '../services/cms/public-read'
import { errors } from '../middleware/errorHandler'

export const getPublicContent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, language, limit = 50, offset = 0 } = req.query
    const data = await cms.getPublicContentItems(
      category as string | undefined,
      language as 'vi' | 'en' | undefined,
      Number(limit),
      Number(offset)
    )
    res.json({ success: true, data: { ...data, limit: Number(limit), offset: Number(offset) } })
  } catch (error) {
    next(error)
  }
}
export const getPublicContentBatch = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json({
      success: true,
      data: await cms.getPublicContentItemsByKeys(req.body.keys, req.body.language ?? 'vi'),
    })
  } catch (error) {
    next(error)
  }
}
export const getPublicContentByKey = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const item = await cms.getPublicContentByKey(
      req.params.key,
      (req.query.language ?? 'vi') as 'vi' | 'en'
    )
    if (!item) throw errors.notFound('Content item')
    res.json({ success: true, data: item })
  } catch (error) {
    next(error)
  }
}
