/**
 * JavaScriptExecutor Service for Auto-Grading System
 *
 * Executes JavaScript code in a sandboxed environment using isolated-vm.
 * Provides timeout support, memory limits, and captures stdout/stderr.
 *
 * Security features:
 * - No file system access
 * - No network access
 * - Memory limit: 256MB
 * - Timeout enforcement
 *
 * @see .kiro/specs/auto-grading-system/design.md
 * Validates Requirements: 2.1, 2.4, 2.6, 13.7, 17.1
 */

import ivm from 'isolated-vm'
import type { ExecutionResult } from './grading.types'

/**
 * JavaScriptExecutor class for executing JavaScript code in a sandboxed environment
 */
export class JavaScriptExecutor {
  private readonly memoryLimit: number = 256 * 1024 * 1024 // 256MB in bytes

  /**
   * Execute JavaScript code with timeout and memory limits
   *
   * @param code - The JavaScript code to execute
   * @param input - Input data to pass to the code (optional)
   * @param timeout - Maximum execution time in milliseconds (default: 5000ms)
   * @returns ExecutionResult with output, stdout, stderr, and execution metadata
   */
  async execute(code: string, input: any = null, timeout: number = 5000): Promise<ExecutionResult> {
    const startTime = Date.now()
    const stdoutLines: string[] = []
    const stderrLines: string[] = []

    try {
      // Validate inputs
      if (typeof code !== 'string' || code.trim().length === 0) {
        return {
          output: null,
          stdout: '',
          stderr: 'Error: Code must be a non-empty string',
          exitCode: 1,
          executionTime: Date.now() - startTime,
          error: 'Invalid code input',
        }
      }

      if (timeout <= 0) {
        return {
          output: null,
          stdout: '',
          stderr: 'Error: Timeout must be a positive number',
          exitCode: 1,
          executionTime: Date.now() - startTime,
          error: 'Invalid timeout value',
        }
      }

      // Create sandbox using isolated-vm
      const isolate = new ivm.Isolate({ memoryLimit: this.memoryLimit / (1024 * 1024) })
      const context = isolate.createContextSync()
      const jail = context.global
      jail.setSync('global', jail.derefInto())

      // Set up console capturing with limits to prevent OOM
      const MAX_LOG_LINES = 1000;
      const MAX_LOG_LENGTH = 5000;

      const logCallback = function(str: string) {
        if (stdoutLines.length < MAX_LOG_LINES) {
          stdoutLines.push(str.substring(0, MAX_LOG_LENGTH))
        } else if (stdoutLines.length === MAX_LOG_LINES) {
          stdoutLines.push('...[Output truncated due to limit]')
        }
      }
      const errorCallback = function(str: string) {
        if (stderrLines.length < MAX_LOG_LINES) {
          stderrLines.push(str.substring(0, MAX_LOG_LENGTH))
        } else if (stderrLines.length === MAX_LOG_LINES) {
          stderrLines.push('...[Error truncated due to limit]')
        }
      }
      const warnCallback = function(str: string) {
        if (stderrLines.length < MAX_LOG_LINES) {
          stderrLines.push('Warning: ' + str.substring(0, MAX_LOG_LENGTH))
        } else if (stderrLines.length === MAX_LOG_LINES) {
          stderrLines.push('...[Warning truncated due to limit]')
        }
      }

      jail.setSync('_logCallback', new ivm.Reference(logCallback))
      jail.setSync('_errorCallback', new ivm.Reference(errorCallback))
      jail.setSync('_warnCallback', new ivm.Reference(warnCallback))

      // Setup inputs if present
      let inputCode = 'const input = null;'
      if (input !== undefined) {
        try {
          inputCode = `const input = JSON.parse(${JSON.stringify(JSON.stringify(input))});`
        } catch {
          inputCode = `const input = null;`
        }
      }

      context.evalSync(`
        ${inputCode}
        global.console = {
          log: (...args) => {
            const serialized = args.map(arg => {
              if (typeof arg === 'object' && arg !== null) {
                try { return JSON.stringify(arg); } catch(e) { return String(arg); }
              }
              return String(arg);
            });
            _logCallback.applySync(undefined, [serialized.join(' ')]);
          },
          error: (...args) => {
            const serialized = args.map(arg => {
              if (typeof arg === 'object' && arg !== null) {
                try { return JSON.stringify(arg); } catch(e) { return String(arg); }
              }
              return String(arg);
            });
            _errorCallback.applySync(undefined, [serialized.join(' ')]);
          },
          warn: (...args) => {
            const serialized = args.map(arg => {
              if (typeof arg === 'object' && arg !== null) {
                try { return JSON.stringify(arg); } catch(e) { return String(arg); }
              }
              return String(arg);
            });
            _warnCallback.applySync(undefined, [serialized.join(' ')]);
          },
          info: (...args) => {
            const serialized = args.map(arg => {
              if (typeof arg === 'object' && arg !== null) {
                try { return JSON.stringify(arg); } catch(e) { return String(arg); }
              }
              return String(arg);
            });
            _logCallback.applySync(undefined, [serialized.join(' ')]);
          }
        };
      `)

      let output: any
      try {
        const script = await isolate.compileScript(code)
        const result = await script.run(context, { timeout, reference: true })

        if (result && typeof result === 'object' && typeof result.copySync === 'function') {
          output = result.copySync()
        } else {
          output = result
        }
      } catch (vmError: any) {
        const errorMessage = vmError.message || String(vmError)

        // Check if it's a timeout error
        if (errorMessage.includes('Script execution timed out')) {
          return {
            output: null,
            stdout: stdoutLines.join('\n'),
            stderr: stderrLines.join('\n'),
            exitCode: 124, // Standard timeout exit code
            executionTime: timeout,
            error: `Execution exceeded timeout of ${timeout}ms`,
          }
        }

        // Check if it's a syntax error
        if (errorMessage.includes('SyntaxError') || vmError.name === 'SyntaxError') {
          return {
            output: null,
            stdout: stdoutLines.join('\n'),
            stderr: errorMessage,
            exitCode: 1,
            executionTime: Date.now() - startTime,
            error: `Syntax Error: ${errorMessage}`,
          }
        }

        // Runtime error
        return {
          output: null,
          stdout: stdoutLines.join('\n'),
          stderr: errorMessage,
          exitCode: 1,
          executionTime: Date.now() - startTime,
          error: errorMessage,
        }
      } finally {
        isolate.dispose()
      }

      // Successful execution
      return {
        output,
        stdout: stdoutLines.join('\n'),
        stderr: stderrLines.join('\n'),
        exitCode: 0,
        executionTime: Date.now() - startTime,
        error: null,
      }
    } catch (error: any) {
      // Catch any unexpected errors
      const errorMessage = error.message || String(error)

      return {
        output: null,
        stdout: stdoutLines.join('\n'),
        stderr: errorMessage,
        exitCode: 1,
        executionTime: Date.now() - startTime,
        error: `Unexpected error: ${errorMessage}`,
      }
    }
  }

}

/**
 * Factory function to create a JavaScriptExecutor instance
 */
export function createJavaScriptExecutor(): JavaScriptExecutor {
  return new JavaScriptExecutor()
}
