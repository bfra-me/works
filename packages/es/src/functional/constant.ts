/**
 * Creates a function that always returns the same value.
 *
 * @param value - The value to return
 * @returns A function that always returns the given value
 *
 * @example
 * ```ts
 * const always42 = constant(42)
 * always42() // => 42
 * ```
 */
export function constant<T>(value: T): () => T {
  return function getValue(): T {
    return value
  }
}
