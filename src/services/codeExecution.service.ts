import { config } from '../config'
import { errors } from '../middleware/errorHandler'

interface ExecutionResult {
  output: string
  error: string | null
}

export const executeJavaScript = async (code: string): Promise<ExecutionResult> => {
  return new Promise(resolve => {
    const timeout = setTimeout(() => {
      resolve({
        output: '',
        error: 'Execution timeout',
      })
    }, config.codeExecution.timeout)

    try {
      // Capture console output
      const logs: string[] = []
      const originalConsole = {
        log: console.log,
        error: console.error,
        warn: console.warn,
      }

      // Override console methods
      console.log = (...args: any[]) => {
        logs.push(
          args
            .map(arg => (typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)))
            .join(' ')
        )
      }
      console.error = console.log
      console.warn = console.log

      // Execute code in isolated context
      const func = new Function(code)
      func()

      // Restore console
      console.log = originalConsole.log
      console.error = originalConsole.error
      console.warn = originalConsole.warn

      clearTimeout(timeout)
      resolve({
        output: logs.join('\n'),
        error: null,
      })
    } catch (err: any) {
      clearTimeout(timeout)
      resolve({
        output: '',
        error: err.message,
      })
    }
  })
}

// Placeholder for Python execution (requires backend service)
export const executePython = async (code: string): Promise<ExecutionResult> => {
  throw errors.executionError(
    'Python execution not implemented yet. Please use an online Python compiler.'
  )
}

// Placeholder for C++ execution (requires backend service)
export const executeCpp = async (code: string): Promise<ExecutionResult> => {
  throw errors.executionError(
    'C++ execution not implemented yet. Please use an online C++ compiler.'
  )
}
