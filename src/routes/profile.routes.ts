import { Router } from 'express'
import * as profileController from '../controllers/profile.controller'
import { authenticate } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { profileSchemas } from '../schemas/profile.schemas'

const router = Router()

/**
 * @openapi
 * /api/profile/me:
 *   get:
 *     tags:
 *       - Profile
 *     summary: Get current user profile
 *     description: Retrieve the authenticated user's complete profile information including display name, avatar, bio, and preferred language
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
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
 *                     profile:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                           example: "123e4567-e89b-12d3-a456-426614174000"
 *                         display_name:
 *                           type: string
 *                           example: Người dùng
 *                         avatar_url:
 *                           type: string
 *                           format: uri
 *                           nullable: true
 *                           example: https://example.com/avatar.jpg
 *                         bio:
 *                           type: string
 *                           nullable: true
 *                           example: Passionate developer learning new technologies
 *                         preferred_language:
 *                           type: string
 *                           enum: [javascript, python, cpp]
 *                           example: javascript
 *                         created_at:
 *                           type: string
 *                           format: date-time
 *                           example: "2024-01-15T10:30:00Z"
 *                         updated_at:
 *                           type: string
 *                           format: date-time
 *                           example: "2024-01-20T14:45:00Z"
 *             example:
 *               success: true
 *               data:
 *                 profile:
 *                   id: "123e4567-e89b-12d3-a456-426614174000"
 *                   display_name: Người dùng
 *                   avatar_url: https://example.com/avatar.jpg
 *                   bio: Passionate developer learning new technologies
 *                   preferred_language: javascript
 *                   created_at: "2024-01-15T10:30:00Z"
 *                   updated_at: "2024-01-20T14:45:00Z"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 */
router.get('/me', authenticate, profileController.getMyProfile)

/**
 * @openapi
 * /api/profile/me:
 *   put:
 *     tags:
 *       - Profile
 *     summary: Update current user profile
 *     description: Update the authenticated user's profile information. All fields are optional - only provided fields will be updated.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               displayName:
 *                 type: string
 *                 minLength: 2
 *                 description: User display name (minimum 2 characters)
 *                 example: Người dùng mới
 *               avatarUrl:
 *                 type: string
 *                 format: uri
 *                 description: URL to user avatar image
 *                 example: https://example.com/new-avatar.jpg
 *               bio:
 *                 type: string
 *                 maxLength: 500
 *                 description: User biography (maximum 500 characters)
 *                 example: Full-stack developer passionate about clean code
 *               preferredLanguage:
 *                 type: string
 *                 enum: [javascript, python, cpp]
 *                 description: Preferred programming language for learning
 *                 example: python
 *           example:
 *             displayName: Người dùng mới
 *             avatarUrl: https://example.com/new-avatar.jpg
 *             bio: Full-stack developer passionate about clean code
 *             preferredLanguage: python
 *     responses:
 *       200:
 *         description: Profile updated successfully
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
 *                     profile:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                           example: "123e4567-e89b-12d3-a456-426614174000"
 *                         display_name:
 *                           type: string
 *                           example: Người dùng mới
 *                         avatar_url:
 *                           type: string
 *                           format: uri
 *                           nullable: true
 *                           example: https://example.com/new-avatar.jpg
 *                         bio:
 *                           type: string
 *                           nullable: true
 *                           example: Full-stack developer passionate about clean code
 *                         preferred_language:
 *                           type: string
 *                           enum: [javascript, python, cpp]
 *                           example: python
 *                         created_at:
 *                           type: string
 *                           format: date-time
 *                           example: "2024-01-15T10:30:00Z"
 *                         updated_at:
 *                           type: string
 *                           format: date-time
 *                           example: "2024-01-20T15:00:00Z"
 *             example:
 *               success: true
 *               data:
 *                 profile:
 *                   id: "123e4567-e89b-12d3-a456-426614174000"
 *                   display_name: Người dùng mới
 *                   avatar_url: https://example.com/new-avatar.jpg
 *                   bio: Full-stack developer passionate about clean code
 *                   preferred_language: python
 *                   created_at: "2024-01-15T10:30:00Z"
 *                   updated_at: "2024-01-20T15:00:00Z"
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 */
router.put('/me', authenticate, validate(profileSchemas.update), profileController.updateProfile)

/**
 * @openapi
 * /api/profile/{id}:
 *   get:
 *     tags:
 *       - Profile
 *     summary: Get public profile by ID
 *     description: Retrieve public profile information for any user by their ID. Returns limited profile data (excludes private information).
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User profile ID
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: Public profile retrieved successfully
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
 *                     profile:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                           example: "123e4567-e89b-12d3-a456-426614174000"
 *                         display_name:
 *                           type: string
 *                           example: Người dùng
 *                         avatar_url:
 *                           type: string
 *                           format: uri
 *                           nullable: true
 *                           example: https://example.com/avatar.jpg
 *                         bio:
 *                           type: string
 *                           nullable: true
 *                           example: Passionate developer learning new technologies
 *                         created_at:
 *                           type: string
 *                           format: date-time
 *                           example: "2024-01-15T10:30:00Z"
 *             example:
 *               success: true
 *               data:
 *                 profile:
 *                   id: "123e4567-e89b-12d3-a456-426614174000"
 *                   display_name: Người dùng
 *                   avatar_url: https://example.com/avatar.jpg
 *                   bio: Passionate developer learning new technologies
 *                   created_at: "2024-01-15T10:30:00Z"
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 */
router.get('/:id', profileController.getPublicProfile)

export default router
