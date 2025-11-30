/**
 * Reverses the order of the first two arguments of a function.
 *
 * @param fn - The function to flip
 * @returns A new function with the first two arguments reversed
 *
 * @example
 * ```ts
 * const divide = (a: number, b: number) => a / b
 * const flipped = flip(divide)
 * divide(10, 2)  // => 5 (10 / 2)
 * flipped(10, 2) // => 0.2 (2 / 10)
 * ```
 */
export function flip<A, B, R>(fn: (a: A, b: B) => R): (b: B, a: A) => R {
  return function flipped(b: B, a: A): R {
    return fn(a, b)
  }
}
