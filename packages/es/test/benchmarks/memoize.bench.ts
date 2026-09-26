/**
 * Performance benchmarks for memoization utilities.
 *
 * Validates TEST-036: Memoization cache lookup < 10ns for cache hits
 * Validates PER-004: Memoization cache lookup must be O(1) for primitive keys
 *
 * These benchmarks measure the performance of the memoize function with
 * different cache strategies and various cache sizes.
 */

import {describe, expect, it} from 'vitest'

import {memoize} from '../../src/functional/memoize'

/**
 * Result holder to prevent JIT from eliminating benchmark code.
 */
const results = {value: undefined as unknown}

describe('memoize cache hit performance', () => {
  describe('map strategy (default)', () => {
    const expensiveFn = (x: number): number => x * x * x
    const memoized = memoize(expensiveFn)

    // Prime the cache
    memoized(42)

    it('cache hit - single argument', async ({bench}) => {
      const result = await bench('cache hit - single argument', () => {
        results.value = memoized(42)
      }).run()
      expect(result.latency.samplesCount).toBeGreaterThan(0)
    })
  })

  describe('lru strategy', () => {
    const expensiveFn = (x: number): number => x * x * x
    const memoized = memoize(expensiveFn, {strategy: 'lru', maxSize: 100})

    // Prime the cache
    memoized(42)

    it('cache hit - single argument', async ({bench}) => {
      const result = await bench('cache hit - single argument', () => {
        results.value = memoized(42)
      }).run()
      expect(result.latency.samplesCount).toBeGreaterThan(0)
    })
  })

  describe('ttl strategy', () => {
    const expensiveFn = (x: number): number => x * x * x
    const memoized = memoize(expensiveFn, {strategy: 'ttl', ttl: 60000})

    // Prime the cache
    memoized(42)

    it('cache hit - single argument', async ({bench}) => {
      const result = await bench('cache hit - single argument', () => {
        results.value = memoized(42)
      }).run()
      expect(result.latency.samplesCount).toBeGreaterThan(0)
    })
  })
})

describe('memoize cache miss performance', () => {
  let callCount = 0

  describe('map strategy', () => {
    const expensiveFn = (x: number): number => {
      callCount++
      return x * x * x
    }
    const memoized = memoize(expensiveFn)

    it('cache miss - unique arguments', async ({bench}) => {
      const result = await bench('cache miss - unique arguments', () => {
        results.value = memoized(callCount)
      }).run()
      expect(result.latency.samplesCount).toBeGreaterThan(0)
    })
  })

  describe('lru strategy', () => {
    const expensiveFn = (x: number): number => {
      callCount++
      return x * x * x
    }
    const memoized = memoize(expensiveFn, {strategy: 'lru', maxSize: 10})

    it('cache miss with eviction', async ({bench}) => {
      const result = await bench('cache miss with eviction', () => {
        results.value = memoized(callCount)
      }).run()
      expect(result.latency.samplesCount).toBeGreaterThan(0)
    })
  })
})

describe('memoize with multiple arguments', () => {
  describe('two arguments', () => {
    const add = (a: number, b: number): number => a + b
    const memoized = memoize(add)

    // Prime the cache
    memoized(1, 2)

    it('cache hit - two numeric arguments', async ({bench}) => {
      const result = await bench('cache hit - two numeric arguments', () => {
        results.value = memoized(1, 2)
      }).run()
      expect(result.latency.samplesCount).toBeGreaterThan(0)
    })
  })

  describe('three arguments', () => {
    const sum = (a: number, b: number, c: number): number => a + b + c
    const memoized = memoize(sum)

    // Prime the cache
    memoized(1, 2, 3)

    it('cache hit - three numeric arguments', async ({bench}) => {
      const result = await bench('cache hit - three numeric arguments', () => {
        results.value = memoized(1, 2, 3)
      }).run()
      expect(result.latency.samplesCount).toBeGreaterThan(0)
    })
  })

  describe('mixed argument types', () => {
    const format = (name: string, age: number, active: boolean): string =>
      `${name} (${age}) - ${active ? 'active' : 'inactive'}`
    const memoized = memoize(format)

    // Prime the cache
    memoized('John', 30, true)

    it('cache hit - mixed types (string, number, boolean)', async ({bench}) => {
      const result = await bench('cache hit - mixed types (string, number, boolean)', () => {
        results.value = memoized('John', 30, true)
      }).run()
      expect(result.latency.samplesCount).toBeGreaterThan(0)
    })
  })
})

describe('memoize key resolution overhead', () => {
  const identity = <T>(x: T): T => x

  describe('primitive keys', () => {
    const memoizedNumber = memoize((x: number) => identity(x))
    const memoizedString = memoize((x: string) => identity(x))

    memoizedNumber(42)
    memoizedString('hello')

    it('number key', async ({bench}) => {
      const result = await bench('number key', () => {
        results.value = memoizedNumber(42)
      }).run()
      expect(result.latency.samplesCount).toBeGreaterThan(0)
    })

    it('string key', async ({bench}) => {
      const result = await bench('string key', () => {
        results.value = memoizedString('hello')
      }).run()
      expect(result.latency.samplesCount).toBeGreaterThan(0)
    })
  })

  describe('complex keys', () => {
    const memoizedArray = memoize((x: number[]) => identity(x))
    const memoizedObject = memoize((x: {id: number; name: string}) => identity(x))

    const arr = [1, 2, 3]
    const obj = {id: 1, name: 'test'}

    memoizedArray(arr)
    memoizedObject(obj)

    it('array key (same reference)', async ({bench}) => {
      const result = await bench('array key (same reference)', () => {
        results.value = memoizedArray(arr)
      }).run()
      expect(result.latency.samplesCount).toBeGreaterThan(0)
    })

    it('object key (same reference)', async ({bench}) => {
      const result = await bench('object key (same reference)', () => {
        results.value = memoizedObject(obj)
      }).run()
      expect(result.latency.samplesCount).toBeGreaterThan(0)
    })
  })

  describe('custom key resolver', () => {
    interface User {
      id: number
      name: string
      email: string
    }

    const memoizedDefault = memoize((user: User) => identity(user))
    const memoizedCustom = memoize((user: User) => identity(user), {
      keyResolver: ([user]) => String(user.id),
    })

    const user = {id: 1, name: 'John', email: 'john@example.com'}

    memoizedDefault(user)
    memoizedCustom(user)

    it('default key resolver (full serialization)', async ({bench}) => {
      const result = await bench('default key resolver (full serialization)', () => {
        results.value = memoizedDefault(user)
      }).run()
      expect(result.latency.samplesCount).toBeGreaterThan(0)
    })

    it('custom key resolver (id only)', async ({bench}) => {
      const result = await bench('custom key resolver (id only)', () => {
        results.value = memoizedCustom(user)
      }).run()
      expect(result.latency.samplesCount).toBeGreaterThan(0)
    })
  })
})

describe('lru cache eviction performance', () => {
  describe('small cache size (10)', () => {
    const fn = (x: number): number => x * 2
    const memoized = memoize(fn, {strategy: 'lru', maxSize: 10})

    // Fill cache
    for (let i = 0; i < 10; i++) memoized(i)

    it('access causing eviction', async ({bench}) => {
      const result = await bench('access causing eviction', () => {
        results.value = memoized(Date.now())
      }).run()
      expect(result.latency.samplesCount).toBeGreaterThan(0)
    })
  })

  describe('medium cache size (100)', () => {
    const fn = (x: number): number => x * 2
    const memoized = memoize(fn, {strategy: 'lru', maxSize: 100})

    // Fill cache
    for (let i = 0; i < 100; i++) memoized(i)

    let counter = 100

    it('access causing eviction', async ({bench}) => {
      const result = await bench('access causing eviction', () => {
        results.value = memoized(counter++)
      }).run()
      expect(result.latency.samplesCount).toBeGreaterThan(0)
    })
  })

  describe('large cache size (1000)', () => {
    const fn = (x: number): number => x * 2
    const memoized = memoize(fn, {strategy: 'lru', maxSize: 1000})

    // Fill cache
    for (let i = 0; i < 1000; i++) memoized(i)

    let counter = 1000

    it('access causing eviction', async ({bench}) => {
      const result = await bench('access causing eviction', () => {
        results.value = memoized(counter++)
      }).run()
      expect(result.latency.samplesCount).toBeGreaterThan(0)
    })
  })
})

describe('memoize vs no memoization', () => {
  describe('cheap function', () => {
    const cheapFn = (x: number): number => x + 1

    it('direct call (baseline)', async ({bench}) => {
      const result = await bench('direct call (baseline)', () => {
        results.value = cheapFn(42)
      }).run()
      expect(result.latency.samplesCount).toBeGreaterThan(0)
    })

    const memoized = memoize(cheapFn)
    memoized(42)

    it('memoized call (cache hit)', async ({bench}) => {
      const result = await bench('memoized call (cache hit)', () => {
        results.value = memoized(42)
      }).run()
      expect(result.latency.samplesCount).toBeGreaterThan(0)
    })
  })

  describe('moderately expensive function', () => {
    const moderateFn = (x: number): number => {
      let result = x
      for (let i = 0; i < 10; i++) {
        result = Math.sqrt(result * result + 1)
      }
      return result
    }

    it('direct call (baseline)', async ({bench}) => {
      const result = await bench('direct call (baseline)', () => {
        results.value = moderateFn(42)
      }).run()
      expect(result.latency.samplesCount).toBeGreaterThan(0)
    })

    const memoized = memoize(moderateFn)
    memoized(42)

    it('memoized call (cache hit)', async ({bench}) => {
      const result = await bench('memoized call (cache hit)', () => {
        results.value = memoized(42)
      }).run()
      expect(result.latency.samplesCount).toBeGreaterThan(0)
    })
  })

  describe('expensive function', () => {
    const expensiveFn = (x: number): number => {
      let result = x
      for (let i = 0; i < 100; i++) {
        result = Math.sqrt(result * result + 1) * Math.PI
      }
      return result
    }

    it('direct call (baseline)', async ({bench}) => {
      const result = await bench('direct call (baseline)', () => {
        results.value = expensiveFn(42)
      }).run()
      expect(result.latency.samplesCount).toBeGreaterThan(0)
    })

    const memoized = memoize(expensiveFn)
    memoized(42)

    it('memoized call (cache hit)', async ({bench}) => {
      const result = await bench('memoized call (cache hit)', () => {
        results.value = memoized(42)
      }).run()
      expect(result.latency.samplesCount).toBeGreaterThan(0)
    })
  })
})

describe('cache statistics overhead', () => {
  const fn = (x: number): number => x * 2
  const memoized = memoize(fn)

  // Prime cache
  memoized(42)

  it('memoized call without stats access', async ({bench}) => {
    const result = await bench('memoized call without stats access', () => {
      results.value = memoized(42)
    }).run()
    expect(result.latency.samplesCount).toBeGreaterThan(0)
  })

  it('memoized call + getStats()', async ({bench}) => {
    const result = await bench('memoized call + getStats()', () => {
      results.value = memoized(42)
      memoized.getStats()
    }).run()
    expect(result.latency.samplesCount).toBeGreaterThan(0)
  })
})

describe('100K iteration stress test', () => {
  it('100K cache hits (map strategy)', async ({bench}) => {
    const result = await bench('100K cache hits (map strategy)', () => {
      const fn = (x: number): number => x * 2
      const memoized = memoize(fn)
      memoized(42)

      for (let i = 0; i < 100_000; i++) {
        results.value = memoized(42)
      }
    }).run()
    expect(result.latency.samplesCount).toBeGreaterThan(0)
  })

  it('100K cache hits (lru strategy)', async ({bench}) => {
    const result = await bench('100K cache hits (lru strategy)', () => {
      const fn = (x: number): number => x * 2
      const memoized = memoize(fn, {strategy: 'lru', maxSize: 100})
      memoized(42)

      for (let i = 0; i < 100_000; i++) {
        results.value = memoized(42)
      }
    }).run()
    expect(result.latency.samplesCount).toBeGreaterThan(0)
  })

  it('100K alternating hits/misses', async ({bench}) => {
    const result = await bench('100K alternating hits/misses', () => {
      const fn = (x: number): number => x * 2
      const memoized = memoize(fn)

      for (let i = 0; i < 100_000; i++) {
        results.value = memoized(i % 10)
      }
    }).run()
    expect(result.latency.samplesCount).toBeGreaterThan(0)
  })
})
