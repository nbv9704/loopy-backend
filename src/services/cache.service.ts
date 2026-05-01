import NodeCache from 'node-cache'

/**
 * CacheService - In-memory caching service using node-cache
 *
 * Provides caching functionality with TTL support for content API responses.
 * Default TTL is 5 minutes (300 seconds) as per Requirements 14.1 and 14.4.
 */
class CacheService {
  private cache: NodeCache

  constructor() {
    // Initialize NodeCache with 5-minute default TTL
    this.cache = new NodeCache({
      stdTTL: 300, // 5 minutes default (Requirement 14.1)
      checkperiod: 60, // Check for expired keys every 60 seconds
      useClones: false, // Better performance, but be careful with object mutations
    })
  }

  /**
   * Get a value from cache
   * @param key - Cache key
   * @returns The cached value or undefined if not found or expired
   */
  get<T>(key: string): T | undefined {
    return this.cache.get<T>(key)
  }

  /**
   * Set a value in cache with optional TTL
   * @param key - Cache key
   * @param value - Value to cache
   * @param ttl - Time to live in seconds (optional, defaults to 300s)
   * @returns true if successful, false otherwise
   */
  set<T>(key: string, value: T, ttl?: number): boolean {
    return this.cache.set(key, value, ttl || 300)
  }

  /**
   * Invalidate cache entries matching a pattern
   * Useful for invalidating related cache entries (e.g., all content:doc-* keys)
   * @param pattern - String pattern to match against cache keys
   */
  invalidate(pattern: string): void {
    const keys = this.cache.keys()
    keys.forEach(key => {
      if (key.startsWith(pattern)) {
        this.cache.del(key)
      }
    })
  }

  /**
   * Clear all cache entries
   * Flushes the entire cache
   */
  clear(): void {
    this.cache.flushAll()
  }
}

// Export singleton instance
export const cacheService = new CacheService()
