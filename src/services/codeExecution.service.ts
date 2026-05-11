import { config } from '../config'
import { errors } from '../middleware/errorHandler'
import { createJavaScriptExecutor } from './javascript-executor.service'

interface ExecutionResult {
  output: string
  error: string | null
}

export const executeJavaScript = async (code: string): Promise<ExecutionResult> => {
  try {
    const executor = createJavaScriptExecutor()
    const result = await executor.execute(code, null, config.codeExecution.timeout)

    return {
      output: result.stdout ? result.stdout + (result.stderr ? '\n' + result.stderr : '') : result.stderr,
      error: result.error,
    }
  } catch (err: any) {
    return {
      output: '',
      error: err.message || 'Execution error',
    }
  }
}

// Placeholder for Python execution (requires backend service)
export const executePython = async (_code: string): Promise<ExecutionResult> => {
  throw errors.executionError(
    'Python execution not implemented yet. Please use an online Python compiler.'
  )
}

// Placeholder for C++ execution (requires backend service)
export const executeCpp = async (_code: string): Promise<ExecutionResult> => {
  throw errors.executionError(
    'C++ execution not implemented yet. Please use an online C++ compiler.'
  )
}
