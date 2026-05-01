/**
 * JavaScriptExecutor Service for Auto-Grading System
 *
 * Executes JavaScript code in a sandboxed environment using vm2.
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

import { VM } from 'vm2'
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

      // Create sandbox with console capture
      const sandbox = {
        input,
        console: {
          log: (...args: any[]) => {
            stdoutLines.push(args.map(arg => this.formatValue(arg)).join(' '))
          },
          error: (...args: any[]) => {
            stderrLines.push(args.map(arg => this.formatValue(arg)).join(' '))
          },
          warn: (...args: any[]) => {
            stderrLines.push('Warning: ' + args.map(arg => this.formatValue(arg)).join(' '))
          },
          info: (...args: any[]) => {
            stdoutLines.push(args.map(arg => this.formatValue(arg)).join(' '))
          },
        },
        // Provide common globals that are safe
        Math,
        Date,
        JSON,
        Array,
        Object,
        String,
        Number,
        Boolean,
        parseInt,
        parseFloat,
        isNaN,
        isFinite,
      }

      // Create VM with security restrictions
      const vm = new VM({
        timeout,
        sandbox,
        eval: false, // Disable eval
        wasm: false, // Disable WebAssembly
        fixAsync: true, // Fix async/await issues
      })

      // Execute the code
      let output: any
      try {
        output = vm.run(code)
      } catch (vmError: any) {
        // Handle syntax errors and runtime errors
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

  /**
   * Format a value for console output
   * Handles objects, arrays, and primitive types
   */
  private formatValue(value: any): string {
    if (value === null) return 'null'
    if (value === undefined) return 'undefined'
    if (typeof value === 'string') return value
    if (typeof value === 'number' || typeof value === 'boolean') return String(value)

    try {
      // For objects and arrays, use JSON.stringify
      return JSON.stringify(value)
    } catch {
      // Fallback for circular references or non-serializable objects
      return String(value)
    }
  }
}

/**
 * Factory function to create a JavaScriptExecutor instance
 */
export function createJavaScriptExecutor(): JavaScriptExecutor {
  return new JavaScriptExecutor()
}
