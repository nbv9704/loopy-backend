import crypto from 'crypto'
import NodeCache from 'node-cache'
import { createClient, RedisClientType } from 'redis'

/**
 * Cache statistics for monitoring
 */
export interface CacheStats {
  hits: number
  misses: number
  hitRate: number
  size: number
}

/**
 * CacheService for Auto-Grading System
 *
 * Provides caching functionality for AI analysis results to minimize redundant API calls.
 * Supports Redis as primary cache with NodeCache as in-memory fallback.
 *
 * **Validates Requirements**: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6
 */
export class GradingCacheService {
  private redisClient: RedisClientType | null = null
  private nodeCache: NodeCache
  private stats = {
    hits: 0,
    misses: 0,
  }
  private readonly DEFAULT_TTL = 3600 // 1 hour in seconds (Requirement 16.4)

  constructor(redisUrl?: string) {
    // Initialize NodeCache as fallback (Requirement 16.6)
    this.nodeCache = new NodeCache({
      stdTTL: this.DEFAULT_TTL,
      checkperiod: 600, // Check for expired keys every 10 minutes
      useClones: false, // Better performance
    })

    // Initialize Redis if URL is provided (Requirement 16.6)
    if (redisUrl) {
      this.initializeRedis(redisUrl)
    }
  }

  /**
   * Initialize Redis client connection
   * @param redisUrl - Redis connection URL
   */
  private async initializeRedis(redisUrl: string): Promise<void> {
    try {
      this.redisClient = createClient({ 
        url: redisUrl,
        socket: redisUrl.startsWith('rediss://') 
          ? { connectTimeout: 30000, tls: true, rejectUnauthorized: false }
          : { connectTimeout: 30000 }
      })

      this.redisClient.on('error', err => {
        console.error('Redis Client Error:', err)
        // Fall back to NodeCache on error
        this.redisClient = null
      })

      this.redisClient.on('connect', () => {
        console.log('Redis Client Connected')
      })

      await this.redisClient.connect()
    } catch (error) {
      console.error('Failed to initialize Redis:', error)
      this.redisClient = null
    }
  }

  /**
   * Generate SHA-256 hash-based cache key
   *
   * **Validates Requirements**: 16.2
   *
   * @param code - Student code submission
   * @param exerciseId - Exercise identifier
   * @param language - Programming language
   * @returns SHA-256 hash of the combined content
   */
  generateCacheKey(code: string, exerciseId: string, language: string): string {
    const content = `${code}:${exerciseId}:${language}`
    const hash = crypto.createHash('sha256').update(content).digest('hex')
    return `ai-grade:${hash}`
  }

  /**
   * Get a value from cache
   *
   * **Validates Requirements**: 16.3, 16.5
   *
   * @param key - Cache key
   * @returns The cached value or null if not found
   */
  async get(key: string): Promise<any | null> {
    try {
      // Try Redis first if available
      if (this.redisClient?.isOpen) {
        const value = await this.redisClient.get(key)
        if (value !== null && typeof value === 'string') {
          this.stats.hits++
          return JSON.parse(value)
        }
      }

      // Fall back to NodeCache
      const value = this.nodeCache.get(key)
      if (value !== undefined) {
        this.stats.hits++
        return value
      }

      this.stats.misses++
      return null
    } catch (error) {
      console.error('Cache get error:', error)
      this.stats.misses++
      return null
    }
  }

  /**
   * Set a value in cache with TTL
   *
   * **Validates Requirements**: 16.1, 16.4
   *
   * @param key - Cache key
   * @param value - Value to cache
   * @param ttl - Time to live in seconds (defaults to 3600)
   */
  async set(key: string, value: any, ttl: number = this.DEFAULT_TTL): Promise<void> {
    try {
      // Store in Redis if available
      if (this.redisClient?.isOpen) {
        await this.redisClient.setEx(key, ttl, JSON.stringify(value))
      }

      // Always store in NodeCache as fallback
      this.nodeCache.set(key, value, ttl)
    } catch (error) {
      console.error('Cache set error:', error)
      // Ensure NodeCache has the value even if Redis fails
      this.nodeCache.set(key, value, ttl)
    }
  }

  /**
   * Delete a value from cache
   *
   * @param key - Cache key to delete
   */
  async delete(key: string): Promise<void> {
    try {
      // Delete from Redis if available
      if (this.redisClient?.isOpen) {
        await this.redisClient.del(key)
      }

      // Delete from NodeCache
      this.nodeCache.del(key)
    } catch (error) {
      console.error('Cache delete error:', error)
      // Ensure NodeCache deletion even if Redis fails
      this.nodeCache.del(key)
    }
  }

  /**
   * Get cache statistics for monitoring
   *
   * **Validates Requirements**: 16.5
   *
   * @returns Cache statistics including hits, misses, hit rate, and size
   */
  async getCacheStats(): Promise<CacheStats> {
    const total = this.stats.hits + this.stats.misses
    const hitRate = total > 0 ? this.stats.hits / total : 0

    // Get size from NodeCache (Redis size would require additional queries)
    const size = this.nodeCache.keys().length

    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: parseFloat(hitRate.toFixed(4)),
      size,
    }
  }

  /**
   * Clear all cache entries
   * Useful for testing and maintenance
   */
  async clear(): Promise<void> {
    try {
      // Clear Redis if available
      if (this.redisClient?.isOpen) {
        await this.redisClient.flushDb()
      }

      // Clear NodeCache
      this.nodeCache.flushAll()

      // Reset stats
      this.stats.hits = 0
      this.stats.misses = 0
    } catch (error) {
      console.error('Cache clear error:', error)
      // Ensure NodeCache is cleared even if Redis fails
      this.nodeCache.flushAll()
      this.stats.hits = 0
      this.stats.misses = 0
    }
  }

  /**
   * Close Redis connection
   * Should be called when shutting down the application
   */
  async disconnect(): Promise<void> {
    if (this.redisClient?.isOpen) {
      await this.redisClient.quit()
    }
  }

  /**
   * Check if Redis is available and connected
   * @returns true if Redis is connected, false otherwise
   */
  isRedisConnected(): boolean {
    return this.redisClient?.isOpen ?? false
  }
}

// Export singleton instance
// Redis URL is optional - will use NodeCache fallback if not provided
const redisUrl = process.env.REDIS_URL
export const gradingCacheService = new GradingCacheService(redisUrl)
