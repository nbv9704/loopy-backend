import type { RequestHandler } from 'express'
import {
  readAdminSubmissions,
  readAdminSubmissionsPage,
} from '../../services/admin-submissions.service'

export const getSubmissions: RequestHandler = async (req, res, next) => {
  try {
    const status = String(req.query.status || 'all')
    // Requests without offset retain the bounded array contract for older clients.
    const data =
      req.query.offset === undefined
        ? await readAdminSubmissions(status, Number(req.query.limit ?? 50))
        : await readAdminSubmissionsPage(
            status,
            Number(req.query.limit ?? 20),
            Number(req.query.offset)
          )
    res.json({ success: true, data })
  } catch (error) {
    next(error)
  }
}
