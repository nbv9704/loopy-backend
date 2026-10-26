import { config } from '../config'
import { createJavaScriptExecutor } from './javascript-executor.service'
import { createPistonExecutor } from './piston-executor.service'
import { createGlotExecutor } from './glot-executor.service'
import { normalizePistonLanguage, selectExecutionRunner } from './execution/languages'
import { observability } from './observability.service'

export interface ExecutionResult {
  output: string
  error: string | null
  executionTime: number
}
const jsExecutor = createJavaScriptExecutor()
const pistonExecutor = createPistonExecutor()
const glotExecutor = createGlotExecutor()

export const executeCode = async (language: string, code: string): Promise<ExecutionResult> => {
  const lang = language.toLowerCase()
  const runner = selectExecutionRunner(lang)
  const externalExecutor = runner === 'piston' ? pistonExecutor : glotExecutor
  const result =
    runner === 'local'
      ? await jsExecutor.execute(code, null, config.codeExecution.timeout)
      : await externalExecutor.execute(
          normalizePistonLanguage(lang)!,
          code,
          null,
          config.codeExecution.timeout
        )
  observability.trackExecution(lang, result.executionTime, result.error === null)
  // stderr is a stream, not proof of a failed process. Preserve it for every language.
  return {
    output: [result.stdout, result.stderr].filter(Boolean).join('\n'),
    error: result.error,
    executionTime: result.executionTime,
  }
}
export const executeJavaScript = (code: string) => executeCode('javascript', code)
export const executePython = (code: string) => executeCode('python', code)
export const executeCpp = (code: string) => executeCode('cpp', code)
