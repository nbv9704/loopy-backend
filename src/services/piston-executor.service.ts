/**
 * PistonExecutor Service for Auto-Grading System
 *
 * Executes Python and C++ code using the public Piston API.
 * This provides a zero-cost, serverless execution environment with strong sandboxing.
 */

import { logger } from '../utils/logger'
import { config } from '../config'
import type { ExecutionResult } from './grading.types'

export type PistonLanguageId = 'python' | 'cpp' | 'java' | 'go' | 'rust'

export const PISTON_LANGUAGE_CONFIG: Record<PistonLanguageId, { pistonLanguage: string; filename: string }> = {
  python: { pistonLanguage: 'python', filename: 'main.py' },
  cpp: { pistonLanguage: 'cpp', filename: 'main.cpp' },
  java: { pistonLanguage: 'java', filename: 'Main.java' },
  go: { pistonLanguage: 'go', filename: 'main.go' },
  rust: { pistonLanguage: 'rust', filename: 'main.rs' },
}

export const PISTON_LANGUAGE_ALIASES: Record<string, PistonLanguageId> = {
  python: 'python',
  py: 'python',
  cpp: 'cpp',
  'c++': 'cpp',
  java: 'java',
  go: 'go',
  golang: 'go',
  rust: 'rust',
  rs: 'rust',
}

export const normalizePistonLanguage = (language: string): PistonLanguageId | null => {
  return PISTON_LANGUAGE_ALIASES[language.toLowerCase()] || null
}

export const isPistonLanguage = (language: string): boolean => normalizePistonLanguage(language) !== null

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
    const normalizedLanguage = normalizePistonLanguage(language)
    if (!normalizedLanguage) {
      return {
        output: null,
        stdout: '',
        stderr: `Unsupported Piston language: ${language}`,
        exitCode: 1,
        executionTime: Date.now() - startTime,
        error: `Unsupported Piston language: ${language}`,
      }
    }

    const pistonConfig = PISTON_LANGUAGE_CONFIG[normalizedLanguage]
    const pistonLang = pistonConfig.pistonLanguage

    try {
      // Format input for stdin
      const stdinStr = this.formatInput(input)

      // Payload for Piston
      const payload = {
        language: pistonLang,
        version: '*', // Use latest available version
        files: [
          {
            name: pistonConfig.filename,
            content: code,
          },
        ],
        stdin: stdinStr,
        compile_timeout: timeout,
        run_timeout: timeout,
      }

      // HTTP-level timeout to prevent hanging when Piston is unresponsive
      const httpTimeout = Math.max(timeout * 2, 30000) // At least 30s, or 2x the execution timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), httpTimeout)

      try {
        const response = await fetch(config.piston.apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(config.piston.apiKey ? { Authorization: config.piston.apiKey } : {}),
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

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
      } finally {
        clearTimeout(timeoutId)
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error 
        ? (error.name === 'AbortError' ? 'Piston API request timed out' : error.message) 
        : String(error)
      logger.error(`Piston execution failed for ${language}`, { error: errorMessage })
      
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
