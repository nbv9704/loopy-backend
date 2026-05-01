/**
 * Property-Based Tests for Grading Orchestrator
 *
 * Uses fast-check to test universal properties with hundreds of random inputs.
 *
 * @see .kiro/specs/auto-grading-system/design.md
 */

import fc from 'fast-check'
import { GradingOrchestratorService } from '../grading-orchestrator.service'

describe('Property-Based Tests: Grading Orchestrator', () => {
  const orchestrator = new GradingOrchestratorService()

  // ============================================================================
  // Property 10: Final Score Calculation
  // ============================================================================

  describe('Property 10: Final score calculation', () => {
    test('should calculate correct final score for "both" method', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 100 }), // testScore
          fc.integer({ min: 0, max: 100 }), // aiScore
          (testScore, aiScore) => {
            const finalScore = orchestrator.calculateFinalScore(
              testScore,
              aiScore,
              'both',
              true // hasTestCases
            )

            const expected = Math.round(testScore * 0.7 + aiScore * 0.3)
            expect(finalScore).toBe(expected)
            expect(finalScore).toBeGreaterThanOrEqual(0)
            expect(finalScore).toBeLessThanOrEqual(100)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('should return test score for "test" method', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 100 }), // testScore
          fc.integer({ min: 0, max: 100 }), // aiScore
          (testScore, aiScore) => {
            const finalScore = orchestrator.calculateFinalScore(testScore, aiScore, 'test')

            expect(finalScore).toBe(testScore)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('should return AI score for "ai" method', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 100 }), // testScore
          fc.integer({ min: 0, max: 100 }), // aiScore
          (testScore, aiScore) => {
            const finalScore = orchestrator.calculateFinalScore(testScore, aiScore, 'ai')

            expect(finalScore).toBe(aiScore)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('should handle null AI score gracefully', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 100 }), // testScore
          testScore => {
            const finalScore = orchestrator.calculateFinalScore(testScore, null, 'both', true)

            // Should fall back to test score when AI is null
            expect(finalScore).toBe(testScore)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('should use AI score when no test cases', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 100 }), // testScore
          fc.integer({ min: 0, max: 100 }), // aiScore
          (testScore, aiScore) => {
            const finalScore = orchestrator.calculateFinalScore(
              testScore,
              aiScore,
              'both',
              false // hasTestCases = false
            )

            // Should use AI score when no test cases
            expect(finalScore).toBe(aiScore)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  // ============================================================================
  // Property 11: Grade Level Assignment
  // ============================================================================

  describe('Property 11: Grade level assignment', () => {
    test('should assign correct grade level for all score ranges', () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 100 }), finalScore => {
          const gradeLevel = orchestrator.calculateGradeLevel(finalScore)

          if (finalScore >= 90) {
            expect(gradeLevel).toBe('excellent')
          } else if (finalScore >= 80) {
            expect(gradeLevel).toBe('good')
          } else if (finalScore >= 70) {
            expect(gradeLevel).toBe('satisfactory')
          } else if (finalScore >= 60) {
            expect(gradeLevel).toBe('needs_improvement')
          } else {
            expect(gradeLevel).toBe('poor')
          }
        }),
        { numRuns: 100 }
      )
    })

    test('should handle boundary values correctly', () => {
      // Test exact boundaries
      expect(orchestrator.calculateGradeLevel(100)).toBe('excellent')
      expect(orchestrator.calculateGradeLevel(90)).toBe('excellent')
      expect(orchestrator.calculateGradeLevel(89)).toBe('good')
      expect(orchestrator.calculateGradeLevel(80)).toBe('good')
      expect(orchestrator.calculateGradeLevel(79)).toBe('satisfactory')
      expect(orchestrator.calculateGradeLevel(70)).toBe('satisfactory')
      expect(orchestrator.calculateGradeLevel(69)).toBe('needs_improvement')
      expect(orchestrator.calculateGradeLevel(60)).toBe('needs_improvement')
      expect(orchestrator.calculateGradeLevel(59)).toBe('poor')
      expect(orchestrator.calculateGradeLevel(0)).toBe('poor')
    })
  })

  // ============================================================================
  // Property: Score Range Validation
  // ============================================================================

  describe('Property: Score range validation', () => {
    test('final score should always be between 0 and 100', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 100 }),
          fc.integer({ min: 0, max: 100 }),
          fc.constantFrom('test', 'ai', 'both'),
          (testScore, aiScore, method) => {
            const finalScore = orchestrator.calculateFinalScore(testScore, aiScore, method as any)

            expect(finalScore).toBeGreaterThanOrEqual(0)
            expect(finalScore).toBeLessThanOrEqual(100)
          }
        ),
        { numRuns: 200 }
      )
    })
  })

  // ============================================================================
  // Property: Deterministic Calculation
  // ============================================================================

  describe('Property: Deterministic calculation', () => {
    test('same inputs should always produce same output', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 100 }),
          fc.integer({ min: 0, max: 100 }),
          fc.constantFrom('test', 'ai', 'both'),
          (testScore, aiScore, method) => {
            const result1 = orchestrator.calculateFinalScore(testScore, aiScore, method as any)
            const result2 = orchestrator.calculateFinalScore(testScore, aiScore, method as any)

            expect(result1).toBe(result2)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  // ============================================================================
  // Property: Weighted Average Properties
  // ============================================================================

  describe('Property: Weighted average properties', () => {
    test('final score should be between test and AI scores for "both" method', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 100 }),
          fc.integer({ min: 0, max: 100 }),
          (testScore, aiScore) => {
            const finalScore = orchestrator.calculateFinalScore(testScore, aiScore, 'both', true)

            const min = Math.min(testScore, aiScore)
            const max = Math.max(testScore, aiScore)

            expect(finalScore).toBeGreaterThanOrEqual(min)
            expect(finalScore).toBeLessThanOrEqual(max)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('when test and AI scores are equal, final score should equal them', () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 100 }), score => {
          const finalScore = orchestrator.calculateFinalScore(score, score, 'both', true)

          expect(finalScore).toBe(score)
        }),
        { numRuns: 100 }
      )
    })
  })
})
