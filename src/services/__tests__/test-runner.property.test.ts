/**
 * Property-Based Tests for Test Runner Service
 *
 * Uses fast-check to test universal properties with hundreds of random inputs.
 *
 * @see .kiro/specs/auto-grading-system/design.md
 */

import fc from 'fast-check'
import { TestRunnerService } from '../test-runner.service'

describe('Property-Based Tests: Test Runner', () => {
  const testRunner = new TestRunnerService()

  // ============================================================================
  // Property 1: Test Case Weight Validation
  // ============================================================================

  describe('Property 1: Weight validation', () => {
    test('should accept weights between 0 and 100', () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 100 }), weight => {
          const result = testRunner.validateTestCase({
            weight,
            description: 'test',
          } as any)
          expect(result.valid).toBe(true)
        }),
        { numRuns: 100 }
      )
    })

    test('should reject weights outside 0-100 range', () => {
      fc.assert(
        fc.property(
          fc.integer().filter(w => w < 0 || w > 100),
          weight => {
            const result = testRunner.validateTestCase({
              weight,
              description: 'test',
            } as any)
            expect(result.valid).toBe(false)
            expect(result.error).toContain('between 0 and 100')
          }
        ),
        { numRuns: 100 }
      )
    })

    test('should reject non-integer weights', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0, max: 100 }).filter(w => !Number.isInteger(w)),
          weight => {
            const result = testRunner.validateTestCase({
              weight,
              description: 'test',
            } as any)
            // Should be invalid because weight is not an integer
            expect(result.valid).toBe(false)
          }
        ),
        { numRuns: 50 }
      )
    })
  })

  // ============================================================================
  // Property 2: Timeout Validation
  // ============================================================================

  describe('Property 2: Timeout validation', () => {
    test('should accept positive integer timeouts', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 60000 }), timeout => {
          const result = testRunner.validateTestCase({
            timeout,
            description: 'test',
          } as any)
          expect(result.valid).toBe(true)
        }),
        { numRuns: 100 }
      )
    })

    test('should reject zero or negative timeouts', () => {
      fc.assert(
        fc.property(fc.integer({ max: 0 }), timeout => {
          const result = testRunner.validateTestCase({
            timeout,
            description: 'test',
          } as any)
          expect(result.valid).toBe(false)
          expect(result.error).toContain('positive integer')
        }),
        { numRuns: 100 }
      )
    })

    test('should reject non-integer timeouts', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 1, max: 1000 }).filter(t => !Number.isInteger(t)),
          timeout => {
            const result = testRunner.validateTestCase({
              timeout,
              description: 'test',
            } as any)
            expect(result.valid).toBe(false)
          }
        ),
        { numRuns: 50 }
      )
    })
  })

  // ============================================================================
  // Property 7: Test Score Calculation
  // ============================================================================

  describe('Property 7: Test score calculation', () => {
    test('score should always be between 0 and 100', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              passed: fc.boolean(),
              weight: fc.integer({ min: 1, max: 100 }),
            }),
            { minLength: 1, maxLength: 10 }
          ),
          testResults => {
            // Create mock test cases
            const testCases = testResults.map((r, i) => ({
              id: `test-${i}`,
              exerciseId: 'ex-1',
              input: null,
              expectedOutput: null,
              weight: r.weight,
              timeout: 1000,
              description: `Test ${i}`,
              isHidden: false,
              orderIndex: i,
            }))

            // Create mock results
            const results = testResults.map((r, i) => ({
              testCaseId: `test-${i}`,
              passed: r.passed,
              actualOutput: null,
              expectedOutput: null,
              executionTime: 10,
              error: null,
              description: `Test ${i}`,
            }))

            // Calculate score using private method (access via any)
            const score = (testRunner as any).calculateTestScore(results, testCases)

            expect(score).toBeGreaterThanOrEqual(0)
            expect(score).toBeLessThanOrEqual(100)
            expect(Number.isInteger(score)).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('all tests pass should give score 100', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 1, max: 100 }), { minLength: 1, maxLength: 10 }),
          weights => {
            const testCases = weights.map((w, i) => ({
              id: `test-${i}`,
              exerciseId: 'ex-1',
              input: null,
              expectedOutput: null,
              weight: w,
              timeout: 1000,
              description: `Test ${i}`,
              isHidden: false,
              orderIndex: i,
            }))

            const results = weights.map((w, i) => ({
              testCaseId: `test-${i}`,
              passed: true, // All pass
              actualOutput: null,
              expectedOutput: null,
              executionTime: 10,
              error: null,
              description: `Test ${i}`,
            }))

            const score = (testRunner as any).calculateTestScore(results, testCases)
            expect(score).toBe(100)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('no tests pass should give score 0', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 1, max: 100 }), { minLength: 1, maxLength: 10 }),
          weights => {
            const testCases = weights.map((w, i) => ({
              id: `test-${i}`,
              exerciseId: 'ex-1',
              input: null,
              expectedOutput: null,
              weight: w,
              timeout: 1000,
              description: `Test ${i}`,
              isHidden: false,
              orderIndex: i,
            }))

            const results = weights.map((w, i) => ({
              testCaseId: `test-${i}`,
              passed: false, // All fail
              actualOutput: null,
              expectedOutput: null,
              executionTime: 10,
              error: null,
              description: `Test ${i}`,
            }))

            const score = (testRunner as any).calculateTestScore(results, testCases)
            expect(score).toBe(0)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('score should be proportional to passed weight', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              weight: fc.integer({ min: 1, max: 100 }),
              passed: fc.boolean(),
            }),
            { minLength: 1, maxLength: 10 }
          ),
          testData => {
            const testCases = testData.map((d, i) => ({
              id: `test-${i}`,
              exerciseId: 'ex-1',
              input: null,
              expectedOutput: null,
              weight: d.weight,
              timeout: 1000,
              description: `Test ${i}`,
              isHidden: false,
              orderIndex: i,
            }))

            const results = testData.map((d, i) => ({
              testCaseId: `test-${i}`,
              passed: d.passed,
              actualOutput: null,
              expectedOutput: null,
              executionTime: 10,
              error: null,
              description: `Test ${i}`,
            }))

            const totalWeight = testData.reduce((sum, d) => sum + d.weight, 0)
            const passedWeight = testData
              .filter(d => d.passed)
              .reduce((sum, d) => sum + d.weight, 0)

            const expectedScore = Math.round((passedWeight / totalWeight) * 100)
            const actualScore = (testRunner as any).calculateTestScore(results, testCases)

            expect(actualScore).toBe(expectedScore)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  // ============================================================================
  // Property: Deep Equality
  // ============================================================================

  describe('Property: Deep equality comparison', () => {
    test('identical values should be equal', () => {
      fc.assert(
        fc.property(fc.anything(), value => {
          const result = (testRunner as any).deepEqual(value, value)
          expect(result).toBe(true)
        }),
        { numRuns: 100 }
      )
    })

    test('numbers should handle floating point tolerance', () => {
      fc.assert(
        fc.property(fc.double({ min: -1000, max: 1000 }), num => {
          const result = (testRunner as any).deepEqual(num, num + 1e-10)
          expect(result).toBe(true) // Within tolerance
        }),
        { numRuns: 100 }
      )
    })

    test('arrays with same elements should be equal', () => {
      fc.assert(
        fc.property(fc.array(fc.integer()), arr => {
          const result = (testRunner as any).deepEqual(arr, [...arr])
          expect(result).toBe(true)
        }),
        { numRuns: 100 }
      )
    })
  })
})
