/**
 * AI Prompt Builder
 *
 * Token-optimized grading prompts.
 * Pre-computes base score from diff, AI only adjusts ± range.
 */

import type { AIAnalysisParams } from './ai-analyzer.service'

// ============================================================================
// Public API
// ============================================================================

/** Max output tokens per grading mode */
export const MODE_MAX_TOKENS: Record<string, number> = {
  quick: 512,
  careful: 1024,
  thorough: 1536,
}

/**
 * Build compact grading prompt. Minimizes input tokens while keeping accuracy.
 */
export function buildGradingPrompt(params: AIAnalysisParams): string {
  const diff = computeCodeDiff(params.starterCode || '', params.code)
  const baseScore = computeBaseScore(diff, params)
  const min = Math.max(0, baseScore - 15)
  const max = Math.min(100, baseScore + 15)
  const depth = params.gradingDepth || 'quick'

  // Compact prompt — every line counts for tokens
  let p = `Giáo viên ${params.language} nghiêm khắc. Chấm bài tập.
Bài: ${params.exerciseTitle}
`

  if (params.lessonInsight) p += `Trọng tâm: ${params.lessonInsight}\n`

  // Exercise instructions
  if (params.starterCode) {
    p += `\nĐỀ BÀI:\n${params.starterCode}\n`
  }

  // Pre-computed analysis (saves AI from computing)
  p += `\nPHÂN TÍCH: ${diff.addedLines.length} dòng code mới, base=${baseScore}/100`

  if (diff.addedLines.length === 0) {
    p += `\n⛔ CHƯA LÀM GÌ → score≤15`
  }

  // Only send added lines (not full code) to save tokens
  if (diff.addedLines.length > 0) {
    p += `\n\nCODE MỚI:\n${diff.addedLines.join('\n')}\n`
  }

  // Mode-specific depth instruction (1 line each)
  const modeHint: Record<string, string> = {
    quick: 'Ngắn gọn, 1 câu/mục.',
    careful: 'Chi tiết, chỉ ra lỗi cụ thể.',
    thorough: 'Toàn diện: logic, edge cases, best practices.',
  }

  p += `
CHẤM [${depth}]: ${modeHint[depth]}
Rubric: chưa làm≤15, sai logic≤40, đúng+xấu=60-75, đúng+sạch=75-90, xuất sắc=90+
Score PHẢI trong [${min},${max}]. 0 dòng mới→≤15.

JSON (không markdown):
{"scores":{"codeQuality":<n>,"bestPractices":<n>,"complexity":<n>,"security":<n>},"overallScore":<${min}-${max}>,"strengths":["..."],"improvements":["..."],"suggestions":["gợi ý, KHÔNG code"],"feedback":"nhận xét tiếng Việt"}`

  return p
}

// ============================================================================
// Deterministic Base Score
// ============================================================================

function computeBaseScore(diff: CodeDiff, params: AIAnalysisParams): number {
  if (params.starterCode) {
    const n = diff.addedLines.length
    if (n === 0) return 5
    if (n <= 2) return 20
    if (n <= 4) return 35
    if (n <= 8) return 50
    if (n <= 15) return 65
    return 75
  }

  const actual = params.code.split('\n')
    .filter(l => l.trim().length > 0 && !l.trim().startsWith('//'))
  const n = actual.length
  if (n === 0) return 5
  if (n <= 3) return 25
  if (n <= 10) return 50
  if (n <= 20) return 65
  return 75
}

// ============================================================================
// Diff Analysis
// ============================================================================

interface CodeDiff {
  starterLineCount: number
  submittedLineCount: number
  addedLines: string[]
  unchangedCount: number
  changePercent: number
}

function computeCodeDiff(starter: string, submitted: string): CodeDiff {
  const norm = (s: string) => s.split('\n').map(l => l.trim()).filter(l => l.length > 0)
  const starterLines = norm(starter)
  const submittedLines = norm(submitted)

  // Ordered comparison: walk through submitted lines, consume matching starter lines
  const remainingStarter = [...starterLines]
  const addedLines: string[] = []
  let unchangedCount = 0

  for (const line of submittedLines) {
    const idx = remainingStarter.indexOf(line)
    if (idx !== -1) {
      remainingStarter.splice(idx, 1) // consume this match
      unchangedCount++
    } else {
      addedLines.push(line)
    }
  }

  return {
    starterLineCount: starterLines.length,
    submittedLineCount: submittedLines.length,
    addedLines,
    unchangedCount,
    changePercent: submittedLines.length > 0
      ? Math.round((addedLines.length / submittedLines.length) * 100) : 0,
  }
}
