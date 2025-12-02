import type {Err, Ok} from './types'

/**
 * Creates a successful Result containing the given value.
 *
 * @param value - The success value to wrap
 * @returns An Ok result containing the value
 *
 * @example
 * ```ts
 * const result = ok(42)
 * // result: Ok<number> = { success: true, data: 42 }
 * ```
 */
export function ok<T>(value: T): Ok<T> {
  return {success: true, data: value}
}

/**
 * Creates a failed Result containing the given error.
 *
 * @param error - The error value to wrap
 * @returns An Err result containing the error
 *
 * @example
 * ```ts
 * const result = err(new Error('Something went wrong'))
 * // result: Err<Error> = { success: false, error: Error }
 * ```
 */
export function err<E>(error: E): Err<E> {
  return {success: false, error}
}
