import { config } from '../config'
import type { ExecutionResult } from './grading.types'
import { executionGate } from './execution/gate'
import { RunnerUnavailableError } from './execution/errors'
import { postRunnerJson } from './execution/http'
import { normalizePistonLanguage } from './execution/languages'
import { glotRequest } from './execution/glot-protocol'
import { parseGlotResult, parseGlotMuxResult } from './execution/provider-results'

export class GlotExecutorService {
  async execute(
    language: string,
    code: string,
    input: unknown = null,
    timeout = 5000
  ): Promise<ExecutionResult> {
    const normalized = normalizePistonLanguage(language)
    if (
      !normalized ||
      !config.glot.enabled ||
      !Number.isInteger(timeout) ||
      timeout < 1 ||
      timeout > 60000
    )
      throw new RunnerUnavailableError()
    return executionGate.run(async () => {
      const start = Date.now()
      const request = glotRequest(config.glot.apiUrl, config.glot.apiToken, normalized, code, input)
      const response = await postRunnerJson(
        request.url,
        request.headers,
        request.payload,
        timeout
      )
      const result = request.protocol === 'mux' ? parseGlotMuxResult(response) : parseGlotResult(response)
      return { ...result, executionTime: Date.now() - start }
    })
  }
}
export function createGlotExecutor() {
  return new GlotExecutorService()
}
