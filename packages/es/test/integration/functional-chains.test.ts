/**
 * Integration tests for functional composition chains.
 * Validates TEST-030: Functional composition chains maintain type safety through 10+ transformations
 */

import type {Result} from '../../src/result/types'

import {describe, expect, it} from 'vitest'

import {compose} from '../../src/functional/compose'
import {curry} from '../../src/functional/curry'
import {identity} from '../../src/functional/identity'
import {memoize} from '../../src/functional/memoize'
import {pipe} from '../../src/functional/pipe'
import {tap} from '../../src/functional/tap'
import {err, ok} from '../../src/result/factories'
import {isErr, isOk} from '../../src/result/guards'
import {flatMap, map} from '../../src/result/operators'

describe('@bfra.me/es/functional - composition chain integration', () => {
  describe('pipe with 10+ transformations', () => {
    it.concurrent('should maintain type safety through 10 string transformations', () => {
      const trim = (s: string): string => s.trim()
      const toLower = (s: string): string => s.toLowerCase()
      const toUpper = (s: string): string => s.toUpperCase()
      const reverse = (s: string): string => s.split('').reverse().join('')
      const addPrefix = (s: string): string => `PREFIX_${s}`
      const addSuffix = (s: string): string => `${s}_SUFFIX`
      const removeSpaces = (s: string): string => s.replaceAll(/\s+/g, '')
      const capitalize = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
      const truncate = (s: string): string => (s.length > 20 ? `${s.slice(0, 20)}...` : s)
      const wrap = (s: string): string => `[${s}]`

      const processString = pipe(
        trim,
        toLower,
        removeSpaces,
        addPrefix,
        addSuffix,
        toUpper,
        reverse,
        capitalize,
        truncate,
        wrap,
      )

      const result = processString('  Hello World  ')

      expect(typeof result).toBe('string')
      expect(result.startsWith('[')).toBe(true)
      expect(result.endsWith(']')).toBe(true)
    })

    it.concurrent('should maintain type safety through 10 numeric transformations', () => {
      const addOne = (n: number): number => n + 1
      const double = (n: number): number => n * 2
      const square = (n: number): number => n * n
      const halve = (n: number): number => n / 2
      const addTen = (n: number): number => n + 10
      const subtractFive = (n: number): number => n - 5
      const triple = (n: number): number => n * 3
      const mod100 = (n: number): number => n % 100
      const abs = (n: number): number => Math.abs(n)
      const floor = (n: number): number => Math.floor(n)

      const processNumber = pipe(
        addOne,
        double,
        square,
        halve,
        addTen,
        subtractFive,
        triple,
        mod100,
        abs,
        floor,
      )

      const result = processNumber(5)

      expect(typeof result).toBe('number')
      expect(Number.isInteger(result)).toBe(true)
    })

    it.concurrent('should work with type transformations in chain', () => {
      const toString = (n: number): string => String(n)
      const addPrefix = (s: string): string => `num_${s}`
      const toArray = (s: string): string[] => s.split('_')
      const getLength = (arr: string[]): number => arr.length
      const isEven = (n: number): boolean => n % 2 === 0
      const toObject = (b: boolean): {value: boolean} => ({value: b})
      const toJson = (obj: {value: boolean}): string => JSON.stringify(obj)
      const parseBack = (s: string): {value: boolean} => JSON.parse(s) as {value: boolean}
      const getValue = (obj: {value: boolean}): boolean => obj.value
      const negate = (b: boolean): boolean => !b

      const transform = pipe(
        toString,
        addPrefix,
        toArray,
        getLength,
        isEven,
        toObject,
        toJson,
        parseBack,
        getValue,
        negate,
      )

      const result = transform(42)

      expect(typeof result).toBe('boolean')
    })
  })

  describe('compose with 10+ transformations', () => {
    it.concurrent('should compose 10 functions in right-to-left order', () => {
      const f1 = (n: number): number => n + 1
      const f2 = (n: number): number => n * 2
      const f3 = (n: number): number => n + 3
      const f4 = (n: number): number => n * 4
      const f5 = (n: number): number => n + 5
      const f6 = (n: number): number => n * 6
      const f7 = (n: number): number => n + 7
      const f8 = (n: number): number => n * 8
      const f9 = (n: number): number => n + 9
      const f10 = (n: number): number => n * 10

      const composed = compose(f1, f2, f3, f4, f5, f6, f7, f8, f9, f10)
      const piped = pipe(f10, f9, f8, f7, f6, f5, f4, f3, f2, f1)

      expect(composed(1)).toBe(piped(1))
    })

    it.concurrent('should verify compose is right-to-left equivalent to pipe left-to-right', () => {
      const addOne = (n: number): number => n + 1
      const double = (n: number): number => n * 2
      const square = (n: number): number => n * n

      const composed = compose(square, double, addOne)
      const piped = pipe(addOne, double, square)

      expect(composed(5)).toBe(piped(5))
      expect(composed(5)).toBe(144)
    })
  })

  describe('curry integration with pipe and compose', () => {
    it.concurrent('should work with curried functions in pipe', () => {
      const add = (a: number, b: number): number => a + b
      const multiply = (a: number, b: number): number => a * b

      const curriedAdd = curry(add)
      const curriedMultiply = curry(multiply)

      const transform = pipe(curriedAdd(5), curriedMultiply(3))

      expect(transform(10)).toBe(45)
    })

    it.concurrent('should work with curried functions in compose', () => {
      const add = (a: number, b: number): number => a + b
      const multiply = (a: number, b: number): number => a * b

      const curriedAdd = curry(add)
      const curriedMultiply = curry(multiply)

      const transform = compose(curriedAdd(5), curriedMultiply(3))

      expect(transform(10)).toBe(35)
    })

    it.concurrent('should curry a 5-argument function and use in pipeline', () => {
      const combineFive = (a: number, b: number, c: number, d: number, e: number): string =>
        `${a}-${b}-${c}-${d}-${e}`

      const curried = curry(combineFive)

      const partially1 = curried(1)
      const partially2 = partially1(2)
      const partially3 = partially2(3)
      const partially4 = partially3(4)
      const result = partially4(5)

      expect(result).toBe('1-2-3-4-5')
      expect(curried(1, 2)(3, 4, 5)).toBe('1-2-3-4-5')
      expect(curried(1)(2, 3)(4)(5)).toBe('1-2-3-4-5')
    })
  })

  describe('tap integration in pipelines', () => {
    it.concurrent('should allow side effects without affecting pipeline values', () => {
      const sideEffects: number[] = []

      const pipeline = pipe(
        (n: number) => n + 1,
        tap((n: number) => sideEffects.push(n)),
        (n: number) => n * 2,
        tap((n: number) => sideEffects.push(n)),
        (n: number) => n + 5,
        tap((n: number) => sideEffects.push(n)),
      )

      const result = pipeline(10)

      expect(result).toBe(27)
      expect(sideEffects).toEqual([11, 22, 27])
    })

    it.concurrent('should work with identity function', () => {
      const pipeline = pipe(identity<number>, (n: number) => n + 1, identity<number>)

      expect(pipeline(5)).toBe(6)
    })
  })

  describe('memoize integration with functional composition', () => {
    it.concurrent('should cache results of composed functions', () => {
      let callCount = 0

      const expensiveComputation = (n: number): number => {
        callCount++
        return n * n * n
      }

      const memoizedExpensive = memoize(expensiveComputation)

      const pipeline = pipe(
        (n: number) => n + 1,
        memoizedExpensive,
        (n: number) => n * 2,
      )

      expect(pipeline(5)).toBe(432)
      expect(callCount).toBe(1)

      expect(pipeline(5)).toBe(432)
      expect(callCount).toBe(1)

      expect(pipeline(10)).toBe(2662)
      expect(callCount).toBe(2)
    })

    it.concurrent('should track cache statistics in pipeline', () => {
      const compute = memoize((n: number): number => n * 2)

      const pipeline = pipe(
        (n: number) => n + 1,
        compute,
        (n: number) => n + 10,
      )

      pipeline(5)
      pipeline(5)
      pipeline(10)
      pipeline(5)

      const stats = compute.getStats()

      expect(stats.hits).toBe(2)
      expect(stats.misses).toBe(2)
    })
  })

  describe('result type with functional composition', () => {
    it.concurrent('should chain Result operations with pipe pattern', () => {
      const parseNumber = (s: string): Result<number, string> => {
        const n = Number.parseInt(s, 10)
        return Number.isNaN(n) ? err('Invalid number') : ok(n)
      }

      const validatePositive = (n: number): Result<number, string> =>
        n > 0 ? ok(n) : err('Number must be positive')

      const validateMax = (n: number): Result<number, string> =>
        n <= 100 ? ok(n) : err('Number must be <= 100')

      const result1 = parseNumber('42')
      const result2 = isOk(result1) ? validatePositive(result1.data) : result1
      const result3 = isOk(result2) ? validateMax(result2.data) : result2

      expect(isOk(result3)).toBe(true)
      expect(isOk(result3) && result3.data).toBe(42)
    })

    it.concurrent('should combine map and flatMap in chains', () => {
      const initial = ok(5)

      const result = flatMap(
        flatMap(
          map(initial, n => n * 2),
          n => (n > 0 ? ok(n + 10) : err('negative')),
        ),
        n => (n < 100 ? ok(`Value: ${n}`) : err('too large')),
      )

      expect(isOk(result)).toBe(true)
      expect(isOk(result) && result.data).toBe('Value: 20')
    })

    it.concurrent('should short-circuit on first error in chain', () => {
      const step1 = (n: number): Result<number, string> => ok(n + 1)
      const step2 = (_n: number): Result<number, string> => err('Error in step 2')
      const step3 = (n: number): Result<number, string> => ok(n * 3)

      let step3Called = false
      const trackedStep3 = (n: number): Result<number, string> => {
        step3Called = true
        return step3(n)
      }

      const result1 = step1(10)
      const result2 = flatMap(result1, step2)
      const result3 = flatMap(result2, trackedStep3)

      expect(isErr(result3)).toBe(true)
      expect(step3Called).toBe(false)
      expect(isErr(result3) && result3.error).toBe('Error in step 2')
    })
  })

  describe('complex data transformation pipelines', () => {
    it.concurrent('should transform nested object structures', () => {
      interface RawUser {
        first_name: string
        last_name: string
        email_address: string
        age_years: number
      }

      interface NormalizedUser {
        firstName: string
        lastName: string
        email: string
        age: number
      }

      interface EnrichedUser extends NormalizedUser {
        displayName: string
        isAdult: boolean
      }

      interface FinalUser extends EnrichedUser {
        id: string
        timestamp: number
      }

      const normalize = (raw: RawUser): NormalizedUser => ({
        firstName: raw.first_name,
        lastName: raw.last_name,
        email: raw.email_address,
        age: raw.age_years,
      })

      const enrich = (user: NormalizedUser): EnrichedUser => ({
        ...user,
        displayName: `${user.firstName} ${user.lastName}`,
        isAdult: user.age >= 18,
      })

      const finalize = (user: EnrichedUser): FinalUser => ({
        ...user,
        id: `user_${user.email.split('@')[0]}`,
        timestamp: 1234567890,
      })

      const processUser = pipe(normalize, enrich, finalize)

      const rawUser: RawUser = {
        first_name: 'John',
        last_name: 'Doe',
        email_address: 'john.doe@example.com',
        age_years: 25,
      }

      const result = processUser(rawUser)

      expect(result.firstName).toBe('John')
      expect(result.displayName).toBe('John Doe')
      expect(result.isAdult).toBe(true)
      expect(result.id).toBe('user_john.doe')
    })

    it.concurrent('should transform arrays through pipelines', () => {
      const double = (arr: number[]): number[] => arr.map(n => n * 2)
      const filterEven = (arr: number[]): number[] => arr.filter(n => n % 2 === 0)
      const sum = (arr: number[]): number => arr.reduce((a, b) => a + b, 0)
      const toObject = (n: number): {total: number; count: number} => ({total: n, count: 1})

      const pipeline = pipe(double, filterEven, sum, toObject)

      const result = pipeline([1, 2, 3, 4, 5])

      // [1,2,3,4,5] -> double -> [2,4,6,8,10] -> filterEven -> [2,4,6,8,10] -> sum -> 30
      expect(result).toEqual({total: 30, count: 1})
    })
  })

  describe('point-free style composition', () => {
    it.concurrent('should support point-free style with curried functions', () => {
      const add = curry((a: number, b: number) => a + b)
      const multiply = curry((a: number, b: number) => a * b)
      // Use flipped divide: divideBy(4) = x => x / 4
      const divideBy = curry((divisor: number, x: number) => x / divisor)

      // (5 + 10) * 2 / 4 = 15 * 2 / 4 = 30 / 4 = 7.5
      const formula = pipe(add(10), multiply(2), divideBy(4))

      expect(formula(5)).toBe(7.5)
    })
  })

  describe('function composition edge cases', () => {
    it.concurrent('should handle single function in pipe', () => {
      const addOne = (n: number): number => n + 1

      const single = pipe(addOne)

      expect(single(5)).toBe(6)
    })

    it.concurrent('should handle single function in compose', () => {
      const addOne = (n: number): number => n + 1

      const single = compose(addOne)

      expect(single(5)).toBe(6)
    })

    it.concurrent('should handle functions that return void (via tap)', () => {
      const logs: string[] = []

      const pipeline = pipe(
        (n: number) => n + 1,
        tap((n: number) => {
          logs.push(`Value is ${n}`)
        }),
        (n: number) => n * 2,
      )

      const result = pipeline(5)

      expect(result).toBe(12)
      expect(logs).toEqual(['Value is 6'])
    })
  })
})
