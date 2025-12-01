/**
 * Best practice validation tests - verifies architectural patterns are correctly implemented.
 *
 * These tests validate that the @bfra.me/es package follows established best practices
 * for Result types, functional composition, and type safety.
 *
 * Related requirements:
 * - GUD-001: TypeScript patterns (explicit exports, no export *)
 * - GUD-003: Use discriminated union result pattern instead of throwing
 * - PAT-003: Discriminated unions for result types
 * - PAT-004: Pure function architecture with no side effects
 */

import type {Result} from '../../src/result'

import {describe, expect, it} from 'vitest'

import {
  compose,
  constant,
  curry,
  flip,
  identity,
  memoize,
  noop,
  noopAsync,
  partial,
  pipe,
  tap,
} from '../../src/functional'
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
import {
  assertType,
  brand,
  hasProperty,
  isArray,
  isFunction,
  isNonNullable,
  isNumber,
  isObject,
  isString,
  unbrand,
} from '../../src/types'

describe('@bfra.me/es/patterns - Best Practices Validation', () => {
  describe('result type best practices', () => {
    describe('discriminated union structure', () => {
      it.concurrent('should have correct Ok structure with success: true', () => {
        const result = ok(42)

        expect(result.success).toBe(true)
        expect(result.data).toBe(42)
      })

      it.concurrent('should have correct Err structure with success: false', () => {
        const result = err('error message')

        expect(result.success).toBe(false)
        expect(result.error).toBe('error message')
      })

      it.concurrent('should be distinguishable by success property', () => {
        const success: Result<number, string> = ok(42)
        const failure: Result<number, string> = err('failed')

        expect('data' in success && success.success === true).toBe(true)
        expect('error' in failure && failure.success === false).toBe(true)
      })
    })

    describe('type guard usage patterns', () => {
      it.concurrent('should narrow Ok type with isOk', () => {
        const result: Result<number, string> = ok(42)

        expect(isOk(result)).toBe(true)
        expect(isOk(result) && result.data).toBe(42)
      })

      it.concurrent('should narrow Err type with isErr', () => {
        const result: Result<number, string> = err('failed')

        expect(isErr(result)).toBe(true)
        expect(isErr(result) && result.error).toBe('failed')
      })

      it.concurrent('should support exhaustive handling', () => {
        const handleResult = (result: Result<number, string>): string => {
          if (isOk(result)) {
            return `Success: ${result.data}`
          }
          return `Error: ${result.error}`
        }

        expect(handleResult(ok(42))).toBe('Success: 42')
        expect(handleResult(err('failed'))).toBe('Error: failed')
      })
    })

    describe('safe value extraction patterns', () => {
      it.concurrent('should extract value with unwrapOr fallback', () => {
        const success: Result<number, string> = ok(42)
        const failure: Result<number, string> = err('failed')

        expect(unwrapOr(success, 0)).toBe(42)
        expect(unwrapOr(failure, 0)).toBe(0)
      })

      it.concurrent('should throw with unwrap on Err (use sparingly)', () => {
        const success: Result<number, string> = ok(42)
        const failure: Result<number, string> = err('failed')

        expect(unwrap(success)).toBe(42)
        expect(() => unwrap(failure)).toThrow()
      })
    })

    describe('transformation patterns', () => {
      it.concurrent('should transform Ok values with map', () => {
        const result = ok(5)
        const doubled = map(result, x => x * 2)

        expect(isOk(doubled) && doubled.data).toBe(10)
      })

      it.concurrent('should pass through Err with map', () => {
        const result: Result<number, string> = err('failed')
        const doubled = map(result, x => x * 2)

        expect(isErr(doubled) && doubled.error).toBe('failed')
      })

      it.concurrent('should chain Results with flatMap', () => {
        function validatePositive(n: number): Result<number, string> {
          return n > 0 ? ok(n) : err('Must be positive')
        }

        const success = flatMap(ok(5), validatePositive)
        const failure = flatMap(ok(-1), validatePositive)

        expect(isOk(success) && success.data).toBe(5)
        expect(isErr(failure) && failure.error).toBe('Must be positive')
      })

      it.concurrent('should transform errors with mapErr', () => {
        const result: Result<number, string> = err('original')
        const enriched = mapErr(result, e => ({code: 'E001', message: e}))

        expect(isErr(enriched) && enriched.error).toEqual({code: 'E001', message: 'original'})
      })
    })

    describe('wrapping throwing code patterns', () => {
      it.concurrent('should wrap sync throwing functions with fromThrowable', () => {
        const safeParseJson = (json: string) => fromThrowable(() => JSON.parse(json))

        const valid = safeParseJson('{"key": "value"}')
        const invalid = safeParseJson('not json')

        expect(isOk(valid) && valid.data).toEqual({key: 'value'})
        expect(isErr(invalid)).toBe(true)
      })

      it.concurrent('should wrap async functions with fromPromise', async () => {
        const resolving = fromPromise(Promise.resolve(42))
        const rejecting = fromPromise(Promise.reject(new Error('failed')))

        const resolved = await resolving
        const rejected = await rejecting

        expect(isOk(resolved) && resolved.data).toBe(42)
        expect(isErr(rejected)).toBe(true)
      })
    })
  })

  describe('functional composition best practices', () => {
    describe('pipe composition patterns', () => {
      it.concurrent('should compose functions left-to-right', () => {
        const addOne = (x: number) => x + 1
        const double = (x: number) => x * 2
        const toString = (x: number) => String(x)

        const pipeline = pipe(addOne, double, toString)

        expect(pipeline(5)).toBe('12')
      })

      it.concurrent('should support type transformations', () => {
        interface User {
          name: string
        }

        const getName = (user: User) => user.name
        const toUpperCase = (s: string) => s.toUpperCase()
        const getLength = (s: string) => s.length

        const pipeline = pipe(getName, toUpperCase, getLength)

        expect(pipeline({name: 'test'})).toBe(4)
      })

      it.concurrent('should compose up to 10 functions', () => {
        const addOne = (x: number) => x + 1

        const pipeline = pipe(
          addOne,
          addOne,
          addOne,
          addOne,
          addOne,
          addOne,
          addOne,
          addOne,
          addOne,
          addOne,
        )

        expect(pipeline(0)).toBe(10)
      })
    })

    describe('compose patterns', () => {
      it.concurrent('should compose functions right-to-left', () => {
        const addOne = (x: number) => x + 1
        const double = (x: number) => x * 2

        const composed = compose(addOne, double)

        expect(composed(5)).toBe(11)
      })
    })

    describe('curry patterns', () => {
      it.concurrent('should curry binary functions', () => {
        const add = curry((a: number, b: number) => a + b)

        expect(add(1)(2)).toBe(3)
        expect(add(1, 2)).toBe(3)
      })

      it.concurrent('should curry ternary functions', () => {
        const sum3 = curry((a: number, b: number, c: number) => a + b + c)

        expect(sum3(1)(2)(3)).toBe(6)
        expect(sum3(1, 2)(3)).toBe(6)
        expect(sum3(1)(2, 3)).toBe(6)
        expect(sum3(1, 2, 3)).toBe(6)
      })
    })

    describe('partial application patterns', () => {
      it.concurrent('should partially apply arguments', () => {
        const greet = (greeting: string, name: string) => `${greeting}, ${name}!`
        const sayHello = partial(greet, 'Hello')

        expect(sayHello('World')).toBe('Hello, World!')
      })
    })

    describe('utility function patterns', () => {
      it.concurrent('should use identity for pass-through', () => {
        expect(identity(42)).toBe(42)
        expect(identity('test')).toBe('test')

        const obj = {key: 'value'}
        expect(identity(obj)).toBe(obj)
      })

      it.concurrent('should use constant for fixed values', () => {
        const always42 = constant(42)

        expect(always42()).toBe(42)
        expect(always42()).toBe(42)
      })

      it.concurrent('should use tap for side effects in pipeline', () => {
        const values: number[] = []
        const capture = tap((x: number) => values.push(x))

        const result = pipe(
          (x: number) => x + 1,
          capture,
          (x: number) => x * 2,
        )(5)

        expect(result).toBe(12)
        expect(values).toEqual([6])
      })

      it.concurrent('should use flip to reverse argument order', () => {
        const subtract = (a: number, b: number) => a - b
        const flipped = flip(subtract)

        expect(subtract(10, 3)).toBe(7)
        expect(flipped(10, 3)).toBe(-7)
      })

      it.concurrent('should use noop for no-op callbacks', () => {
        expect(noop()).toBeUndefined()
      })

      it.concurrent('should use noopAsync for async no-op callbacks', async () => {
        const result = await noopAsync()
        expect(result).toBeUndefined()
      })
    })

    describe('memoization patterns', () => {
      it.concurrent('should memoize pure functions', () => {
        let callCount = 0
        const expensive = (n: number) => {
          callCount++
          return n * 2
        }

        const memoized = memoize(expensive)

        expect(memoized(5)).toBe(10)
        expect(memoized(5)).toBe(10)
        expect(memoized(5)).toBe(10)
        expect(callCount).toBe(1)

        expect(memoized(10)).toBe(20)
        expect(callCount).toBe(2)
      })
    })
  })

  describe('type safety best practices', () => {
    describe('type guard patterns', () => {
      it.concurrent('should use isString for string validation', () => {
        expect(isString('test')).toBe(true)
        expect(isString('')).toBe(true)
        expect(isString(123)).toBe(false)
        expect(isString(null)).toBe(false)
      })

      it.concurrent('should use isNumber for number validation (excluding NaN)', () => {
        expect(isNumber(42)).toBe(true)
        expect(isNumber(0)).toBe(true)
        expect(isNumber(-1.5)).toBe(true)
        expect(isNumber(Number.NaN)).toBe(false)
        expect(isNumber('42')).toBe(false)
      })

      it.concurrent('should use isObject for plain object validation', () => {
        expect(isObject({})).toBe(true)
        expect(isObject({key: 'value'})).toBe(true)
        expect(isObject(null)).toBe(false)
        expect(isObject([])).toBe(false)
      })

      it.concurrent('should use isArray for array validation', () => {
        expect(isArray([])).toBe(true)
        expect(isArray([1, 2, 3])).toBe(true)
        expect(isArray({})).toBe(false)
      })

      it.concurrent('should use isFunction for function validation', () => {
        expect(isFunction(() => {})).toBe(true)
        expect(isFunction(Math.max)).toBe(true)
        expect(isFunction('not a function')).toBe(false)
      })

      it.concurrent('should use hasProperty for safe property access', () => {
        const obj: unknown = {name: 'test', age: 25}

        expect(hasProperty(obj, 'name')).toBe(true)
        expect(hasProperty(obj, 'missing')).toBe(false)
      })

      it.concurrent('should use isNonNullable for null filtering', () => {
        const values: (string | null | undefined)[] = ['a', null, 'b', undefined, 'c']
        const filtered = values.filter(isNonNullable)

        expect(filtered).toEqual(['a', 'b', 'c'])
      })
    })

    describe('assertion patterns', () => {
      it.concurrent('should use assertType for guaranteed narrowing', () => {
        const value: unknown = 'test'

        assertType(value, isString)
        expect(value.toUpperCase()).toBe('TEST')
      })

      it.concurrent('should throw on failed assertion', () => {
        const value: unknown = 42

        expect(() => assertType(value, isString)).toThrow()
      })
    })

    describe('branded type patterns', () => {
      it.concurrent('should create branded values', () => {
        const userId = brand<number, 'UserId'>(123)

        expect(unbrand(userId)).toBe(123)
      })

      it.concurrent('should maintain type safety with brands', () => {
        type UserId = ReturnType<typeof brand<number, 'UserId'>>
        type OrderId = ReturnType<typeof brand<number, 'OrderId'>>

        const userId: UserId = brand<number, 'UserId'>(1)
        const orderId: OrderId = brand<number, 'OrderId'>(1)

        expect(unbrand(userId)).toBe(unbrand(orderId))
        expect(unbrand(userId)).toBe(1)
      })
    })
  })

  describe('immutability best practices', () => {
    describe('state transformations', () => {
      it.concurrent('should never mutate input in pipelines', () => {
        interface State {
          count: number
          items: string[]
        }

        const incrementCount = (state: State): State => ({
          ...state,
          count: state.count + 1,
        })

        const addItem =
          (item: string) =>
          (state: State): State => ({
            ...state,
            items: [...state.items, item],
          })

        const initial: State = {count: 0, items: []}
        const updated = pipe(incrementCount, addItem('test'))(initial)

        expect(initial).toEqual({count: 0, items: []})
        expect(updated).toEqual({count: 1, items: ['test']})
      })

      it.concurrent('should return new arrays, not mutated ones', () => {
        const addToArray = <T>(arr: T[], item: T): T[] => [...arr, item]

        const original = [1, 2, 3]
        const updated = addToArray(original, 4)

        expect(original).toEqual([1, 2, 3])
        expect(updated).toEqual([1, 2, 3, 4])
        expect(original).not.toBe(updated)
      })

      it.concurrent('should return new objects, not mutated ones', () => {
        interface Config {
          value: number
          enabled: boolean
        }

        const updateValue = (config: Config, value: number): Config => ({
          ...config,
          value,
        })

        const original: Config = {value: 10, enabled: true}
        const updated = updateValue(original, 20)

        expect(original).toEqual({value: 10, enabled: true})
        expect(updated).toEqual({value: 20, enabled: true})
        expect(original).not.toBe(updated)
      })
    })
  })

  describe('error handling best practices', () => {
    describe('boundary wrapping patterns', () => {
      it.concurrent('should wrap external APIs at boundaries', () => {
        const safeJsonParse = (json: string): Result<unknown, Error> => {
          return fromThrowable(() => JSON.parse(json))
        }

        const valid = safeJsonParse('{"key": "value"}')
        const invalid = safeJsonParse('invalid')

        expect(isOk(valid)).toBe(true)
        expect(isErr(invalid)).toBe(true)
      })

      it.concurrent('should propagate errors through Result chains', () => {
        const step1 = (x: number): Result<number, string> => {
          return x > 0 ? ok(x * 2) : err('Step 1: must be positive')
        }

        const step2 = (x: number): Result<number, string> => {
          return x < 100 ? ok(x + 1) : err('Step 2: must be less than 100')
        }

        const pipeline = (x: number) => flatMap(step1(x), step2)

        expect(isOk(pipeline(5)) && pipeline(5)).toMatchObject({data: 11})
        expect(isErr(pipeline(-1)) && pipeline(-1)).toMatchObject({
          error: 'Step 1: must be positive',
        })
        expect(isErr(pipeline(60)) && pipeline(60)).toMatchObject({
          error: 'Step 2: must be less than 100',
        })
      })
    })
  })
})
