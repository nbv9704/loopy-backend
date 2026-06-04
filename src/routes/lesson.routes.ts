import { Router } from 'express'
import * as lessonController from '../controllers/lesson.controller'
import { optionalAuth } from '../middleware/auth'
import * as lessonCheckController from '../controllers/lesson-check.controller'

const router = Router()

/**
 * @openapi
 * /api/lessons/{id}:
 *   get:
 *     tags:
 *       - Lessons
 *     summary: Get lesson by ID
 *     description: Retrieve detailed information about a specific lesson by its ID, including associated chapter and language information. This is a public endpoint that does not require authentication.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Lesson unique identifier (UUID)
 *         example: "456e7890-e89b-12d3-a456-426614174001"
 *     responses:
 *       200:
 *         description: Lesson retrieved successfully
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
 *                     lesson:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                           description: Lesson unique identifier
 *                           example: "456e7890-e89b-12d3-a456-426614174001"
 *                         chapter_id:
 *                           type: string
 *                           format: uuid
 *                           description: Parent chapter identifier
 *                           example: "123e4567-e89b-12d3-a456-426614174000"
 *                         title:
 *                           type: string
 *                           description: Lesson title
 *                           example: "Variables and Data Types"
 *                         content:
 *                           type: string
 *                           description: Lesson content in markdown format
 *                           example: "# Variables\n\nLearn about JavaScript variables..."
 *                         order_index:
 *                           type: integer
 *                           description: Display order within the chapter
 *                           example: 1
 *                         created_at:
 *                           type: string
 *                           format: date-time
 *                           description: Timestamp when the lesson was created
 *                           example: "2024-01-15T10:30:00Z"
 *                         chapters:
 *                           type: object
 *                           description: Associated chapter information
 *                           properties:
 *                             id:
 *                               type: string
 *                               format: uuid
 *                               example: "123e4567-e89b-12d3-a456-426614174000"
 *                             language_id:
 *                               type: string
 *                               example: javascript
 *                             title:
 *                               type: string
 *                               example: "Getting Started with JavaScript"
 *                             description:
 *                               type: string
 *                               example: "Learn the basics of JavaScript programming"
 *                             order_index:
 *                               type: integer
 *                               example: 1
 *                             languages:
 *                               type: object
 *                               description: Associated language information
 *                               properties:
 *                                 id:
 *                                   type: string
 *                                   example: javascript
 *                                 name:
 *                                   type: string
 *                                   example: javascript
 *                                 display_name:
 *                                   type: string
 *                                   example: JavaScript
 *             example:
 *               success: true
 *               data:
 *                 lesson:
 *                   id: "456e7890-e89b-12d3-a456-426614174001"
 *                   chapter_id: "123e4567-e89b-12d3-a456-426614174000"
 *                   title: "Variables and Data Types"
 *                   content: "# Variables\n\nLearn about JavaScript variables..."
 *                   order_index: 1
 *                   created_at: "2024-01-15T10:30:00Z"
 *                   chapters:
 *                     id: "123e4567-e89b-12d3-a456-426614174000"
 *                     language_id: javascript
 *                     title: "Getting Started with JavaScript"
 *                     description: "Learn the basics of JavaScript programming"
 *                     order_index: 1
 *                     languages:
 *                       id: javascript
 *                       name: javascript
 *                       display_name: JavaScript
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 */
router.get('/:id', lessonController.getLessonById)

/**
 * @openapi
 * /api/lessons/{id}/exercises:
 *   get:
 *     tags:
 *       - Lessons
 *     summary: Get exercises by lesson
 *     description: Retrieve all exercises for a specific lesson, ordered by their sequence. This is a public endpoint that does not require authentication.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Lesson unique identifier (UUID)
 *         example: "456e7890-e89b-12d3-a456-426614174001"
 *     responses:
 *       200:
 *         description: Exercises retrieved successfully
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
 *                     exercises:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                             description: Exercise unique identifier
 *                             example: "789e0123-e89b-12d3-a456-426614174002"
 *                           lesson_id:
 *                             type: string
 *                             format: uuid
 *                             description: Parent lesson identifier
 *                             example: "456e7890-e89b-12d3-a456-426614174001"
 *                           exercise_number:
 *                             type: integer
 *                             description: Exercise number within the lesson
 *                             example: 1
 *                           question:
 *                             type: string
 *                             description: Exercise question or prompt
 *                             example: "Write a function that adds two numbers"
 *                           hint:
 *                             type: string
 *                             nullable: true
 *                             description: Optional hint for the exercise
 *                             example: "Use the + operator to add numbers"
 *                           difficulty:
 *                             type: string
 *                             enum: [easy, medium, hard]
 *                             description: Exercise difficulty level
 *                             example: easy
 *                           order_index:
 *                             type: integer
 *                             description: Display order within the lesson
 *                             example: 1
 *             example:
 *               success: true
 *               data:
 *                 exercises:
 *                   - id: "789e0123-e89b-12d3-a456-426614174002"
 *                     lesson_id: "456e7890-e89b-12d3-a456-426614174001"
 *                     exercise_number: 1
 *                     question: "Write a function that adds two numbers"
 *                     hint: "Use the + operator to add numbers"
 *                     difficulty: easy
 *                     order_index: 1
 *                   - id: "789e0123-e89b-12d3-a456-426614174003"
 *                     lesson_id: "456e7890-e89b-12d3-a456-426614174001"
 *                     exercise_number: 2
 *                     question: "Create a variable to store your name"
 *                     hint: "Use const or let to declare a variable"
 *                     difficulty: easy
 *                     order_index: 2
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 */
router.get('/:id/exercises', lessonController.getExercisesByLesson)

/**
 * Route to check lesson code using deterministic validation or test-runner.
 */
router.post('/:lessonId/check', optionalAuth, lessonCheckController.checkLesson)

export default router
