/**
 * Narrows unknown values to string for safe string operations.
 *
 * @param value - The value to check
 * @returns True if value is a string
 *
 * @example
 * ```ts
 * if (isString(value)) {
 *   console.log(value.toUpperCase())
 * }
 * ```
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string'
}

/**
 * Narrows unknown values to number, excluding NaN which often indicates invalid numeric operations.
 *
 * @param value - The value to check
 * @returns True if value is a number (not NaN)
 *
 * @example
 * ```ts
 * if (isNumber(value)) {
 *   console.log(value * 2)  // Safe numeric operation
 * }
 * ```
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !Number.isNaN(value)
}

/**
 * Narrows to plain objects, excluding arrays and null to match typical "object" semantics in APIs.
 *
 * @param value - The value to check
 * @returns True if value is a plain object
 *
 * @example
 * ```ts
 * if (isObject(value)) {
 *   console.log(Object.keys(value))  // Safe object operation
 * }
 * ```
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Narrows unknown values to arrays for safe iteration and array method access.
 *
 * @param value - The value to check
 * @returns True if value is an array
 *
 * @example
 * ```ts
 * if (isArray(value)) {
 *   value.forEach(item => console.log(item))
 * }
 * ```
 */
export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value)
}

/**
 * Narrows unknown values to callable functions for safe invocation.
 *
 * @param value - The value to check
 * @returns True if value is a function
 *
 * @example
 * ```ts
 * if (isFunction(value)) {
 *   value()  // Safe to call
 * }
 * ```
 */
export function isFunction(value: unknown): value is (...args: unknown[]) => unknown {
  return typeof value === 'function'
}

/**
 * Safely checks for property existence before access, preventing undefined property errors.
 *
 * @param obj - The object to check
 * @param key - The property key to look for
 * @returns True if the object has the property
 *
 * @example
 * ```ts
 * if (hasProperty(obj, 'name')) {
 *   console.log(obj.name)  // TypeScript knows 'name' exists
 * }
 * ```
 */
export function hasProperty<K extends PropertyKey>(
  obj: unknown,
  key: K,
): obj is Record<K, unknown> {
  return isObject(obj) && key in obj
}

/**
 * Filters out null and undefined, enabling safe property access on optional values.
 *
 * @param value - The value to check
 * @returns True if value is neither null nor undefined
 *
 * @example
 * ```ts
 * const values = [1, null, 2, undefined, 3].filter(isNonNullable)
 * // values: number[] = [1, 2, 3]
 * ```
 */
export function isNonNullable<T>(value: T): value is NonNullable<T> {
  return value !== null && value !== undefined
}
