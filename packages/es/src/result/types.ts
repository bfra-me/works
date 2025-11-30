/**
 * Represents a successful result containing a value of type T.
 */
export interface Ok<T> {
  readonly success: true
  readonly data: T
}

/**
 * Represents a failed result containing an error of type E.
 */
export interface Err<E> {
  readonly success: false
  readonly error: E
}

/**
 * A discriminated union representing either success (Ok) or failure (Err).
 * Use this pattern instead of throwing exceptions for expected errors.
 */
export type Result<T, E = Error> = Ok<T> | Err<E>
