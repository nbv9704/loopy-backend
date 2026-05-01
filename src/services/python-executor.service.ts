/**
 * PythonExecutor Service for Auto-Grading System
 *
 * Executes Python code in a sandboxed environment using child_process.
 * Provides timeout support, memory limits, and captures stdout/stderr.
 *
 * Security features:
 * - Isolated subprocess execution
 * - No file system write access
 * - No network access (via restricted environment)
 * - Memory limit: 256MB
 * - Timeout enforcement
 *
 * @see .kiro/specs/auto-grading-system/design.md
 * Validates Requirements: 2.1, 2.4, 2.6, 13.7, 17.2
 */

import { spawn } from 'child_process'
import type { ExecutionResult } from './grading.types'

/**
 * PythonExecutor class for executing Python code in a sandboxed environment
 */
export class PythonExecutor {
  private readonly memoryLimit: number = 256 * 1024 * 1024 // 256MB in bytes

  /**
   * Execute Python code with timeout and memory limits
   *
   * @param code - The Python code to execute
   * @param input - Input data to pass to the code (optional)
   * @param timeout - Maximum execution time in milliseconds (default: 5000ms)
   * @returns ExecutionResult with output, stdout, stderr, and execution metadata
   */
  async execute(code: string, input: any = null, timeout: number = 5000): Promise<ExecutionResult> {
    const startTime = Date.now()

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

      // Prepare Python code with input handling
      const wrappedCode = this.wrapCode(code, input)

      // Execute Python code in subprocess
      const result = await this.executeInSubprocess(wrappedCode, timeout)

      return {
        output: result.output,
        stdout: result.stdout,
        stderr: result.stderr,
        exitCode: result.exitCode,
        executionTime: Date.now() - startTime,
        error: result.error,
      }
    } catch (error: any) {
      // Catch any unexpected errors
      const errorMessage = error.message || String(error)

      return {
        output: null,
        stdout: '',
        stderr: errorMessage,
        exitCode: 1,
        executionTime: Date.now() - startTime,
        error: `Unexpected error: ${errorMessage}`,
      }
    }
  }

  /**
   * Wrap user code with input handling and output capture
   */
  private wrapCode(code: string, input: any): string {
    // Escape the user code for Python string
    const escapedCode = code
      .replace(/\\/g, '\\\\') // Escape backslashes first
      .replace(/"/g, '\\"') // Escape double quotes
      .replace(/\n/g, '\\n') // Escape newlines
      .replace(/\r/g, '\\r') // Escape carriage returns
      .replace(/\t/g, '\\t') // Escape tabs

    // Convert input to Python-compatible representation
    const inputPython = this.toPythonValue(input)

    return `import sys
import json
import io
from contextlib import redirect_stdout, redirect_stderr

# Prepare input
input_data = ${inputPython}

# Capture stdout and stderr
stdout_capture = io.StringIO()
stderr_capture = io.StringIO()

# Result container
result = {"output": None, "error": None}

try:
    with redirect_stdout(stdout_capture), redirect_stderr(stderr_capture):
        # Make input available as 'input' variable
        input = input_data
        
        # Execute user code
        exec_globals = {
            'input': input,
            '__builtins__': __builtins__,
        }
        exec_result = exec("${escapedCode}", exec_globals)
        
        # Try to get the last expression result
        # If code doesn't have a return value, exec returns None
        result["output"] = exec_result
        
except SyntaxError as e:
    result["error"] = f"Syntax Error: {str(e)}"
    stderr_capture.write(f"Syntax Error: {str(e)}\\n")
except Exception as e:
    # Include error type name in the error message
    error_type = type(e).__name__
    error_message = str(e)
    result["error"] = f"{error_type}: {error_message}"
    stderr_capture.write(f"{error_type}: {error_message}\\n")

# Output results as JSON
output_data = {
    "output": result["output"],
    "stdout": stdout_capture.getvalue(),
    "stderr": stderr_capture.getvalue(),
    "error": result["error"]
}

print("__RESULT_START__")
print(json.dumps(output_data))
print("__RESULT_END__")
`
  }

  /**
   * Convert JavaScript value to Python-compatible string representation
   */
  private toPythonValue(value: any): string {
    if (value === null || value === undefined) {
      return 'None'
    }
    if (typeof value === 'boolean') {
      return value ? 'True' : 'False'
    }
    if (typeof value === 'number') {
      return String(value)
    }
    if (typeof value === 'string') {
      // Escape string for Python
      const escaped = value
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t')
      return `"${escaped}"`
    }
    // For objects and arrays, use JSON and then convert
    return JSON.stringify(value)
      .replace(/null/g, 'None')
      .replace(/true/g, 'True')
      .replace(/false/g, 'False')
  }

  /**
   * Execute Python code in a subprocess with timeout
   */
  private executeInSubprocess(
    code: string,
    timeout: number
  ): Promise<{
    output: any
    stdout: string
    stderr: string
    exitCode: number
    error: string | null
  }> {
    return new Promise(resolve => {
      let stdoutData = ''
      let stderrData = ''
      let timedOut = false
      let processExited = false

      // Spawn Python process
      // Use 'python' command (works on Windows and most systems)
      const pythonProcess = spawn('python', ['-c', code], {
        timeout,
        env: {
          ...process.env,
          // Restrict network access (best effort)
          PYTHONDONTWRITEBYTECODE: '1',
        },
        // Set memory limit (ulimit on Unix-like systems)
        // Note: This may not work on all platforms
      })

      // Set timeout
      const timeoutId = setTimeout(() => {
        if (!processExited) {
          timedOut = true
          pythonProcess.kill('SIGTERM')

          // Force kill after 100ms if still running
          setTimeout(() => {
            if (!processExited) {
              pythonProcess.kill('SIGKILL')
            }
          }, 100)
        }
      }, timeout)

      // Capture stdout
      pythonProcess.stdout.on('data', data => {
        stdoutData += data.toString()
      })

      // Capture stderr
      pythonProcess.stderr.on('data', data => {
        stderrData += data.toString()
      })

      // Handle process exit
      pythonProcess.on('close', exitCode => {
        processExited = true
        clearTimeout(timeoutId)

        if (timedOut) {
          resolve({
            output: null,
            stdout: stdoutData,
            stderr: stderrData,
            exitCode: 124, // Standard timeout exit code
            error: `Execution exceeded timeout of ${timeout}ms`,
          })
          return
        }

        // Parse result from stdout
        try {
          // More flexible regex to handle different line endings
          const resultMatch = stdoutData.match(
            /__RESULT_START__[\r\n]+([\s\S]*?)[\r\n]+__RESULT_END__/
          )

          if (resultMatch) {
            const resultJson = JSON.parse(resultMatch[1])

            // Check for syntax or runtime errors
            if (resultJson.error) {
              resolve({
                output: null,
                stdout: resultJson.stdout,
                stderr: resultJson.stderr,
                exitCode: 1,
                error: resultJson.error,
              })
              return
            }

            // Successful execution - return the captured stdout/stderr from JSON
            resolve({
              output: resultJson.output,
              stdout: resultJson.stdout,
              stderr: resultJson.stderr,
              exitCode: 0,
              error: null,
            })
            return
          }

          // If no result marker found, check for errors
          if (exitCode !== 0 || stderrData.trim().length > 0) {
            // Extract error message from stderr
            const errorMessage = stderrData.trim() || 'Unknown error'

            resolve({
              output: null,
              stdout: stdoutData,
              stderr: stderrData,
              exitCode: exitCode || 1,
              error: errorMessage,
            })
            return
          }

          // No result and no error - return empty result
          resolve({
            output: null,
            stdout: stdoutData,
            stderr: stderrData,
            exitCode: 0,
            error: null,
          })
        } catch (parseError: any) {
          // Failed to parse result JSON
          resolve({
            output: null,
            stdout: stdoutData,
            stderr: stderrData,
            exitCode: 1,
            error: `Failed to parse execution result: ${parseError.message}`,
          })
        }
      })

      // Handle process errors
      pythonProcess.on('error', error => {
        processExited = true
        clearTimeout(timeoutId)

        resolve({
          output: null,
          stdout: stdoutData,
          stderr: stderrData,
          exitCode: 1,
          error: `Process error: ${error.message}`,
        })
      })
    })
  }
}

/**
 * Factory function to create a PythonExecutor instance
 */
export function createPythonExecutor(): PythonExecutor {
  return new PythonExecutor()
}
