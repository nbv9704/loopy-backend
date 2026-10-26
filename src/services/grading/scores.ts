import type { GradeLevel, GradingMethod } from '../grading-orchestrator.service'

export function calculateFinalScore(
  testScore: number,
  aiScore: number | null,
  method: GradingMethod,
  hasTestCases = true
): number {
  if (method === 'test' || aiScore === null) return method === 'ai' ? 0 : testScore
  if (method === 'ai' || !hasTestCases) return aiScore
  return Math.round(testScore * 0.7 + aiScore * 0.3)
}

export function calculateGradeLevel(score: number): GradeLevel {
  if (score >= 90) return 'excellent'
  if (score >= 80) return 'good'
  if (score >= 70) return 'satisfactory'
  if (score >= 60) return 'needs_improvement'
  return 'poor'
}
