/**
 * Property-Based Tests for Grading Cache Service
 *
 * Uses fast-check to test universal properties with hundreds of random inputs.
 *
 * @see .kiro/specs/auto-grading-system/design.md
 */

import fc from 'fast-check'
import { GradingCacheService } from '../grading-cache.service'

describe('Property-Based Tests: Grading Cache Service', () => {
  let cacheService: GradingCacheService

  beforeEach(() => {
    // Create new instance for each test (no Redis, uses NodeCache)
    cacheService = new GradingCacheService()
  })

  afterEach(async () => {
    // Clean up
    await cacheService.clear()
    await cacheService.disconnect()
  })

  // ============================================================================
  // Property 15: Cache Key Consistency
  // ============================================================================

  describe('Property 15: Cache key consistency', () => {
    test('identical inputs should generate identical cache keys', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 10, maxLength: 500 }),
          fc.uuid(),
          fc.constantFrom('javascript', 'python', 'cpp'),
          (code, exerciseId, language) => {
            const key1 = cacheService.generateCacheKey(code, exerciseId, language)
            const key2 = cacheService.generateCacheKey(code, exerciseId, language)

            expect(key1).toBe(key2)
            expect(key1).toMatch(/^ai-grade:[a-f0-9]{64}$/) // SHA-256 format
          }
        ),
        { numRuns: 100 }
      )
    })

    test('different code should generate different cache keys', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 10, maxLength: 500 }),
          fc.string({ minLength: 1, maxLength: 10 }),
          fc.uuid(),
          fc.constantFrom('javascript', 'python', 'cpp'),
          (code, suffix, exerciseId, language) => {
            const key1 = cacheService.generateCacheKey(code, exerciseId, language)
            const key2 = cacheService.generateCacheKey(code + suffix, exerciseId, language)

            expect(key1).not.toBe(key2)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('different exercise ID should generate different cache keys', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 10, maxLength: 500 }),
          fc.uuid(),
          fc.uuid(),
          fc.constantFrom('javascript', 'python', 'cpp'),
          (code, exerciseId1, exerciseId2, language) => {
            fc.pre(exerciseId1 !== exerciseId2) // Ensure different IDs

            const key1 = cacheService.generateCacheKey(code, exerciseId1, language)
            const key2 = cacheService.generateCacheKey(code, exerciseId2, language)

            expect(key1).not.toBe(key2)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('different language should generate different cache keys', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 10, maxLength: 500 }), fc.uuid(), (code, exerciseId) => {
          const key1 = cacheService.generateCacheKey(code, exerciseId, 'javascript')
          const key2 = cacheService.generateCacheKey(code, exerciseId, 'python')
          const key3 = cacheService.generateCacheKey(code, exerciseId, 'cpp')

          expect(key1).not.toBe(key2)
          expect(key2).not.toBe(key3)
          expect(key1).not.toBe(key3)
        }),
        { numRuns: 100 }
      )
    })

    test('cache key should be deterministic', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 10, maxLength: 500 }),
          fc.uuid(),
          fc.constantFrom('javascript', 'python', 'cpp'),
          (code, exerciseId, language) => {
            // Generate key multiple times
            const keys = Array.from({ length: 5 }, () =>
              cacheService.generateCacheKey(code, exerciseId, language)
            )

            // All keys should be identical
            expect(new Set(keys).size).toBe(1)
          }
        ),
        { numRuns: 50 }
      )
    })
  })

  // ============================================================================
  // Property: Cache Get/Set Consistency
  // ============================================================================

  describe('Property: Cache get/set consistency', () => {
    test('should retrieve the same value that was set', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 5, maxLength: 50 }),
          fc.anything().filter(v => v !== undefined), // Filter out undefined values
          async (key, value) => {
            await cacheService.set(key, value, 60)
            const retrieved = await cacheService.get(key)

            expect(retrieved).toEqual(value)
          }
        ),
        { numRuns: 50 }
      )
    })

    test('should return null for non-existent keys', async () => {
      await fc.assert(
        fc.asyncProperty(fc.string({ minLength: 5, maxLength: 50 }), async key => {
          const result = await cacheService.get(key)
          expect(result).toBeNull()
        }),
        { numRuns: 50 }
      )
    })

    test('should handle complex objects', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 5, maxLength: 50 }),
          fc.record({
            aiScore: fc.integer({ min: 0, max: 100 }),
            scores: fc.record({
              codeQuality: fc.integer({ min: 0, max: 100 }),
              bestPractices: fc.integer({ min: 0, max: 100 }),
              complexity: fc.integer({ min: 0, max: 100 }),
              security: fc.integer({ min: 0, max: 100 }),
            }),
            strengths: fc.array(fc.string(), { maxLength: 3 }),
            improvements: fc.array(fc.string(), { maxLength: 3 }),
            suggestions: fc.array(fc.string(), { maxLength: 3 }),
            feedback: fc.string(),
          }),
          async (key, aiAnalysis) => {
            await cacheService.set(key, aiAnalysis, 60)
            const retrieved = await cacheService.get(key)

            expect(retrieved).toEqual(aiAnalysis)
          }
        ),
        { numRuns: 30 }
      )
    })
  })

  // ============================================================================
  // Property: Cache Statistics
  // ============================================================================

  describe('Property: Cache statistics', () => {
    test('hit rate should be between 0 and 1', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.string({ minLength: 5, maxLength: 20 }), { maxLength: 10 }),
          async keys => {
            // Set some values
            for (const key of keys.slice(0, Math.floor(keys.length / 2))) {
              await cacheService.set(key, 'value', 60)
            }

            // Get all keys (some will hit, some will miss)
            for (const key of keys) {
              await cacheService.get(key)
            }

            const stats = await cacheService.getCacheStats()

            expect(stats.hitRate).toBeGreaterThanOrEqual(0)
            expect(stats.hitRate).toBeLessThanOrEqual(1)
            expect(stats.hits + stats.misses).toBeGreaterThan(0)
          }
        ),
        { numRuns: 20 }
      )
    })

    test('cache size should match number of unique keys set', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.string({ minLength: 5, maxLength: 20 }), { minLength: 1, maxLength: 10 }),
          async keys => {
            // Clear cache first
            await cacheService.clear()

            // Set values for unique keys
            const uniqueKeys = [...new Set(keys)]
            for (const key of uniqueKeys) {
              await cacheService.set(key, 'value', 60)
            }

            const stats = await cacheService.getCacheStats()
            expect(stats.size).toBe(uniqueKeys.length)
          }
        ),
        { numRuns: 20 }
      )
    })
  })

  // ============================================================================
  // Property: Cache Delete
  // ============================================================================

  describe('Property: Cache delete', () => {
    test('deleted keys should return null', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 5, maxLength: 50 }),
          fc.anything(),
          async (key, value) => {
            await cacheService.set(key, value, 60)
            await cacheService.delete(key)
            const result = await cacheService.get(key)

            expect(result).toBeNull()
          }
        ),
        { numRuns: 50 }
      )
    })
  })
})
