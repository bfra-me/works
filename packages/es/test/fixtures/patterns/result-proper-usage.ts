/**
 * Proper Result usage patterns - demonstrates correct error handling with discriminated unions.
 * This file serves as a reference for detecting anti-patterns by comparison.
 */

import {err, flatMap, fromPromise, fromThrowable, isErr, isOk, map, ok, unwrapOr} from '../../../src/result'
import type {Result} from '../../../src/result'

/**
 * PATTERN 1: Return Result instead of throwing for expected errors
 * Expected errors (validation, not found, etc.) should return Err variants.
 */
export function divideNumbers(a: number, b: number): Result<number, string> {
  if (b === 0) {
    return err('Division by zero')
  }
  return ok(a / b)
}

/**
 * PATTERN 2: Use type guards for discriminated union narrowing
 * Always use isOk/isErr guards instead of direct property access.
 */
export function processResult<T, E>(result: Result<T, E>): {value: T | null; error: E | null} {
  if (isOk(result)) {
    return {value: result.data, error: null}
  }
  return {value: null, error: result.error}
}

/**
 * PATTERN 3: Chain operations with map/flatMap instead of imperative checks
 * Use functional composition for cleaner Result transformations.
 */
export function processUserData(userId: string): Result<{id: string; displayName: string}, string> {
  const validateId = (id: string): Result<string, string> => {
    if (id.length === 0) {
      return err('User ID cannot be empty')
    }
    return ok(id)
  }

  const fetchUser = (id: string): Result<{id: string; name: string}, string> => {
    if (id === 'invalid') {
      return err('User not found')
    }
    return ok({id, name: 'Test User'})
  }

  const formatDisplay = (user: {id: string; name: string}): {id: string; displayName: string} => ({
    id: user.id,
    displayName: `User: ${user.name}`,
  })

  return map(flatMap(validateId(userId), fetchUser), formatDisplay)
}

/**
 * PATTERN 4: Use unwrapOr for safe default values
 * Prefer unwrapOr over unwrap for safer value extraction.
 */
export function getConfigValue(config: Result<{value: number}, Error>): number {
  return unwrapOr(map(config, (c: {value: number}) => c.value), 0)
}

/**
 * PATTERN 5: Wrap external throwing functions with fromThrowable
 * Third-party code that throws should be wrapped at the boundary.
 */
export function parseJsonSafely(json: string): Result<unknown, Error> {
  return fromThrowable(() => JSON.parse(json))
}

/**
 * PATTERN 6: Wrap async operations with fromPromise
 * Promise rejections should be converted to Result at the boundary.
 */
export async function fetchDataSafely(url: string): Promise<Result<unknown, Error>> {
  return fromPromise(
    fetch(url).then(response => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      return response.json()
    }),
  )
}

/**
 * PATTERN 7: Exhaustive error handling with Result
 * Handle both success and error cases explicitly.
 */
export function handleResult<T, E>(
  result: Result<T, E>,
  handlers: {onOk: (data: T) => void; onErr: (error: E) => void},
): void {
  if (isOk(result)) {
    handlers.onOk(result.data)
  } else {
    handlers.onErr(result.error)
  }
}

/**
 * PATTERN 8: Use mapErr for error transformation
 * Transform errors at appropriate boundaries rather than catching and rethrowing.
 */
export function enrichError(result: Result<number, string>): Result<number, {code: string; message: string}> {
  if (isErr(result)) {
    return err({code: 'E001', message: result.error})
  }
  return result
}

/**
 * PATTERN 9: Combine multiple Results properly
 * Use flatMap chains or specialized combinators for multiple operations.
 */
export function combineResults<A, B, E>(
  resultA: Result<A, E>,
  resultB: Result<B, E>,
): Result<[A, B], E> {
  if (isErr(resultA)) return resultA
  if (isErr(resultB)) return resultB
  return ok([resultA.data, resultB.data])
}

/**
 * PATTERN 10: Early return pattern with Result
 * Return early on errors to maintain flat code structure.
 */
export function processMultiStep(input: string): Result<string, string> {
  const step1 = validateInput(input)
  if (isErr(step1)) return step1

  const step2 = transformInput(step1.data)
  if (isErr(step2)) return step2

  return ok(`Processed: ${step2.data}`)
}

function validateInput(input: string): Result<string, string> {
  if (input.length === 0) return err('Input cannot be empty')
  return ok(input)
}

function transformInput(input: string): Result<string, string> {
  if (input.includes('invalid')) return err('Invalid content detected')
  return ok(input.toUpperCase())
}
