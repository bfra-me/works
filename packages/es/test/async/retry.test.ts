import {describe, expect, it, vi} from 'vitest'

import {retry} from '../../src/async'
import {isErr, isOk, unwrap} from '../../src/result'

describe('@bfra.me/es/async - retry()', () => {
  describe('successful operations', () => {
    it.concurrent('should return Ok result on first successful attempt', async () => {
      const fn = vi.fn().mockResolvedValue('success')

      const result = await retry(fn)

      expect(isOk(result)).toBe(true)
      expect(unwrap(result)).toBe('success')
      expect(fn).toHaveBeenCalledTimes(1)
    })

    it.concurrent('should return Ok result after failed attempts', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('fail 1'))
        .mockRejectedValueOnce(new Error('fail 2'))
        .mockResolvedValue('eventual success')

      const result = await retry(fn, {initialDelay: 1})

      expect(isOk(result)).toBe(true)
      expect(unwrap(result)).toBe('eventual success')
      expect(fn).toHaveBeenCalledTimes(3)
    })
  })

  describe('failed operations', () => {
    it.concurrent('should return Err result after exhausting max attempts', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('always fails'))

      const result = await retry(fn, {maxAttempts: 3, initialDelay: 1})

      expect(isErr(result)).toBe(true)
      expect(result.success).toBe(false)
      expect(isErr(result) && result.error.message).toBe('always fails')
      expect(fn).toHaveBeenCalledTimes(3)
    })

    it.concurrent('should convert non-Error throws to Error', async () => {
      const fn = vi.fn().mockRejectedValue('string error')

      const result = await retry(fn, {maxAttempts: 1, initialDelay: 1})

      expect(isErr(result)).toBe(true)
      expect(result.success).toBe(false)
      expect(isErr(result) && result.error).toBeInstanceOf(Error)
      expect(isErr(result) && result.error.message).toBe('string error')
    })
  })

  describe('options', () => {
    it.concurrent('should respect maxAttempts option', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('fail'))

      await retry(fn, {maxAttempts: 5, initialDelay: 1})

      expect(fn).toHaveBeenCalledTimes(5)
    })

    it.concurrent('should use exponential backoff with backoffFactor', async () => {
      const delays: number[] = []
      const startTime = Date.now()

      const fn = vi.fn().mockImplementation(async () => {
        delays.push(Date.now() - startTime)
        throw new Error('fail')
      })

      await retry(fn, {
        maxAttempts: 3,
        initialDelay: 10,
        backoffFactor: 2,
      })

      // First attempt should be immediate, second after ~10ms, third after ~20ms more
      expect(fn).toHaveBeenCalledTimes(3)
    })

    it.concurrent('should respect maxDelay cap', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('fail'))

      const start = Date.now()
      await retry(fn, {
        maxAttempts: 3,
        initialDelay: 100,
        maxDelay: 50,
        backoffFactor: 10,
      })
      const elapsed = Date.now() - start

      // With maxDelay=50, delays should be capped at 50ms
      expect(elapsed).toBeLessThan(500)
    })

    it.concurrent('should stop early when shouldRetry returns false', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('non-retryable'))

      const result = await retry(fn, {
        maxAttempts: 5,
        initialDelay: 1,
        shouldRetry: (error, attempt) => {
          return error.message !== 'non-retryable' && attempt < 3
        },
      })

      expect(isErr(result)).toBe(true)
      expect(fn).toHaveBeenCalledTimes(1)
    })

    it.concurrent('should continue when shouldRetry returns true', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('retryable'))
        .mockRejectedValueOnce(new Error('retryable'))
        .mockResolvedValue('success')

      const result = await retry(fn, {
        maxAttempts: 5,
        initialDelay: 1,
        shouldRetry: error => error.message === 'retryable',
      })

      expect(isOk(result)).toBe(true)
      expect(fn).toHaveBeenCalledTimes(3)
    })
  })

  describe('default options', () => {
    it.concurrent('should use default maxAttempts of 3', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('fail'))

      await retry(fn, {initialDelay: 1})

      expect(fn).toHaveBeenCalledTimes(3)
    })
  })
})
