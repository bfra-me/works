/**
 * Runtime assertion that throws for invalid types, enabling fail-fast error detection.
 * Use at API boundaries where invalid input should halt execution immediately.
 *
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
