/**
 * Statistics about cache performance.
 */
export interface CacheStats {
  /** Number of cache hits */
  readonly hits: number
  /** Number of cache misses */
  readonly misses: number
  /** Number of entries evicted from cache */
  readonly evictions: number
  /** Current number of entries in cache */
  readonly size: number
}

/**
 * Common interface for all cache implementations.
 */
export interface Cache<K, V> {
  /**
   * Gets a value from the cache.
   *
   * @param key - The cache key
   * @returns The cached value or undefined if not found
   */
  get: (key: K) => V | undefined

  /**
   * Sets a value in the cache.
   *
   * @param key - The cache key
   * @param value - The value to cache
   */
  set: (key: K, value: V) => void

  /**
   * Checks if a key exists in the cache.
   *
   * @param key - The cache key
   * @returns True if the key exists
   */
  has: (key: K) => boolean

  /**
   * Deletes a key from the cache.
   *
   * @param key - The cache key
   * @returns True if the key was deleted
   */
  delete: (key: K) => boolean

  /**
   * Clears all entries from the cache.
   */
  clear: () => void

  /**
   * Gets cache statistics.
   *
   * @returns Current cache statistics
   */
  getStats: () => CacheStats

  /**
   * Resets cache statistics.
   */
  resetStats: () => void
}

/**
 * Options for LRU cache creation.
 */
export interface LRUCacheOptions {
  /** Maximum number of entries in the cache */
  readonly maxSize: number
}

/**
 * Options for TTL cache creation.
 */
export interface TTLCacheOptions {
  /** Time-to-live in milliseconds */
  readonly ttl: number
  /** Maximum number of entries (optional) */
  readonly maxSize?: number | undefined
}

/**
 * Options for weak reference cache creation.
 */
export interface WeakCacheOptions {
  /** Optional cleanup interval in milliseconds */
  readonly cleanupInterval?: number
}
