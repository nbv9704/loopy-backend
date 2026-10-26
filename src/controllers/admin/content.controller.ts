import { Response, NextFunction } from 'express'
import { AuthRequest } from '../../middleware/auth'
import { AdminContentService as cms } from '../../services/admin-content.service'
import { errors } from '../../middleware/errorHandler'

const actor = (req: AuthRequest) => {
  if (!req.user?.id) throw errors.authRequired()
  return req.user.id
}
export const getContentItems = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    actor(req)
    const { category, language, search, limit = 50, offset = 0 } = req.query
    const data = await cms.getContentItems(
      category as string | undefined,
      language as 'vi' | 'en' | undefined,
      search as string | undefined,
      Number(limit),
      Number(offset)
    )
    res.json({ success: true, data: { ...data, limit: Number(limit), offset: Number(offset) } })
  } catch (error) {
    next(error)
  }
}
export const getCategories = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    actor(req)
    res.json({ success: true, data: await cms.getCategories() })
  } catch (error) {
    next(error)
  }
}
export const getContentItem = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    actor(req)
    const data = await cms.getContentItem(req.params.id)
    if (!data) throw errors.notFound('Content item')
    res.json({ success: true, data })
  } catch (error) {
    next(error)
  }
}
export const createContentItem = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await cms.createContentItem(req.body, actor(req))
    res.status(201).json({ success: true, data })
  } catch (error) {
    next(error)
  }
}
export const updateContentItem = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await cms.updateContentItem(req.params.id, req.body, actor(req))
    res.json({ success: true, data })
  } catch (error) {
    next(error)
  }
}
export const deleteContentItem = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await cms.deleteContentItem(req.params.id, actor(req), Number(req.query.revision))
    res.json({ success: true, data })
  } catch (error) {
    next(error)
  }
}
export const exportContent = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    actor(req)
    const data = await cms.exportContent(req.query.language as 'vi' | 'en')
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Content-Disposition', `attachment; filename="content-${data.language}.json"`)
    res.json(data)
  } catch (error) {
    next(error)
  }
}
export const importContent = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    res.json({ success: true, data: await cms.importContent(req.body, actor(req)) })
  } catch (error) {
    next(error)
  }
}
