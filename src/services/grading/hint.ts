import { aiAnalyzerService } from '../ai-analyzer.service'
import { readPublishedGradingContext } from './lesson-context'

export async function generateLessonHint(
  lessonId: string,
  input: { code: string; language: string; outputLogs?: string[] }
) {
  const context = await readPublishedGradingContext(lessonId, input.language)
  return aiAnalyzerService.generateHint({
    ...context,
    code: input.code,
    language: input.language,
    outputLogs: input.outputLogs,
  })
}
