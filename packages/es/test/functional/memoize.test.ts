import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {memoize, memoizeAsync} from '../../src/functional/memoize'

interface TrackedFn<Args extends unknown[], R> {
  fn: (...args: Args) => R
  getCallCount: () => number
}

function createTrackedFn<Args extends unknown[], R>(
  impl: (...args: Args) => R,
): TrackedFn<Args, R> {
  let callCount = 0
  return {
    fn: (...args: Args): R => {
      callCount++
      return impl(...args)
    },
    getCallCount: () => callCount,
  }
}

describe('@bfra.me/es/functional - memoize()', () => {
  describe('basic caching behavior (TEST-012)', () => {
    it.concurrent('should cache results for identical arguments', () => {
      const {fn: expensive, getCallCount} = createTrackedFn((a: number, b: number) => a + b)

      const memoized = memoize(expensive)

      expect(memoized(1, 2)).toBe(3)
      expect(memoized(1, 2)).toBe(3)
      expect(memoized(1, 2)).toBe(3)
      expect(getCallCount()).toBe(1)
    })

    it.concurrent('should compute new results for different arguments', () => {
      const {fn: expensive, getCallCount} = createTrackedFn((a: number, b: number) => a + b)

      const memoized = memoize(expensive)

      expect(memoized(1, 2)).toBe(3)
      expect(memoized(2, 3)).toBe(5)
      expect(memoized(3, 4)).toBe(7)
      expect(getCallCount()).toBe(3)
    })

    it.concurrent('should handle functions with no arguments', () => {
      const {fn: getTimestamp, getCallCount} = createTrackedFn(() => Date.now())

      const memoized = memoize(getTimestamp)

      const first = memoized()
      const second = memoized()

      expect(first).toBe(second)
      expect(getCallCount()).toBe(1)
    })

    it.concurrent('should handle functions returning undefined', () => {
      const {fn: returnsUndefined, getCallCount} = createTrackedFn((_x: number) => undefined)

      const memoized = memoize(returnsUndefined)

      expect(memoized(1)).toBeUndefined()
      expect(memoized(1)).toBeUndefined()
      expect(getCallCount()).toBe(1)
    })

    it.concurrent('should handle functions returning null', () => {
      const {fn: returnsNull, getCallCount} = createTrackedFn((_x: number) => null)

      const memoized = memoize(returnsNull)

      expect(memoized(1)).toBeNull()
      expect(memoized(1)).toBeNull()
      expect(getCallCount()).toBe(1)
    })

    it.concurrent('should cache based on object content, not reference', () => {
      const {fn: processObject, getCallCount} = createTrackedFn(
        (obj: {id: number}) => `processed-${obj.id}`,
      )

      const memoized = memoize(processObject)

      expect(memoized({id: 1})).toBe('processed-1')
      expect(memoized({id: 1})).toBe('processed-1')
      expect(getCallCount()).toBe(1)
    })

    it.concurrent('should preserve this context', () => {
      const obj = {
        multiplier: 10,
        compute(x: number): number {
          return x * this.multiplier
        },
      }

      const memoized = memoize(obj.compute.bind(obj))

      expect(memoized(5)).toBe(50)
      expect(memoized(5)).toBe(50)
    })
  })

  describe('lru cache strategy (TEST-013)', () => {
    it.concurrent('should evict least recently used entries when maxSize is exceeded', () => {
      const {fn, getCallCount} = createTrackedFn((x: number) => x * 2)

      const memoized = memoize(fn, {strategy: 'lru', maxSize: 3})

      expect(memoized(1)).toBe(2)
      expect(memoized(2)).toBe(4)
      expect(memoized(3)).toBe(6)
      expect(getCallCount()).toBe(3)

      expect(memoized(4)).toBe(8)
      expect(getCallCount()).toBe(4)

      expect(memoized(2)).toBe(4)
      expect(memoized(3)).toBe(6)
      expect(getCallCount()).toBe(4)

      expect(memoized(1)).toBe(2)
      expect(getCallCount()).toBe(5)
    })

    it.concurrent('should update LRU order on cache hit', () => {
      const {fn, getCallCount} = createTrackedFn((x: number) => x * 2)

      const memoized = memoize(fn, {strategy: 'lru', maxSize: 3})

      memoized(1)
      memoized(2)
      memoized(3)
      expect(getCallCount()).toBe(3)

      memoized(1)
      expect(getCallCount()).toBe(3)

      memoized(4)
      expect(getCallCount()).toBe(4)

      expect(memoized(1)).toBe(2)
      expect(getCallCount()).toBe(4)

      expect(memoized(2)).toBe(4)
      expect(getCallCount()).toBe(5)
    })

    it.concurrent('should track evictions in statistics', () => {
      const memoized = memoize((x: number) => x * 2, {strategy: 'lru', maxSize: 2})

      memoized(1)
      memoized(2)
      memoized(3)
      memoized(4)

      const stats = memoized.getStats()
      expect(stats.evictions).toBe(2)
    })

    it.concurrent('should throw when LRU strategy is used without maxSize', () => {
      expect(() => memoize((x: number) => x * 2, {strategy: 'lru'})).toThrow(
        'maxSize is required for LRU cache strategy',
      )
    })
  })

  describe('ttl cache strategy (TEST-014)', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should expire entries after TTL', () => {
      const {fn, getCallCount} = createTrackedFn((x: number) => x * 2)

      const memoized = memoize(fn, {strategy: 'ttl', ttl: 1000})

      expect(memoized(1)).toBe(2)
      expect(getCallCount()).toBe(1)

      vi.advanceTimersByTime(500)
      expect(memoized(1)).toBe(2)
      expect(getCallCount()).toBe(1)

      vi.advanceTimersByTime(600)
      expect(memoized(1)).toBe(2)
      expect(getCallCount()).toBe(2)
    })

    it('should track expired entries as evictions', () => {
      const memoized = memoize((x: number) => x * 2, {strategy: 'ttl', ttl: 100})

      memoized(1)

      vi.advanceTimersByTime(150)
      memoized(1)

      const stats = memoized.getStats()
      expect(stats.evictions).toBeGreaterThan(0)
    })

    it('should throw when TTL strategy is used without ttl', () => {
      expect(() => memoize((x: number) => x * 2, {strategy: 'ttl'})).toThrow(
        'ttl is required for TTL cache strategy',
      )
    })

    it('should respect maxSize with TTL strategy', () => {
      const {fn, getCallCount} = createTrackedFn((x: number) => x * 2)

      const memoized = memoize(fn, {strategy: 'ttl', ttl: 10000, maxSize: 2})

      memoized(1)
      memoized(2)
      memoized(3)

      expect(getCallCount()).toBe(3)

      const stats = memoized.getStats()
      expect(stats.size).toBeLessThanOrEqual(2)
    })
  })

  describe('map cache strategy (default)', () => {
    it.concurrent('should use Map cache by default', () => {
      const {fn, getCallCount} = createTrackedFn((x: number) => x * 2)

      const memoized = memoize(fn)

      memoized(1)
      memoized(2)
      memoized(1)

      expect(getCallCount()).toBe(2)

      const stats = memoized.getStats()
      expect(stats.hits).toBe(1)
      expect(stats.misses).toBe(2)
      expect(stats.evictions).toBe(0)
    })

    it.concurrent('should explicitly accept map strategy', () => {
      const memoized = memoize((x: number) => x * 2, {strategy: 'map'})

      memoized(1)
      memoized(1)

      const stats = memoized.getStats()
      expect(stats.hits).toBe(1)
      expect(stats.misses).toBe(1)
    })
  })

  describe('cache control methods', () => {
    it.concurrent('clear() should remove all cached values', () => {
      const {fn, getCallCount} = createTrackedFn((x: number) => x * 2)

      const memoized = memoize(fn)

      memoized(1)
      memoized(2)
      expect(getCallCount()).toBe(2)

      memoized.clear()

      memoized(1)
      memoized(2)
      expect(getCallCount()).toBe(4)
    })

    it.concurrent('delete() should remove specific cached value', () => {
      const {fn, getCallCount} = createTrackedFn((x: number) => x * 2)

      const memoized = memoize(fn)

      memoized(1)
      memoized(2)
      expect(getCallCount()).toBe(2)

      const deleted = memoized.delete(1)
      expect(deleted).toBe(true)

      memoized(1)
      expect(getCallCount()).toBe(3)

      memoized(2)
      expect(getCallCount()).toBe(3)
    })

    it.concurrent('delete() should return false for non-existent key', () => {
      const memoized = memoize((x: number) => x * 2)

      memoized(1)

      const deleted = memoized.delete(999)
      expect(deleted).toBe(false)
    })

    it.concurrent('getStats() should return cache statistics', () => {
      const memoized = memoize((x: number) => x * 2)

      memoized(1)
      memoized(2)
      memoized(1)
      memoized(3)
      memoized(1)

      const stats = memoized.getStats()
      expect(stats.hits).toBe(2)
      expect(stats.misses).toBe(3)
      expect(stats.size).toBe(3)
    })

    it.concurrent('resetStats() should reset statistics but keep cached values', () => {
      const memoized = memoize((x: number) => x * 2)

      memoized(1)
      memoized(1)

      let stats = memoized.getStats()
      expect(stats.hits).toBe(1)
      expect(stats.misses).toBe(1)

      memoized.resetStats()

      stats = memoized.getStats()
      expect(stats.hits).toBe(0)
      expect(stats.misses).toBe(0)
      expect(stats.size).toBe(1)

      const memoized2 = memoize((x: number) => x * 2)

      memoized2(1)
      memoized2.resetStats()
      memoized2(1)

      expect(memoized2.getStats().hits).toBe(1)
    })
  })

  describe('custom key resolver', () => {
    it.concurrent('should use custom key resolver', () => {
      const {fn, getCallCount} = createTrackedFn(
        (obj: {id: number; name: string}) => `${obj.id}-${obj.name}`,
      )

      const memoized = memoize(fn, {
        keyResolver: args => String(args[0].id),
      })

      expect(memoized({id: 1, name: 'Alice'})).toBe('1-Alice')
      expect(memoized({id: 1, name: 'Bob'})).toBe('1-Alice')
      expect(getCallCount()).toBe(1)

      expect(memoized({id: 2, name: 'Charlie'})).toBe('2-Charlie')
      expect(getCallCount()).toBe(2)
    })
  })

  describe('callbacks', () => {
    it.concurrent('should call onHit callback on cache hit', () => {
      const hits: {key: string; value: unknown}[] = []

      const memoized = memoize((x: number) => x * 2, {
        onHit: (key, value) => hits.push({key, value}),
      })

      memoized(5)
      memoized(5)
      memoized(5)

      expect(hits).toHaveLength(2)
      expect(hits[0]).toEqual({key: '5', value: 10})
    })

    it.concurrent('should call onMiss callback on cache miss', () => {
      const misses: string[] = []

      const memoized = memoize((x: number) => x * 2, {
        onMiss: key => misses.push(key),
      })

      memoized(1)
      memoized(2)
      memoized(1)
      memoized(3)

      expect(misses).toEqual(['1', '2', '3'])
    })
  })

  describe('argument type handling', () => {
    it.concurrent('should handle string arguments', () => {
      const {fn, getCallCount} = createTrackedFn((s: string) => s.length)

      const memoized = memoize(fn)

      expect(memoized('hello')).toBe(5)
      expect(memoized('hello')).toBe(5)
      expect(getCallCount()).toBe(1)
    })

    it.concurrent('should handle array arguments', () => {
      const {fn, getCallCount} = createTrackedFn((arr: number[]) => arr.reduce((a, b) => a + b, 0))

      const memoized = memoize(fn)

      expect(memoized([1, 2, 3])).toBe(6)
      expect(memoized([1, 2, 3])).toBe(6)
      expect(getCallCount()).toBe(1)

      expect(memoized([4, 5, 6])).toBe(15)
      expect(getCallCount()).toBe(2)
    })

    it.concurrent('should handle nested object arguments', () => {
      const {fn, getCallCount} = createTrackedFn((obj: {a: {b: number}}) => obj.a.b)

      const memoized = memoize(fn)

      expect(memoized({a: {b: 42}})).toBe(42)
      expect(memoized({a: {b: 42}})).toBe(42)
      expect(getCallCount()).toBe(1)
    })

    it.concurrent('should handle multiple arguments of different types', () => {
      const {fn, getCallCount} = createTrackedFn(
        (a: number, b: string, c: boolean) => `${a}-${b}-${c}`,
      )

      const memoized = memoize(fn)

      expect(memoized(1, 'test', true)).toBe('1-test-true')
      expect(memoized(1, 'test', true)).toBe('1-test-true')
      expect(getCallCount()).toBe(1)

      expect(memoized(1, 'test', false)).toBe('1-test-false')
      expect(getCallCount()).toBe(2)
    })

    it.concurrent('should handle Date objects', () => {
      const {fn, getCallCount} = createTrackedFn((d: Date) => d.toISOString())

      const memoized = memoize(fn)

      const date = new Date('2025-01-01')
      expect(memoized(date)).toBe('2025-01-01T00:00:00.000Z')
      expect(memoized(new Date('2025-01-01'))).toBe('2025-01-01T00:00:00.000Z')
      expect(getCallCount()).toBe(1)
    })
  })
})

describe('@bfra.me/es/functional - memoizeAsync()', () => {
  describe('basic async caching', () => {
    it.concurrent('should cache async results', async () => {
      const {fn, getCallCount} = createTrackedFn(async (x: number) => x * 2)

      const memoized = memoizeAsync(fn)

      expect(await memoized(5)).toBe(10)
      expect(await memoized(5)).toBe(10)
      expect(getCallCount()).toBe(1)
    })

    it.concurrent('should compute new results for different arguments', async () => {
      const {fn, getCallCount} = createTrackedFn(async (x: number) => x * 2)

      const memoized = memoizeAsync(fn)

      expect(await memoized(1)).toBe(2)
      expect(await memoized(2)).toBe(4)
      expect(getCallCount()).toBe(2)
    })
  })

  describe('promise deduplication', () => {
    it('should deduplicate concurrent calls with same arguments', async () => {
      let callCount = 0
      const fn = async (x: number): Promise<number> => {
        callCount++
        await new Promise(resolve => setTimeout(resolve, 50))
        return x * 2
      }

      const memoized = memoizeAsync(fn)

      const promise1 = memoized(5)
      const promise2 = memoized(5)
      const promise3 = memoized(5)

      const [result1, result2, result3] = await Promise.all([promise1, promise2, promise3])

      expect(result1).toBe(10)
      expect(result2).toBe(10)
      expect(result3).toBe(10)
      expect(callCount).toBe(1)
    })

    it('should not cache failed promises', async () => {
      let callCount = 0
      let shouldFail = true
      const fn = async (x: number): Promise<number> => {
        callCount++
        if (shouldFail) {
          throw new Error('intentional failure')
        }
        return x * 2
      }

      const memoized = memoizeAsync(fn)

      await expect(memoized(5)).rejects.toThrow('intentional failure')
      expect(callCount).toBe(1)

      shouldFail = false
      expect(await memoized(5)).toBe(10)
      expect(callCount).toBe(2)
    })

    it('should handle concurrent calls where first fails', async () => {
      let callCount = 0
      let shouldFail = true
      const fn = async (x: number): Promise<number> => {
        callCount++
        await new Promise(resolve => setTimeout(resolve, 50))
        if (shouldFail) {
          throw new Error('intentional failure')
        }
        return x * 2
      }

      const memoized = memoizeAsync(fn)

      const promise1 = memoized(5)
      const promise2 = memoized(5)

      await expect(promise1).rejects.toThrow('intentional failure')
      await expect(promise2).rejects.toThrow('intentional failure')
      expect(callCount).toBe(1)

      shouldFail = false
      expect(await memoized(5)).toBe(10)
      expect(callCount).toBe(2)
    })
  })

  describe('cache strategies with async', () => {
    it.concurrent('should work with LRU cache strategy', async () => {
      const {fn, getCallCount} = createTrackedFn(async (x: number) => x * 2)

      const memoized = memoizeAsync(fn, {strategy: 'lru', maxSize: 2})

      await memoized(1)
      await memoized(2)
      await memoized(3)

      expect(getCallCount()).toBe(3)

      await memoized(2)
      expect(getCallCount()).toBe(3)

      await memoized(1)
      expect(getCallCount()).toBe(4)
    })

    it('should work with TTL cache strategy', async () => {
      vi.useFakeTimers()
      const {fn, getCallCount} = createTrackedFn(async (x: number) => x * 2)

      const memoized = memoizeAsync(fn, {strategy: 'ttl', ttl: 1000})

      expect(await memoized(5)).toBe(10)
      expect(getCallCount()).toBe(1)

      vi.advanceTimersByTime(500)
      expect(await memoized(5)).toBe(10)
      expect(getCallCount()).toBe(1)

      vi.advanceTimersByTime(600)
      expect(await memoized(5)).toBe(10)
      expect(getCallCount()).toBe(2)

      vi.useRealTimers()
    })
  })

  describe('cache control methods', () => {
    it.concurrent('clear() should remove all cached values and pending promises', async () => {
      const {fn, getCallCount} = createTrackedFn(async (x: number) => x * 2)

      const memoized = memoizeAsync(fn)

      await memoized(1)
      await memoized(2)
      expect(getCallCount()).toBe(2)

      memoized.clear()

      await memoized(1)
      expect(getCallCount()).toBe(3)
    })

    it.concurrent('delete() should remove specific cached value', async () => {
      const {fn, getCallCount} = createTrackedFn(async (x: number) => x * 2)

      const memoized = memoizeAsync(fn)

      await memoized(1)
      await memoized(2)
      expect(getCallCount()).toBe(2)

      memoized.delete(1)

      await memoized(1)
      expect(getCallCount()).toBe(3)

      await memoized(2)
      expect(getCallCount()).toBe(3)
    })

    it.concurrent('getStats() should return cache statistics', async () => {
      const memoized = memoizeAsync(async (x: number) => x * 2)

      await memoized(1)
      await memoized(2)
      await memoized(1)

      const stats = memoized.getStats()
      expect(stats.hits).toBe(1)
      expect(stats.misses).toBe(2)
    })

    it.concurrent('resetStats() should clear metrics', async () => {
      const memoized = memoizeAsync(async (x: number) => x * 2)

      await memoized(1)
      await memoized(1)

      memoized.resetStats()

      const stats = memoized.getStats()
      expect(stats.hits).toBe(0)
      expect(stats.misses).toBe(0)
    })
  })

  describe('callbacks', () => {
    it.concurrent('should call onHit callback on cache hit', async () => {
      const hits: {key: string}[] = []

      const memoized = memoizeAsync(async (x: number) => x * 2, {
        onHit: key => hits.push({key}),
      })

      await memoized(5)
      await memoized(5)
      await memoized(5)

      expect(hits).toHaveLength(2)
    })

    it.concurrent('should call onMiss callback on cache miss', async () => {
      const misses: string[] = []

      const memoized = memoizeAsync(async (x: number) => x * 2, {
        onMiss: key => misses.push(key),
      })

      await memoized(1)
      await memoized(2)
      await memoized(1)

      expect(misses).toEqual(['1', '2'])
    })
  })

  describe('custom key resolver', () => {
    it.concurrent('should use custom key resolver', async () => {
      const {fn, getCallCount} = createTrackedFn(
        async (obj: {id: number; name: string}) => `${obj.id}-${obj.name}`,
      )

      const memoized = memoizeAsync(fn, {
        keyResolver: args => String(args[0].id),
      })

      expect(await memoized({id: 1, name: 'Alice'})).toBe('1-Alice')
      expect(await memoized({id: 1, name: 'Bob'})).toBe('1-Alice')
      expect(getCallCount()).toBe(1)
    })
  })
})
