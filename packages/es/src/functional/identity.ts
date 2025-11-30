/**
 * Returns the input value unchanged.
 * Useful as a default function or in pipelines.
 *
 * @param value - The value to return
 * @returns The same value unchanged
 *
 * @example
 * ```ts
 * identity(42) // => 42
 * identity('hello') // => 'hello'
 * ```
 */
export function identity<T>(value: T): T {
  return value
}
