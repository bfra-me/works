import type {Err, Ok, Result} from './types'

/**
 * Type guard that narrows a Result to Ok.
 *
 * @param result - The Result to check
 * @returns True if the result is Ok, false if Err
 *
 * @example
 * ```ts
 * const result = divide(10, 2)
 * if (isOk(result)) {
 *   console.log(result.data) // TypeScript knows this is safe
 * }
 * ```
 */
export function isOk<T, E>(result: Result<T, E>): result is Ok<T> {
  return result.success
}

/**
 * Type guard that narrows a Result to Err.
 *
 * @param result - The Result to check
 * @returns True if the result is Err, false if Ok
 *
 * @example
 * ```ts
 * const result = divide(10, 0)
 * if (isErr(result)) {
 *   console.error(result.error) // TypeScript knows error exists
 * }
 * ```
 */
export function isErr<T, E>(result: Result<T, E>): result is Err<E> {
  return !result.success
}
