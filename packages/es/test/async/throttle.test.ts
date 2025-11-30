import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {throttle} from '../../src/async'

describe('@bfra.me/es/async - throttle()', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('basic functionality', () => {
    it('should execute immediately on first call', () => {
      const fn = vi.fn()
      const throttled = throttle(fn, 100)

      throttled()

      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('should not execute again within throttle period', () => {
      const fn = vi.fn()
      const throttled = throttle(fn, 100)

      throttled()
      throttled()
      throttled()

      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('should execute again after throttle period', () => {
      const fn = vi.fn()
      const throttled = throttle(fn, 100)

      throttled()
      vi.advanceTimersByTime(100)
      throttled()

      expect(fn).toHaveBeenCalledTimes(2)
    })

    it('should pass arguments to the throttled function', () => {
      const fn = vi.fn()
      const throttled = throttle(fn, 100)

      throttled('arg1', 'arg2')

      expect(fn).toHaveBeenCalledWith('arg1', 'arg2')
    })
  })

  describe('trailing edge behavior', () => {
    it('should execute trailing call with latest arguments after throttle period', () => {
      const fn = vi.fn()
      const throttled = throttle(fn, 100)

      throttled('first')
      throttled('second')
      throttled('third')

      expect(fn).toHaveBeenCalledTimes(1)
      expect(fn).toHaveBeenLastCalledWith('first')

      vi.advanceTimersByTime(100)

      expect(fn).toHaveBeenCalledTimes(2)
      expect(fn).toHaveBeenLastCalledWith('third')
    })

    it('should not execute trailing call if no calls during throttle period', () => {
      const fn = vi.fn()
      const throttled = throttle(fn, 100)

      throttled()
      vi.advanceTimersByTime(100)

      expect(fn).toHaveBeenCalledTimes(1)
    })
  })

  describe('cancel functionality', () => {
    it('should provide cancel method', () => {
      const fn = vi.fn()
      const throttled = throttle(fn, 100)

      expect(throttled.cancel).toBeTypeOf('function')
    })

    it('should cancel pending trailing execution', () => {
      const fn = vi.fn()
      const throttled = throttle(fn, 100)

      throttled('first')
      throttled('second')
      throttled.cancel()
      vi.advanceTimersByTime(100)

      expect(fn).toHaveBeenCalledTimes(1)
      expect(fn).toHaveBeenCalledWith('first')
    })

    it('should be safe to call cancel when no pending execution', () => {
      const fn = vi.fn()
      const throttled = throttle(fn, 100)

      expect(() => throttled.cancel()).not.toThrow()
    })

    it('should allow new calls after cancel', () => {
      const fn = vi.fn()
      const throttled = throttle(fn, 100)

      throttled('first')
      throttled.cancel()
      vi.advanceTimersByTime(100)
      throttled('after cancel')

      expect(fn).toHaveBeenCalledTimes(2)
      expect(fn).toHaveBeenLastCalledWith('after cancel')
    })
  })

  describe('separate throttle instances', () => {
    it('should maintain separate state for different instances', () => {
      const fn1 = vi.fn()
      const fn2 = vi.fn()
      const throttled1 = throttle(fn1, 100)
      const throttled2 = throttle(fn2, 50)

      throttled1()
      throttled2()

      expect(fn1).toHaveBeenCalledTimes(1)
      expect(fn2).toHaveBeenCalledTimes(1)

      vi.advanceTimersByTime(50)
      throttled1()
      throttled2()

      expect(fn1).toHaveBeenCalledTimes(1)
      expect(fn2).toHaveBeenCalledTimes(2)
    })
  })
})
