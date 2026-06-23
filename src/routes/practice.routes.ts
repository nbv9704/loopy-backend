import { Router } from 'express'
import { authenticate, optionalAuth } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { practiceSchemas } from '../schemas/practice.schemas'
import * as practiceController from '../controllers/practice.controller'

const router = Router()

router.get('/sets', optionalAuth, validate(practiceSchemas.listSets), practiceController.listSets)
router.post('/sets', authenticate, validate(practiceSchemas.createSet), practiceController.createSet)
router.get('/questions/search', authenticate, validate(practiceSchemas.searchQuestions), practiceController.searchQuestions)
router.get('/sets/:setId', optionalAuth, validate(practiceSchemas.getSet), practiceController.getSet)
router.put('/sets/:setId', authenticate, validate(practiceSchemas.updateSet), practiceController.updateSet)
router.delete('/sets/:setId', authenticate, validate(practiceSchemas.deleteSet), practiceController.deleteSet)
router.post('/sets/:setId/attempts', authenticate, validate(practiceSchemas.startAttempt), practiceController.startAttempt)
router.post(
  '/attempts/:attemptId/questions/:questionId/submit',
  authenticate,
  validate(practiceSchemas.submit),
  practiceController.submit
)

export default router
