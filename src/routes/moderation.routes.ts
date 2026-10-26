import { Router } from 'express'
import { authenticateSession } from '../middleware/authenticateSession'
import { requireAdmin } from '../middleware/requireAdmin'
import { validate } from '../middleware/validate'
import { moderationSchemas } from '../schemas/moderation.schemas'
import { moderationService } from '../services/moderation.service'
import { AuthRequest } from '../middleware/auth'

const router = Router()
router.use(authenticateSession, requireAdmin)
router.get('/keywords', async (_req, res, next) => {
  try {
    res.json({ success: true, data: await moderationService.list() })
  } catch (error) {
    next(error)
  }
})
router.post('/keywords', validate(moderationSchemas.createKeyword), async (req, res, next) => {
  try {
    res.status(201).json({
      success: true,
      data: await moderationService.create(req.body, (req as AuthRequest).user!.id),
    })
  } catch (error) {
    next(error)
  }
})
router.put('/keywords/:id', validate(moderationSchemas.updateKeyword), async (req, res, next) => {
  try {
    res.json({ success: true, data: await moderationService.update(req.params.id, req.body) })
  } catch (error) {
    next(error)
  }
})
router.delete(
  '/keywords/:id',
  validate(moderationSchemas.keywordParams),
  async (req, res, next) => {
    try {
      res.json({ success: true, data: await moderationService.remove(req.params.id) })
    } catch (error) {
      next(error)
    }
  }
)
export default router
