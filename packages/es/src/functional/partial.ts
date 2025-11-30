/**
 * Partially applies arguments to a function.
 *
 * @param fn - The function to partially apply
 * @param args - The arguments to partially apply
 * @returns A new function with the given arguments pre-applied
 *
 * @example
 * ```ts
 * const add = (a: number, b: number, c: number) => a + b + c
 * const add5 = partial(add, 5)
 * add5(3, 2) // => 10
 * ```
 */
export function partial<T extends unknown[], R, A extends unknown[]>(
  fn: (...args: [...A, ...T]) => R,
  ...args: A
): (...rest: T) => R {
  return (...rest: T): R => fn(...args, ...rest)
}
