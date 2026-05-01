import { Router } from 'express'
import * as chapterController from '../controllers/chapter.controller'

const router = Router()

/**
 * @openapi
 * /api/chapters/{id}:
 *   get:
 *     tags:
 *       - Chapters
 *     summary: Get chapter by ID
 *     description: Retrieve detailed information about a specific chapter by its ID, including associated language information. This is a public endpoint that does not require authentication.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Chapter unique identifier (UUID)
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: Chapter retrieved successfully
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
 *                     chapter:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                           description: Chapter unique identifier
 *                           example: "123e4567-e89b-12d3-a456-426614174000"
 *                         language_id:
 *                           type: string
 *                           description: Associated programming language identifier
 *                           example: javascript
 *                         title:
 *                           type: string
 *                           description: Chapter title
 *                           example: "Getting Started with JavaScript"
 *                         description:
 *                           type: string
 *                           description: Chapter description
 *                           example: "Learn the basics of JavaScript programming"
 *                         order_index:
 *                           type: integer
 *                           description: Display order within the language
 *                           example: 1
 *                         created_at:
 *                           type: string
 *                           format: date-time
 *                           description: Timestamp when the chapter was created
 *                           example: "2024-01-15T10:30:00Z"
 *                         languages:
 *                           type: object
 *                           description: Associated language information
 *                           properties:
 *                             id:
 *                               type: string
 *                               example: javascript
 *                             name:
 *                               type: string
 *                               example: javascript
 *                             display_name:
 *                               type: string
 *                               example: JavaScript
 *             example:
 *               success: true
 *               data:
 *                 chapter:
 *                   id: "123e4567-e89b-12d3-a456-426614174000"
 *                   language_id: javascript
 *                   title: "Getting Started with JavaScript"
 *                   description: "Learn the basics of JavaScript programming"
 *                   order_index: 1
 *                   created_at: "2024-01-15T10:30:00Z"
 *                   languages:
 *                     id: javascript
 *                     name: javascript
 *                     display_name: JavaScript
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 */
router.get('/:id', chapterController.getChapterById)

/**
 * @openapi
 * /api/chapters/{id}/lessons:
 *   get:
 *     tags:
 *       - Chapters
 *     summary: Get lessons by chapter
 *     description: Retrieve all lessons for a specific chapter, ordered by their sequence. This is a public endpoint that does not require authentication.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Chapter unique identifier (UUID)
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: Lessons retrieved successfully
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
 *                     lessons:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                             description: Lesson unique identifier
 *                             example: "456e7890-e89b-12d3-a456-426614174001"
 *                           chapter_id:
 *                             type: string
 *                             format: uuid
 *                             description: Parent chapter identifier
 *                             example: "123e4567-e89b-12d3-a456-426614174000"
 *                           title:
 *                             type: string
 *                             description: Lesson title
 *                             example: "Variables and Data Types"
 *                           content:
 *                             type: string
 *                             description: Lesson content in markdown format
 *                             example: "# Variables\n\nLearn about JavaScript variables..."
 *                           order_index:
 *                             type: integer
 *                             description: Display order within the chapter
 *                             example: 1
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *                             description: Timestamp when the lesson was created
 *                             example: "2024-01-15T10:30:00Z"
 *             example:
 *               success: true
 *               data:
 *                 lessons:
 *                   - id: "456e7890-e89b-12d3-a456-426614174001"
 *                     chapter_id: "123e4567-e89b-12d3-a456-426614174000"
 *                     title: "Variables and Data Types"
 *                     content: "# Variables\n\nLearn about JavaScript variables..."
 *                     order_index: 1
 *                     created_at: "2024-01-15T10:30:00Z"
 *                   - id: "456e7890-e89b-12d3-a456-426614174002"
 *                     chapter_id: "123e4567-e89b-12d3-a456-426614174000"
 *                     title: "Functions and Scope"
 *                     content: "# Functions\n\nLearn about JavaScript functions..."
 *                     order_index: 2
 *                     created_at: "2024-01-15T10:30:00Z"
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 */
router.get('/:id/lessons', chapterController.getLessonsByChapter)

export default router
