import type {Cache, CacheStats} from './cache/types'
import {createKeyResolver} from './cache/key-resolver'
import {createLRUCache} from './cache/lru'
import {createTTLCache} from './cache/ttl'

/**
 * Cache strategy type for the memoize function.
 */
export type MemoizeCacheStrategy = 'map' | 'lru' | 'ttl'

/**
 * Options for configuring the memoize function.
 */
export interface MemoizeOptions<Args extends unknown[] = unknown[]> {
  /**
   * Cache strategy to use.
   * - 'map': Simple Map-based cache (default, no eviction)
   * - 'lru': Least Recently Used eviction (requires maxSize)
   * - 'ttl': Time-to-live based expiration (requires ttl)
   */
  readonly strategy?: MemoizeCacheStrategy

  /**
   * Maximum number of entries to cache (for 'lru' and optionally 'ttl').
   * Required when using 'lru' strategy.
   */
  readonly maxSize?: number

  /**
   * Time-to-live in milliseconds (for 'ttl' strategy).
   * Required when using 'ttl' strategy.
   */
  readonly ttl?: number

  /**
   * Custom key resolver function.
   * By default uses createKeyResolver which handles most types.
   */
  readonly keyResolver?: (args: Args) => string

  /**
   * Called when a cache hit occurs.
   */
  readonly onHit?: (key: string, value: unknown) => void

  /**
   * Called when a cache miss occurs.
   */
  readonly onMiss?: (key: string) => void
}

/**
 * Extended function type with cache control methods.
 */
export interface MemoizedFunction<T extends (...args: never[]) => unknown> {
  /**
   * Call the memoized function.
   */
  (...args: Parameters<T>): ReturnType<T>

  /**
   * Clears all cached values.
   */
  clear: () => void

  /**
   * Deletes a specific cached value by arguments.
   */
  delete: (...args: Parameters<T>) => boolean

  /**
   * Gets cache statistics.
   */
  getStats: () => CacheStats

  /**
   * Resets cache statistics.
   */
  resetStats: () => void
}

/**
 * Simple Map-based cache with statistics tracking.
 */
function createMapCache<K, V>(): Cache<K, V> {
  const cache = new Map<K, V>()
  let hits = 0
  let misses = 0

  return {
    get(key: K): V | undefined {
      if (cache.has(key)) {
        hits++
        return cache.get(key)
      }
      misses++
      return undefined
    },

    set(key: K, value: V): void {
      cache.set(key, value)
    },

    has(key: K): boolean {
      return cache.has(key)
    },

    delete(key: K): boolean {
      return cache.delete(key)
    },

    clear(): void {
      cache.clear()
    },

    getStats(): CacheStats {
      return {
        hits,
        misses,
        evictions: 0,
        size: cache.size,
      }
    },

    resetStats(): void {
      hits = 0
      misses = 0
    },
  }
}

interface CacheCreationOptions {
  strategy: MemoizeCacheStrategy
  maxSize?: number | undefined
  ttl?: number | undefined
}

function createCacheForStrategy<V>(options: CacheCreationOptions): Cache<string, V> {
  const {strategy, maxSize, ttl} = options

  switch (strategy) {
    case 'lru':
      if (maxSize === undefined) {
        throw new Error('maxSize is required for LRU cache strategy')
      }
      return createLRUCache<string, V>({maxSize})

    case 'ttl':
      if (ttl === undefined) {
        throw new Error('ttl is required for TTL cache strategy')
      }
      return createTTLCache<string, V>({ttl, maxSize})

    case 'map':
      return createMapCache<string, V>()
  }
}

/**
 * Creates a memoized version of a function that caches results based on arguments.
 *
 * @param fn - The function to memoize
 * @param options - Memoization options
 * @returns A memoized version of the function with cache control methods
 *
 * @example
 * ```ts
 * // Simple memoization with Map cache
 * const memoizedAdd = memoize((a: number, b: number) => a + b)
 * memoizedAdd(1, 2) // Computed: 3
 * memoizedAdd(1, 2) // Cached: 3
 *
 * // LRU cache with max 100 entries
 * const memoizedFetch = memoize(fetchUser, { strategy: 'lru', maxSize: 100 })
 *
 * // TTL cache with 5 minute expiration
 * const memoizedConfig = memoize(loadConfig, { strategy: 'ttl', ttl: 300_000 })
 *
 * // Custom key resolver
 * const memoizedQuery = memoize(query, {
 *   keyResolver: (args) => args[0].id, // Use only the id for caching
 * })
 *
 * // Cache statistics
 * const stats = memoizedFn.getStats()
 * console.log(`Hits: ${stats.hits}, Misses: ${stats.misses}`)
 *
 * // Clear cache
 * memoizedFn.clear()
 * ```
 */
export function memoize<T extends (...args: never[]) => unknown>(
  fn: T,
  options: MemoizeOptions<Parameters<T>> = {},
): MemoizedFunction<T> {
  const {
    strategy = 'map',
    maxSize,
    ttl,
    keyResolver = (args: Parameters<T>) => createKeyResolver(args as unknown[]),
    onHit,
    onMiss,
  } = options

  const cache = createCacheForStrategy<ReturnType<T>>({strategy, maxSize, ttl})

  const memoized = function (this: unknown, ...args: Parameters<T>): ReturnType<T> {
    const key = keyResolver(args)
    const cached = cache.get(key)

    if (cached !== undefined) {
      onHit?.(key, cached)
      return cached
    }

    // Check if the key exists but value is undefined
    if (cache.has(key)) {
      onHit?.(key, undefined)
      return undefined as ReturnType<T>
    }

    onMiss?.(key)
    const result = fn.apply(this, args) as ReturnType<T>
    cache.set(key, result)
    return result
  } as MemoizedFunction<T>

  memoized.clear = (): void => {
    cache.clear()
  }

  memoized.delete = (...args: Parameters<T>): boolean => {
    const key = keyResolver(args)
    return cache.delete(key)
  }

  memoized.getStats = (): CacheStats => {
    return cache.getStats()
  }

  memoized.resetStats = (): void => {
    cache.resetStats()
  }

  return memoized
}

/**
 * Creates a memoized version of an async function with promise deduplication.
 *
 * Concurrent calls with the same arguments will share a single in-flight promise,
 * preventing duplicate executions. Failed promises are not cached.
 *
 * @param fn - The async function to memoize
 * @param options - Memoization options
 * @returns A memoized version of the async function
 *
 * @example
 * ```ts
 * const memoizedFetch = memoizeAsync(async (id: string) => {
 *   const response = await fetch(`/api/users/${id}`)
 *   return response.json()
 * }, { strategy: 'ttl', ttl: 60_000 })
 * ```
 */
export function memoizeAsync<Args extends unknown[], Result>(
  fn: (...args: Args) => Promise<Result>,
  options: MemoizeOptions<Args> = {},
): MemoizedFunction<(...args: Args) => Promise<Result>> {
  const {
    strategy = 'map',
    maxSize,
    ttl,
    keyResolver = (args: Args) => createKeyResolver(args),
    onHit,
    onMiss,
  } = options

  const cache = createCacheForStrategy<Promise<Result>>({strategy, maxSize, ttl})
  const pendingPromises = new Map<string, Promise<Result>>()

  async function memoizedFn(...args: Args): Promise<Result> {
    const key = keyResolver(args)
    const cached = cache.get(key)

    if (cached !== undefined) {
      onHit?.(key, cached)
      return cached
    }

    // Check for pending promise with same key (deduplication)
    const pending = pendingPromises.get(key)
    if (pending !== undefined) {
      onHit?.(key, pending)
      return pending
    }

    onMiss?.(key)

    const promise = fn(...args)
    pendingPromises.set(key, promise)

    try {
      const result = await promise
      pendingPromises.delete(key)
      cache.set(key, Promise.resolve(result))
      return result
    } catch (error) {
      pendingPromises.delete(key)
      throw error
    }
  }

  const memoized = memoizedFn as unknown as MemoizedFunction<(...args: Args) => Promise<Result>>

  memoized.clear = (): void => {
    cache.clear()
    pendingPromises.clear()
  }

  memoized.delete = (...args: Args): boolean => {
    const key = keyResolver(args)
    pendingPromises.delete(key)
    return cache.delete(key)
  }

  memoized.getStats = (): CacheStats => {
    return cache.getStats()
  }

  memoized.resetStats = (): void => {
    cache.resetStats()
  }

  return memoized
}
