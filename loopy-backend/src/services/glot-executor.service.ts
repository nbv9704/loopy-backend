/**
 * GlotExecutor Service for temporary multi-language code execution fallback.
 *
 * Glot.io is used only when the self-hosted Piston runner is not configured.
 * Keep this adapter small and compatible with ExecutionResult so it can be
 * swapped out once Piston is available in production.
 */

import { config } from '../config'
import { logger } from '../utils/logger'
import type { ExecutionResult } from './grading.types'
import { PISTON_LANGUAGE_CONFIG, type PistonLanguageId, normalizePistonLanguage } from './piston-executor.service'

const GLOT_LANGUAGE_CONFIG: Record<PistonLanguageId, { glotLanguage: string; version: string; filename: string }> = {
  python: { glotLanguage: 'python', version: 'latest', filename: PISTON_LANGUAGE_CONFIG.python.filename },
  cpp: { glotLanguage: 'cpp', version: 'latest', filename: PISTON_LANGUAGE_CONFIG.cpp.filename },
  java: { glotLanguage: 'java', version: 'latest', filename: PISTON_LANGUAGE_CONFIG.java.filename },
  go: { glotLanguage: 'go', version: 'latest', filename: PISTON_LANGUAGE_CONFIG.go.filename },
  rust: { glotLanguage: 'rust', version: 'latest', filename: PISTON_LANGUAGE_CONFIG.rust.filename },
}

interface GlotResponse {
  stdout?: string
  stderr?: string
  error?: string
}

export class GlotExecutorService {
  async execute(
    language: string,
    code: string,
    input: unknown = null,
    timeout: number = 5000
  ): Promise<ExecutionResult> {
    const startTime = Date.now()
    const normalizedLanguage = normalizePistonLanguage(language)

    if (!normalizedLanguage) {
      return {
        output: null,
        stdout: '',
        stderr: `Unsupported Glot language: ${language}`,
        exitCode: 1,
        executionTime: Date.now() - startTime,
        error: `Unsupported Glot language: ${language}`,
      }
    }

    if (!config.glot.apiToken) {
      return {
        output: null,
        stdout: '',
        stderr: 'GLOT_API_TOKEN is not configured',
        exitCode: 1,
        executionTime: Date.now() - startTime,
        error: 'Execution Service Error: GLOT_API_TOKEN is not configured',
      }
    }

    const glotConfig = GLOT_LANGUAGE_CONFIG[normalizedLanguage]
    const endpoint = `${config.glot.apiUrl.replace(/\/$/, '')}/${glotConfig.glotLanguage}/${glotConfig.version}`

    const payload = {
      files: [
        {
          name: glotConfig.filename,
          content: code,
        },
      ],
      stdin: this.formatInput(input),
    }

    const httpTimeout = Math.max(timeout * 2, 30000)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), httpTimeout)

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${config.glot.apiToken}`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      })

      if (!response.ok) {
        throw new Error(`Glot API Error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json() as GlotResponse
      const stdout = data.stdout || ''
      const stderr = data.stderr || ''
      const apiError = data.error || null
      const errorStr = apiError || (stderr.trim() ? stderr.trim() : null)
      const exitCode = errorStr ? 1 : 0

      return {
        output: this.parseOutput(stdout),
        stdout,
        stderr,
        exitCode,
        executionTime: Date.now() - startTime,
        error: errorStr,
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error
        ? (error.name === 'AbortError' ? 'Glot API request timed out' : error.message)
        : String(error)
      logger.error(`Glot execution failed for ${language}`, { error: errorMessage })

      return {
        output: null,
        stdout: '',
        stderr: errorMessage,
        exitCode: 1,
        executionTime: Date.now() - startTime,
        error: `Execution Service Error: ${errorMessage}`,
      }
    } finally {
      clearTimeout(timeoutId)
    }
  }

  private parseOutput(stdout: string): unknown {
    const trimmed = stdout.trim()
    if (!trimmed) return ''

    try {
      return JSON.parse(trimmed)
    } catch {
      if (!isNaN(Number(trimmed))) {
        return Number(trimmed)
      }
      return trimmed
    }
  }

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
      return input.map(item => this.formatInput(item)).join(' ')
    }

    try {
      return JSON.stringify(input)
    } catch {
      return String(input)
    }
  }
}

export function createGlotExecutor(): GlotExecutorService {
  return new GlotExecutorService()
}
