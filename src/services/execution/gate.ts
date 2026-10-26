import { AppError } from '../../middleware/errorHandler'

/** Per-process job budget. HTTP disconnects cannot release a still-running job. */
export class ExecutionGate {
  private active = 0
  constructor(private readonly capacity = 5) {}

  async run<T>(job: () => Promise<T>): Promise<T> {
    if (this.active >= this.capacity)
      throw new AppError(
        429,
        'TOO_MANY_CONCURRENT_EXECUTIONS',
        'Runner đang bận. Hãy thử lại sau vài giây.'
      )
    ++this.active
    try {
      return await job()
    } finally {
      --this.active
    }
  }
}

export const executionGate = new ExecutionGate()
