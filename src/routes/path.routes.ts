import { Router } from 'express'
import * as pathController from '../controllers/path.controller'
import { validate } from '../middleware/validate'
import { publicSchemas } from '../schemas/public.schemas'

const router = Router()

/**
 * @route   GET /api/paths
 * @desc    Get all active learning paths
 * @access  Public
 */
router.get('/', validate(publicSchemas.pathQuery), pathController.getAllPaths)

/**
 * @route   GET /api/paths/goal/:goalId
 * @desc    Get paths filtered by goal
 * @access  Public
 */
router.get('/goal/:goalId', validate(publicSchemas.pathGoalParam), pathController.getPathsByGoal)

/**
 * @route   GET /api/paths/:id
 * @desc    Get specific path details with chapters
 * @access  Public
 */
router.get('/:id', validate(publicSchemas.uuidIdParam), pathController.getPathById)

export default router
