import {describe, expect, it} from 'vitest'

import {timeout, TimeoutError} from '../../src/async'
import {isErr, isOk, unwrap} from '../../src/result'

describe('@bfra.me/es/async - timeout()', () => {
  describe('successful operations', () => {
    it.concurrent('should return Ok result when promise resolves before timeout', async () => {
      const promise = Promise.resolve('success')

      const result = await timeout(promise, 100)

      expect(isOk(result)).toBe(true)
      expect(unwrap(result)).toBe('success')
    })

    it.concurrent('should return Ok result for slow but completing promises', async () => {
      const promise = new Promise<string>(resolve => {
        setTimeout(() => resolve('delayed success'), 20)
      })

      const result = await timeout(promise, 100)

      expect(isOk(result)).toBe(true)
      expect(unwrap(result)).toBe('delayed success')
    })
  })

  describe('timeout handling', () => {
    it.concurrent('should return Err with TimeoutError when promise exceeds timeout', async () => {
      const promise = new Promise<string>(resolve => {
        setTimeout(() => resolve('too late'), 200)
      })

      const result = await timeout(promise, 50)

      expect(isErr(result)).toBe(true)
      expect(result.success).toBe(false)
      expect(isErr(result) && result.error).toBeInstanceOf(TimeoutError)
      expect(isErr(result) && result.error.message).toBe('Operation timed out after 50ms')
    })

    it.concurrent('should not resolve the original promise after timeout', async () => {
      let resolved = false
      const promise = new Promise<string>(resolve => {
        setTimeout(() => {
          resolved = true
          resolve('too late')
        }, 100)
      })

      const result = await timeout(promise, 20)

      expect(isErr(result)).toBe(true)
      expect(resolved).toBe(false)
    })
  })

  describe('error propagation', () => {
    it.concurrent('should rethrow non-timeout errors from the promise', async () => {
      const promise = Promise.reject(new Error('original error'))

      await expect(timeout(promise, 100)).rejects.toThrow('original error')
    })

    it.concurrent('should rethrow TypeError from the promise', async () => {
      const promise = Promise.reject(new TypeError('type error'))

      await expect(timeout(promise, 100)).rejects.toThrow(TypeError)
    })
  })

  describe('timeoutError class', () => {
    it.concurrent('should have correct name property', () => {
      const error = new TimeoutError(100)

      expect(error.name).toBe('TimeoutError')
    })

    it.concurrent('should include timeout duration in message', () => {
      const error = new TimeoutError(5000)

      expect(error.message).toBe('Operation timed out after 5000ms')
    })

    it.concurrent('should be instance of Error', () => {
      const error = new TimeoutError(100)

      expect(error).toBeInstanceOf(Error)
    })
  })
})
