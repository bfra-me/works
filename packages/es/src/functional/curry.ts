/**
 * Curries a function, allowing partial application of arguments.
 * Supports both single-argument and multi-argument calls at each step.
 *
 * @example
 * ```ts
 * const add = (a: number, b: number, c: number) => a + b + c
 * const curriedAdd = curry(add)
 * curriedAdd(1)(2)(3) // => 6
 * curriedAdd(1, 2)(3) // => 6
 * curriedAdd(1)(2, 3) // => 6
 * curriedAdd(1, 2, 3) // => 6
 * ```
 */

type Curry1<A, R> = (a: A) => R
interface Curry2<A, B, R> {
  (a: A): Curry1<B, R>
  (a: A, b: B): R
}
interface Curry3<A, B, C, R> {
  (a: A): Curry2<B, C, R>
  (a: A, b: B): Curry1<C, R>
  (a: A, b: B, c: C): R
}
interface Curry4<A, B, C, D, R> {
  (a: A): Curry3<B, C, D, R>
  (a: A, b: B): Curry2<C, D, R>
  (a: A, b: B, c: C): Curry1<D, R>
  (a: A, b: B, c: C, d: D): R
}
interface Curry5<A, B, C, D, E, R> {
  (a: A): Curry4<B, C, D, E, R>
  (a: A, b: B): Curry3<C, D, E, R>
  (a: A, b: B, c: C): Curry2<D, E, R>
  (a: A, b: B, c: C, d: D): Curry1<E, R>
  (a: A, b: B, c: C, d: D, e: E): R
}

export type Curried<F extends (...args: never[]) => unknown> = F extends (a: infer A) => infer R
  ? Curry1<A, R>
  : F extends (a: infer A, b: infer B) => infer R
    ? Curry2<A, B, R>
    : F extends (a: infer A, b: infer B, c: infer C) => infer R
      ? Curry3<A, B, C, R>
      : F extends (a: infer A, b: infer B, c: infer C, d: infer D) => infer R
        ? Curry4<A, B, C, D, R>
        : F extends (a: infer A, b: infer B, c: infer C, d: infer D, e: infer E) => infer R
          ? Curry5<A, B, C, D, E, R>
          : never

export function curry<A, R>(fn: (a: A) => R): Curry1<A, R>
export function curry<A, B, R>(fn: (a: A, b: B) => R): Curry2<A, B, R>
export function curry<A, B, C, R>(fn: (a: A, b: B, c: C) => R): Curry3<A, B, C, R>
export function curry<A, B, C, D, R>(fn: (a: A, b: B, c: C, d: D) => R): Curry4<A, B, C, D, R>
export function curry<A, B, C, D, E, R>(
  fn: (a: A, b: B, c: C, d: D, e: E) => R,
): Curry5<A, B, C, D, E, R>
export function curry(fn: (...args: unknown[]) => unknown): (...args: unknown[]) => unknown {
  return function curried(...args: unknown[]): unknown {
    if (args.length >= fn.length) {
      return fn(...args)
    }
    return function curriedNext(...nextArgs: unknown[]): unknown {
      return curried(...args, ...nextArgs)
    }
  }
}
