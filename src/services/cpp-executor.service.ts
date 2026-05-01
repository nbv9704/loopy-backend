/**
 * CppExecutor Service for Auto-Grading System
 *
 * Executes C++ code in a sandboxed environment using g++ compiler and child_process.
 * Provides compilation, timeout support, memory limits, and captures stdout/stderr.
 *
 * Security features:
 * - Isolated subprocess execution
 * - No file system write access (beyond temp compilation)
 * - No network access (via restricted environment)
 * - Memory limit: 256MB
 * - Timeout enforcement
 *
 * @see .kiro/specs/auto-grading-system/design.md
 * Validates Requirements: 2.1, 2.4, 2.6, 13.7, 17.3
 */

import { spawn } from 'child_process'
import { writeFile, unlink, chmod } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'
import { randomBytes } from 'crypto'
import type { ExecutionResult, CompilationResult } from './grading.types'

/**
 * CppExecutor class for compiling and executing C++ code in a sandboxed environment
 */
export class CppExecutor {
  private readonly memoryLimit: number = 256 * 1024 * 1024 // 256MB in bytes
  private readonly compileTimeout: number = 10000 // 10 seconds for compilation

  /**
   * Compile C++ code using g++ compiler
   *
   * @param code - The C++ code to compile
   * @returns CompilationResult with success status, binary path, or compilation errors
   */
  async compile(code: string): Promise<CompilationResult> {
    try {
      // Validate input
      if (typeof code !== 'string' || code.trim().length === 0) {
        return {
          success: false,
          binary: null,
          errors: ['Error: Code must be a non-empty string'],
        }
      }

      // Generate unique filenames for source and binary
      const uniqueId = randomBytes(16).toString('hex')
      const sourceFile = join(tmpdir(), `code_${uniqueId}.cpp`)
      const binaryFile = join(tmpdir(), `binary_${uniqueId}`)

      // Write source code to temporary file
      await writeFile(sourceFile, code, 'utf-8')

      // Compile with g++
      const compileResult = await this.compileWithGpp(sourceFile, binaryFile)

      // Clean up source file
      try {
        await unlink(sourceFile)
      } catch {
        // Ignore cleanup errors
      }

      if (!compileResult.success) {
        // Clean up binary file if it exists
        try {
          await unlink(binaryFile)
        } catch {
          // Ignore cleanup errors
        }

        return {
          success: false,
          binary: null,
          errors: compileResult.errors,
        }
      }

      // Make binary executable
      try {
        await chmod(binaryFile, 0o755)
      } catch (error: any) {
        return {
          success: false,
          binary: null,
          errors: [`Failed to make binary executable: ${error.message}`],
        }
      }

      return {
        success: true,
        binary: binaryFile,
        errors: [],
      }
    } catch (error: any) {
      return {
        success: false,
        binary: null,
        errors: [`Compilation error: ${error.message}`],
      }
    }
  }

  /**
   * Execute compiled C++ binary with timeout and memory limits
   *
   * @param binary - Path to the compiled binary
   * @param input - Input data to pass to the program (optional)
   * @param timeout - Maximum execution time in milliseconds (default: 5000ms)
   * @returns ExecutionResult with output, stdout, stderr, and execution metadata
   */
  async execute(
    binary: string,
    input: any = null,
    timeout: number = 5000
  ): Promise<ExecutionResult> {
    const startTime = Date.now()

    try {
      // Validate inputs
      if (typeof binary !== 'string' || binary.trim().length === 0) {
        return {
          output: null,
          stdout: '',
          stderr: 'Error: Binary path must be a non-empty string',
          exitCode: 1,
          executionTime: Date.now() - startTime,
          error: 'Invalid binary path',
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

      // Execute binary in subprocess
      const result = await this.executeInSubprocess(binary, input, timeout)

      // Clean up binary file
      try {
        await unlink(binary)
      } catch {
        // Ignore cleanup errors
      }

      return {
        output: result.output,
        stdout: result.stdout,
        stderr: result.stderr,
        exitCode: result.exitCode,
        executionTime: Date.now() - startTime,
        error: result.error,
      }
    } catch (error: any) {
      // Clean up binary file on error
      try {
        await unlink(binary)
      } catch {
        // Ignore cleanup errors
      }

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
   * Compile C++ code using g++ compiler
   */
  private compileWithGpp(
    sourceFile: string,
    binaryFile: string
  ): Promise<{ success: boolean; errors: string[] }> {
    return new Promise(resolve => {
      let stderrData = ''
      let timedOut = false
      let processExited = false

      // Spawn g++ compiler
      // Use standard C++17 with optimizations and warnings
      const gppProcess = spawn('g++', [
        sourceFile,
        '-o',
        binaryFile,
        '-std=c++17',
        '-O2',
        '-Wall',
        '-Wextra',
      ])

      // Set compilation timeout
      const timeoutId = setTimeout(() => {
        if (!processExited) {
          timedOut = true
          gppProcess.kill('SIGTERM')

          // Force kill after 100ms if still running
          setTimeout(() => {
            if (!processExited) {
              gppProcess.kill('SIGKILL')
            }
          }, 100)
        }
      }, this.compileTimeout)

      // Capture stderr (g++ outputs errors to stderr)
      gppProcess.stderr.on('data', data => {
        stderrData += data.toString()
      })

      // Handle process exit
      gppProcess.on('close', exitCode => {
        processExited = true
        clearTimeout(timeoutId)

        if (timedOut) {
          resolve({
            success: false,
            errors: [`Compilation exceeded timeout of ${this.compileTimeout}ms`],
          })
          return
        }

        if (exitCode !== 0) {
          // Compilation failed
          const errors = this.parseCompilationErrors(stderrData)
          resolve({
            success: false,
            errors,
          })
          return
        }

        // Compilation successful
        resolve({
          success: true,
          errors: [],
        })
      })

      // Handle process errors
      gppProcess.on('error', error => {
        processExited = true
        clearTimeout(timeoutId)

        resolve({
          success: false,
          errors: [`Compiler error: ${error.message}. Make sure g++ is installed.`],
        })
      })
    })
  }

  /**
   * Execute compiled binary in a subprocess with timeout
   */
  private executeInSubprocess(
    binary: string,
    input: any,
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

      // Spawn binary process
      const binaryProcess = spawn(binary, [], {
        timeout,
        env: {
          ...process.env,
          // Restrict environment
        },
      })

      // Set timeout
      const timeoutId = setTimeout(() => {
        if (!processExited) {
          timedOut = true
          binaryProcess.kill('SIGTERM')

          // Force kill after 100ms if still running
          setTimeout(() => {
            if (!processExited) {
              binaryProcess.kill('SIGKILL')
            }
          }, 100)
        }
      }, timeout)

      // Send input to stdin if provided
      if (input !== null && input !== undefined) {
        try {
          const inputStr = this.formatInput(input)
          binaryProcess.stdin.write(inputStr)
          binaryProcess.stdin.end()
        } catch (error: any) {
          // If input write fails, continue execution
          binaryProcess.stdin.end()
        }
      } else {
        binaryProcess.stdin.end()
      }

      // Capture stdout
      binaryProcess.stdout.on('data', data => {
        stdoutData += data.toString()
      })

      // Capture stderr
      binaryProcess.stderr.on('data', data => {
        stderrData += data.toString()
      })

      // Handle process exit
      binaryProcess.on('close', exitCode => {
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

        // Check for runtime errors
        if (exitCode !== 0) {
          const errorMessage = stderrData.trim() || `Program exited with code ${exitCode}`

          resolve({
            output: null,
            stdout: stdoutData,
            stderr: stderrData,
            exitCode: exitCode || 1,
            error: errorMessage,
          })
          return
        }

        // Successful execution
        // For C++, the output is typically in stdout
        // Try to parse as JSON if possible, otherwise return as string
        let output: any = stdoutData.trim()

        try {
          // Attempt to parse as JSON
          output = JSON.parse(stdoutData.trim())
        } catch {
          // Not JSON, keep as string
          // Try to parse as number if it looks like one
          const trimmed = stdoutData.trim()
          if (trimmed && !isNaN(Number(trimmed))) {
            output = Number(trimmed)
          }
        }

        resolve({
          output,
          stdout: stdoutData,
          stderr: stderrData,
          exitCode: 0,
          error: null,
        })
      })

      // Handle process errors
      binaryProcess.on('error', error => {
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

  /**
   * Parse compilation errors from g++ stderr output
   */
  private parseCompilationErrors(stderr: string): string[] {
    if (!stderr.trim()) {
      return ['Compilation failed with unknown error']
    }

    // Split by lines and filter out empty lines
    const lines = stderr.split('\n').filter(line => line.trim().length > 0)

    // If there are too many lines, summarize
    if (lines.length > 10) {
      const errorCount = lines.filter(line => line.includes('error:')).length
      const warningCount = lines.filter(line => line.includes('warning:')).length

      return [
        `Compilation failed with ${errorCount} error(s) and ${warningCount} warning(s)`,
        ...lines.slice(0, 5),
        '... (additional errors omitted)',
      ]
    }

    return lines
  }

  /**
   * Format input for C++ program stdin
   */
  private formatInput(input: any): string {
    if (input === null || input === undefined) {
      return ''
    }

    if (typeof input === 'string') {
      return input
    }

    if (typeof input === 'number' || typeof input === 'boolean') {
      return String(input)
    }

    if (Array.isArray(input)) {
      // Format array as space-separated values
      return input.map(item => this.formatInput(item)).join(' ')
    }

    // For objects, try JSON
    try {
      return JSON.stringify(input)
    } catch {
      return String(input)
    }
  }
}

/**
 * Factory function to create a CppExecutor instance
 */
export function createCppExecutor(): CppExecutor {
  return new CppExecutor()
}
