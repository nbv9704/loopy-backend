import { AppError } from '../../middleware/errorHandler'

/** Infrastructure failure is not an incorrect student answer. */
export class RunnerUnavailableError extends AppError {
  constructor(message = 'Runner tạm thời chưa sẵn sàng. Vui lòng thử lại sau.') {
    super(503, 'RUNNER_UNAVAILABLE', message)
  }
}
