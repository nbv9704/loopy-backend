import { GradingCacheService } from '../grading-cache.service'

describe('GradingCacheService', () => {
  let cacheService: GradingCacheService

  beforeEach(() => {
    // Create a new instance without Redis for testing (uses NodeCache fallback)
    cacheService = new GradingCacheService()
  })

  afterEach(async () => {
    // Clean up after each test
    await cacheService.clear()
    await cacheService.disconnect()
  })

  describe('generateCacheKey', () => {
    it('should generate SHA-256 hash-based cache key', () => {
      const code = 'function add(a, b) { return a + b; }'
      const exerciseId = 'ex-123'
      const language = 'javascript'

      const key = cacheService.generateCacheKey(code, exerciseId, language)

      // Should start with prefix
      expect(key).toMatch(/^ai-grade:/)
      // Should be 64 hex characters after prefix (SHA-256)
      expect(key).toMatch(/^ai-grade:[a-f0-9]{64}$/)
    })

    it('should generate same key for identical inputs', () => {
      const code = 'print("Hello World")'
      const exerciseId = 'ex-456'
      const language = 'python'

      const key1 = cacheService.generateCacheKey(code, exerciseId, language)
      const key2 = cacheService.generateCacheKey(code, exerciseId, language)

      expect(key1).toBe(key2)
    })

    it('should generate different keys for different code', () => {
      const exerciseId = 'ex-789'
      const language = 'javascript'

      const key1 = cacheService.generateCacheKey('code1', exerciseId, language)
      const key2 = cacheService.generateCacheKey('code2', exerciseId, language)

      expect(key1).not.toBe(key2)
    })

    it('should generate different keys for different exercises', () => {
      const code = 'const x = 10;'
      const language = 'javascript'

      const key1 = cacheService.generateCacheKey(code, 'ex-1', language)
      const key2 = cacheService.generateCacheKey(code, 'ex-2', language)

      expect(key1).not.toBe(key2)
    })

    it('should generate different keys for different languages', () => {
      const code = 'x = 10'
      const exerciseId = 'ex-100'

      const key1 = cacheService.generateCacheKey(code, exerciseId, 'python')
      const key2 = cacheService.generateCacheKey(code, exerciseId, 'javascript')

      expect(key1).not.toBe(key2)
    })
  })

  describe('get and set', () => {
    it('should store and retrieve values from cache', async () => {
      const key = 'test-key-1'
      const value = { score: 85, feedback: 'Good job!' }

      await cacheService.set(key, value)
      const retrieved = await cacheService.get(key)

      expect(retrieved).toEqual(value)
    })

    it('should return null for non-existent keys', async () => {
      const result = await cacheService.get('non-existent-key')
      expect(result).toBeNull()
    })

    it('should support complex objects', async () => {
      const key = 'test-key-2'
      const value = {
        aiScore: 90,
        scores: {
          codeQuality: 85,
          bestPractices: 90,
          complexity: 88,
          security: 95,
        },
        strengths: ['Clean code', 'Good naming'],
        improvements: ['Add error handling'],
        suggestions: ['Use async/await'],
        feedback: 'Excellent work!',
      }

      await cacheService.set(key, value)
      const retrieved = await cacheService.get(key)

      expect(retrieved).toEqual(value)
    })

    it('should use default TTL of 3600 seconds when not specified', async () => {
      const key = 'test-key-3'
      const value = { data: 'test' }

      // Set without TTL parameter
      await cacheService.set(key, value)
      const retrieved = await cacheService.get(key)

      expect(retrieved).toEqual(value)
    })

    it('should support custom TTL', async () => {
      const key = 'test-key-4'
      const value = { data: 'test' }
      const customTTL = 60 // 1 minute

      await cacheService.set(key, value, customTTL)
      const retrieved = await cacheService.get(key)

      expect(retrieved).toEqual(value)
    })

    it('should handle string values', async () => {
      const key = 'test-key-5'
      const value = 'simple string value'

      await cacheService.set(key, value)
      const retrieved = await cacheService.get(key)

      expect(retrieved).toBe(value)
    })

    it('should handle number values', async () => {
      const key = 'test-key-6'
      const value = 42

      await cacheService.set(key, value)
      const retrieved = await cacheService.get(key)

      expect(retrieved).toBe(value)
    })

    it('should handle array values', async () => {
      const key = 'test-key-7'
      const value = [1, 2, 3, 'test', { nested: true }]

      await cacheService.set(key, value)
      const retrieved = await cacheService.get(key)

      expect(retrieved).toEqual(value)
    })
  })

  describe('delete', () => {
    it('should delete values from cache', async () => {
      const key = 'test-key-delete'
      const value = { data: 'to be deleted' }

      await cacheService.set(key, value)
      expect(await cacheService.get(key)).toEqual(value)

      await cacheService.delete(key)
      expect(await cacheService.get(key)).toBeNull()
    })

    it('should not throw error when deleting non-existent key', async () => {
      await expect(cacheService.delete('non-existent')).resolves.not.toThrow()
    })
  })

  describe('getCacheStats', () => {
    it('should track cache hits and misses', async () => {
      const key = 'stats-test-key'
      const value = { data: 'test' }

      // Initial stats
      let stats = await cacheService.getCacheStats()
      const initialHits = stats.hits
      const initialMisses = stats.misses

      // Cache miss
      await cacheService.get('non-existent')
      stats = await cacheService.getCacheStats()
      expect(stats.misses).toBe(initialMisses + 1)

      // Set value
      await cacheService.set(key, value)

      // Cache hit
      await cacheService.get(key)
      stats = await cacheService.getCacheStats()
      expect(stats.hits).toBe(initialHits + 1)
    })

    it('should calculate hit rate correctly', async () => {
      const key = 'hitrate-test-key'
      const value = { data: 'test' }

      await cacheService.set(key, value)

      // 2 hits
      await cacheService.get(key)
      await cacheService.get(key)

      // 1 miss
      await cacheService.get('non-existent')

      const stats = await cacheService.getCacheStats()
      // Hit rate should be 2/3 = 0.6667
      expect(stats.hitRate).toBeCloseTo(0.6667, 4)
    })

    it('should return 0 hit rate when no operations performed', async () => {
      const stats = await cacheService.getCacheStats()
      expect(stats.hitRate).toBe(0)
    })

    it('should track cache size', async () => {
      const initialStats = await cacheService.getCacheStats()
      const initialSize = initialStats.size

      await cacheService.set('key1', 'value1')
      await cacheService.set('key2', 'value2')
      await cacheService.set('key3', 'value3')

      const stats = await cacheService.getCacheStats()
      expect(stats.size).toBe(initialSize + 3)
    })

    it('should return all required stat fields', async () => {
      const stats = await cacheService.getCacheStats()

      expect(stats).toHaveProperty('hits')
      expect(stats).toHaveProperty('misses')
      expect(stats).toHaveProperty('hitRate')
      expect(stats).toHaveProperty('size')

      expect(typeof stats.hits).toBe('number')
      expect(typeof stats.misses).toBe('number')
      expect(typeof stats.hitRate).toBe('number')
      expect(typeof stats.size).toBe('number')
    })
  })

  describe('clear', () => {
    it('should clear all cache entries', async () => {
      await cacheService.set('key1', 'value1')
      await cacheService.set('key2', 'value2')
      await cacheService.set('key3', 'value3')

      let stats = await cacheService.getCacheStats()
      expect(stats.size).toBeGreaterThan(0)

      await cacheService.clear()

      stats = await cacheService.getCacheStats()
      expect(stats.size).toBe(0)
    })

    it('should reset cache statistics', async () => {
      await cacheService.set('key1', 'value1')
      await cacheService.get('key1') // hit
      await cacheService.get('non-existent') // miss

      let stats = await cacheService.getCacheStats()
      expect(stats.hits).toBeGreaterThan(0)
      expect(stats.misses).toBeGreaterThan(0)

      await cacheService.clear()

      stats = await cacheService.getCacheStats()
      expect(stats.hits).toBe(0)
      expect(stats.misses).toBe(0)
    })
  })

  describe('isRedisConnected', () => {
    it('should return false when Redis is not configured', () => {
      expect(cacheService.isRedisConnected()).toBe(false)
    })
  })

  describe('integration scenarios', () => {
    it('should handle typical grading cache workflow', async () => {
      const code = 'function fibonacci(n) { return n <= 1 ? n : fibonacci(n-1) + fibonacci(n-2); }'
      const exerciseId = 'ex-fibonacci'
      const language = 'javascript'

      // Generate cache key
      const cacheKey = cacheService.generateCacheKey(code, exerciseId, language)

      // First submission - cache miss
      let cachedResult = await cacheService.get(cacheKey)
      expect(cachedResult).toBeNull()

      // Store AI analysis result
      const aiAnalysis = {
        aiScore: 75,
        scores: {
          codeQuality: 70,
          bestPractices: 75,
          complexity: 60, // Recursive without memoization
          security: 90,
        },
        strengths: ['Correct implementation', 'Clean code'],
        improvements: ['Consider memoization for better performance'],
        suggestions: ['Use dynamic programming approach'],
        feedback: 'Code hoạt động đúng nhưng có thể tối ưu hiệu suất.',
      }

      await cacheService.set(cacheKey, aiAnalysis, 3600)

      // Second submission with same code - cache hit
      cachedResult = await cacheService.get(cacheKey)
      expect(cachedResult).toEqual(aiAnalysis)

      // Verify stats
      const stats = await cacheService.getCacheStats()
      expect(stats.hits).toBeGreaterThan(0)
      expect(stats.misses).toBeGreaterThan(0)
    })

    it('should handle multiple concurrent cache operations', async () => {
      const operations = []

      // Simulate concurrent cache operations
      for (let i = 0; i < 10; i++) {
        const key = `concurrent-key-${i}`
        const value = { index: i, data: `value-${i}` }
        operations.push(cacheService.set(key, value))
      }

      await Promise.all(operations)

      // Verify all values are stored
      for (let i = 0; i < 10; i++) {
        const key = `concurrent-key-${i}`
        const retrieved = await cacheService.get(key)
        expect(retrieved).toEqual({ index: i, data: `value-${i}` })
      }
    })
  })
})
