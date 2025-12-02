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
export function compose<A, B, C, D, E, F, G>(
  fn6: (f: F) => G,
  fn5: (e: E) => F,
  fn4: (d: D) => E,
  fn3: (c: C) => D,
  fn2: (b: B) => C,
  fn1: (a: A) => B,
): (a: A) => G
export function compose<A, B, C, D, E, F, G, H>(
  fn7: (g: G) => H,
  fn6: (f: F) => G,
  fn5: (e: E) => F,
  fn4: (d: D) => E,
  fn3: (c: C) => D,
  fn2: (b: B) => C,
  fn1: (a: A) => B,
): (a: A) => H
export function compose<A, B, C, D, E, F, G, H, I>(
  fn8: (h: H) => I,
  fn7: (g: G) => H,
  fn6: (f: F) => G,
  fn5: (e: E) => F,
  fn4: (d: D) => E,
  fn3: (c: C) => D,
  fn2: (b: B) => C,
  fn1: (a: A) => B,
): (a: A) => I
export function compose<A, B, C, D, E, F, G, H, I, J>(
  fn9: (i: I) => J,
  fn8: (h: H) => I,
  fn7: (g: G) => H,
  fn6: (f: F) => G,
  fn5: (e: E) => F,
  fn4: (d: D) => E,
  fn3: (c: C) => D,
  fn2: (b: B) => C,
  fn1: (a: A) => B,
): (a: A) => J
export function compose<A, B, C, D, E, F, G, H, I, J, K>(
  fn10: (j: J) => K,
  fn9: (i: I) => J,
  fn8: (h: H) => I,
  fn7: (g: G) => H,
  fn6: (f: F) => G,
  fn5: (e: E) => F,
  fn4: (d: D) => E,
  fn3: (c: C) => D,
  fn2: (b: B) => C,
  fn1: (a: A) => B,
): (a: A) => K
export function compose(...fns: ((arg: unknown) => unknown)[]): (arg: unknown) => unknown {
  return function composed(arg: unknown): unknown {
    return fns.reduceRight((acc, fn) => fn(acc), arg)
  }
}
