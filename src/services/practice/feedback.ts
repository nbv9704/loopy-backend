import { supabaseAdmin } from '../../db/supabase'
import { logger } from '../../utils/logger'

/** Read only after the actor's submission has committed. Feedback failure cannot undo that write. */
export async function readSubmittedExplanation(
  questionId: string,
  setId: string
): Promise<string | undefined> {
  try {
    const { data, error } = await supabaseAdmin
      .from('practice_questions')
      .select('explanation')
      .eq('id', questionId)
      .eq('set_id', setId)
      .maybeSingle()
    if (error) throw error
    return typeof data?.explanation === 'string' ? data.explanation : undefined
  } catch {
    logger.warn('Practice answer saved; explanation could not be loaded', { questionId })
    return undefined
  }
}
