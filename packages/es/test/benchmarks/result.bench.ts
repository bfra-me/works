/**
 * Performance benchmarks for Result type operations.
 *
 * Validates TEST-035: Result creation < 100ns per operation (100K iterations)
 *
 * These benchmarks measure the performance of Result type creation,
 * type guards, and transformation operations to ensure minimal overhead.
 */

import type {Result} from '../../src/result'

import {bench, describe} from 'vitest'

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
    bench('ok() with number', () => {
      results.value = ok(42)
    })

    bench('ok() with string', () => {
      results.value = ok('hello world')
    })

    bench('ok() with object', () => {
      results.value = ok({id: 1, name: 'test', active: true})
    })

    bench('ok() with array', () => {
      results.value = ok([1, 2, 3, 4, 5])
    })

    bench('ok() with nested object', () => {
      results.value = ok({
        user: {id: 1, name: 'test'},
        metadata: {created: Date.now(), tags: ['a', 'b']},
      })
    })
  })

  describe('err() creation', () => {
    bench('err() with string', () => {
      results.value = err('Error message')
    })

    bench('err() with Error object', () => {
      results.value = err(new Error('Something went wrong'))
    })

    bench('err() with structured error', () => {
      results.value = err({code: 'NOT_FOUND', message: 'Resource not found', statusCode: 404})
    })
  })

  describe('creation comparison - ok() vs raw object literal', () => {
    bench('raw object literal (baseline)', () => {
      results.value = {success: true, data: 42}
    })

    bench('ok() factory function', () => {
      results.value = ok(42)
    })
  })
})

describe('result type guards - isOk() and isErr()', () => {
  const okResult = ok(42)
  const errResult = err('error')

  describe('isOk() guard', () => {
    bench('isOk() on Ok result', () => {
      results.value = isOk(okResult)
    })

    bench('isOk() on Err result', () => {
      results.value = isOk(errResult)
    })
  })

  describe('isErr() guard', () => {
    bench('isErr() on Ok result', () => {
      results.value = isErr(okResult)
    })

    bench('isErr() on Err result', () => {
      results.value = isErr(errResult)
    })
  })

  describe('type guard comparison - isOk() vs property access', () => {
    bench('direct property check (baseline)', () => {
      results.value = okResult.success === true
    })

    bench('isOk() type guard', () => {
      results.value = isOk(okResult)
    })
  })
})

describe('result extraction - unwrap() and unwrapOr()', () => {
  const okResult = ok(42)
  const errResult = err('error')

  describe('unwrap() on Ok result', () => {
    bench('unwrap() success path', () => {
      results.value = unwrap(okResult)
    })
  })

  describe('unwrapOr() extraction', () => {
    bench('unwrapOr() on Ok result', () => {
      results.value = unwrapOr(okResult, 0)
    })

    bench('unwrapOr() on Err result (uses default)', () => {
      results.value = unwrapOr(errResult, 0)
    })
  })

  describe('extraction comparison - unwrapOr() vs ternary', () => {
    bench('ternary expression (baseline)', () => {
      results.value = okResult.success ? okResult.data : 0
    })

    bench('unwrapOr() function', () => {
      results.value = unwrapOr(okResult, 0)
    })
  })
})

describe('result transformation - map() and flatMap()', () => {
  const okResult = ok(10)
  const errResult = err('error')
  const double = (x: number): number => x * 2
  const toString = (x: number): string => `Value: ${x}`

  describe('map() transformation', () => {
    bench('map() on Ok result - numeric transform', () => {
      results.value = map(okResult, double)
    })

    bench('map() on Ok result - type-changing transform', () => {
      results.value = map(okResult, toString)
    })

    bench('map() on Err result (passthrough)', () => {
      results.value = map(errResult, double)
    })
  })

  describe('map() chain', () => {
    bench('single map()', () => {
      results.value = map(okResult, double)
    })

    bench('two chained map() calls', () => {
      results.value = map(map(okResult, double), double)
    })

    bench('three chained map() calls', () => {
      results.value = map(map(map(okResult, double), double), double)
    })
  })

  describe('flatMap() chaining', () => {
    const safeDivide = (x: number): Result<number, string> =>
      x === 0 ? err('Division by zero') : ok(100 / x)

    bench('flatMap() on Ok result', () => {
      results.value = flatMap(okResult, safeDivide)
    })

    bench('flatMap() on Err result (passthrough)', () => {
      results.value = flatMap(errResult, safeDivide)
    })
  })

  describe('mapErr() error transformation', () => {
    const wrapError = (e: string): {code: string; message: string} => ({
      code: 'WRAPPED',
      message: e,
    })

    bench('mapErr() on Err result', () => {
      results.value = mapErr(errResult, wrapError)
    })

    bench('mapErr() on Ok result (passthrough)', () => {
      results.value = mapErr(okResult, wrapError)
    })
  })
})

describe('result from throwing functions - fromThrowable()', () => {
  const successFn = (): number => 42
  const throwingFn = (): number => {
    throw new Error('Intentional error')
  }

  describe('fromThrowable() wrapping', () => {
    bench('fromThrowable() - success path', () => {
      results.value = fromThrowable(successFn)
    })

    bench('fromThrowable() - error path', () => {
      results.value = fromThrowable(throwingFn)
    })
  })

  describe('fromThrowable() vs try-catch', () => {
    bench('manual try-catch (baseline)', () => {
      try {
        results.value = {success: true, data: successFn()}
      } catch (error) {
        results.value = {success: false, error}
      }
    })

    bench('fromThrowable() wrapper', () => {
      results.value = fromThrowable(successFn)
    })
  })
})

describe('result from promises - fromPromise()', () => {
  describe('fromPromise() wrapping', () => {
    bench('fromPromise() - resolving promise', async () => {
      results.value = await fromPromise(Promise.resolve(42))
    })

    bench('fromPromise() - rejecting promise', async () => {
      results.value = await fromPromise(Promise.reject(new Error('Failed')))
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
    bench('fetch -> validate -> format pipeline', () => {
      const result = fetchUser(1)
      const validated = flatMap(result, validateEmail)
      results.value = map(validated, formatUser)
    })
  })

  describe('result array processing', () => {
    const items = Array.from({length: 100}, (_, i) => ok(i))

    bench('filter successful results', () => {
      results.value = items.filter(isOk)
    })

    bench('extract values from successful results', () => {
      results.value = items.filter(isOk).map(r => r.data)
    })
  })
})

describe('100K iteration stress test', () => {
  bench('100K ok() creations', () => {
    for (let i = 0; i < 100_000; i++) {
      results.value = ok(i)
    }
  })

  bench('100K isOk() checks', () => {
    const result = ok(42)
    for (let i = 0; i < 100_000; i++) {
      results.value = isOk(result)
    }
  })

  bench('100K map() transformations', () => {
    const result = ok(1)
    const increment = (x: number): number => x + 1
    for (let i = 0; i < 100_000; i++) {
      results.value = map(result, increment)
    }
  })

  bench('100K unwrapOr() extractions', () => {
    const result = ok(42)
    for (let i = 0; i < 100_000; i++) {
      results.value = unwrapOr(result, 0)
    }
  })
})
