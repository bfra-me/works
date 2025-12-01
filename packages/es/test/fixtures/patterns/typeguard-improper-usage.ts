/**
 * Improper type guard usage patterns - demonstrates anti-patterns to detect and avoid.
 * This file contains intentional anti-patterns for testing detection logic.
 *
 * WARNING: Do NOT copy these patterns - they demonstrate what NOT to do.
 */

/**
 * ANTI-PATTERN 1: Using type assertions instead of type guards
 * Type assertions bypass runtime checks and can cause runtime errors.
 */
export function processApiResponseBad(data: unknown): string {
  // WRONG: Asserting type without validation
  const response = data as {name: string}
  return response.name // Will throw if data doesn't have 'name' property
}

/**
 * ANTI-PATTERN 2: Using 'any' to bypass type checking
 * 'any' defeats the purpose of TypeScript's type safety.
 */
export function processWithAny(data: unknown): string {
  // WRONG: Casting to 'any' bypasses all type checking
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const unsafeData = data as any
  return unsafeData.name.toUpperCase() // No type safety
}

/**
 * ANTI-PATTERN 3: Non-exhaustive type checking
 * Missing cases in union type handling.
 */
type Status = 'pending' | 'active' | 'completed' | 'cancelled'

export function handleStatusBad(status: Status): string {
  if (status === 'pending') return 'Waiting'
  if (status === 'active') return 'In Progress'
  // WRONG: Missing 'cancelled' case - not exhaustive
  return 'Done'
}

/**
 * ANTI-PATTERN 4: Truthiness checks instead of proper guards
 * Truthiness doesn't guarantee the expected type.
 */
export function processTruthyBad(value: unknown): number {
  if (value) {
    // WRONG: Truthy doesn't mean it's a number
    return (value as number) * 2
  }
  return 0
}

/**
 * ANTI-PATTERN 5: typeof checks that don't narrow properly
 * Some typeof checks don't provide useful narrowing.
 */
export function processObjectBad(data: unknown): object {
  if (typeof data === 'object') {
    // WRONG: typeof 'object' includes null
    return data as object // Will return null if data is null
  }
  return {}
}

/**
 * ANTI-PATTERN 6: Instanceof checks for plain objects
 * instanceof doesn't work for object literals from external sources.
 */
class User {
  constructor(
    public id: number,
    public name: string,
  ) {}
}

export function processUserBad(data: unknown): User {
  if (data instanceof User) {
    return data
  }
  // WRONG: External data won't be instance of User class
  // even if it has the same shape
  throw new Error('Invalid user')
}

/**
 * ANTI-PATTERN 7: Double assertion (assertion to unknown then to target)
 * This is a code smell indicating type system bypass.
 */
export function doubleAssertionBad(value: string): number {
  // WRONG: Double assertion bypasses type checking
  return value as unknown as number
}

/**
 * ANTI-PATTERN 8: Non-null assertion operator (!) without validation
 * The ! operator asserts non-null without runtime check.
 */
interface MaybeData {
  value?: string
}

export function processOptionalBad(data: MaybeData): string {
  // WRONG: Using ! without checking if value exists
  return data.value!.toUpperCase()
}

/**
 * ANTI-PATTERN 9: Relying on array index access without bounds checking
 * Array access can return undefined even if typed otherwise.
 */
export function getFirstItemBad(items: string[]): string {
  // WRONG: No check if array is empty
  return items[0]!.toUpperCase()
}

/**
 * ANTI-PATTERN 10: Type guards that don't properly narrow
 * A type guard must return 'value is T' to narrow types.
 */
function isStringLoose(value: unknown): boolean {
  // WRONG: Returns boolean, not 'value is string'
  // This doesn't narrow the type
  return typeof value === 'string'
}

export function processWithLooseGuard(value: unknown): string {
  if (isStringLoose(value)) {
    // WRONG: value is still 'unknown' because guard doesn't narrow
    return (value as string).toUpperCase()
  }
  return ''
}

/**
 * ANTI-PATTERN 11: Partial type checking
 * Only checking some properties when all should be validated.
 */
interface FullConfig {
  host: string
  port: number
  timeout: number
}

export function parseConfigBad(data: unknown): FullConfig {
  if (typeof data === 'object' && data !== null) {
    // WRONG: Only checking host, not port and timeout
    if ('host' in data) {
      return data as FullConfig // Unsafe - port and timeout not validated
    }
  }
  throw new Error('Invalid config')
}

/**
 * ANTI-PATTERN 12: Using 'in' operator without proper object check
 * 'in' operator should only be used after validating object type.
 */
export function checkPropertyBad(value: unknown): string {
  // WRONG: 'in' on primitives will throw
  if ('name' in (value as object)) {
    return (value as {name: string}).name
  }
  return ''
}

/**
 * ANTI-PATTERN 13: Ignoring undefined in optional chaining
 * Optional chaining returns undefined, which may not be handled.
 */
interface NestedData {
  outer?: {
    inner?: {
      value?: string
    }
  }
}

export function getNestedValueBad(data: NestedData): string {
  // WRONG: Returns undefined as string type
  return data.outer?.inner?.value as string
}

/**
 * ANTI-PATTERN 14: Type predicate that always returns true
 * A type guard must actually validate the condition.
 */
function isNumberAlwaysTrue(_value: unknown): _value is number {
  // WRONG: This always returns true regardless of actual type
  return true
}

export function processWithBadGuard(value: unknown): number {
  if (isNumberAlwaysTrue(value)) {
    // TypeScript thinks this is safe, but it's not
    return value * 2 // Will fail if value isn't actually a number
  }
  return 0
}

/**
 * ANTI-PATTERN 15: Casting array types without element validation
 * Array type assertions don't validate element types.
 */
export function sumArrayBad(data: unknown): number {
  // WRONG: Casting entire array without validating elements
  const numbers = data as number[]
  return numbers.reduce((a, b) => a + b, 0) // Fails if elements aren't numbers
}
