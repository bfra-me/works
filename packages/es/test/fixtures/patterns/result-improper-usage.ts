/**
 * Improper Result usage patterns - demonstrates anti-patterns to detect and avoid.
 * This file contains intentional anti-patterns for testing detection logic.
 *
 * WARNING: Do NOT copy these patterns - they demonstrate what NOT to do.
 */

import {err, isErr, isOk, ok, unwrap} from '../../../src/result'
import type {Result} from '../../../src/result'

/**
 * ANTI-PATTERN 1: Throwing inside Result-returning functions
 * Functions returning Result should never throw for expected errors.
 */
export function divideNumbersBad(a: number, b: number): Result<number, string> {
  if (b === 0) {
    throw new Error('Division by zero') // WRONG: Should return err()
  }
  return ok(a / b)
}

/**
 * ANTI-PATTERN 2: Mixing throw and Result in the same code path
 * This creates inconsistent error handling.
 */
export function processDataBad(data: unknown): Result<string, string> {
  if (data === null) {
    throw new Error('Data cannot be null') // WRONG: Should return err()
  }
  if (typeof data !== 'string') {
    return err('Data must be a string') // Correct usage
  }
  return ok(data.toUpperCase())
}

/**
 * ANTI-PATTERN 3: Using try/catch inside Result-returning functions for expected errors
 * Expected errors should be handled with Result, not exceptions.
 */
export function parseConfigBad(config: string): Result<object, string> {
  try {
    const parsed = JSON.parse(config)
    return ok(parsed)
  } catch {
    throw new Error('Invalid JSON') // WRONG: Should return err()
  }
}

/**
 * ANTI-PATTERN 4: Ignoring Err results silently
 * Errors should be explicitly handled or propagated.
 */
export function processIgnoringErrors(result: Result<number, string>): number {
  if (isOk(result)) {
    return result.data * 2
  }
  // WRONG: Error is silently ignored, returning magic value
  return 0
}

/**
 * ANTI-PATTERN 5: Using unwrap without proper error handling
 * Unwrap should only be used when you're certain the Result is Ok.
 */
export function unsafeUnwrap(result: Result<string, Error>): string {
  // WRONG: This will throw if result is Err - defeats the purpose of Result
  return unwrap(result)
}

/**
 * ANTI-PATTERN 6: Direct property access without type guards
 * Should use isOk/isErr guards for proper type narrowing.
 */
export function directPropertyAccess(result: Result<number, string>): number | string {
  // WRONG: Accessing .success directly without type guard
  if ((result as {success: boolean}).success) {
    return (result as {data: number}).data
  }
  return (result as {error: string}).error
}

/**
 * ANTI-PATTERN 7: Converting Result back to throw
 * This pattern negates the benefits of using Result.
 */
export function convertToThrow(result: Result<string, Error>): string {
  if (isErr(result)) {
    throw result.error // WRONG: Should propagate Result, not convert to throw
  }
  return result.data
}

/**
 * ANTI-PATTERN 8: Catching and throwing different error
 * This loses error context and makes debugging harder.
 */
export async function loseErrorContext(): Promise<Result<string, Error>> {
  try {
    const response = await fetch('https://example.com')
    return ok(await response.text())
  } catch {
    throw new Error('Something went wrong') // WRONG: Original error context lost
  }
}

/**
 * ANTI-PATTERN 9: Using Result but still relying on exception flow
 * Mixing paradigms creates confusion and bugs.
 */
export function mixedParadigms(values: number[]): Result<number, string> {
  if (values.length === 0) {
    return err('Array is empty')
  }

  // WRONG: Using exception for control flow within Result-based code
  const sum = values.reduce((acc, val) => {
    if (val < 0) {
      throw new Error('Negative values not allowed')
    }
    return acc + val
  }, 0)

  return ok(sum)
}

/**
 * ANTI-PATTERN 10: Not handling async Result rejections properly
 * Async Result functions should catch rejections and return err().
 */
export async function asyncNoErrorHandling(url: string): Promise<Result<unknown, string>> {
  // WRONG: fetch can reject, but we're not catching it
  const response = await fetch(url)
  if (!response.ok) {
    return err(`HTTP ${response.status}`)
  }
  return ok(await response.json())
}

/**
 * ANTI-PATTERN 11: Throwing inside map/flatMap callbacks
 * These callbacks should be pure and not throw.
 */
export function throwInCallback(result: Result<string, Error>): Result<number, Error> {
  if (isOk(result)) {
    const parsed = parseInt(result.data, 10)
    if (isNaN(parsed)) {
      throw new Error('Invalid number') // WRONG: Should use flatMap and return err()
    }
    return ok(parsed)
  }
  return result
}

/**
 * ANTI-PATTERN 12: Nested try/catch instead of flatMap chains
 * This creates deeply nested, hard to read code.
 */
export function nestedTryCatch(input: string): Result<{value: number}, string> {
  try {
    const obj = JSON.parse(input)
    try {
      if (typeof obj.value !== 'number') {
        throw new Error('Invalid value type')
      }
      return ok({value: obj.value})
    } catch {
      return err('Value validation failed')
    }
  } catch {
    return err('JSON parse failed')
  }
}
