import { Router } from 'express'
import * as executeController from '../controllers/execute.controller'
import { authenticate, optionalAuth } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { executeSchemas } from '../schemas/execute.schemas'
import { codeExecutionLimiter } from '../middleware/rateLimiter'
import { concurrencyLimiter } from '../middleware/concurrencyLimiter'

const router = Router()

// Apply optional authentication first so all routes can check req.user
router.use(optionalAuth)

/**
 * Route to check execution runner capabilities.
 */
router.get('/capabilities', executeController.getCapabilities)

// Apply stricter rate limiting and concurrency control only for code execution routes
router.use(codeExecutionLimiter)
router.use(concurrencyLimiter)

/**
 * @openapi
 * /api/execute:
 *   post:
 *     tags:
 *       - Code Execution
 *     summary: Execute code in browser
 *     description: |
 *       Execute code in the specified programming language and return the output.
 *       This endpoint supports JavaScript, Python, and C++ code execution.
 *
 *       **Rate Limiting Policy**: This endpoint is rate-limited to 500 requests per hour per IP address to prevent abuse.
 *       Rate limit headers (X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset) are included in responses.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - language
 *               - code
 *             properties:
 *               language:
 *                 type: string
 *                 enum: [javascript, python, cpp]
 *                 description: Programming language to execute
 *                 example: javascript
 *               code:
 *                 type: string
 *                 minLength: 1
 *                 description: Source code to execute (max length varies by configuration)
 *                 example: console.log('Hello, World!');
 *           example:
 *             language: javascript
 *             code: console.log('Hello, World!');
 *     responses:
 *       200:
 *         description: Code execution successful
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
 *                     output:
 *                       type: string
 *                       description: Execution output or result
 *                       example: Hello, World!
 *                     error:
 *                       type: string
 *                       nullable: true
 *                       description: Error message if execution failed
 *                       example: null
 *                     executionTime:
 *                       type: number
 *                       description: Execution time in milliseconds
 *                       example: 45
 *             example:
 *               success: true
 *               data:
 *                 output: Hello, World!
 *                 error: null
 *                 executionTime: 45
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 */
router.post('/', validate(executeSchemas.execute), executeController.executeCode)

/**
 * @openapi
 * /api/execute/validate:
 *   post:
 *     tags:
 *       - Code Execution
 *     summary: Validate code against exercise
 *     description: |
 *       Validate user-submitted code against an exercise's test cases.
 *       This endpoint requires authentication and is used to check if the user's solution is correct.
 *
 *       **Rate Limiting Policy**: This endpoint is rate-limited to 500 requests per hour per IP address.
 *       Rate limit headers (X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset) are included in responses.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - exerciseId
 *               - code
 *             properties:
 *               exerciseId:
 *                 type: string
 *                 format: uuid
 *                 description: UUID of the exercise to validate against
 *                 example: "123e4567-e89b-12d3-a456-426614174000"
 *               code:
 *                 type: string
 *                 minLength: 1
 *                 description: User's solution code to validate
 *                 example: function add(a, b) { return a + b; }
 *           example:
 *             exerciseId: "123e4567-e89b-12d3-a456-426614174000"
 *             code: function add(a, b) { return a + b; }
 *     responses:
 *       200:
 *         description: Validation completed
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
 *                     passed:
 *                       type: boolean
 *                       description: Whether all test cases passed
 *                       example: true
 *                     testResults:
 *                       type: array
 *                       description: Results for each test case
 *                       items:
 *                         type: object
 *                         properties:
 *                           testName:
 *                             type: string
 *                             example: Test case 1
 *                           passed:
 *                             type: boolean
 *                             example: true
 *                           expected:
 *                             type: string
 *                             example: "5"
 *                           actual:
 *                             type: string
 *                             example: "5"
 *                     message:
 *                       type: string
 *                       description: Validation result message
 *                       example: All test cases passed!
 *             example:
 *               success: true
 *               data:
 *                 passed: true
 *                 testResults:
 *                   - testName: Test case 1
 *                     passed: true
 *                     expected: "5"
 *                     actual: "5"
 *                 message: All test cases passed!
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
  '/validate',
  authenticate,
  validate(executeSchemas.validate),
  executeController.validateCode
)

export default router
