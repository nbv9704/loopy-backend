/**
 * AI Analyzer Service for Auto-Grading System
 *
 * Analyzes code quality using Groq AI (primary) and Google Gemini AI (fallback).
 * Implements cascading fallback strategy for maximum availability.
 *
 * Prompt building and response parsing are in separate modules.
 */

import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai'
import { gradingCacheService, GradingCacheService } from './grading-cache.service'
import { groqAnalyzerService, GroqAnalyzerService } from './groq-analyzer.service'
import { buildGradingPrompt, MODE_MAX_TOKENS } from './ai-prompt-builder'
import { parseAIResponse } from './ai-response-parser'
import { supabaseAdmin } from '../db/supabase'
import { logger } from '../utils/logger'

// ============================================================================
// Types
// ============================================================================

export interface AIAnalysisParams {
  code: string
  language: string
  exerciseTitle: string
  exerciseQuestion: string
  expectedSolution?: string
  starterCode?: string
  lessonInsight?: string
  gradingDepth?: 'quick' | 'careful' | 'thorough'
}

export interface AIAnalysis {
  aiScore: number
  scores: {
    codeQuality: number
    bestPractices: number
    complexity: number
    security: number
  }
  strengths: string[]
  improvements: string[]
  suggestions: string[]
  feedback: string
}

export interface RateLimitStatus {
  requestsRemaining: number
  tokensRemaining: number
  resetTime: Date
}

// ============================================================================
// Service
// ============================================================================

export class AIAnalyzerService {
  private groq: GroqAnalyzerService
  private model: GenerativeModel | null = null
  private fallbackModel: GenerativeModel | null = null
  private cache: GradingCacheService
  private dailyRequestCount = 0
  private dailyTokenCount = 0
  private lastResetDate: string = ''

  // Free tier limits
  private readonly MAX_REQUESTS_PER_MINUTE = 15
  private readonly MAX_TOKENS_PER_DAY = 1_000_000
  private readonly WARNING_THRESHOLD = 0.8

  constructor(cache?: GradingCacheService, groq?: GroqAnalyzerService) {
    this.cache = cache ?? gradingCacheService
    this.groq = groq ?? groqAnalyzerService

    const apiKey = process.env.GEMINI_API_KEY
    if (apiKey) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey)
        this.model = genAI.getGenerativeModel({
          model: 'gemini-2.5-flash',
          generationConfig: { temperature: 0.3 },
        })
        this.fallbackModel = genAI.getGenerativeModel({
          model: 'gemini-2.0-flash',
          generationConfig: { temperature: 0.3 },
        })
        logger.info('Gemini AI models initialized (primary: 2.5-flash, fallback: 2.0-flash)')
      } catch (error) {
        logger.error('Failed to initialize Gemini AI model:', error)
        this.model = null
      }
    } else {
      logger.warn('GEMINI_API_KEY not set — AI grading will be unavailable')
    }
  }

  /**
   * Analyze code and return AI grading scores + feedback
   * Implements cascading fallback: Groq → Gemini 2.5 → Gemini 2.0
   */
  async analyzeCode(params: AIAnalysisParams): Promise<AIAnalysis> {
    this.resetDailyCountersIfNeeded()

    // Cache key includes starterCode hash for correct per-context caching
    const depth = params.gradingDepth || 'quick'
    const cacheKey = this.cache.generateCacheKey(
      `${params.code}|${params.starterCode || ''}`,
      params.exerciseTitle,
      `${params.language}:${depth}`
    )
    const cached = await this.cache.get(cacheKey)
    if (cached) {
      logger.info('AI analysis cache hit', { exerciseTitle: params.exerciseTitle })
      await this.logUsage(null, 0, 0, 0, true)
      return cached as AIAnalysis
    }

    // Build prompt once (reused by both Groq and Gemini paths)
    const prompt = buildGradingPrompt(params)

    // Try Groq first (Primary — cascading: 8B → Scout 17B → Qwen 32B → 70B)
    if (this.groq.canAnalyze(depth)) {
      try {
        logger.info('Using Groq AI for analysis', { depth })
        const analysis = await this.groq.analyzeCode(params, prompt)
        await this.cache.set(cacheKey, analysis, 3600)
        await this.logUsage(null, 0, 0, 0, false, 0, 'groq')
        return analysis
      } catch (groqError: any) {
        logger.warn('Groq AI failed, falling back to Gemini', {
          error: groqError.message,
        })
      }
    } else {
      logger.warn('Groq quota exceeded, using Gemini fallback')
    }

    // Fallback to Gemini if Groq fails or quota exceeded
    if (!this.model) {
      throw new Error('No AI models available — both Groq and Gemini unavailable')
    }

    // Check Gemini rate limit
    const rateLimitStatus = await this.checkRateLimit()
    if (rateLimitStatus.requestsRemaining <= 0) {
      throw new Error('AI API rate limit exceeded — please try again later')
    }
    if (rateLimitStatus.tokensRemaining <= 0) {
      throw new Error('AI API daily token limit exceeded')
    }

    // Prompt already built above, reuse it

    try {
      const startTime = Date.now()

      // Map grading depth to thinking budget
      const thinkingBudgets = { quick: 0, careful: 512, thorough: 2048 }
      const thinkingBudget = thinkingBudgets[depth]
      const maxOutputTokens = MODE_MAX_TOKENS[depth] || 512

      const requestPayload = {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens,
          thinkingConfig: { thinkingBudget },
        },
      } as any

      // Try primary model with retry, then fallback on 503 or 429
      let text: string
      let usedFallback = false
      try {
        text = await this.callWithRetry(this.model, requestPayload, 2)
      } catch (primaryError: any) {
        const shouldFallback =
          this.fallbackModel &&
          (primaryError.message?.includes('503') ||
            primaryError.message?.includes('429') ||
            primaryError.message?.includes('quota'))

        if (shouldFallback) {
          const errorType = primaryError.message?.includes('429')
            ? 'rate limit/quota exceeded'
            : 'unavailable (503)'
          logger.warn(`Primary model ${errorType}, switching to fallback model (gemini-2.0-flash)`)

          const fallbackPayload = {
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.3, maxOutputTokens },
          }
          text = await this.callWithRetry(this.fallbackModel, fallbackPayload, 1)
          usedFallback = true
        } else {
          throw primaryError
        }
      }

      const responseTime = Date.now() - startTime

      // Parse response (delegated to ai-response-parser)
      const analysis = parseAIResponse(text)

      // Track usage (estimate: ~4 chars per token)
      const estimatedTokens = Math.ceil(text.length / 4)
      this.dailyRequestCount++
      this.dailyTokenCount += estimatedTokens

      await this.logUsage(null, estimatedTokens, estimatedTokens, estimatedTokens * 2, false, responseTime)

      if (this.dailyTokenCount > this.MAX_TOKENS_PER_DAY * this.WARNING_THRESHOLD) {
        logger.warn('AI token usage approaching daily limit', {
          used: this.dailyTokenCount,
          limit: this.MAX_TOKENS_PER_DAY,
        })
      }

      // Cache result (1 hour TTL)
      await this.cache.set(cacheKey, analysis, 3600)

      logger.info('AI analysis completed', {
        exerciseTitle: params.exerciseTitle,
        aiScore: analysis.aiScore,
        responseTime,
        ...(usedFallback && { model: 'fallback' }),
      })

      return analysis
    } catch (error: any) {
      logger.error('AI analysis failed', {
        error: error.message,
        exerciseTitle: params.exerciseTitle,
      })
      throw error
    }
  }

  /**
   * Call Gemini API with retry and exponential backoff
   */
  private async callWithRetry(
    model: GenerativeModel,
    payload: any,
    maxRetries: number
  ): Promise<string> {
    let lastError: any
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await model.generateContent(payload)
        return result.response.text()
      } catch (error: any) {
        lastError = error
        const is503 = error.message?.includes('503')
        if (is503 && attempt < maxRetries) {
          const delay = 1000 * (attempt + 1)
          logger.warn(
            `Gemini API 503, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`
          )
          await new Promise(r => setTimeout(r, delay))
        } else {
          throw error
        }
      }
    }
    throw lastError
  }

  /**
   * Check rate limit status
   */
  async checkRateLimit(): Promise<RateLimitStatus> {
    this.resetDailyCountersIfNeeded()
    const resetTime = new Date(Date.now() + 60 * 1000)

    return {
      requestsRemaining: Math.max(
        0,
        this.MAX_REQUESTS_PER_MINUTE - (this.dailyRequestCount % this.MAX_REQUESTS_PER_MINUTE)
      ),
      tokensRemaining: Math.max(0, this.MAX_TOKENS_PER_DAY - this.dailyTokenCount),
      resetTime,
    }
  }

  /**
   * Log AI usage to database
   */
  private async logUsage(
    submissionId: string | null,
    requestTokens: number = 0,
    responseTokens: number = 0,
    totalTokens: number = 0,
    cacheHit: boolean = false,
    responseTime: number = 0,
    _provider: string = 'gemini' // Prefixed with _ to indicate intentionally unused (for future use)
  ): Promise<void> {
    try {
      await supabaseAdmin.from('ai_usage_logs').insert({
        submission_id: submissionId,
        request_tokens: Math.round(requestTokens),
        response_tokens: Math.round(responseTokens),
        total_tokens: Math.round(totalTokens),
        cache_hit: cacheHit,
        response_time: Math.round(responseTime),
        // Note: Add 'provider' column to ai_usage_logs table if needed
      })
    } catch (error) {
      logger.error('Failed to log AI usage:', error)
    }
  }

  /** Reset daily counters at midnight */
  private resetDailyCountersIfNeeded(): void {
    const today = new Date().toISOString().split('T')[0]
    if (this.lastResetDate !== today) {
      this.dailyRequestCount = 0
      this.dailyTokenCount = 0
      this.lastResetDate = today
    }
  }
}

// Export singleton
export const aiAnalyzerService = new AIAnalyzerService()
