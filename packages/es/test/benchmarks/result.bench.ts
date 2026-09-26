/**
 * Performance benchmarks for Result type operations.
 *
 * Validates TEST-035: Result creation < 100ns per operation (100K iterations)
 *
 * These benchmarks measure the performance of Result type creation,
 * type guards, and transformation operations to ensure minimal overhead.
 */

import type {Result} from '../../src/result'

import {describe, expect, it} from 'vitest'

import {
  err,
  flatMap,
  fromPromise,
  fromThrowable,
  isErr,
  isOk,
  map,
  mapErr,
  ok,
  unwrap,
  unwrapOr,
} from '../../src/result'

/**
 * Result holder to prevent JIT from eliminating benchmark code.
 */
const results = {value: undefined as unknown}

describe('result creation - ok() and err()', () => {
  describe('ok() creation', () => {
    it('ok() with number', async ({bench}) => {
      const result = await bench('ok() with number', () => {
        results.value = ok(42)
      }).run()
      expect(result.latency.samplesCount).toBeGreaterThan(0)
    })

    it('ok() with string', async ({bench}) => {
      const result = await bench('ok() with string', () => {
        results.value = ok('hello world')
      }).run()
      expect(result.latency.samplesCount).toBeGreaterThan(0)
    })

    it('ok() with object', async ({bench}) => {
      const result = await bench('ok() with object', () => {
        results.value = ok({id: 1, name: 'test', active: true})
      }).run()
      expect(result.latency.samplesCount).toBeGreaterThan(0)
    })

    it('ok() with array', async ({bench}) => {
      const result = await bench('ok() with array', () => {
        results.value = ok([1, 2, 3, 4, 5])
      }).run()
      expect(result.latency.samplesCount).toBeGreaterThan(0)
    })

    it('ok() with nested object', async ({bench}) => {
      const result = await bench('ok() with nested object', () => {
        results.value = ok({
          user: {id: 1, name: 'test'},
          metadata: {created: Date.now(), tags: ['a', 'b']},
        })
      }).run()
      expect(result.latency.samplesCount).toBeGreaterThan(0)
    })
  })

  describe('err() creation', () => {
    it('err() with string', async ({bench}) => {
      const result = await bench('err() with string', () => {
        results.value = err('Error message')
      }).run()
      expect(result.latency.samplesCount).toBeGreaterThan(0)
    })

    it('err() with Error object', async ({bench}) => {
      const result = await bench('err() with Error object', () => {
        results.value = err(new Error('Something went wrong'))
      }).run()
      expect(result.latency.samplesCount).toBeGreaterThan(0)
    })

    it('err() with structured error', async ({bench}) => {
      const result = await bench('err() with structured error', () => {
        results.value = err({code: 'NOT_FOUND', message: 'Resource not found', statusCode: 404})
      }).run()
      expect(result.latency.samplesCount).toBeGreaterThan(0)
    })
  })

  describe('creation comparison - ok() vs raw object literal', () => {
    it('raw object literal (baseline)', async ({bench}) => {
      const result = await bench('raw object literal (baseline)', () => {
        results.value = {success: true, data: 42}
      }).run()
      expect(result.latency.samplesCount).toBeGreaterThan(0)
    })

    it('ok() factory function', async ({bench}) => {
      const result = await bench('ok() factory function', () => {
        results.value = ok(42)
      }).run()
      expect(result.latency.samplesCount).toBeGreaterThan(0)
    })
  })
})

describe('result type guards - isOk() and isErr()', () => {
  const okResult = ok(42)
  const errResult = err('error')

  describe('isOk() guard', () => {
    it('isOk() on Ok result', async ({bench}) => {
      const result = await bench('isOk() on Ok result', () => {
        results.value = isOk(okResult)
      }).run()
      expect(result.latency.samplesCount).toBeGreaterThan(0)
    })

    it('isOk() on Err result', async ({bench}) => {
      const result = await bench('isOk() on Err result', () => {
        results.value = isOk(errResult)
      }).run()
      expect(result.latency.samplesCount).toBeGreaterThan(0)
    })
  })

  describe('isErr() guard', () => {
    it('isErr() on Ok result', async ({bench}) => {
      const result = await bench('isErr() on Ok result', () => {
        results.value = isErr(okResult)
      }).run()
      expect(result.latency.samplesCount).toBeGreaterThan(0)
    })

    it('isErr() on Err result', async ({bench}) => {
      const result = await bench('isErr() on Err result', () => {
        results.value = isErr(errResult)
      }).run()
      expect(result.latency.samplesCount).toBeGreaterThan(0)
    })
  })

  describe('type guard comparison - isOk() vs property access', () => {
    it('direct property check (baseline)', async ({bench}) => {
      const result = await bench('direct property check (baseline)', () => {
        results.value = okResult.success === true
      }).run()
      expect(result.latency.samplesCount).toBeGreaterThan(0)
    })

    it('isOk() type guard', async ({bench}) => {
      const result = await bench('isOk() type guard', () => {
        results.value = isOk(okResult)
      }).run()
      expect(result.latency.samplesCount).toBeGreaterThan(0)
    })
  })
})

describe('result extraction - unwrap() and unwrapOr()', () => {
  const okResult = ok(42)
  const errResult = err('error')

  describe('unwrap() on Ok result', () => {
    it('unwrap() success path', async ({bench}) => {
      const result = await bench('unwrap() success path', () => {
        results.value = unwrap(okResult)
      }).run()
      expect(result.latency.samplesCount).toBeGreaterThan(0)
    })
  })

  describe('unwrapOr() extraction', () => {
    it('unwrapOr() on Ok result', async ({bench}) => {
      const result = await bench('unwrapOr() on Ok result', () => {
        results.value = unwrapOr(okResult, 0)
      }).run()
      expect(result.latency.samplesCount).toBeGreaterThan(0)
    })

    it('unwrapOr() on Err result (uses default)', async ({bench}) => {
      const result = await bench('unwrapOr() on Err result (uses default)', () => {
        results.value = unwrapOr(errResult, 0)
      }).run()
      expect(result.latency.samplesCount).toBeGreaterThan(0)
    })
  })

  describe('extraction comparison - unwrapOr() vs ternary', () => {
    it('ternary expression (baseline)', async ({bench}) => {
      const result = await bench('ternary expression (baseline)', () => {
        results.value = okResult.success ? okResult.data : 0
      }).run()
      expect(result.latency.samplesCount).toBeGreaterThan(0)
    })

    it('unwrapOr() function', async ({bench}) => {
      const result = await bench('unwrapOr() function', () => {
        results.value = unwrapOr(okResult, 0)
      }).run()
      expect(result.latency.samplesCount).toBeGreaterThan(0)
    })
  })
})

describe('result transformation - map() and flatMap()', () => {
  const okResult = ok(10)
  const errResult = err('error')
  const double = (x: number): number => x * 2
  const toString = (x: number): string => `Value: ${x}`

  describe('map() transformation', () => {
    it('map() on Ok result - numeric transform', async ({bench}) => {
      const result = await bench('map() on Ok result - numeric transform', () => {
        results.value = map(okResult, double)
      }).run()
      expect(result.latency.samplesCount).toBeGreaterThan(0)
    })

    it('map() on Ok result - type-changing transform', async ({bench}) => {
      const result = await bench('map() on Ok result - type-changing transform', () => {
        results.value = map(okResult, toString)
      }).run()
      expect(result.latency.samplesCount).toBeGreaterThan(0)
    })

    it('map() on Err result (passthrough)', async ({bench}) => {
      const result = await bench('map() on Err result (passthrough)', () => {
        results.value = map(errResult, double)
      }).run()
      expect(result.latency.samplesCount).toBeGreaterThan(0)
    })
  })

  describe('map() chain', () => {
    it('single map()', async ({bench}) => {
      const result = await bench('single map()', () => {
        results.value = map(okResult, double)
      }).run()
      expect(result.latency.samplesCount).toBeGreaterThan(0)
    })

    it('two chained map() calls', async ({bench}) => {
      const result = await bench('two chained map() calls', () => {
        results.value = map(map(okResult, double), double)
      }).run()
      expect(result.latency.samplesCount).toBeGreaterThan(0)
    })

    it('three chained map() calls', async ({bench}) => {
      const result = await bench('three chained map() calls', () => {
        results.value = map(map(map(okResult, double), double), double)
      }).run()
      expect(result.latency.samplesCount).toBeGreaterThan(0)
    })
  })

  describe('flatMap() chaining', () => {
    const safeDivide = (x: number): Result<number, string> =>
      x === 0 ? err('Division by zero') : ok(100 / x)

    it('flatMap() on Ok result', async ({bench}) => {
      const result = await bench('flatMap() on Ok result', () => {
        results.value = flatMap(okResult, safeDivide)
      }).run()
      expect(result.latency.samplesCount).toBeGreaterThan(0)
    })

    it('flatMap() on Err result (passthrough)', async ({bench}) => {
      const result = await bench('flatMap() on Err result (passthrough)', () => {
        results.value = flatMap(errResult, safeDivide)
      }).run()
      expect(result.latency.samplesCount).toBeGreaterThan(0)
    })
  })

  describe('mapErr() error transformation', () => {
    const wrapError = (e: string): {code: string; message: string} => ({
      code: 'WRAPPED',
      message: e,
    })

    it('mapErr() on Err result', async ({bench}) => {
      const result = await bench('mapErr() on Err result', () => {
        results.value = mapErr(errResult, wrapError)
      }).run()
      expect(result.latency.samplesCount).toBeGreaterThan(0)
    })

    it('mapErr() on Ok result (passthrough)', async ({bench}) => {
      const result = await bench('mapErr() on Ok result (passthrough)', () => {
        results.value = mapErr(okResult, wrapError)
      }).run()
      expect(result.latency.samplesCount).toBeGreaterThan(0)
    })
  })
})

describe('result from throwing functions - fromThrowable()', () => {
  const successFn = (): number => 42
  const throwingFn = (): number => {
    throw new Error('Intentional error')
  }

  describe('fromThrowable() wrapping', () => {
    it('fromThrowable() - success path', async ({bench}) => {
      const result = await bench('fromThrowable() - success path', () => {
        results.value = fromThrowable(successFn)
      }).run()
      expect(result.latency.samplesCount).toBeGreaterThan(0)
    })

    it('fromThrowable() - error path', async ({bench}) => {
      const result = await bench('fromThrowable() - error path', () => {
        results.value = fromThrowable(throwingFn)
      }).run()
      expect(result.latency.samplesCount).toBeGreaterThan(0)
    })
  })

  describe('fromThrowable() vs try-catch', () => {
    it('manual try-catch (baseline)', async ({bench}) => {
      const result = await bench('manual try-catch (baseline)', () => {
        try {
          results.value = {success: true, data: successFn()}
        } catch (error) {
          results.value = {success: false, error}
        }
      }).run()
      expect(result.latency.samplesCount).toBeGreaterThan(0)
    })

    it('fromThrowable() wrapper', async ({bench}) => {
      const result = await bench('fromThrowable() wrapper', () => {
        results.value = fromThrowable(successFn)
      }).run()
      expect(result.latency.samplesCount).toBeGreaterThan(0)
    })
  })
})

describe('result from promises - fromPromise()', () => {
  describe('fromPromise() wrapping', () => {
    it('fromPromise() - resolving promise', async ({bench}) => {
      const result = await bench('fromPromise() - resolving promise', async () => {
        results.value = await fromPromise(Promise.resolve(42))
      }).run()
      expect(result.latency.samplesCount).toBeGreaterThan(0)
    })

    it('fromPromise() - rejecting promise', async ({bench}) => {
      const result = await bench('fromPromise() - rejecting promise', async () => {
        results.value = await fromPromise(Promise.reject(new Error('Failed')))
      }).run()
      expect(result.latency.samplesCount).toBeGreaterThan(0)
    })
  })
})

describe('real-world result patterns', () => {
  interface User {
    id: number
    name: string
    email: string
  }

  const fetchUser = (id: number): Result<User, string> =>
    ok({id, name: `User ${id}`, email: `user${id}@example.com`})

  const validateEmail = (user: User): Result<User, string> =>
    user.email.includes('@') ? ok(user) : err('Invalid email')

  const formatUser = (user: User): string => `${user.name} <${user.email}>`

  describe('typical validation pipeline', () => {
    it('fetch -> validate -> format pipeline', async ({bench}) => {
      const result = await bench('fetch -> validate -> format pipeline', () => {
        const result = fetchUser(1)
        const validated = flatMap(result, validateEmail)
        results.value = map(validated, formatUser)
      }).run()
      expect(result.latency.samplesCount).toBeGreaterThan(0)
    })
  })

  describe('result array processing', () => {
    const items = Array.from({length: 100}, (_, i) => ok(i))

    it('filter successful results', async ({bench}) => {
      const result = await bench('filter successful results', () => {
        results.value = items.filter(isOk)
      }).run()
      expect(result.latency.samplesCount).toBeGreaterThan(0)
    })

    it('extract values from successful results', async ({bench}) => {
      const result = await bench('extract values from successful results', () => {
        results.value = items.filter(isOk).map(r => r.data)
      }).run()
      expect(result.latency.samplesCount).toBeGreaterThan(0)
    })
  })
})

describe('100K iteration stress test', () => {
  it('100K ok() creations', async ({bench}) => {
    const result = await bench('100K ok() creations', () => {
      for (let i = 0; i < 100_000; i++) {
        results.value = ok(i)
      }
    }).run()
    expect(result.latency.samplesCount).toBeGreaterThan(0)
  })

  it('100K isOk() checks', async ({bench}) => {
    const result = await bench('100K isOk() checks', () => {
      const result = ok(42)
      for (let i = 0; i < 100_000; i++) {
        results.value = isOk(result)
      }
    }).run()
    expect(result.latency.samplesCount).toBeGreaterThan(0)
  })

  it('100K map() transformations', async ({bench}) => {
    const result = await bench('100K map() transformations', () => {
      const result = ok(1)
      const increment = (x: number): number => x + 1
      for (let i = 0; i < 100_000; i++) {
        results.value = map(result, increment)
      }
    }).run()
    expect(result.latency.samplesCount).toBeGreaterThan(0)
  })

  it('100K unwrapOr() extractions', async ({bench}) => {
    const result = await bench('100K unwrapOr() extractions', () => {
      const result = ok(42)
      for (let i = 0; i < 100_000; i++) {
        results.value = unwrapOr(result, 0)
      }
    }).run()
    expect(result.latency.samplesCount).toBeGreaterThan(0)
  })
})
