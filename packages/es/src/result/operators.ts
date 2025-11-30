import type {Result} from './types'
import {err, ok} from './factories'
import {isOk} from './guards'

/**
 * Extracts the value from an Ok result, or throws an error for Err results.
 *
 * @param result - The result to unwrap
 * @param message - Optional custom error message for Err results
 * @returns The contained value if Ok
 * @throws Error if the result is Err
 */
export function unwrap<T, E>(result: Result<T, E>, message?: string): T {
  if (isOk(result)) {
    return result.data
  }
  const errorMessage = message ?? `Attempted to unwrap an Err result: ${String(result.error)}`
  throw new Error(errorMessage)
}

/**
 * Extracts the value from an Ok result, or returns the default value for Err results.
 *
 * @param result - The result to unwrap
 * @param defaultValue - The value to return if result is Err
 * @returns The contained value if Ok, otherwise the default value
 */
export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
  return isOk(result) ? result.data : defaultValue
}

/**
 * Transforms the value inside an Ok result using the provided function.
 * Err results pass through unchanged.
 *
 * @param result - The result to transform
 * @param fn - The transformation function
 * @returns A new Result with the transformed value
 */
export function map<T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> {
  return isOk(result) ? ok(fn(result.data)) : result
}

/**
 * Chains Result-returning functions, flattening the result.
 * Useful for composing operations that may fail.
 *
 * @param result - The result to chain
 * @param fn - A function that returns a Result
 * @returns The result of the function if Ok, otherwise the original Err
 */
export function flatMap<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>,
): Result<U, E> {
  return isOk(result) ? fn(result.data) : result
}

/**
 * Transforms the error inside an Err result using the provided function.
 * Ok results pass through unchanged.
 *
 * @param result - The result to transform
 * @param fn - The error transformation function
 * @returns A new Result with the transformed error
 */
export function mapErr<T, E, F>(result: Result<T, E>, fn: (error: E) => F): Result<T, F> {
  return isOk(result) ? result : err(fn(result.error))
}

/**
 * Wraps a potentially throwing function in a Result.
 *
 * @param fn - A function that may throw
 * @returns Ok with the return value, or Err with the caught error
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
 *
 * @param promise - The promise to convert
 * @returns A Promise that resolves to Ok or Err
 */
export async function fromPromise<T>(promise: Promise<T>): Promise<Result<T, Error>> {
  try {
    return ok(await promise)
  } catch (error) {
    return err(error instanceof Error ? error : new Error(String(error)))
  }
}
