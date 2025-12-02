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
 * Discriminated union for error handling without exceptions.
 * Prefer this pattern over throwing for expected/recoverable errors.
 *
 * @example
 * ```ts
 * function divide(a: number, b: number): Result<number, string> {
 *   return b === 0 ? err('Division by zero') : ok(a / b)
 * }
 * ```
 */
export type Result<T, E = Error> = Ok<T> | Err<E>
