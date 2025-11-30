import type {CacheStats, WeakCacheOptions} from './types'

/**
 * A cache that uses weak references for object keys.
 *
 * Keys must be objects (not primitives). Values are garbage collected
 * when the key is no longer referenced elsewhere.
 */
export interface WeakCache<K extends WeakKey, V> {
  /**
   * Gets a value from the cache.
   *
   * @param key - The cache key (must be an object)
   * @returns The cached value or undefined if not found
   */
  get: (key: K) => V | undefined

  /**
   * Sets a value in the cache.
   *
   * @param key - The cache key (must be an object)
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
   * Gets cache statistics.
   *
   * Note: Size is tracked manually since WeakMap doesn't expose size.
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
 * Creates a cache that uses weak references for object keys.
 *
 * Values are automatically garbage collected when keys are no longer referenced.
 * Use this for caching computed results based on object identity without
 * preventing garbage collection.
 *
 * @param _options - Weak cache configuration (currently unused but reserved)
 * @returns A weak cache instance
 *
 * @example
 * ```ts
 * const cache = createWeakCache<object, number>({})
 * const obj = { id: 1 }
 * cache.set(obj, 42)
 * cache.get(obj) // => 42
 * // When obj is garbage collected, the cached value is also cleaned up
 * ```
 */
export function createWeakCache<K extends WeakKey, V>(
  _options: WeakCacheOptions = {},
): WeakCache<K, V> {
  const cache = new WeakMap<K, V>()

  // Manual size tracking since WeakMap doesn't expose size
  // This is approximate since we can't detect GC
  let approximateSize = 0
  let hits = 0
  let misses = 0

  return {
    get(key: K): V | undefined {
      const value = cache.get(key)
      if (value === undefined && !cache.has(key)) {
        misses++
        return undefined
      }
      hits++
      return value
    },

    set(key: K, value: V): void {
      if (!cache.has(key)) {
        approximateSize++
      }
      cache.set(key, value)
    },

    has(key: K): boolean {
      return cache.has(key)
    },

    delete(key: K): boolean {
      const existed = cache.has(key)
      if (existed) {
        approximateSize = Math.max(0, approximateSize - 1)
      }
      cache.delete(key)
      return existed
    },

    getStats(): CacheStats {
      return {
        hits,
        misses,
        evictions: 0, // WeakMap handles eviction via GC
        size: approximateSize,
      }
    },

    resetStats(): void {
      hits = 0
      misses = 0
    },
  }
}
