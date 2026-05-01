import { Router } from 'express'
import * as exerciseController from '../controllers/exercise.controller'
import { authenticate } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { exerciseSchemas } from '../schemas/exercise.schemas'

const router = Router()

/**
 * @openapi
 * /api/exercises/{id}/submit:
 *   post:
 *     tags:
 *       - Exercises
 *     summary: Submit exercise solution
 *     description: Submit code solution for an exercise. The code will be executed and validated against test cases. Requires authentication.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Exercise unique identifier (UUID)
 *         example: "789e0123-e89b-12d3-a456-426614174002"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *             properties:
 *               code:
 *                 type: string
 *                 minLength: 1
 *                 description: User's code solution
 *                 example: "function add(a, b) { return a + b; }"
 *           example:
 *             code: "function add(a, b) { return a + b; }"
 *     responses:
 *       200:
 *         description: Submission successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     submission:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                           description: Submission unique identifier
 *                           example: "abc12345-e89b-12d3-a456-426614174003"
 *                         user_id:
 *                           type: string
 *                           format: uuid
 *                           description: User identifier
 *                           example: "123e4567-e89b-12d3-a456-426614174000"
 *                         exercise_id:
 *                           type: string
 *                           format: uuid
 *                           description: Exercise identifier
 *                           example: "789e0123-e89b-12d3-a456-426614174002"
 *                         code:
 *                           type: string
 *                           description: Submitted code
 *                           example: "function add(a, b) { return a + b; }"
 *                         is_correct:
 *                           type: boolean
 *                           description: Whether the solution passed all test cases
 *                           example: true
 *                         execution_time:
 *                           type: integer
 *                           description: Code execution time in milliseconds
 *                           example: 45
 *                         submitted_at:
 *                           type: string
 *                           format: date-time
 *                           description: Submission timestamp
 *                           example: "2024-01-15T10:30:00Z"
 *                     result:
 *                       type: object
 *                       properties:
 *                         isCorrect:
 *                           type: boolean
 *                           description: Whether the solution is correct
 *                           example: true
 *                         output:
 *                           type: string
 *                           description: Code execution output
 *                           example: "3"
 *                         error:
 *                           type: string
 *                           nullable: true
 *                           description: Error message if execution failed
 *                           example: null
 *                         executionTime:
 *                           type: integer
 *                           description: Execution time in milliseconds
 *                           example: 45
 *             example:
 *               success: true
 *               data:
 *                 submission:
 *                   id: "abc12345-e89b-12d3-a456-426614174003"
 *                   user_id: "123e4567-e89b-12d3-a456-426614174000"
 *                   exercise_id: "789e0123-e89b-12d3-a456-426614174002"
 *                   code: "function add(a, b) { return a + b; }"
 *                   is_correct: true
 *                   execution_time: 45
 *                   submitted_at: "2024-01-15T10:30:00Z"
 *                 result:
 *                   isCorrect: true
 *                   output: "3"
 *                   error: null
 *                   executionTime: 45
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 */
router.post(
  '/:id/submit',
  authenticate,
  validate(exerciseSchemas.submit),
  exerciseController.submitExercise
)

/**
 * @openapi
 * /api/exercises/{id}/submissions:
 *   get:
 *     tags:
 *       - Exercises
 *     summary: Get exercise submissions
 *     description: Retrieve the authenticated user's submission history for a specific exercise, ordered by most recent first. Limited to 10 most recent submissions. Requires authentication.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Exercise unique identifier (UUID)
 *         example: "789e0123-e89b-12d3-a456-426614174002"
 *     responses:
 *       200:
 *         description: Submissions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     submissions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                             description: Submission unique identifier
 *                             example: "abc12345-e89b-12d3-a456-426614174003"
 *                           code:
 *                             type: string
 *                             description: Submitted code
 *                             example: "function add(a, b) { return a + b; }"
 *                           is_correct:
 *                             type: boolean
 *                             description: Whether the solution passed all test cases
 *                             example: true
 *                           submitted_at:
 *                             type: string
 *                             format: date-time
 *                             description: Submission timestamp
 *                             example: "2024-01-15T10:30:00Z"
 *                           execution_time:
 *                             type: integer
 *                             description: Code execution time in milliseconds
 *                             example: 45
 *             example:
 *               success: true
 *               data:
 *                 submissions:
 *                   - id: "abc12345-e89b-12d3-a456-426614174003"
 *                     code: "function add(a, b) { return a + b; }"
 *                     is_correct: true
 *                     submitted_at: "2024-01-15T10:30:00Z"
 *                     execution_time: 45
 *                   - id: "abc12345-e89b-12d3-a456-426614174004"
 *                     code: "function add(a, b) { return a + b }"
 *                     is_correct: false
 *                     submitted_at: "2024-01-15T10:25:00Z"
 *                     execution_time: 38
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 */
router.get('/:id/submissions', authenticate, exerciseController.getSubmissions)

export default router
