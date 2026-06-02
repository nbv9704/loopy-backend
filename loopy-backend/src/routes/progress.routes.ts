import { Router } from 'express'
import * as progressController from '../controllers/progress.controller'
import { authenticate } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { progressSchemas } from '../schemas/progress.schemas'

const router = Router()

// All progress routes require authentication
router.use(authenticate)

/**
 * @openapi
 * /api/progress/me:
 *   get:
 *     tags:
 *       - Progress
 *     summary: Get user's progress
 *     description: Retrieve the authenticated user's learning progress across all lessons, including completion statistics, streak information, and progress grouped by language. Requires authentication.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User progress retrieved successfully
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
 *                     progress:
 *                       type: array
 *                       description: Array of all user progress records
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                             description: Progress record unique identifier
 *                             example: "789e0123-e89b-12d3-a456-426614174002"
 *                           user_id:
 *                             type: string
 *                             format: uuid
 *                             description: User identifier
 *                             example: "123e4567-e89b-12d3-a456-426614174000"
 *                           lesson_id:
 *                             type: string
 *                             format: uuid
 *                             description: Lesson identifier
 *                             example: "456e7890-e89b-12d3-a456-426614174001"
 *                           status:
 *                             type: string
 *                             enum: [not_started, in_progress, completed]
 *                             description: Current progress status
 *                             example: completed
 *                           time_spent:
 *                             type: integer
 *                             description: Total time spent on lesson in seconds
 *                             example: 1200
 *                           completed_at:
 *                             type: string
 *                             format: date-time
 *                             nullable: true
 *                             description: Timestamp when lesson was completed
 *                             example: "2024-01-15T10:30:00Z"
 *                           updated_at:
 *                             type: string
 *                             format: date-time
 *                             description: Last update timestamp
 *                             example: "2024-01-15T10:30:00Z"
 *                           lessons:
 *                             type: object
 *                             description: Associated lesson information
 *                             properties:
 *                               id:
 *                                 type: string
 *                                 format: uuid
 *                                 example: "456e7890-e89b-12d3-a456-426614174001"
 *                               lesson_id:
 *                                 type: string
 *                                 example: "lesson-1"
 *                               title:
 *                                 type: string
 *                                 example: "Variables and Data Types"
 *                               chapter_id:
 *                                 type: string
 *                                 format: uuid
 *                                 example: "123e4567-e89b-12d3-a456-426614174000"
 *                               chapters:
 *                                 type: object
 *                                 properties:
 *                                   language_id:
 *                                     type: string
 *                                     example: javascript
 *                     summary:
 *                       type: object
 *                       description: Progress summary grouped by language
 *                       additionalProperties:
 *                         type: object
 *                         properties:
 *                           total:
 *                             type: integer
 *                             description: Total lessons in this language
 *                             example: 10
 *                           completed:
 *                             type: integer
 *                             description: Completed lessons count
 *                             example: 5
 *                           inProgress:
 *                             type: integer
 *                             description: In-progress lessons count
 *                             example: 2
 *                           lessons:
 *                             type: array
 *                             description: Progress records for this language
 *                             items:
 *                               type: object
 *                     completed_lessons:
 *                       type: integer
 *                       description: Total number of completed lessons
 *                       example: 5
 *                     total_lessons:
 *                       type: integer
 *                       description: Total number of lessons available
 *                       example: 99
 *                     current_streak:
 *                       type: integer
 *                       description: Current consecutive days with lesson completions
 *                       example: 3
 *                     longest_streak:
 *                       type: integer
 *                       description: Longest streak of consecutive days
 *                       example: 7
 *             example:
 *               success: true
 *               data:
 *                 progress:
 *                   - id: "789e0123-e89b-12d3-a456-426614174002"
 *                     user_id: "123e4567-e89b-12d3-a456-426614174000"
 *                     lesson_id: "456e7890-e89b-12d3-a456-426614174001"
 *                     status: completed
 *                     time_spent: 1200
 *                     completed_at: "2024-01-15T10:30:00Z"
 *                     updated_at: "2024-01-15T10:30:00Z"
 *                     lessons:
 *                       id: "456e7890-e89b-12d3-a456-426614174001"
 *                       lesson_id: "lesson-1"
 *                       title: "Variables and Data Types"
 *                       chapter_id: "123e4567-e89b-12d3-a456-426614174000"
 *                       chapters:
 *                         language_id: javascript
 *                 summary:
 *                   javascript:
 *                     total: 10
 *                     completed: 5
 *                     inProgress: 2
 *                     lessons: []
 *                 completed_lessons: 5
 *                 total_lessons: 99
 *                 current_streak: 3
 *                 longest_streak: 7
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 */
router.get('/me', progressController.getUserProgress)

/**
 * @openapi
 * /api/progress/me/{lessonId}:
 *   get:
 *     tags:
 *       - Progress
 *     summary: Get progress for specific lesson
 *     description: Retrieve the authenticated user's progress for a specific lesson by lesson ID. Returns progress status and time spent. Requires authentication.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: lessonId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Lesson unique identifier (UUID)
 *         example: "456e7890-e89b-12d3-a456-426614174001"
 *     responses:
 *       200:
 *         description: Lesson progress retrieved successfully
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
 *                     progress:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                           description: Progress record unique identifier
 *                           example: "789e0123-e89b-12d3-a456-426614174002"
 *                         user_id:
 *                           type: string
 *                           format: uuid
 *                           description: User identifier
 *                           example: "123e4567-e89b-12d3-a456-426614174000"
 *                         lesson_id:
 *                           type: string
 *                           format: uuid
 *                           description: Lesson identifier
 *                           example: "456e7890-e89b-12d3-a456-426614174001"
 *                         status:
 *                           type: string
 *                           enum: [not_started, in_progress, completed]
 *                           description: Current progress status
 *                           example: in_progress
 *                         time_spent:
 *                           type: integer
 *                           description: Total time spent on lesson in seconds
 *                           example: 600
 *                         completed_at:
 *                           type: string
 *                           format: date-time
 *                           nullable: true
 *                           description: Timestamp when lesson was completed
 *                           example: null
 *                         created_at:
 *                           type: string
 *                           format: date-time
 *                           description: Progress record creation timestamp
 *                           example: "2024-01-15T09:00:00Z"
 *                         updated_at:
 *                           type: string
 *                           format: date-time
 *                           description: Last update timestamp
 *                           example: "2024-01-15T10:00:00Z"
 *             example:
 *               success: true
 *               data:
 *                 progress:
 *                   id: "789e0123-e89b-12d3-a456-426614174002"
 *                   user_id: "123e4567-e89b-12d3-a456-426614174000"
 *                   lesson_id: "456e7890-e89b-12d3-a456-426614174001"
 *                   status: in_progress
 *                   time_spent: 600
 *                   completed_at: null
 *                   created_at: "2024-01-15T09:00:00Z"
 *                   updated_at: "2024-01-15T10:00:00Z"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 */
router.get('/me/:lessonId', progressController.getLessonProgress)

/**
 * @openapi
 * /api/progress/me/{lessonId}:
 *   post:
 *     tags:
 *       - Progress
 *     summary: Update progress for lesson
 *     description: Update the authenticated user's progress for a specific lesson. Can update status and add time spent. Creates a new progress record if one doesn't exist. Requires authentication.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: lessonId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Lesson unique identifier (UUID)
 *         example: "456e7890-e89b-12d3-a456-426614174001"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [not_started, in_progress, completed]
 *                 description: Progress status to set
 *                 example: in_progress
 *               timeSpent:
 *                 type: number
 *                 minimum: 0
 *                 description: Additional time spent on lesson in seconds (will be added to existing time)
 *                 example: 300
 *           example:
 *             status: in_progress
 *             timeSpent: 300
 *     responses:
 *       200:
 *         description: Progress updated successfully
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
 *                     progress:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                           description: Progress record unique identifier
 *                           example: "789e0123-e89b-12d3-a456-426614174002"
 *                         user_id:
 *                           type: string
 *                           format: uuid
 *                           description: User identifier
 *                           example: "123e4567-e89b-12d3-a456-426614174000"
 *                         lesson_id:
 *                           type: string
 *                           format: uuid
 *                           description: Lesson identifier
 *                           example: "456e7890-e89b-12d3-a456-426614174001"
 *                         status:
 *                           type: string
 *                           enum: [not_started, in_progress, completed]
 *                           description: Updated progress status
 *                           example: in_progress
 *                         time_spent:
 *                           type: integer
 *                           description: Total time spent on lesson in seconds
 *                           example: 900
 *                         completed_at:
 *                           type: string
 *                           format: date-time
 *                           nullable: true
 *                           description: Timestamp when lesson was completed
 *                           example: null
 *                         created_at:
 *                           type: string
 *                           format: date-time
 *                           description: Progress record creation timestamp
 *                           example: "2024-01-15T09:00:00Z"
 *                         updated_at:
 *                           type: string
 *                           format: date-time
 *                           description: Last update timestamp
 *                           example: "2024-01-15T10:30:00Z"
 *             example:
 *               success: true
 *               data:
 *                 progress:
 *                   id: "789e0123-e89b-12d3-a456-426614174002"
 *                   user_id: "123e4567-e89b-12d3-a456-426614174000"
 *                   lesson_id: "456e7890-e89b-12d3-a456-426614174001"
 *                   status: in_progress
 *                   time_spent: 900
 *                   completed_at: null
 *                   created_at: "2024-01-15T09:00:00Z"
 *                   updated_at: "2024-01-15T10:30:00Z"
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 */
router.post('/me/:lessonId', validate(progressSchemas.update), progressController.updateProgress)

/**
 * @openapi
 * /api/progress/me/{lessonId}/complete:
 *   put:
 *     tags:
 *       - Progress
 *     summary: Mark lesson as complete
 *     description: Mark a specific lesson as completed for the authenticated user. Sets status to 'completed' and records completion timestamp. Creates a new progress record if one doesn't exist. Requires authentication.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: lessonId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Lesson unique identifier (UUID)
 *         example: "456e7890-e89b-12d3-a456-426614174001"
 *     responses:
 *       200:
 *         description: Lesson marked as complete successfully
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
 *                     progress:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                           description: Progress record unique identifier
 *                           example: "789e0123-e89b-12d3-a456-426614174002"
 *                         user_id:
 *                           type: string
 *                           format: uuid
 *                           description: User identifier
 *                           example: "123e4567-e89b-12d3-a456-426614174000"
 *                         lesson_id:
 *                           type: string
 *                           format: uuid
 *                           description: Lesson identifier
 *                           example: "456e7890-e89b-12d3-a456-426614174001"
 *                         status:
 *                           type: string
 *                           enum: [completed]
 *                           description: Progress status (always 'completed')
 *                           example: completed
 *                         time_spent:
 *                           type: integer
 *                           description: Total time spent on lesson in seconds
 *                           example: 1200
 *                         completed_at:
 *                           type: string
 *                           format: date-time
 *                           description: Timestamp when lesson was completed
 *                           example: "2024-01-15T10:30:00Z"
 *                         created_at:
 *                           type: string
 *                           format: date-time
 *                           description: Progress record creation timestamp
 *                           example: "2024-01-15T09:00:00Z"
 *                         updated_at:
 *                           type: string
 *                           format: date-time
 *                           description: Last update timestamp
 *                           example: "2024-01-15T10:30:00Z"
 *             example:
 *               success: true
 *               data:
 *                 progress:
 *                   id: "789e0123-e89b-12d3-a456-426614174002"
 *                   user_id: "123e4567-e89b-12d3-a456-426614174000"
 *                   lesson_id: "456e7890-e89b-12d3-a456-426614174001"
 *                   status: completed
 *                   time_spent: 1200
 *                   completed_at: "2024-01-15T10:30:00Z"
 *                   created_at: "2024-01-15T09:00:00Z"
 *                   updated_at: "2024-01-15T10:30:00Z"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 */
router.put('/me/:lessonId/complete', progressController.completeLesson)

export default router
