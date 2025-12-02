import type {Cache, CacheStats, TTLCacheOptions} from './types'

/**
 * Entry in the TTL cache with expiration time.
 */
interface TTLEntry<V> {
  value: V
  expiresAt: number
}

/**
 * Creates a TTL (Time-To-Live) cache where entries expire after a specified duration.
 *
 * Expired entries are lazily removed on access and optionally capped by maxSize.
 *
 * @param options - TTL cache configuration
 * @returns A cache instance with TTL-based expiration
 *
 * @example
 * ```ts
 * const cache = createTTLCache<string, number>({ ttl: 5000 }) // 5 seconds
 * cache.set('key', 42)
 * cache.get('key') // => 42
 * // After 5 seconds...
 * cache.get('key') // => undefined
 * ```
 */
export function createTTLCache<K, V>(options: TTLCacheOptions): Cache<K, V> {
  const {ttl, maxSize} = options

  if (ttl < 0) {
    throw new Error('TTL must be non-negative')
  }

  if (maxSize !== undefined && maxSize < 1) {
    throw new Error('TTL cache maxSize must be at least 1')
  }

  const cache = new Map<K, TTLEntry<V>>()

  let hits = 0
  let misses = 0
  let evictions = 0

  function isExpired(entry: TTLEntry<V>): boolean {
    return Date.now() > entry.expiresAt
  }

  function evictExpired(): void {
    const now = Date.now()
    for (const [key, entry] of cache) {
      if (now > entry.expiresAt) {
        cache.delete(key)
        evictions++
      }
    }
  }

  function evictOldest(): void {
    // Find and remove the entry closest to expiration
    let oldestKey: K | undefined
    let oldestExpiresAt = Number.POSITIVE_INFINITY

    for (const [key, entry] of cache) {
      if (entry.expiresAt < oldestExpiresAt) {
        oldestExpiresAt = entry.expiresAt
        oldestKey = key
      }
    }

    if (oldestKey !== undefined) {
      cache.delete(oldestKey)
      evictions++
    }
  }

  return {
    get(key: K): V | undefined {
      const entry = cache.get(key)

      if (entry === undefined) {
        misses++
        return undefined
      }

      if (isExpired(entry)) {
        cache.delete(key)
        evictions++
        misses++
        return undefined
      }

      hits++
      return entry.value
    },

    set(key: K, value: V): void {
      // Clean up expired entries periodically
      if (cache.size > 0 && cache.size % 100 === 0) {
        evictExpired()
      }

      // Evict if at capacity (after checking for existing key)
      if (maxSize !== undefined && !cache.has(key) && cache.size >= maxSize) {
        evictOldest()
      }

      cache.set(key, {
        value,
        expiresAt: Date.now() + ttl,
      })
    },

    has(key: K): boolean {
      const entry = cache.get(key)
      if (entry === undefined) {
        return false
      }
      if (isExpired(entry)) {
        cache.delete(key)
        evictions++
        return false
      }
      return true
    },

    delete(key: K): boolean {
      return cache.delete(key)
    },

    clear(): void {
      cache.clear()
    },

    getStats(): CacheStats {
      // Count only non-expired entries for accurate size
      let size = 0
      const now = Date.now()
      for (const entry of cache.values()) {
        if (now <= entry.expiresAt) {
          size++
        }
      }

      return {
        hits,
        misses,
        evictions,
        size,
      }
    },

    resetStats(): void {
      hits = 0
      misses = 0
      evictions = 0
    },
  }
}
