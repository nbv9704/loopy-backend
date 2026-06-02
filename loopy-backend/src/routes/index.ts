import { Router } from 'express'
import authRoutes from './auth.routes'
import languageRoutes from './language.routes'
import chapterRoutes from './chapter.routes'
import lessonRoutes from './lesson.routes'
import progressRoutes from './progress.routes'
import exerciseRoutes from './exercise.routes'
import executeRoutes from './execute.routes'
import profileRoutes from './profile.routes'
import adminRoutes from './admin.routes'
import adminApiRoutes from './admin-api.routes'
import gradingRoutes from './grading.routes'
import pvpRoutes from './pvp.routes'
import pathRoutes from './path.routes'
import publicRoutes from './public.routes'
import { healthCheck } from '../controllers/health.controller'

/**
 * Centralized route aggregation
 * Extracted from index.ts to follow Single Responsibility Principle
 * REVIEW: All route mounting is now isolated from the entry point
 */
const router = Router()

// Health check
router.get('/health', healthCheck)

// Public API routes
router.use('/auth', authRoutes)
router.use('/languages', languageRoutes)
router.use('/chapters', chapterRoutes)
router.use('/lessons', lessonRoutes)
router.use('/progress', progressRoutes)
router.use('/exercises', exerciseRoutes)
router.use('/execute', executeRoutes)
router.use('/profile', profileRoutes)
router.use('/paths', pathRoutes)
router.use('/public', publicRoutes)

// Direct public content routes (for frontend compatibility)
router.use('', publicRoutes)

// Grading system routes
router.use('/grading', gradingRoutes)

// PvP system routes
router.use('/pvp', pvpRoutes)

// Admin API routes (session-based for React SPA) - MUST be before /admin
router.use('/admin-auth', adminApiRoutes)

// Admin API routes (Bearer token-based)
router.use('/admin', adminRoutes)

export default router
