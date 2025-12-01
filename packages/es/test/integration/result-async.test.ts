/**
 * Integration tests for Result type across async boundaries.
 * Validates TEST-029: Result type works correctly across async/await boundaries
 */

import type {Result} from '../../src/result/types'

import {describe, expect, it} from 'vitest'

import {err, ok} from '../../src/result/factories'
import {isErr, isOk} from '../../src/result/guards'
import {flatMap, fromPromise, map, unwrap, unwrapOr} from '../../src/result/operators'

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

describe('@bfra.me/es/result - async integration', () => {
  describe('result propagation across async boundaries', () => {
    it.concurrent('should maintain Ok state across multiple await points', async () => {
      const userResult: Result<{id: number; name: string}, Error> = ok({id: 1, name: 'Alice'})
      await delay(10)

      expect(isOk(userResult)).toBe(true)
      expect(isOk(userResult) && userResult.data.name).toBe('Alice')
    })

    it.concurrent('should maintain Err state across multiple await points', async () => {
      const errorResult: Result<string, string> = err('Input cannot be empty')
      await delay(10)

      expect(isErr(errorResult)).toBe(true)
      expect(isErr(errorResult) && errorResult.error).toBe('Input cannot be empty')
    })

    it.concurrent('should handle async Result chains with map', async () => {
      const initialResult = ok(10)
      await delay(10)

      const doubled = map(initialResult, n => n * 2)
      const stringified = map(doubled, n => `Value: ${n}`)

      expect(isOk(stringified)).toBe(true)
      expect(isOk(stringified) && stringified.data).toBe('Value: 20')
    })

    it.concurrent('should handle async flatMap chains', async () => {
      const parsed = ok(100)
      await delay(10)

      const divided = flatMap(parsed, n => (n > 0 ? ok(n / 5) : err('Division error')))

      expect(isOk(divided)).toBe(true)
      expect(isOk(divided) && divided.data).toBe(20)
    })
  })

  describe('fromPromise integration', () => {
    it.concurrent('should convert resolved Promise to Ok', async () => {
      const promise = delay(10).then(() => 42)
      const result = await fromPromise(promise)

      expect(isOk(result)).toBe(true)
      expect(isOk(result) && result.data).toBe(42)
    })

    it.concurrent('should convert rejected Promise to Err', async () => {
      const promise = delay(10).then(() => {
        throw new Error('Network error')
      })

      const result = await fromPromise(promise)

      expect(isErr(result)).toBe(true)
      expect(isErr(result) && result.error.message).toBe('Network error')
    })

    it.concurrent('should handle chained async operations with fromPromise', async () => {
      const fetchResult = await fromPromise(delay(10).then(() => ({value: 100})))
      expect(isOk(fetchResult)).toBe(true)

      const processResult = await fromPromise(
        delay(10).then(() => (isOk(fetchResult) ? fetchResult.data.value * 2 : 0)),
      )

      expect(isOk(processResult)).toBe(true)
      expect(isOk(processResult) && processResult.data).toBe(200)
    })

    it.concurrent('should handle Error rejection values', async () => {
      const promise = delay(10).then(() => {
        throw new Error('Simple error rejection')
      })

      const result = await fromPromise(promise)

      expect(isErr(result)).toBe(true)
      expect(isErr(result) && result.error.message).toBe('Simple error rejection')
    })
  })

  describe('concurrent Result operations', () => {
    it.concurrent('should handle parallel async operations with Results', async () => {
      const results = await Promise.all([
        delay(20).then(() => ok(10)),
        delay(30).then(() => ok(20)),
        delay(10).then(() => ok(30)),
      ])

      const allOk = results.every(r => isOk(r))
      expect(allOk).toBe(true)

      const sum = results.reduce((acc, r) => acc + (isOk(r) ? r.data : 0), 0)
      expect(sum).toBe(60)
    })

    it.concurrent('should short-circuit on first error in sequential chain', async () => {
      const callOrder: string[] = []

      const step1 = async (): Promise<Result<number, string>> => {
        callOrder.push('step1')
        await delay(10)
        return ok(1)
      }

      const step2 = async (): Promise<Result<number, string>> => {
        callOrder.push('step2')
        await delay(10)
        return err('Error in step 2')
      }

      const step3 = async (): Promise<Result<number, string>> => {
        callOrder.push('step3')
        await delay(10)
        return ok(3)
      }

      let current = await step1()

      if (isOk(current)) {
        current = await step2()
      }

      if (isOk(current)) {
        current = await step3()
      }

      expect(callOrder).toEqual(['step1', 'step2'])
      expect(isErr(current)).toBe(true)
    })
  })

  describe('unwrap and unwrapOr with async operations', () => {
    it.concurrent('should safely unwrap Ok results from async operations', async () => {
      const result = await delay(10).then(() => ok('async data'))
      const value = unwrap(result)
      expect(value).toBe('async data')
    })

    it.concurrent('should provide default value for Err results with unwrapOr', async () => {
      const result = await delay(10).then(() => err('Operation failed') as Result<string, string>)
      const value = unwrapOr(result, 'default value')
      expect(value).toBe('default value')
    })

    it.concurrent('should throw with custom message when unwrapping Err', async () => {
      const result = await delay(10).then(
        () => err('Database connection failed') as Result<number, string>,
      )
      expect(() => unwrap(result, 'Critical error occurred')).toThrow('Critical error occurred')
    })
  })

  describe('real-world async patterns', () => {
    it.concurrent('should handle API request simulation with retry logic', async () => {
      let attempts = 0

      const simulateApiCall = async (attempt: number): Promise<{status: string}> => {
        await delay(10)
        if (attempt < 2) {
          throw new Error(`Attempt ${attempt} failed`)
        }
        return {status: 'success'}
      }

      const fetchWithRetry = async (maxRetries = 3): Promise<Result<{status: string}, Error>> => {
        for (let i = 0; i < maxRetries; i++) {
          attempts++
          const result = await fromPromise(simulateApiCall(i))
          if (isOk(result)) {
            return result
          }
        }
        return err(new Error(`Failed after ${maxRetries} attempts`))
      }

      const result = await fetchWithRetry()
      expect(isOk(result)).toBe(true)
      expect(attempts).toBe(3)
      expect(isOk(result) && result.data.status).toBe('success')
    })

    it.concurrent('should handle cascading async transformations', async () => {
      interface User {
        id: number
        name: string
      }

      const userResult = await delay(10).then(() => ok<User>({id: 1, name: 'Test User'}))
      expect(isOk(userResult)).toBe(true)

      const enrichedResult = map(userResult, user => ({
        ...user,
        profile: {bio: 'A test user biography'},
      }))
      expect(isOk(enrichedResult)).toBe(true)

      const formattedResult = map(enrichedResult, user => ({
        displayName: `@${user.name.toLowerCase().replaceAll(' ', '_')}`,
        bio: user.profile.bio,
      }))

      expect(isOk(formattedResult)).toBe(true)
      expect(isOk(formattedResult) && formattedResult.data.displayName).toBe('@test_user')
      expect(isOk(formattedResult) && formattedResult.data.bio).toBe('A test user biography')
    })

    it.concurrent('should handle parallel data fetching with error aggregation', async () => {
      const fetchResource = async (
        id: number,
        shouldFail: boolean,
      ): Promise<Result<{id: number; data: string}, {id: number; reason: string}>> => {
        await delay(10)
        if (shouldFail) {
          return err({id, reason: `Resource ${id} not found`})
        }
        return ok({id, data: `Data for resource ${id}`})
      }

      const results = await Promise.all([
        fetchResource(1, false),
        fetchResource(2, true),
        fetchResource(3, false),
        fetchResource(4, true),
      ])

      const successes = results.filter(isOk)
      const failures = results.filter(isErr)

      expect(successes).toHaveLength(2)
      expect(failures).toHaveLength(2)

      const successIds = successes.map(r => r.data.id)
      expect(successIds).toEqual([1, 3])

      const failureIds = failures.map(r => r.error.id)
      expect(failureIds).toEqual([2, 4])
    })
  })

  describe('async generator with Result', () => {
    it.concurrent('should work with async iterators yielding Results', async () => {
      const generateResults = async function* (): AsyncGenerator<Result<number, string>> {
        for (let i = 1; i <= 5; i++) {
          await delay(5)
          if (i === 3) {
            yield err('Error at item 3')
          } else {
            yield ok(i * 10)
          }
        }
      }

      const results: Result<number, string>[] = []
      for await (const result of generateResults()) {
        results.push(result)
      }

      expect(results).toHaveLength(5)

      const okValues = results.filter(isOk).map(r => r.data)
      expect(okValues).toEqual([10, 20, 40, 50])

      const errValues = results.filter(isErr).map(r => r.error)
      expect(errValues).toEqual(['Error at item 3'])
    })
  })
})
