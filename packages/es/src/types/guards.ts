/**
 * Narrows unknown values to string for safe string operations.
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string'
}

/**
 * Narrows unknown values to number, excluding NaN which often indicates invalid numeric operations.
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !Number.isNaN(value)
}

/**
 * Narrows to plain objects, excluding arrays and null to match typical "object" semantics in APIs.
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Narrows unknown values to arrays for safe iteration and array method access.
 */
export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value)
}

/**
 * Narrows unknown values to callable functions for safe invocation.
 */
export function isFunction(value: unknown): value is (...args: unknown[]) => unknown {
  return typeof value === 'function'
}

/**
 * Safely checks for property existence before access, preventing undefined property errors.
 */
export function hasProperty<K extends PropertyKey>(
  obj: unknown,
  key: K,
): obj is Record<K, unknown> {
  return isObject(obj) && key in obj
}

/**
 * Filters out null and undefined, enabling safe property access on optional values.
 */
export function isNonNullable<T>(value: T): value is NonNullable<T> {
  return value !== null && value !== undefined
}
