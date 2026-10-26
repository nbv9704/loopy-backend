import { supabaseAdmin } from '../../db/supabase'
import { logger } from '../../utils/logger'

/** Optional telemetry must not delay a completed run or turn it into a failed execution. */
export async function logCodeExecution(input: {
  userId: string
  language: string
  code: string
  output: string
  error: string | null
  executionTime: number
}) {
  try {
    const { error } = await supabaseAdmin.from('code_executions').insert({
      user_id: input.userId,
      language: input.language,
      code: input.code,
      output: input.output,
      error: input.error,
      execution_time: input.executionTime,
    })
    if (error) logger.warn('Execution log was not saved')
  } catch {
    logger.warn('Execution log was not saved')
  }
}
