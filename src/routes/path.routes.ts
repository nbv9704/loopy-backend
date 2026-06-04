import { Router } from 'express'
import * as pathController from '../controllers/path.controller'

const router = Router()

/**
 * @route   GET /api/paths
 * @desc    Get all active learning paths
 * @access  Public
 */
router.get('/', pathController.getAllPaths)

/**
 * @route   GET /api/paths/goal/:goalId
 * @desc    Get paths filtered by goal
 * @access  Public
 */
router.get('/goal/:goalId', pathController.getPathsByGoal)

/**
 * @route   GET /api/paths/:id
 * @desc    Get specific path details with chapters
 * @access  Public
 */
router.get('/:id', pathController.getPathById)

export default router
