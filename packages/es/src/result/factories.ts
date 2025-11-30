import type {Err, Ok} from './types'

/** Creates a successful Result containing the given value. */
export function ok<T>(value: T): Ok<T> {
  return {success: true, data: value}
}

/** Creates a failed Result containing the given error. */
export function err<E>(error: E): Err<E> {
  return {success: false, error}
}
