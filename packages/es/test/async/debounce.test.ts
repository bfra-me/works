import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {debounce} from '../../src/async'

describe('@bfra.me/es/async - debounce()', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('basic functionality', () => {
    it('should delay function execution', () => {
      const fn = vi.fn()
      const debounced = debounce(fn, 100)

      debounced()
      expect(fn).not.toHaveBeenCalled()

      vi.advanceTimersByTime(50)
      expect(fn).not.toHaveBeenCalled()

      vi.advanceTimersByTime(50)
      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('should only call function once after multiple rapid calls', () => {
      const fn = vi.fn()
      const debounced = debounce(fn, 100)

      debounced()
      debounced()
      debounced()
      debounced()
      debounced()

      vi.advanceTimersByTime(100)
      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('should reset timer on each call', () => {
      const fn = vi.fn()
      const debounced = debounce(fn, 100)

      debounced()
      vi.advanceTimersByTime(50)
      expect(fn).not.toHaveBeenCalled()

      debounced() // Reset timer
      vi.advanceTimersByTime(50)
      expect(fn).not.toHaveBeenCalled()

      vi.advanceTimersByTime(50)
      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('should pass arguments to the debounced function', () => {
      const fn = vi.fn()
      const debounced = debounce(fn, 100)

      debounced('arg1', 'arg2')
      vi.advanceTimersByTime(100)

      expect(fn).toHaveBeenCalledWith('arg1', 'arg2')
    })

    it('should use latest arguments when called multiple times', () => {
      const fn = vi.fn()
      const debounced = debounce(fn, 100)

      debounced('first')
      debounced('second')
      debounced('third')

      vi.advanceTimersByTime(100)

      expect(fn).toHaveBeenCalledTimes(1)
      expect(fn).toHaveBeenCalledWith('third')
    })
  })

  describe('cancel functionality', () => {
    it('should provide cancel method', () => {
      const fn = vi.fn()
      const debounced = debounce(fn, 100)

      expect(debounced.cancel).toBeTypeOf('function')
    })

    it('should cancel pending execution', () => {
      const fn = vi.fn()
      const debounced = debounce(fn, 100)

      debounced()
      vi.advanceTimersByTime(50)
      debounced.cancel()
      vi.advanceTimersByTime(100)

      expect(fn).not.toHaveBeenCalled()
    })

    it('should be safe to call cancel when no pending execution', () => {
      const fn = vi.fn()
      const debounced = debounce(fn, 100)

      expect(() => debounced.cancel()).not.toThrow()
    })

    it('should allow new calls after cancel', () => {
      const fn = vi.fn()
      const debounced = debounce(fn, 100)

      debounced()
      debounced.cancel()
      debounced()

      vi.advanceTimersByTime(100)
      expect(fn).toHaveBeenCalledTimes(1)
    })
  })

  describe('separate debounce instances', () => {
    it('should maintain separate timers for different instances', () => {
      const fn1 = vi.fn()
      const fn2 = vi.fn()
      const debounced1 = debounce(fn1, 100)
      const debounced2 = debounce(fn2, 50)

      debounced1()
      debounced2()

      vi.advanceTimersByTime(50)
      expect(fn1).not.toHaveBeenCalled()
      expect(fn2).toHaveBeenCalledTimes(1)

      vi.advanceTimersByTime(50)
      expect(fn1).toHaveBeenCalledTimes(1)
    })
  })
})
