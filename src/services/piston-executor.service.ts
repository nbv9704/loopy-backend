import { config } from '../config'
import type { ExecutionResult } from './grading.types'
import { executionGate } from './execution/gate'
import { RunnerUnavailableError } from './execution/errors'
import { postRunnerJson } from './execution/http'
import { formatRunnerInput } from './execution/io'
import { normalizePistonLanguage, PISTON_LANGUAGE_CONFIG } from './execution/languages'
import { parsePistonResult } from './execution/provider-results'
export {
  normalizePistonLanguage,
  isPistonLanguage,
  PISTON_LANGUAGE_CONFIG,
  PISTON_LANGUAGE_ALIASES,
  type PistonLanguageId,
} from './execution/languages'

export class PistonExecutorService {
  async execute(
    language: string,
    code: string,
    input: unknown = null,
    timeout = 5000
  ): Promise<ExecutionResult> {
    const normalized = normalizePistonLanguage(language)
    if (
      !normalized ||
      !config.piston.apiUrl ||
      !Number.isInteger(timeout) ||
      timeout < 1 ||
      timeout > 60000
    )
      throw new RunnerUnavailableError()
    return executionGate.run(async () => {
      const start = Date.now()
      const item = PISTON_LANGUAGE_CONFIG[normalized]
      const response = await postRunnerJson(
        config.piston.apiUrl,
        config.piston.apiKey ? { Authorization: config.piston.apiKey } : {},
        {
          language: item.pistonLanguage,
          version: '*',
          files: [{ name: item.filename, content: code }],
          stdin: formatRunnerInput(input),
          compile_timeout: timeout,
          run_timeout: timeout,
        },
        timeout
      )
      return { ...parsePistonResult(response), executionTime: Date.now() - start }
    })
  }
}
export function createPistonExecutor() {
  return new PistonExecutorService()
}
