/**
 * PistonExecutor Service for Auto-Grading System
 *
 * Executes Python and C++ code using the public Piston API.
 * This provides a zero-cost, serverless execution environment with strong sandboxing.
 */

import { logger } from '../utils/logger'
import type { ExecutionResult } from './grading.types'

const PISTON_API_URL = 'https://emkc.org/api/v2/piston/execute'

export class PistonExecutorService {
  /**
   * Execute code via Piston API
   *
   * @param language - 'python' or 'cpp'
   * @param code - Source code to execute
   * @param input - Input data to pass to stdin
   * @param timeout - Execution timeout (ms)
   */
  async execute(
    language: string,
    code: string,
    input: unknown = null,
    timeout: number = 5000
  ): Promise<ExecutionResult> {
    const startTime = Date.now()
    
    // Map internal language ids to Piston language ids
    const pistonLang = language === 'c++' || language === 'cpp' ? 'cpp' : language

    try {
      // Format input for stdin
      const stdinStr = this.formatInput(input)

      // Payload for Piston
      const payload = {
        language: pistonLang,
        version: '*', // Use latest available version
        files: [
          {
            name: pistonLang === 'cpp' ? 'main.cpp' : 'main.py',
            content: code,
          },
        ],
        stdin: stdinStr,
        compile_timeout: timeout,
        run_timeout: timeout,
      }

      const response = await fetch(PISTON_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(`Piston API Error: ${response.status} ${response.statusText}`)
      }

      interface PistonResponse {
        compile?: {
          code: number
          stderr?: string
          output?: string
        }
        run?: {
          code: number | null
          stdout: string
          stderr: string
          signal: string | null
        }
      }

      const data = await response.json() as PistonResponse

      // Piston returns compile errors in data.compile (if applicable) and run results in data.run
      const compileResult = data.compile
      const runResult = data.run

      let stdout = ''
      let stderr = ''
      let exitCode = 1
      let errorStr: string | null = null

      if (compileResult && compileResult.code !== 0) {
        // Compilation failed
        stderr = compileResult.stderr || compileResult.output || ''
        exitCode = compileResult.code
        errorStr = 'Compilation Error'
      } else if (runResult) {
        // Execution result
        stdout = runResult.stdout
        stderr = runResult.stderr
        exitCode = runResult.code !== null ? runResult.code : 1
        
        if (runResult.signal === 'SIGKILL') {
          errorStr = 'Execution Timeout or Out of Memory'
          exitCode = 124
        } else if (exitCode !== 0) {
          errorStr = stderr.trim() || `Program exited with code ${exitCode}`
        }
      } else {
        errorStr = 'Unknown Piston API response format'
      }

      // Try to parse stdout to capture the output value (like JavaScript execution does)
      let output: unknown = stdout.trim()
      try {
        output = JSON.parse(stdout.trim())
      } catch {
        const trimmed = stdout.trim()
        if (trimmed && !isNaN(Number(trimmed))) {
          output = Number(trimmed)
        }
      }

      return {
        output,
        stdout,
        stderr,
        exitCode,
        executionTime: Date.now() - startTime,
        error: errorStr,
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      logger.error(`Piston execution failed for ${language}:`, errorMessage)
      
      return {
        output: null,
        stdout: '',
        stderr: errorMessage,
        exitCode: 1,
        executionTime: Date.now() - startTime,
        error: `Execution Service Error: ${errorMessage}`,
      }
    }
  }

  /**
   * Format input for program stdin
   */
  private formatInput(input: unknown): string {
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
      // Format array as space-separated or line-separated values
      return input.map(item => this.formatInput(item)).join(' ')
    }

    try {
      return JSON.stringify(input)
    } catch {
      return String(input)
    }
  }
}

export function createPistonExecutor(): PistonExecutorService {
  return new PistonExecutorService()
}
