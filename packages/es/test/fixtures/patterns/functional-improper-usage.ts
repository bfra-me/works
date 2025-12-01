/**
 * Improper functional composition patterns - demonstrates anti-patterns to detect and avoid.
 * This file contains intentional anti-patterns for testing detection logic.
 *
 * WARNING: Do NOT copy these patterns - they demonstrate what NOT to do.
 */

import {compose, pipe} from '../../../src/functional'

/**
 * ANTI-PATTERN 1: Side effects in pipeline functions
 * Functions in pipe/compose should be pure - no external state modification.
 */
let globalCounter = 0

export const pipeWithSideEffect = pipe(
  (x: number) => {
    globalCounter++ // WRONG: Modifying external state
    return x + 1
  },
  (x: number) => x * 2,
)

export {globalCounter}

/**
 * ANTI-PATTERN 2: Mutating the input argument
 * Never mutate the input - always return a new value.
 */
interface MutableState {
  count: number
  items: string[]
}

export const mutatingPipeline = pipe(
  (state: MutableState) => {
    state.count++ // WRONG: Mutating input
    return state
  },
  (state: MutableState) => {
    state.items.push('new item') // WRONG: Mutating input array
    return state
  },
)

/**
 * ANTI-PATTERN 3: Throwing inside pipeline functions
 * Pipeline functions should be total (handle all inputs).
 */
export const throwingPipeline = pipe(
  (x: number) => {
    if (x < 0) {
      throw new Error('Negative numbers not allowed') // WRONG: Should use Result
    }
    return x + 1
  },
  (x: number) => x * 2,
)

/**
 * ANTI-PATTERN 4: Async functions in sync pipelines
 * Mixing async and sync creates confusion and potential bugs.
 */
export const mixedAsyncPipeline = pipe(
  (x: number) => x + 1,
  async (x: number) => {
    await Promise.resolve()
    return x * 2 // WRONG: Async in sync pipeline - returns Promise, not number
  },
)

/**
 * ANTI-PATTERN 5: I/O operations inside pipelines
 * I/O should be at boundaries, not inside pure transformations.
 */
export const ioInPipeline = pipe(
  (filename: string) => filename.toUpperCase(),
  (filename: string) => {
    console.log(`Processing: ${filename}`) // WRONG: I/O side effect (console.log without tap)
    return filename
  },
  (filename: string) => `processed_${filename}`,
)

/**
 * ANTI-PATTERN 6: Depending on execution order for state
 * Each function should be independent.
 */
const sharedState = {value: 0}

export const orderDependentPipeline = pipe(
  (x: number) => {
    sharedState.value = x // WRONG: Setting shared state
    return x + 1
  },
  (x: number) => {
    return x + sharedState.value // WRONG: Reading shared state set by previous function
  },
)

export {sharedState}

/**
 * ANTI-PATTERN 7: Non-deterministic functions in pipelines
 * Pure functions should always return the same output for the same input.
 */
export const nonDeterministicPipeline = pipe(
  (x: number) => x + Math.random(), // WRONG: Non-deterministic
  (x: number) => x * 2,
)

/**
 * ANTI-PATTERN 8: Direct external system manipulation in pipelines
 * Side effects to external systems should be at boundaries.
 */
export const externalManipulationPipeline = pipe(
  (text: string) => text.toUpperCase(),
  (text: string) => {
    // WRONG: External system manipulation inside pipeline
    // Example: modifying environment, file system, or other external state
    process.env.LAST_PROCESSED = text
    return text
  },
)

/**
 * ANTI-PATTERN 9: Using closures that capture mutable state
 * Closures should only capture immutable values.
 */
function createBadPipeline() {
  let cache: number | null = null

  return pipe(
    (x: number) => {
      if (cache !== null) {
        return cache // WRONG: Returning cached value, not processing input
      }
      return x + 1
    },
    (x: number) => {
      cache = x // WRONG: Caching in mutable closure
      return x * 2
    },
  )
}

export const badCachingPipeline = createBadPipeline()

/**
 * ANTI-PATTERN 10: Breaking the pipeline with early returns
 * All paths should return a value of the expected type.
 */
export const earlyReturnPipeline = pipe(
  (x: number) => {
    if (x === 0) {
      return 0 // This is fine, but the next function might expect non-zero
    }
    return x + 1
  },
  (x: number) => {
    // This might fail or give unexpected results if x is 0
    return 10 / x // WRONG: Division by zero possible due to early return above
  },
)

/**
 * ANTI-PATTERN 11: Overly long pipelines without decomposition
 * Long pipelines should be broken into named, composable units.
 */
export const tooLongPipeline = pipe(
  (x: number) => x + 1,
  (x: number) => x * 2,
  (x: number) => x - 3,
  (x: number) => x / 4,
  (x: number) => x + 5,
  (x: number) => x * 6,
  (x: number) => x - 7,
  (x: number) => x / 8,
  (x: number) => x + 9,
  (x: number) => x * 10,
)

/**
 * ANTI-PATTERN 12: Using compose/pipe for single function
 * Unnecessary wrapping adds complexity without benefit.
 */
export const unnecessaryPipe = pipe((x: number) => x + 1) // WRONG: Just use the function directly

/**
 * ANTI-PATTERN 13: Tight coupling to external services
 * External service calls should be dependency-injected or at boundaries.
 */
export const externalServicePipeline = pipe(
  (userId: string) => userId.trim(),
  async (userId: string) => {
    // WRONG: Direct HTTP call inside pipeline
    const response = await fetch(`https://api.example.com/users/${userId}`)
    return response.json()
  },
)

/**
 * ANTI-PATTERN 14: Type assertions to bypass type safety
 * If types don't align, fix the functions, don't assert.
 */
export const typeAssertionPipeline = pipe(
  (x: unknown) => x as number, // WRONG: Unsafe type assertion
  (x: number) => x * 2,
)

/**
 * ANTI-PATTERN 15: Compose/pipe that doesn't compose well
 * Functions should have compatible signatures for composition.
 */
const badlyDesigned1 = (x: number): {result: number} => ({result: x + 1})
const badlyDesigned2 = (x: number): number => x * 2 // Expects number, not object

export const incompatiblePipeline = compose(
  badlyDesigned2,
  // @ts-expect-error - Intentionally showing type mismatch anti-pattern
  badlyDesigned1,
)
