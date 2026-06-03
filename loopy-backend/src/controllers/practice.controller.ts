import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/auth'
import { practiceService } from '../services/practice.service'

export const listSets = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id
    const result = await practiceService.listSets({
      userId,
      languageId: req.query.languageId as string | undefined,
      difficulty: req.query.difficulty as 'easy' | 'medium' | 'hard' | undefined,
      topic: req.query.topic as string | undefined,
      keyword: req.query.keyword as string | undefined,
      includeQuestions: req.query.includeQuestions as boolean | undefined,
      mine: req.query.mine as boolean | undefined,
      limit: req.query.limit as number | undefined,
      offset: req.query.offset as number | undefined,
    })

    res.json({ success: true, data: result })
  } catch (error) {
    next(error)
  }
}

export const getSet = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await practiceService.getSet(req.params.setId, req.user!.id)
    res.json({ success: true, data: result })
  } catch (error) {
    next(error)
  }
}

export const searchQuestions = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await practiceService.searchQuestions({
      userId: req.user!.id,
      keyword: req.query.keyword as string,
      limit: req.query.limit as number | undefined,
    })
    res.json({ success: true, data: result })
  } catch (error) {
    next(error)
  }
}

export const createSet = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await practiceService.createSet(req.body, req.user!.id)
    res.status(201).json({ success: true, data: result })
  } catch (error) {
    next(error)
  }
}

export const startAttempt = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await practiceService.startAttempt(req.params.setId, req.user!.id)
    res.status(201).json({ success: true, data: result })
  } catch (error) {
    next(error)
  }
}

export const submit = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await practiceService.submit(
      req.params.attemptId,
      req.params.questionId,
      req.user!.id,
      req.body
    )
    res.json({ success: true, data: result })
  } catch (error) {
    next(error)
  }
}
