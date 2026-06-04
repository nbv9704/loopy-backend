import { logger } from '../utils/logger'

/**
 * Observability Service
 * Tracks application metrics, errors, and performance data
 */
export class ObservabilityService {
  private static instance: ObservabilityService

  private constructor() {}

  public static getInstance(): ObservabilityService {
    if (!ObservabilityService.instance) {
      ObservabilityService.instance = new ObservabilityService()
    }
    return ObservabilityService.instance
  }

  /**
   * Track execution metrics
   */
  public trackExecution(language: string, duration: number, success: boolean, error?: string): void {
    logger.info(`[METRIC] Execution: lang=${language} duration=${duration}ms success=${success}${error ? ` error="${error}"` : ''}`)
    // Future: Push to Prometheus, CloudWatch, or Datadog
  }

  /**
   * Track AI usage and latency
   */
  public trackAIUsage(provider: string, model: string, duration: number, tokens?: number): void {
    logger.info(`[METRIC] AI_Usage: provider=${provider} model=${model} duration=${duration}ms${tokens ? ` tokens=${tokens}` : ''}`)
  }

  /**
   * Track Grading latency
   */
  public trackGrading(method: string, duration: number, score: number): void {
    logger.info(`[METRIC] Grading: method=${method} duration=${duration}ms score=${score}`)
  }

  /**
   * Track PvP events
   */
  public trackPvPEvent(event: string, matchId: string, userId?: string, data?: any): void {
    logger.info(`[METRIC] PvP_Event: event=${event} matchId=${matchId}${userId ? ` userId=${userId}` : ''} data=${data ? JSON.stringify(data) : 'N/A'}`)
  }

  /**
   * Track Error events for analysis
   */
  public trackError(category: string, message: string, stack?: string): void {
    logger.error(`[OBSERVABILITY_ERROR] category=${category} message="${message}"`)
    if (stack) {
      logger.debug(stack)
    }
  }
}

export const observability = ObservabilityService.getInstance()
