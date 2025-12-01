/**
 * Proper functional composition patterns - demonstrates correct usage of pipe/compose.
 * This file serves as a reference for detecting anti-patterns by comparison.
 */

import {compose, constant, curry, identity, pipe, tap} from '../../../src/functional'

/**
 * PATTERN 1: Pure functions in pipe/compose
 * All functions in a pipeline should be pure (no side effects).
 */
export const processNumber = pipe(
  (x: number) => x + 1,
  (x: number) => x * 2,
  (x: number) => x.toString(),
)

/**
 * PATTERN 2: Type transformations through pipeline
 * Each function receives output of previous and returns new value.
 */
interface User {
  id: number
  name: string
  email: string
}

interface UserDTO {
  userId: number
  displayName: string
  contactEmail: string
}

export const toUserDTO = pipe(
  (user: User) => ({
    ...user,
    displayName: user.name.toUpperCase(),
  }),
  (user: User & {displayName: string}): UserDTO => ({
    userId: user.id,
    displayName: user.displayName,
    contactEmail: user.email,
  }),
)

/**
 * PATTERN 3: Use compose for right-to-left composition
 * Compose is useful when thinking mathematically (f ∘ g means "f after g").
 */
export const formatPrice = compose(
  (s: string) => `$${s}`,
  (n: number) => n.toFixed(2),
)

/**
 * PATTERN 4: Curried functions in pipelines
 * Curry allows partial application for pipeline compatibility.
 */
const multiply = curry((a: number, b: number) => a * b)
const add = curry((a: number, b: number) => a + b)

export const calculateTotal = pipe(add(10), multiply(2), (x: number) => x - 5)

/**
 * PATTERN 5: Identity function for conditional pipelines
 * Use identity as a pass-through when no transformation needed.
 */
export function conditionalProcess(value: number, shouldDouble: boolean): number {
  const processor = pipe((x: number) => x + 1, shouldDouble ? (x: number) => x * 2 : identity)

  return processor(value)
}

/**
 * PATTERN 6: Use tap for debugging without breaking the chain
 * Tap allows side effects (like logging) while maintaining data flow.
 */
const debugPipeline = pipe(
  (x: number) => x + 1,
  tap((x: number) => console.log('After add:', x)),
  (x: number) => x * 2,
  tap((x: number) => console.log('After multiply:', x)),
)

export {debugPipeline}

/**
 * PATTERN 7: Constant function for default values
 * Use constant for functions that always return the same value.
 */
export const getDefaultValue = constant(42)
export const getEmptyArray = constant<string[]>([])

/**
 * PATTERN 8: Composing with Result-returning functions
 * Handle errors at pipeline boundaries, not inside.
 */
import {isErr, map, ok} from '../../../src/result'
import type {Result} from '../../../src/result'

function parseNumber(s: string): Result<number, string> {
  const n = parseInt(s, 10)
  return isNaN(n) ? {success: false, error: 'Not a number'} : ok(n)
}

function validatePositive(n: number): Result<number, string> {
  return n > 0 ? ok(n) : {success: false, error: 'Must be positive'}
}

export function processStringToNumber(input: string): Result<number, string> {
  const parsed = parseNumber(input)
  if (isErr(parsed)) return parsed

  const validated = validatePositive(parsed.data)
  if (isErr(validated)) return validated

  return map(validated, x => x * 2)
}

/**
 * PATTERN 9: Small, focused functions for composition
 * Each function should do one thing well.
 */
const trim = (s: string) => s.trim()
const toLowerCase = (s: string) => s.toLowerCase()
const removeSpaces = (s: string) => s.replace(/\s+/g, '-')
const addPrefix = (prefix: string) => (s: string) => `${prefix}${s}`

export const createSlug = pipe(trim, toLowerCase, removeSpaces, addPrefix('/'))

/**
 * PATTERN 10: Maintaining immutability in pipelines
 * Never mutate input - always return new values.
 */
interface State {
  count: number
  items: string[]
}

const incrementCount = (state: State): State => ({
  ...state,
  count: state.count + 1,
})

const addItem = (item: string) => (state: State): State => ({
  ...state,
  items: [...state.items, item],
})

export const updateState = (item: string) => pipe(incrementCount, addItem(item))
