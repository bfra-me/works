import type {Result} from './types'
import {err, ok} from './factories'
import {isOk} from './guards'

/**
 * Extracts the value from an Ok result, or throws for Err results.
 * Use sparingly - prefer `unwrapOr` or pattern matching for safer extraction.
 */
export function unwrap<T, E>(result: Result<T, E>, message?: string): T {
  if (isOk(result)) {
    return result.data
  }
  const errorMessage = message ?? `Attempted to unwrap an Err result: ${String(result.error)}`
  throw new Error(errorMessage)
}

/** Extracts the value from an Ok result, or returns the default value for Err. */
export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
  return isOk(result) ? result.data : defaultValue
}

/** Transforms the value inside an Ok result. Err results pass through unchanged. */
export function map<T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> {
  return isOk(result) ? ok(fn(result.data)) : result
}

/** Chains Result-returning functions, flattening nested Results. */
export function flatMap<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>,
): Result<U, E> {
  return isOk(result) ? fn(result.data) : result
}

/** Transforms the error inside an Err result. Ok results pass through unchanged. */
export function mapErr<T, E, F>(result: Result<T, E>, fn: (error: E) => F): Result<T, F> {
  return isOk(result) ? result : err(fn(result.error))
}

/** Wraps a potentially throwing function in a Result. */
export function fromThrowable<T>(fn: () => T): Result<T, Error> {
  try {
    return ok(fn())
  } catch (error) {
    return err(error instanceof Error ? error : new Error(String(error)))
  }
}

/** Converts a Promise to a Promise<Result>, catching rejections. */
export async function fromPromise<T>(promise: Promise<T>): Promise<Result<T, Error>> {
  try {
    return ok(await promise)
  } catch (error) {
    return err(error instanceof Error ? error : new Error(String(error)))
  }
}
