import { config } from '../config'
import { errors } from '../middleware/errorHandler'
import { createJavaScriptExecutor } from './javascript-executor.service'
import { createPistonExecutor, isPistonLanguage, normalizePistonLanguage } from './piston-executor.service'
import { createGlotExecutor } from './glot-executor.service'
import { logger } from '../utils/logger'
import { observability } from './observability.service'

export interface ExecutionResult {
  output: string
  error: string | null
  executionTime?: number
}

const jsExecutor = createJavaScriptExecutor()
const pistonExecutor = createPistonExecutor()
const glotExecutor = createGlotExecutor()

/**
 * Main execution router
 */
export const executeCode = async (language: string, code: string): Promise<ExecutionResult> => {
  const startTime = Date.now()
  const lang = language.toLowerCase()
  
  try {
    logger.info(`Executing ${lang} code...`)
    
    let result: any
    
    if (lang === 'javascript' || lang === 'js') {
      result = await jsExecutor.execute(code, null, config.codeExecution.timeout)
      const duration = Date.now() - startTime
      observability.trackExecution(lang, duration, !result.error, result.error)
      const stdout = result.stdout || ''
      const stderr = result.stderr || ''
      const output = stdout + (stderr ? `${stdout ? '\n' : ''}${stderr}` : '')
      return {
        output,
        error: result.error,
        executionTime: result.executionTime,
      }
    }

    if (isPistonLanguage(lang)) {
      const normalizedLanguage = normalizePistonLanguage(lang) || lang
      const externalRunner = config.piston.apiUrl ? 'piston' : (config.glot.apiToken ? 'glot' : null)

      if (!externalRunner) {
        logger.info(`External code runner not configured. Rejecting live run for ${lang}.`)
        return {
          output: '',
          error: `Ngôn ngữ ${normalizedLanguage} cần runner để Chạy thử/Kiểm tra bằng test case. Hãy cấu hình PISTON_API_URL hoặc GLOT_API_TOKEN rồi thử lại.`,
          executionTime: 0,
        }
      }

      result = externalRunner === 'piston'
        ? await pistonExecutor.execute(normalizedLanguage, code, null, config.codeExecution.timeout)
        : await glotExecutor.execute(normalizedLanguage, code, null, config.codeExecution.timeout)
      const duration = Date.now() - startTime
      observability.trackExecution(normalizedLanguage, duration, !result.error, result.error)
      const stdout = result.stdout || ''
      const stderr = result.stderr || ''
      const output = stdout + (stderr && !result.error ? `${stdout ? '\n' : ''}${stderr}` : '')
      return {
        output,
        error: result.error || (stderr && !stdout ? stderr : null),
        executionTime: result.executionTime,
      }
    }

    throw errors.executionError(`Language ${language} not supported for execution`)
  } catch (err: any) {
    logger.error(`Execution failed for ${lang}:`, err.message)
    return {
      output: '',
      error: err.message || 'Execution error',
      executionTime: Date.now() - startTime,
    }
  }
}

export const executeJavaScript = async (code: string): Promise<ExecutionResult> => {
  return executeCode('javascript', code)
}

export const executePython = async (code: string): Promise<ExecutionResult> => {
  return executeCode('python', code)
}

export const executeCpp = async (code: string): Promise<ExecutionResult> => {
  return executeCode('cpp', code)
}
