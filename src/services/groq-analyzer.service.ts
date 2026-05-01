/**
 * Groq Analyzer Service for Auto-Grading System
 *
 * Analyzes code quality using Groq AI with multi-model cascading strategy.
 * Per-model quota tracking ensures optimal usage across free tier limits.
 *
 * Model strategy per grading depth:
 *   Quick:    llama-3.1-8b-instant (14.4K RPD)
 *   Careful:  llama-4-scout-17b → qwen3-32b (1K RPD each)
 *   Thorough: qwen3-32b → llama-3.3-70b (1K RPD each)
 */

import Groq from 'groq-sdk'
import { buildGradingPrompt, MODE_MAX_TOKENS } from './ai-prompt-builder'
import { parseAIResponse } from './ai-response-parser'
import { logger } from '../utils/logger'
import type { AIAnalysisParams, AIAnalysis } from './ai-analyzer.service'

// ============================================================================
// Model Configuration
// ============================================================================

interface ModelConfig {
  id: string
  label: string
  dailyLimit: number
  rpm: number
}

const MODELS: Record<string, ModelConfig> = {
  '8b': { id: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B', dailyLimit: 14400, rpm: 30 },
  'scout': { id: 'meta-llama/llama-4-scout-17b-16e-instruct', label: 'Llama 4 Scout 17B', dailyLimit: 1000, rpm: 30 },
  'qwen': { id: 'qwen/qwen3-32b', label: 'Qwen 3 32B', dailyLimit: 1000, rpm: 60 },
  '70b': { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B', dailyLimit: 1000, rpm: 30 },
}

/** Model cascade per grading depth */
const DEPTH_MODEL_CASCADE: Record<string, string[]> = {
  quick: ['8b'],
  careful: ['scout', 'qwen'],
  thorough: ['qwen', '70b'],
}

// ============================================================================
// Service
// ============================================================================

export class GroqAnalyzerService {
  private client: Groq | null = null
  private quotas: Record<string, number> = {}
  private lastResetDate: string = ''

  constructor() {
    const apiKey = process.env.GROQ_API_KEY
    if (apiKey) {
      try {
        this.client = new Groq({ apiKey })
        // Initialize per-model counters
        for (const key of Object.keys(MODELS)) {
          this.quotas[key] = 0
        }
        logger.info('Groq AI client initialized', {
          models: Object.values(MODELS).map(m => m.label),
        })
      } catch (error) {
        logger.error('Failed to initialize Groq AI client:', error)
        this.client = null
      }
    } else {
      logger.warn('GROQ_API_KEY not set — Groq AI grading will be unavailable')
    }
  }

  /**
   * Analyze code with cascading model selection based on grading depth.
   * Tries each model in the cascade until one succeeds or all fail.
   */
  async analyzeCode(params: AIAnalysisParams, prebuiltPrompt?: string): Promise<AIAnalysis> {
    if (!this.client) {
      throw new Error('Groq AI client not initialized — GROQ_API_KEY is required')
    }

    this.resetDailyCountersIfNeeded()

    const depth = params.gradingDepth || 'quick'
    const cascade = DEPTH_MODEL_CASCADE[depth] || DEPTH_MODEL_CASCADE.quick
    const prompt = prebuiltPrompt || buildGradingPrompt(params)

    // Try each model in cascade order
    let lastError: Error | null = null
    for (const modelKey of cascade) {
      const model = MODELS[modelKey]
      if (!model) continue

      // Skip if quota exceeded for this model
      if (this.quotas[modelKey] >= model.dailyLimit) {
        logger.warn(`Groq ${model.label} quota exceeded (${this.quotas[modelKey]}/${model.dailyLimit}), trying next`)
        continue
      }

      try {
        const analysis = await this.callModel(model, prompt, params.exerciseTitle, depth)
        this.quotas[modelKey]++
        return analysis
      } catch (error: any) {
        lastError = error
        logger.warn(`Groq ${model.label} failed, trying next model`, {
          error: error.message,
        })
      }
    }

    // All Groq models failed
    throw lastError || new Error('All Groq models exhausted or failed')
  }

  /**
   * Call a specific Groq model
   */
  private async callModel(model: ModelConfig, prompt: string, exerciseTitle: string, depth: string = 'quick'): Promise<AIAnalysis> {
    const startTime = Date.now()
    const maxTokens = MODE_MAX_TOKENS[depth] || 512

    const completion = await this.client!.chat.completions.create({
      model: model.id,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: maxTokens,
      response_format: { type: 'json_object' },
    })

    const responseTime = Date.now() - startTime
    const text = completion.choices[0]?.message?.content

    if (!text) {
      throw new Error(`Empty response from Groq ${model.label}`)
    }

    const analysis = parseAIResponse(text)

    logger.info('Groq AI analysis completed', {
      exerciseTitle,
      aiScore: analysis.aiScore,
      responseTime,
      model: model.label,
      tokensUsed: completion.usage?.total_tokens || 0,
    })

    return analysis
  }

  /**
   * Check if any Groq model is available for the given depth
   */
  canAnalyze(depth?: string): boolean {
    this.resetDailyCountersIfNeeded()

    const cascade = DEPTH_MODEL_CASCADE[depth || 'quick'] || DEPTH_MODEL_CASCADE.quick
    return cascade.some(key => {
      const model = MODELS[key]
      return model && this.quotas[key] < model.dailyLimit
    })
  }

  /**
   * Get current quota status for all models
   */
  getQuotaStatus() {
    this.resetDailyCountersIfNeeded()

    const status: Record<string, { used: number; limit: number; remaining: number }> = {}
    for (const [key, model] of Object.entries(MODELS)) {
      const used = this.quotas[key] || 0
      status[model.label] = {
        used,
        limit: model.dailyLimit,
        remaining: Math.max(0, model.dailyLimit - used),
      }
    }
    return status
  }

  /** Reset all model counters at midnight */
  private resetDailyCountersIfNeeded() {
    const today = new Date().toISOString().split('T')[0]
    if (this.lastResetDate !== today) {
      for (const key of Object.keys(MODELS)) {
        this.quotas[key] = 0
      }
      this.lastResetDate = today
      logger.info('Groq daily quota counters reset')
    }
  }
}

// Export singleton
export const groqAnalyzerService = new GroqAnalyzerService()
