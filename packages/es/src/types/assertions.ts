/**
 * Runtime assertion that throws for invalid types, enabling fail-fast error detection.
 * Use at API boundaries where invalid input should halt execution immediately.
 *
 * @param value - The value to assert
 * @param guard - A type guard function
 * @param message - Optional custom error message
 * @throws Error if the guard returns false
 *
 * @example
 * ```ts
 * assertType(input, isString, 'Expected string input')
 * // input is now narrowed to string
 * console.log(input.toUpperCase())
 * ```
 */
export function assertType<T>(
  value: unknown,
  guard: (v: unknown) => v is T,
  message?: string,
): asserts value is T {
  if (!guard(value)) {
    throw new Error(message ?? `Type assertion failed`)
  }
}
