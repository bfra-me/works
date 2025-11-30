import type {Err, Ok} from './types'

/**
 * Creates a successful Result containing the given value.
 *
 * @param value - The value to wrap in an Ok result
 * @returns An Ok result containing the value
 */
export function ok<T>(value: T): Ok<T> {
  return {success: true, data: value}
}

/**
 * Creates a failed Result containing the given error.
 *
 * @param error - The error to wrap in an Err result
 * @returns An Err result containing the error
 */
export function err<E>(error: E): Err<E> {
  return {success: false, error}
}
