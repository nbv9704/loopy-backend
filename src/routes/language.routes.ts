import { Router } from 'express'
import * as languageController from '../controllers/language.controller'

const router = Router()

/**
 * @openapi
 * /api/languages:
 *   get:
 *     tags:
 *       - Languages
 *     summary: Get all programming languages
 *     description: Retrieve a list of all available programming languages in the platform. This is a public endpoint that does not require authentication.
 *     responses:
 *       200:
 *         description: Languages retrieved successfully
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
 *                     languages:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             description: Language identifier
 *                             example: javascript
 *                           name:
 *                             type: string
 *                             description: Language name
 *                             example: javascript
 *                           display_name:
 *                             type: string
 *                             description: Display name for the language
 *                             example: JavaScript
 *                           icon:
 *                             type: string
 *                             description: Icon identifier or URL
 *                             example: js-icon
 *                           can_run_in_browser:
 *                             type: boolean
 *                             description: Whether the language can be executed in the browser
 *                             example: true
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *                             description: Timestamp when the language was added
 *                             example: "2024-01-15T10:30:00Z"
 *             example:
 *               success: true
 *               data:
 *                 languages:
 *                   - id: javascript
 *                     name: javascript
 *                     display_name: JavaScript
 *                     icon: js-icon
 *                     can_run_in_browser: true
 *                     created_at: "2024-01-15T10:30:00Z"
 *                   - id: python
 *                     name: python
 *                     display_name: Python
 *                     icon: py-icon
 *                     can_run_in_browser: true
 *                     created_at: "2024-01-15T10:30:00Z"
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 */
router.get('/', languageController.getAllLanguages)

/**
 * @openapi
 * /api/languages/{id}:
 *   get:
 *     tags:
 *       - Languages
 *     summary: Get language by ID
 *     description: Retrieve detailed information about a specific programming language by its ID. This is a public endpoint that does not require authentication.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Language identifier (e.g., javascript, python, cpp)
 *         example: javascript
 *     responses:
 *       200:
 *         description: Language retrieved successfully
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
 *                     language:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           description: Language identifier
 *                           example: javascript
 *                         name:
 *                           type: string
 *                           description: Language name
 *                           example: javascript
 *                         display_name:
 *                           type: string
 *                           description: Display name for the language
 *                           example: JavaScript
 *                         icon:
 *                           type: string
 *                           description: Icon identifier or URL
 *                           example: js-icon
 *                         can_run_in_browser:
 *                           type: boolean
 *                           description: Whether the language can be executed in the browser
 *                           example: true
 *                         created_at:
 *                           type: string
 *                           format: date-time
 *                           description: Timestamp when the language was added
 *                           example: "2024-01-15T10:30:00Z"
 *             example:
 *               success: true
 *               data:
 *                 language:
 *                   id: javascript
 *                   name: javascript
 *                   display_name: JavaScript
 *                   icon: js-icon
 *                   can_run_in_browser: true
 *                   created_at: "2024-01-15T10:30:00Z"
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 */
router.get('/:id', languageController.getLanguageById)

/**
 * @openapi
 * /api/languages/{id}/chapters:
 *   get:
 *     tags:
 *       - Languages
 *     summary: Get chapters by language
 *     description: Retrieve all chapters for a specific programming language, ordered by their sequence. This is a public endpoint that does not require authentication.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Language identifier (e.g., javascript, python, cpp)
 *         example: javascript
 *     responses:
 *       200:
 *         description: Chapters retrieved successfully
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
 *                     chapters:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                             description: Chapter unique identifier
 *                             example: "123e4567-e89b-12d3-a456-426614174000"
 *                           language_id:
 *                             type: string
 *                             description: Associated programming language identifier
 *                             example: javascript
 *                           title:
 *                             type: string
 *                             description: Chapter title
 *                             example: "Getting Started with JavaScript"
 *                           description:
 *                             type: string
 *                             description: Chapter description
 *                             example: "Learn the basics of JavaScript programming"
 *                           order_index:
 *                             type: integer
 *                             description: Display order within the language
 *                             example: 1
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *                             description: Timestamp when the chapter was created
 *                             example: "2024-01-15T10:30:00Z"
 *             example:
 *               success: true
 *               data:
 *                 chapters:
 *                   - id: "123e4567-e89b-12d3-a456-426614174000"
 *                     language_id: javascript
 *                     title: "Getting Started with JavaScript"
 *                     description: "Learn the basics of JavaScript programming"
 *                     order_index: 1
 *                     created_at: "2024-01-15T10:30:00Z"
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 */
router.get('/:id/chapters', languageController.getChaptersByLanguage)

/**
 * @openapi
 * /api/languages/{id}/curriculum:
 *   get:
 *     tags:
 *       - Languages
 *     summary: Get complete curriculum (chapters with lessons)
 *     description: |
 *       Retrieve all chapters and their associated lessons for a specific programming language in a single request.
 *       This is a batch endpoint that eliminates N+1 queries and provides the complete curriculum structure.
 *       This is a public endpoint that does not require authentication.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Language identifier (e.g., javascript, python, cpp)
 *         example: javascript
 *     responses:
 *       200:
 *         description: Curriculum retrieved successfully
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
 *                     curriculum:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                             description: Chapter unique identifier
 *                             example: "123e4567-e89b-12d3-a456-426614174000"
 *                           language_id:
 *                             type: string
 *                             description: Associated programming language identifier
 *                             example: javascript
 *                           title:
 *                             type: string
 *                             description: Chapter title
 *                             example: "Getting Started with JavaScript"
 *                           description:
 *                             type: string
 *                             description: Chapter description
 *                             example: "Learn the basics of JavaScript programming"
 *                           order_index:
 *                             type: integer
 *                             description: Display order within the language
 *                             example: 1
 *                           lessons:
 *                             type: array
 *                             description: Lessons within this chapter
 *                             items:
 *                               type: object
 *                               properties:
 *                                 id:
 *                                   type: string
 *                                   format: uuid
 *                                   description: Lesson unique identifier
 *                                   example: "456e7890-e89b-12d3-a456-426614174001"
 *                                 chapter_id:
 *                                   type: string
 *                                   format: uuid
 *                                   description: Parent chapter identifier
 *                                   example: "123e4567-e89b-12d3-a456-426614174000"
 *                                 title:
 *                                   type: string
 *                                   description: Lesson title
 *                                   example: "Variables and Data Types"
 *                                 content:
 *                                   type: string
 *                                   description: Lesson content in markdown format
 *                                   example: "# Variables\n\nLearn about JavaScript variables..."
 *                                 order_index:
 *                                   type: integer
 *                                   description: Display order within the chapter
 *                                   example: 1
 *             example:
 *               success: true
 *               data:
 *                 curriculum:
 *                   - id: "123e4567-e89b-12d3-a456-426614174000"
 *                     language_id: javascript
 *                     title: "Getting Started with JavaScript"
 *                     description: "Learn the basics of JavaScript programming"
 *                     order_index: 1
 *                     lessons:
 *                       - id: "456e7890-e89b-12d3-a456-426614174001"
 *                         chapter_id: "123e4567-e89b-12d3-a456-426614174000"
 *                         title: "Variables and Data Types"
 *                         content: "# Variables\n\nLearn about JavaScript variables..."
 *                         order_index: 1
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 */
router.get('/:id/curriculum', languageController.getChaptersWithLessons)

export default router
