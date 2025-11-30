/**
 * Asserts that a value matches a type guard, throwing if it doesn't.
 *
 * @param value - The value to check
 * @param guard - The type guard function
 * @param message - Optional error message
 * @throws Error if the guard returns false
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
