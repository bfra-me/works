/**
 * Creates a function that calls the provided function with the value
 * and then returns the value unchanged. Useful for side effects in pipelines.
 *
 * @param fn - The function to call for its side effects
 * @returns A function that calls fn and returns the original value
 *
 * @example
 * ```ts
 * const addOne = (x: number) => x + 1
 * const logValue = tap(console.log)
 * pipe(addOne, logValue, addOne)(5) // logs 6, returns 7
 * ```
 */
export function tap<T>(fn: (value: T) => void): (value: T) => T {
  return (value: T): T => {
    fn(value)
    return value
  }
}
