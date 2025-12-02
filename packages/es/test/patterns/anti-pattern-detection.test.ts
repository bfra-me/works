/**
 * Anti-pattern detection tests - validates detection of common anti-patterns.
 *
 * These tests verify that anti-patterns can be detected at runtime through
 * behavioral testing, demonstrating how improper usage leads to failures
 * while proper usage succeeds.
 *
 * Related requirements:
 * - TEST-038: Validates Result usage patterns (no throwing from Result code paths)
 * - TEST-039: Validates pipe/compose usage (no side effects, no mutation)
 * - TEST-040: Validates type guard usage over type assertions
 */

import type {Result} from '../../src/result'

import {beforeEach, describe, expect, it} from 'vitest'

import {compose, pipe} from '../../src/functional'
import {err, isErr, isOk, map, ok, unwrapOr} from '../../src/result'
import {hasProperty, isNumber, isObject, isString} from '../../src/types'

function divideProper(a: number, b: number): Result<number, string> {
  if (b === 0) {
    return err('Division by zero')
  }
  return ok(a / b)
}

function divideBad(a: number, b: number): Result<number, string> {
  if (b === 0) {
    throw new Error('Division by zero')
  }
  return ok(a / b)
}

function processBad(data: unknown): Result<string, string> {
  if (data === null) {
    throw new Error('Null not allowed')
  }
  if (typeof data !== 'string') {
    return err('Must be string')
  }
  return ok(data.toUpperCase())
}

function processApiResponse(data: unknown): string {
  if (!isObject(data)) {
    return 'Invalid: not an object'
  }
  if (!hasProperty(data, 'name') || !isString(data.name)) {
    return 'Invalid: missing or invalid name'
  }
  return data.name.toUpperCase()
}

function processApiResponseBad(data: unknown): string {
  const response = data as {name: string}
  return response.name.toUpperCase()
}

function processValue(value: unknown): number {
  if (value === null || value === undefined) {
    return 0
  }
  if (!isNumber(value)) {
    return 0
  }
  return value * 2
}

function processValueBad(value: unknown): number | string {
  if (typeof value === 'number' || typeof value === 'string') {
    return (value as number) * 2
  }
  return 0
}

interface UserClass {
  id: number
  name: string
}

class User implements UserClass {
  id: number
  name: string

  constructor(id: number, name: string) {
    this.id = id
    this.name = name
  }
}

function isUserLike(value: unknown): value is {id: number; name: string} {
  return (
    isObject(value) &&
    hasProperty(value, 'id') &&
    isNumber(value.id) &&
    hasProperty(value, 'name') &&
    isString(value.name)
  )
}

function sumNumbers(data: unknown): Result<number, string> {
  if (!Array.isArray(data)) {
    return err('Expected array')
  }

  if (!data.every(isNumber)) {
    return err('All elements must be numbers')
  }

  return ok(data.reduce((sum: number, n: number) => sum + n, 0))
}

function sumNumbersBad(data: unknown): number | string {
  const numbers = data as number[]
  return numbers.reduce((sum: number, n: number) => sum + n, 0)
}

describe('@bfra.me/es/patterns - Anti-Pattern Detection', () => {
  describe('result usage patterns (TEST-038)', () => {
    describe('throwing inside Result-returning functions (ANTI-PATTERN)', () => {
      it.concurrent('should demonstrate proper Result usage does not throw', () => {
        const result = divideProper(10, 0)

        expect(isErr(result)).toBe(true)
        expect(() => divideProper(10, 0)).not.toThrow()
      })

      it.concurrent('should detect throwing inside Result functions as anti-pattern', () => {
        expect(() => divideBad(10, 0)).toThrow('Division by zero')
      })

      it.concurrent('should detect mixed throw/Result patterns', () => {
        expect(() => processBad(null)).toThrow()
        expect(isErr(processBad(123))).toBe(true)
      })
    })

    describe('proper Result error handling', () => {
      it.concurrent('should handle errors with type guards', () => {
        const success: Result<number, string> = ok(42)
        const failure: Result<number, string> = err('failed')

        expect(isOk(success) && success.data).toBe(42)
        expect(isErr(failure) && failure.error).toBe('failed')
      })

      it.concurrent('should chain operations with map/flatMap', () => {
        const result = ok(5)
        const doubled = map(result, x => x * 2)

        expect(isOk(doubled) && doubled.data).toBe(10)
      })

      it.concurrent('should use unwrapOr for safe extraction', () => {
        const success: Result<number, string> = ok(42)
        const failure: Result<number, string> = err('failed')

        expect(unwrapOr(success, 0)).toBe(42)
        expect(unwrapOr(failure, 0)).toBe(0)
      })
    })

    describe('detecting improper unwrap usage', () => {
      it.concurrent('should show unwrap throws on Err', () => {
        const failure: Result<number, string> = err('failed')

        expect(isErr(failure)).toBe(true)
        expect(() => {
          throw new Error(failure.error)
        }).toThrow()
      })
    })
  })

  describe('pipe/compose usage patterns (TEST-039)', () => {
    describe('side effects in pipelines (ANTI-PATTERN)', () => {
      let sideEffectCounter: number

      beforeEach(() => {
        sideEffectCounter = 0
      })

      it.concurrent('should demonstrate pure pipeline has no side effects', () => {
        const purePipeline = pipe(
          (x: number) => x + 1,
          (x: number) => x * 2,
        )

        const result1 = purePipeline(5)
        const result2 = purePipeline(5)

        expect(result1).toBe(12)
        expect(result2).toBe(12)
        expect(result1).toBe(result2)
      })

      it('should detect side effects in pipeline', () => {
        const impurePipeline = pipe(
          (x: number) => {
            sideEffectCounter++
            return x + 1
          },
          (x: number) => x * 2,
        )

        expect(sideEffectCounter).toBe(0)
        impurePipeline(5)
        expect(sideEffectCounter).toBe(1)
        impurePipeline(5)
        expect(sideEffectCounter).toBe(2)
      })
    })

    describe('mutation in pipelines (ANTI-PATTERN)', () => {
      it.concurrent('should demonstrate immutable pipeline', () => {
        interface State {
          count: number
          items: string[]
        }

        const immutablePipeline = pipe(
          (state: State): State => ({...state, count: state.count + 1}),
          (state: State): State => ({...state, items: [...state.items, 'new']}),
        )

        const initial: State = {count: 0, items: []}
        const result = immutablePipeline(initial)

        expect(initial.count).toBe(0)
        expect(initial.items).toEqual([])
        expect(result.count).toBe(1)
        expect(result.items).toEqual(['new'])
      })

      it.concurrent('should detect mutation anti-pattern', () => {
        interface MutableState {
          count: number
          items: string[]
        }

        const mutatingPipeline = pipe(
          (state: MutableState) => {
            state.count++
            return state
          },
          (state: MutableState) => {
            state.items.push('mutated')
            return state
          },
        )

        const initial: MutableState = {count: 0, items: []}
        mutatingPipeline(initial)

        expect(initial.count).toBe(1)
        expect(initial.items).toEqual(['mutated'])
      })
    })

    describe('non-deterministic functions in pipelines (ANTI-PATTERN)', () => {
      it.concurrent('should demonstrate deterministic pipeline', () => {
        const deterministicPipeline = pipe(
          (x: number) => x + 1,
          (x: number) => x * 2,
        )

        const results = Array.from({length: 10}, () => deterministicPipeline(5))

        expect(results.every(r => r === 12)).toBe(true)
      })

      it.concurrent('should detect non-deterministic pipeline', () => {
        const nonDeterministicPipeline = pipe(
          (x: number) => x + Math.random(),
          (x: number) => x * 2,
        )

        const results = new Set(Array.from({length: 10}, () => nonDeterministicPipeline(5)))

        expect(results.size).toBeGreaterThan(1)
      })
    })

    describe('throwing in pipelines (ANTI-PATTERN)', () => {
      it.concurrent('should demonstrate safe pipeline with Result', () => {
        const safePipeline = pipe(
          (x: number): Result<number, string> => (x < 0 ? err('Negative') : ok(x + 1)),
          (result: Result<number, string>) => map(result, x => x * 2),
        )

        const success = safePipeline(5)
        const failure = safePipeline(-1)

        expect(isOk(success) && success.data).toBe(12)
        expect(isErr(failure) && failure.error).toBe('Negative')
        expect(() => safePipeline(-1)).not.toThrow()
      })

      it.concurrent('should detect throwing pipeline', () => {
        const throwingPipeline = pipe(
          (x: number) => {
            if (x < 0) throw new Error('Negative')
            return x + 1
          },
          (x: number) => x * 2,
        )

        expect(throwingPipeline(5)).toBe(12)
        expect(() => throwingPipeline(-1)).toThrow('Negative')
      })
    })

    describe('compose vs pipe direction', () => {
      it.concurrent('should apply pipe left-to-right', () => {
        const addOne = (x: number) => x + 1
        const double = (x: number) => x * 2
        const stringify = (x: number) => `Result: ${x}`

        const piped = pipe(addOne, double, stringify)

        expect(piped(5)).toBe('Result: 12')
      })

      it.concurrent('should apply compose right-to-left', () => {
        const addOne = (x: number) => x + 1
        const double = (x: number) => x * 2
        const asNumber = (x: string) => Number.parseInt(x, 10)

        const composed = compose(addOne, double, asNumber)

        expect(composed('5')).toBe(11)
      })
    })
  })

  describe('type guard usage patterns (TEST-040)', () => {
    describe('type assertions vs type guards (ANTI-PATTERN)', () => {
      it.concurrent('should demonstrate safe type guard usage', () => {
        expect(processApiResponse({name: 'test'})).toBe('TEST')
        expect(processApiResponse({name: 123})).toBe('Invalid: missing or invalid name')
        expect(processApiResponse(null)).toBe('Invalid: not an object')
        expect(processApiResponse('string')).toBe('Invalid: not an object')
      })

      it.concurrent('should show type assertion failures at runtime', () => {
        expect(processApiResponseBad({name: 'test'})).toBe('TEST')
        expect(() => processApiResponseBad(null)).toThrow()
        expect(() => processApiResponseBad({noName: true})).toThrow()
      })
    })

    describe('using proper type predicates', () => {
      interface UserData {
        id: number
        name: string
        email: string
      }

      function isUserData(value: unknown): value is UserData {
        return (
          isObject(value) &&
          hasProperty(value, 'id') &&
          isNumber(value.id) &&
          hasProperty(value, 'name') &&
          isString(value.name) &&
          hasProperty(value, 'email') &&
          isString(value.email)
        )
      }

      it.concurrent('should narrow types correctly with proper guard', () => {
        const validUser = {id: 1, name: 'Test', email: 'test@example.com'}
        const invalidUser = {id: 'not-a-number', name: 'Test'}

        expect(isUserData(validUser)).toBe(true)
        expect(isUserData(invalidUser)).toBe(false)

        const narrowedUser = isUserData(validUser) ? validUser : null
        expect(narrowedUser?.id).toBe(1)
        expect(narrowedUser?.name.toUpperCase()).toBe('TEST')
      })

      it.concurrent('should demonstrate filter with type guards', () => {
        const mixedData: unknown[] = [
          {id: 1, name: 'User1', email: 'user1@test.com'},
          {id: 'bad', name: 'Invalid'},
          null,
          {id: 2, name: 'User2', email: 'user2@test.com'},
          'string',
        ]

        const users = mixedData.filter(isUserData)

        expect(users).toHaveLength(2)
        expect(users.at(0)?.name).toBe('User1')
        expect(users.at(1)?.name).toBe('User2')
      })
    })

    describe('truthy checks vs proper validation (ANTI-PATTERN)', () => {
      it.concurrent('should demonstrate proper null check', () => {
        expect(processValue(5)).toBe(10)
        expect(processValue(null)).toBe(0)
        expect(processValue(0)).toBe(0)
        expect(processValue('')).toBe(0)
      })

      it.concurrent('should show truthy check failures', () => {
        // ANTI-PATTERN: Using type assertion (as number) causes unexpected coercion
        // '5' * 2 coerces string to number, returning 10 instead of proper string handling
        expect(processValueBad(5)).toBe(10)
        expect(processValueBad(0)).toBe(0)
        expect(processValueBad('5')).toBe(10) // String '5' coerced to number by * operator
        expect(processValueBad(null)).toBe(0)
      })
    })

    describe('instanceof limitations', () => {
      it.concurrent('should show instanceof works with class instances', () => {
        const user = new User(1, 'Test')

        expect(user instanceof User).toBe(true)
      })

      it.concurrent('should demonstrate instanceof fails with plain objects', () => {
        const plainObject = {id: 1, name: 'Test'}

        expect(plainObject instanceof User).toBe(false)
      })

      it.concurrent('should use type guards for plain objects', () => {
        const plainObject = {id: 1, name: 'Test'}

        expect(isUserLike(plainObject)).toBe(true)
      })
    })

    describe('array validation patterns', () => {
      it.concurrent('should validate array elements', () => {
        const validResult = sumNumbers([1, 2, 3])
        const invalidElements = sumNumbers([1, '2', 3])
        const notArray = sumNumbers('not array')

        expect(isOk(validResult) && validResult.data).toBe(6)
        expect(isErr(invalidElements) && invalidElements.error).toBe('All elements must be numbers')
        expect(isErr(notArray) && notArray.error).toBe('Expected array')
      })

      it.concurrent('should show array assertion failures', () => {
        expect(sumNumbersBad([1, 2, 3])).toBe(6)
        // Demonstrates unexpected string concatenation when types aren't validated
        expect(sumNumbersBad([1, '2', 3])).toBe('123')
      })
    })
  })
})
