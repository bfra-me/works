/**
 * Testing utilities package for synthetic monorepo.
 * Provides helpers for testing Result-based code.
 */

import type {Result} from '@bfra.me/es/result'
import {isErr, isOk} from '@bfra.me/es/result'

/** Asserts that a Result is successful and returns the data */
export function expectOk<T, E>(result: Result<T, E>): T {
  if (!isOk(result)) {
    throw new Error(`Expected Ok but got Err: ${JSON.stringify(result.error)}`)
  }
  return result.data
}

/** Asserts that a Result is an error and returns the error */
export function expectErr<T, E>(result: Result<T, E>): E {
  if (!isErr(result)) {
    throw new Error(`Expected Err but got Ok: ${JSON.stringify(result.data)}`)
  }
  return result.error
}

/** Asserts that a Result matches a specific success value */
export function expectOkValue<T, E>(result: Result<T, E>, expected: T): void {
  const data = expectOk(result)
  if (JSON.stringify(data) !== JSON.stringify(expected)) {
    throw new Error(`Expected ${JSON.stringify(expected)} but got ${JSON.stringify(data)}`)
  }
}

/** Asserts that a Result matches a specific error code */
export function expectErrCode<T, E extends {code: string}>(
  result: Result<T, E>,
  expectedCode: string,
): void {
  const error = expectErr(result)
  if (error.code !== expectedCode) {
    throw new Error(`Expected error code "${expectedCode}" but got "${error.code}"`)
  }
}

/** Creates a mock function that returns a Result */
export function createMockResultFn<T, E>(result: Result<T, E>): () => Result<T, E> {
  return () => result
}

/** Creates a mock async function that returns a Result */
export function createMockAsyncResultFn<T, E>(
  result: Result<T, E>,
  delayMs = 0,
): () => Promise<Result<T, E>> {
  return async () => {
    if (delayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, delayMs))
    }
    return result
  }
}

/** Test fixture helpers */
export interface TestFixture<T> {
  name: string
  input: T
  setup?: () => void | Promise<void>
  teardown?: () => void | Promise<void>
}

/** Creates a parameterized test runner */
export function createParameterizedTest<T>(fixtures: TestFixture<T>[]) {
  return {
    run(testFn: (fixture: TestFixture<T>) => void | Promise<void>): void {
      for (const fixture of fixtures) {
        testFn(fixture)
      }
    },
  }
}
