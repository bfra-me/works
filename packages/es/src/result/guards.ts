import type {Err, Ok, Result} from './types'

/**
 * Type guard that checks if a Result is an Ok (success).
 *
 * @param result - The result to check
 * @returns True if the result is Ok, narrowing the type
 */
export function isOk<T, E>(result: Result<T, E>): result is Ok<T> {
  return result.success === true
}

/**
 * Type guard that checks if a Result is an Err (failure).
 *
 * @param result - The result to check
 * @returns True if the result is Err, narrowing the type
 */
export function isErr<T, E>(result: Result<T, E>): result is Err<E> {
  return result.success === false
}
