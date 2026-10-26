import { Request, Response, NextFunction } from 'express'
import { readPaths, readPathOverview } from '../services/curriculum/catalog-read'
import { keysToCamel } from '../utils/caseConverter'

export const getAllPaths = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const paths = await readPaths({
      languageId: req.query.languageId as string | undefined,
      goalId: req.query.goalId as string | undefined,
    })
    res.json({ success: true, data: keysToCamel({ paths }) })
  } catch (error) {
    next(error)
  }
}

export const getPathById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json({ success: true, data: keysToCamel(await readPathOverview(req.params.id)) })
  } catch (error) {
    next(error)
  }
}

export const getPathsByGoal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const paths = await readPaths({ goalId: req.params.goalId })
    res.json({ success: true, data: keysToCamel({ paths }) })
  } catch (error) {
    next(error)
  }
}
