import { Router } from 'express'
import * as authController from '../controllers/auth.controller'
import { validate } from '../middleware/validate'
import { authSchemas } from '../schemas/auth.schemas'

const router = Router()

/**
 * @openapi
 * /api/auth/signup:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: User registration
 *     description: Register a new user account with email and password. In development, email is auto-confirmed. In production, requires email verification.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User email address
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 description: User password (minimum 6 characters)
 *                 example: password123
 *               displayName:
 *                 type: string
 *                 minLength: 2
 *                 description: Optional display name (defaults to email prefix)
 *                 example: Người dùng
 *           example:
 *             email: user@example.com
 *             password: password123
 *             displayName: Người dùng
 *     responses:
 *       201:
 *         description: Registration successful
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
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                           example: "123e4567-e89b-12d3-a456-426614174000"
 *                         email:
 *                           type: string
 *                           format: email
 *                           example: user@example.com
 *                     session:
 *                       type: object
 *                       nullable: true
 *                       description: Session object (only in development mode)
 *                     message:
 *                       type: string
 *                       example: Đăng ký thành công
 *             example:
 *               success: true
 *               data:
 *                 user:
 *                   id: "123e4567-e89b-12d3-a456-426614174000"
 *                   email: user@example.com
 *                 session: null
 *                 message: Vui lòng kiểm tra email để xác nhận tài khoản
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 */
router.post('/signup', validate(authSchemas.signup), authController.signup)

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: User login
 *     description: Authenticate user with email and password, returns session with access token and refresh token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User email address
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 description: User password
 *                 example: password123
 *           example:
 *             email: user@example.com
 *             password: password123
 *     responses:
 *       200:
 *         description: Login successful
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
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                           example: "123e4567-e89b-12d3-a456-426614174000"
 *                         email:
 *                           type: string
 *                           format: email
 *                           example: user@example.com
 *                     session:
 *                       type: object
 *                       properties:
 *                         access_token:
 *                           type: string
 *                           description: JWT access token for authenticated requests
 *                           example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                         refresh_token:
 *                           type: string
 *                           description: Refresh token for obtaining new access tokens
 *                           example: v1.MRjHYJzKHtJE...
 *                         expires_in:
 *                           type: integer
 *                           description: Access token expiration time in seconds
 *                           example: 3600
 *                         token_type:
 *                           type: string
 *                           example: bearer
 *             example:
 *               success: true
 *               data:
 *                 user:
 *                   id: "123e4567-e89b-12d3-a456-426614174000"
 *                   email: user@example.com
 *                 session:
 *                   access_token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                   refresh_token: v1.MRjHYJzKHtJE...
 *                   expires_in: 3600
 *                   token_type: bearer
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 */
router.post('/login', validate(authSchemas.login), authController.login)

/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: User logout
 *     description: Logout the current user and invalidate their session. Optionally accepts Bearer token in Authorization header.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
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
 *                     message:
 *                       type: string
 *                       example: Logged out successfully
 *             example:
 *               success: true
 *               data:
 *                 message: Logged out successfully
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 */
router.post('/logout', authController.logout)

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     tags:
 *       - Authentication
 *     summary: Get current user
 *     description: Retrieve the currently authenticated user's information and profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User information retrieved successfully
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
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                           example: "123e4567-e89b-12d3-a456-426614174000"
 *                         email:
 *                           type: string
 *                           format: email
 *                           example: user@example.com
 *                         profile:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                               format: uuid
 *                             display_name:
 *                               type: string
 *                               example: Người dùng
 *                             preferred_language:
 *                               type: string
 *                               example: javascript
 *             example:
 *               success: true
 *               data:
 *                 user:
 *                   id: "123e4567-e89b-12d3-a456-426614174000"
 *                   email: user@example.com
 *                   profile:
 *                     id: "123e4567-e89b-12d3-a456-426614174000"
 *                     display_name: Người dùng
 *                     preferred_language: javascript
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 */
router.get('/me', authController.getCurrentUser)

/**
 * @openapi
 * /api/auth/refresh:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Refresh access token
 *     description: Obtain a new access token using a valid refresh token when the current access token expires
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Valid refresh token from login response
 *                 example: v1.MRjHYJzKHtJE...
 *           example:
 *             refreshToken: v1.MRjHYJzKHtJE...
 *     responses:
 *       200:
 *         description: Token refresh successful
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
 *                     session:
 *                       type: object
 *                       properties:
 *                         access_token:
 *                           type: string
 *                           description: New JWT access token
 *                           example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                         refresh_token:
 *                           type: string
 *                           description: New refresh token
 *                           example: v1.MRjHYJzKHtJE...
 *                         expires_in:
 *                           type: integer
 *                           description: Access token expiration time in seconds
 *                           example: 3600
 *                         token_type:
 *                           type: string
 *                           example: bearer
 *             example:
 *               success: true
 *               data:
 *                 session:
 *                   access_token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                   refresh_token: v1.MRjHYJzKHtJE...
 *                   expires_in: 3600
 *                   token_type: bearer
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 */
router.post('/refresh', authController.refreshToken)

// ============================================================================
// DEV-ONLY: Quick login with auto-created test account
// ============================================================================
if (process.env.NODE_ENV === 'development') {
  router.post('/dev-login', async (_req, res, next) => {
    try {
      const { supabase: sb, supabaseAdmin: sbAdmin } = await import('../db/supabase')
      const { setAuthTokenCookie, setRefreshTokenCookie } = await import('../utils/cookieHelper')
      const { logger: log } = await import('../utils/logger')

      const testEmail = 'dev-admin-2026@loopy.dev'
      const testPassword = 'dev_password_2026_!@#'
      const testName = 'Dev Admin'

      // Try to sign in first
      let { data, error } = await sb.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      })

      // If account doesn't exist or password changed, try to create/reset it
      if (error) {
        log.info('[dev-login] SignIn failed, attempting to create or update test account...', error.message)

        // Force delete first just in case
        const { data: existingUser } = await sbAdmin.auth.admin.listUsers()
        const userToDel = existingUser.users.find(u => u.email === testEmail)
        if (userToDel) {
          await sbAdmin.auth.admin.deleteUser(userToDel.id)
        }

        const { data: createData, error: createErr } = await sbAdmin.auth.admin.createUser({
          email: testEmail,
          password: testPassword,
          email_confirm: true,
          user_metadata: { display_name: testName },
        })

        if (createErr) {
          log.error('[dev-login] Failed to create test user:', createErr)
          return res.status(500).json({ success: false, error: createErr.message })
        }

        // Create profile
        if (createData.user) {
          await sbAdmin.from('user_profiles').upsert({
            id: createData.user.id,
            display_name: testName,
            preferred_language: 'javascript',
          } as any)
        }

        // Now sign in
        const signIn = await sb.auth.signInWithPassword({
          email: testEmail,
          password: testPassword,
        })
        data = signIn.data
        error = signIn.error
      }

      if (error || !data.session) {
        log.error('[dev-login] Authentication failed. Error details:', error, 'Session data:', data.session);
        return res.status(401).json({ success: false, error: error?.message || 'Login failed' })
      }

      // Set cookies
      setAuthTokenCookie(res, data.session.access_token)
      setRefreshTokenCookie(res, data.session.refresh_token)

      return res.json({
        success: true,
        data: {
          user: { id: data.user.id, email: data.user.email },
          message: `Dev login OK — ${testEmail}`,
        },
      })
    } catch (err) {
      return next(err)
    }
  })
}

export default router
