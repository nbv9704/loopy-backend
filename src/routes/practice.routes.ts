import { Router } from 'express'
import { authenticate } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { practiceSchemas } from '../schemas/practice.schemas'
import * as practiceController from '../controllers/practice.controller'

const router = Router()

router.use(authenticate)

router.get('/sets', validate(practiceSchemas.listSets), practiceController.listSets)
router.post('/sets', validate(practiceSchemas.createSet), practiceController.createSet)
router.get('/questions/search', validate(practiceSchemas.searchQuestions), practiceController.searchQuestions)
router.get('/sets/:setId', validate(practiceSchemas.getSet), practiceController.getSet)
router.put('/sets/:setId', validate(practiceSchemas.updateSet), practiceController.updateSet)
router.delete('/sets/:setId', validate(practiceSchemas.deleteSet), practiceController.deleteSet)
router.post('/sets/:setId/attempts', validate(practiceSchemas.startAttempt), practiceController.startAttempt)
router.post(
  '/attempts/:attemptId/questions/:questionId/submit',
  validate(practiceSchemas.submit),
  practiceController.submit
)

export default router
