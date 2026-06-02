/**
 * AI Response Parser
 *
 * Parses and validates JSON responses from the Gemini AI model.
 * Includes partial recovery for truncated responses.
 */

import type { AIAnalysis } from './ai-analyzer.service'
import { logger } from '../utils/logger'

/** Clamp a number between 0-100 */
const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v || 0)))

/**
 * Parse and validate AI response JSON.
 * Handles markdown wrapping, truncated responses, and invalid JSON gracefully.
 */
export function parseAIResponse(text: string): AIAnalysis {
  try {
    let jsonStr = text.trim()

    // Remove markdown code blocks if present
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim()
    }

    const parsed = JSON.parse(jsonStr)

    const scores = {
      codeQuality: clamp(parsed.scores?.codeQuality ?? 50),
      bestPractices: clamp(parsed.scores?.bestPractices ?? 50),
      complexity: clamp(parsed.scores?.complexity ?? 50),
      security: clamp(parsed.scores?.security ?? 50),
    }

    // Use AI's overallScore (constrained by prompt to base ± 15)
    // Fall back to weighted sub-scores if overallScore not provided
    const weightedScore = Math.round(
      scores.codeQuality * 0.4 +
        scores.bestPractices * 0.3 +
        scores.complexity * 0.2 +
        scores.security * 0.1
    )
    const aiScore = clamp(parsed.overallScore ?? weightedScore)

    return {
      aiScore,
      scores,
      strengths: Array.isArray(parsed.strengths)
        ? parsed.strengths.slice(0, 3)
        : ['Đã hoàn thành bài tập'],
      improvements: Array.isArray(parsed.improvements)
        ? parsed.improvements.slice(0, 3)
        : ['Có thể cải thiện thêm'],
      suggestions: Array.isArray(parsed.suggestions)
        ? parsed.suggestions.slice(0, 3)
        : ['Tiếp tục luyện tập'],
      feedback: parsed.feedback || 'Không có nhận xét chi tiết.',
    }
  } catch {
    return recoverPartialResponse(text)
  }
}

/**
 * Attempt to recover scores from a truncated/malformed AI response
 */
function recoverPartialResponse(text: string): AIAnalysis {
  try {
    const partialScores = text.match(/"codeQuality"\s*:\s*(\d+)/)
    const partialBP = text.match(/"bestPractices"\s*:\s*(\d+)/)
    const partialCx = text.match(/"complexity"\s*:\s*(\d+)/)
    const partialSec = text.match(/"security"\s*:\s*(\d+)/)
    const partialOverall = text.match(/"overallScore"\s*:\s*(\d+)/)

    if (partialScores || partialOverall) {
      const scores = {
        codeQuality: partialScores ? parseInt(partialScores[1]) : 50,
        bestPractices: partialBP ? parseInt(partialBP[1]) : 50,
        complexity: partialCx ? parseInt(partialCx[1]) : 50,
        security: partialSec ? parseInt(partialSec[1]) : 50,
      }
      const aiScore = partialOverall
        ? parseInt(partialOverall[1])
        : Math.round(
            scores.codeQuality * 0.4 +
              scores.bestPractices * 0.3 +
              scores.complexity * 0.2 +
              scores.security * 0.1
          )

      const strengthMatches = text.match(/"strengths"\s*:\s*\[([^\]]*)/)
      const strengths = strengthMatches
        ? (strengthMatches[1].match(/"([^"]+)"/g) || [])
            .map((s: string) => s.replace(/"/g, ''))
            .slice(0, 3)
        : ['Đã hoàn thành bài tập']

      logger.info('Recovered partial AI response', { aiScore, scores })

      return {
        aiScore,
        scores,
        strengths,
        improvements: ['Cần cải thiện thêm'],
        suggestions: ['Tiếp tục luyện tập'],
        feedback: 'Phân tích AI bị cắt ngắn — điểm được trích xuất từ dữ liệu có sẵn.',
      }
    }
  } catch {
    // Fall through to default fallback
  }

  logger.warn('Failed to parse AI response', {
    text: text.substring(0, 200),
  })

  throw new Error('AI response could not be parsed — please retry')
}
