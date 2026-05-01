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

router.get('/:id/chapters', languageController.getChaptersByLanguage)

// Batch endpoint: chapters + lessons in a single request (eliminates N+1 queries)
router.get('/:id/curriculum', languageController.getChaptersWithLessons)

export default router
