import { NextFunction, Request, Response } from 'express'
import { getDashboardOverview } from '../../services/dashboard.service'

export const getDashboardStats = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.json({ success: true, data: await getDashboardOverview() })
  } catch (error) {
    next(error)
  }
}
