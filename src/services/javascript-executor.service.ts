import { decodeIsolateValue, resultSerializerSource } from './execution/serialized-value'
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
import { executionGate } from './execution/gate'
import { CapturedOutput } from './execution/captured-output'
import { RunnerUnavailableError } from './execution/errors'
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
    return executionGate.run(() => this.executeJob(code, input, timeout))
  }

  private async executeJob(
    code: string,
    input: unknown,
    timeout: number
  ): Promise<ExecutionResult> {
    const startTime = Date.now()
    const stdout = new CapturedOutput()
    const stderr = new CapturedOutput()
    let isolate: ivm.Isolate | undefined

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

      if (!Number.isInteger(timeout) || timeout <= 0 || timeout > 60000) {
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
      isolate = new ivm.Isolate({ memoryLimit: this.memoryLimit / (1024 * 1024) })
      const context = isolate.createContextSync()
      const jail = context.global
      jail.setSync('global', jail.derefInto())

      // Limit each copied console message in the isolate before crossing into the host.
      const logCallback = (value: unknown) => stdout.write(value)
      const errorCallback = (value: unknown) => stderr.write(value)
      const warnCallback = (value: unknown) => stderr.write(value, 'Warning: ')

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

      context.evalSync(
        `
        ${inputCode}
        global.console = (() => {
          const log = _logCallback, error = _errorCallback, warn = _warnCallback;
          delete global._logCallback;
          delete global._errorCallback;
          delete global._warnCallback;
          const format = args => args.map(arg => {
            if (typeof arg === 'object' && arg !== null) {
              try { return JSON.stringify(arg); } catch { return String(arg); }
            }
            return String(arg);
          }).join(' ').slice(0, 5001);
          return {
            log: (...args) => log.applySync(undefined, [format(args)]),
            info: (...args) => log.applySync(undefined, [format(args)]),
            error: (...args) => error.applySync(undefined, [format(args)]),
            warn: (...args) => warn.applySync(undefined, [format(args)])
          };
        })();
      `,
        { timeout }
      )
      // Serialize inside the isolate with a captured intrinsic and a size limit before copying.
      const serialize = context.evalSync(resultSerializerSource, { reference: true, timeout })

      let output: any
      try {
        const script = await isolate.compileScript(code)
        const result = await script.run(context, { timeout, reference: true })

        const json = await serialize.apply(undefined, [result.derefInto()], { timeout })
        if (typeof json !== 'string') throw new Error('Invalid serialized result')
        output = decodeIsolateValue(json)
      } catch (vmError: any) {
        const errorMessage = String(vmError.message || vmError).slice(0, 5000)

        // Check if it's a timeout error
        if (errorMessage.includes('Script execution timed out')) {
          return {
            output: null,
            stdout: stdout.text(),
            stderr: stderr.text(),
            exitCode: 124, // Standard timeout exit code
            executionTime: timeout,
            error: `Execution exceeded timeout of ${timeout}ms`,
          }
        }

        // Check if it's a syntax error
        if (errorMessage.includes('SyntaxError') || vmError.name === 'SyntaxError') {
          return {
            output: null,
            stdout: stdout.text(),
            stderr: errorMessage,
            exitCode: 1,
            executionTime: Date.now() - startTime,
            error: `Syntax Error: ${errorMessage}`,
          }
        }

        // Runtime error
        return {
          output: null,
          stdout: stdout.text(),
          stderr: errorMessage,
          exitCode: 1,
          executionTime: Date.now() - startTime,
          error: errorMessage,
        }
      }

      if (stdout.truncated || stderr.truncated)
        return {
          output: null,
          stdout: stdout.text(),
          stderr: stderr.text(),
          exitCode: 1,
          executionTime: Date.now() - startTime,
          error: 'Output limit exceeded',
        }

      // Successful execution
      return {
        output,
        stdout: stdout.text(),
        stderr: stderr.text(),
        exitCode: 0,
        executionTime: Date.now() - startTime,
        error: null,
      }
    } catch {
      throw new RunnerUnavailableError()
    } finally {
      if (isolate && !isolate.isDisposed) isolate.dispose()
    }
  }
}

/**
 * Factory function to create a JavaScriptExecutor instance
 */
export function createJavaScriptExecutor(): JavaScriptExecutor {
  return new JavaScriptExecutor()
}
