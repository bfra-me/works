/**
 * Curries a function, allowing partial application of arguments.
 *
 * @example
 * ```ts
 * const add = (a: number, b: number, c: number) => a + b + c
 * const curriedAdd = curry(add)
 * curriedAdd(1)(2)(3) // => 6
 * curriedAdd(1, 2)(3) // => 6
 * curriedAdd(1)(2, 3) // => 6
 * ```
 */

type Curried<F extends (...args: never[]) => unknown> = F extends (
  ...args: infer Args
) => infer Return
  ? Args extends [infer First, ...infer Rest]
    ? Rest extends []
      ? (arg: First) => Return
      : (arg: First) => Curried<(...args: Rest) => Return>
    : Return
  : never

export function curry<F extends (...args: never[]) => unknown>(fn: F): Curried<F> {
  return function curried(...args: unknown[]): unknown {
    if (args.length >= fn.length) {
      return fn(...(args as Parameters<F>))
    }
    return (...nextArgs: unknown[]) => curried(...args, ...nextArgs)
  } as Curried<F>
}
