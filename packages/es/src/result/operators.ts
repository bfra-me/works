import type {Result} from './types'
import {err, ok} from './factories'
import {isOk} from './guards'

/**
 * Extracts the value from an Ok result, or throws for Err results.
 * Use sparingly - prefer `unwrapOr` or pattern matching for safer extraction.
 *
 * @param result - The Result to unwrap
 * @param message - Optional custom error message when unwrapping an Err
 * @returns The value inside Ok
 * @throws Error when result is Err
 *
 * @example
 * ```ts
 * const value = unwrap(ok(42))  // 42
 * const willThrow = unwrap(err('fail'))  // throws Error
 * const custom = unwrap(err('fail'), 'Custom message')  // throws with custom message
 * ```
 */
export function unwrap<T, E>(result: Result<T, E>, message?: string): T {
  if (isOk(result)) {
    return result.data
  }
  const errorMessage = message ?? `Attempted to unwrap an Err result: ${String(result.error)}`
  throw new Error(errorMessage)
}

/**
 * Extracts the value from an Ok result, or returns the default value for Err.
 * This is the preferred safe way to extract values from Results.
 *
 * @param result - The Result to unwrap
 * @param defaultValue - The value to return if result is Err
 * @returns The value inside Ok, or the default value
 *
 * @example
 * ```ts
 * unwrapOr(ok(42), 0)       // 42
 * unwrapOr(err('fail'), 0)  // 0
 * ```
 */
export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
  return isOk(result) ? result.data : defaultValue
}

/**
 * Transforms the value inside an Ok result. Err results pass through unchanged.
 *
 * @param result - The Result to transform
 * @param fn - The transformation function
 * @returns A new Result with the transformed value, or the original Err
 *
 * @example
 * ```ts
 * map(ok(5), x => x * 2)           // ok(10)
 * map(err('fail'), x => x * 2)     // err('fail') - unchanged
 * ```
 */
export function map<T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> {
  return isOk(result) ? ok(fn(result.data)) : result
}

/**
 * Chains Result-returning functions, flattening nested Results.
 * Use when the transformation function itself returns a Result.
 *
 * @param result - The Result to transform
 * @param fn - A function that returns a Result
 * @returns The Result from fn, or the original Err
 *
 * @example
 * ```ts
 * const parse = (s: string) => {
 *   const n = parseInt(s, 10)
 *   return isNaN(n) ? err('Invalid number') : ok(n)
 * }
 *
 * flatMap(ok('42'), parse)    // ok(42)
 * flatMap(ok('abc'), parse)   // err('Invalid number')
 * flatMap(err('fail'), parse) // err('fail')
 * ```
 */
export function flatMap<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>,
): Result<U, E> {
  return isOk(result) ? fn(result.data) : result
}

/**
 * Transforms the error inside an Err result. Ok results pass through unchanged.
 *
 * @param result - The Result to transform
 * @param fn - The error transformation function
 * @returns A new Result with the transformed error, or the original Ok
 *
 * @example
 * ```ts
 * mapErr(err('not found'), e => new Error(`Resource ${e}`))
 * // err(Error('Resource not found'))
 *
 * mapErr(ok(42), e => new Error(e))  // ok(42) - unchanged
 * ```
 */
export function mapErr<T, E, F>(result: Result<T, E>, fn: (error: E) => F): Result<T, F> {
  return isOk(result) ? result : err(fn(result.error))
}

/**
 * Wraps a potentially throwing function in a Result.
 * Captures exceptions and converts them to Err results.
 *
 * @param fn - The function that might throw
 * @returns Ok with the return value, or Err with the caught error
 *
 * @example
 * ```ts
 * const parsed = fromThrowable(() => JSON.parse('{"a": 1}'))
 * // ok({ a: 1 })
 *
 * const invalid = fromThrowable(() => JSON.parse('not json'))
 * // err(SyntaxError(...))
 * ```
 */
export function fromThrowable<T>(fn: () => T): Result<T, Error> {
  try {
    return ok(fn())
  } catch (error) {
    return err(error instanceof Error ? error : new Error(String(error)))
  }
}

/**
 * Converts a Promise to a Promise<Result>, catching rejections.
 * Useful for wrapping async operations in the Result pattern.
 *
 * @param promise - The promise to wrap
 * @returns A Promise that resolves to Ok or Err
 *
 * @example
 * ```ts
 * const result = await fromPromise(fetch('/api/data'))
 * if (isOk(result)) {
 *   console.log(result.data)
 * } else {
 *   console.error('Fetch failed:', result.error)
 * }
 * ```
 */
export async function fromPromise<T>(promise: Promise<T>): Promise<Result<T, Error>> {
  try {
    return ok(await promise)
  } catch (error) {
    return err(error instanceof Error ? error : new Error(String(error)))
  }
}
