/**
 * Composes functions from right to left.
 * The result of each function is passed to the next.
 *
 * @example
 * ```ts
 * const addOne = (x: number) => x + 1
 * const double = (x: number) => x * 2
 * const addOneThenDouble = compose(double, addOne)
 * addOneThenDouble(5) // => 12 (5 + 1 = 6, 6 * 2 = 12)
 * ```
 */
export function compose<A, B>(fn1: (a: A) => B): (a: A) => B
export function compose<A, B, C>(fn2: (b: B) => C, fn1: (a: A) => B): (a: A) => C
export function compose<A, B, C, D>(
  fn3: (c: C) => D,
  fn2: (b: B) => C,
  fn1: (a: A) => B,
): (a: A) => D
export function compose<A, B, C, D, E>(
  fn4: (d: D) => E,
  fn3: (c: C) => D,
  fn2: (b: B) => C,
  fn1: (a: A) => B,
): (a: A) => E
export function compose<A, B, C, D, E, F>(
  fn5: (e: E) => F,
  fn4: (d: D) => E,
  fn3: (c: C) => D,
  fn2: (b: B) => C,
  fn1: (a: A) => B,
): (a: A) => F
export function compose(...fns: ((arg: unknown) => unknown)[]): (arg: unknown) => unknown {
  return (arg: unknown): unknown => fns.reduceRight((acc, fn) => fn(acc), arg)
}
