import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {createDebouncer} from '../../src/watcher/debouncer'

describe('@bfra.me/es/watcher - createDebouncer()', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('basic functionality', () => {
    it('should call the handler with batched items after delay', () => {
      const handler = vi.fn()
      const debouncer = createDebouncer<string>(handler, 100)

      debouncer.add('item1')
      expect(handler).not.toHaveBeenCalled()

      vi.advanceTimersByTime(100)
      expect(handler).toHaveBeenCalledTimes(1)
      expect(handler).toHaveBeenCalledWith(['item1'])
    })

    it('should batch multiple items added before delay', () => {
      const handler = vi.fn()
      const debouncer = createDebouncer<string>(handler, 100)

      debouncer.add('item1')
      debouncer.add('item2')
      debouncer.add('item3')

      vi.advanceTimersByTime(100)
      expect(handler).toHaveBeenCalledTimes(1)
      expect(handler).toHaveBeenCalledWith(['item1', 'item2', 'item3'])
    })

    it('should reset timer on each add', () => {
      const handler = vi.fn()
      const debouncer = createDebouncer<string>(handler, 100)

      debouncer.add('item1')
      vi.advanceTimersByTime(50)
      expect(handler).not.toHaveBeenCalled()

      debouncer.add('item2')
      vi.advanceTimersByTime(50)
      expect(handler).not.toHaveBeenCalled()

      vi.advanceTimersByTime(50)
      expect(handler).toHaveBeenCalledTimes(1)
      expect(handler).toHaveBeenCalledWith(['item1', 'item2'])
    })

    it('should work with different item types', () => {
      const handler = vi.fn()
      const debouncer = createDebouncer<{path: string; type: string}>(handler, 100)

      debouncer.add({path: '/a.ts', type: 'add'})
      debouncer.add({path: '/b.ts', type: 'change'})

      vi.advanceTimersByTime(100)
      expect(handler).toHaveBeenCalledWith([
        {path: '/a.ts', type: 'add'},
        {path: '/b.ts', type: 'change'},
      ])
    })

    it('should handle number items', () => {
      const handler = vi.fn()
      const debouncer = createDebouncer<number>(handler, 50)

      debouncer.add(1)
      debouncer.add(2)
      debouncer.add(3)

      vi.advanceTimersByTime(50)
      expect(handler).toHaveBeenCalledWith([1, 2, 3])
    })
  })

  describe('flush()', () => {
    it('should emit all pending items immediately', () => {
      const handler = vi.fn()
      const debouncer = createDebouncer<string>(handler, 100)

      debouncer.add('item1')
      debouncer.add('item2')
      expect(handler).not.toHaveBeenCalled()

      debouncer.flush()
      expect(handler).toHaveBeenCalledTimes(1)
      expect(handler).toHaveBeenCalledWith(['item1', 'item2'])
    })

    it('should not emit if no pending items', () => {
      const handler = vi.fn()
      const debouncer = createDebouncer<string>(handler, 100)

      debouncer.flush()
      expect(handler).not.toHaveBeenCalled()
    })

    it('should clear pending timeout after flush', () => {
      const handler = vi.fn()
      const debouncer = createDebouncer<string>(handler, 100)

      debouncer.add('item1')
      debouncer.flush()
      expect(handler).toHaveBeenCalledTimes(1)

      vi.advanceTimersByTime(100)
      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('should allow new items after flush', () => {
      const handler = vi.fn()
      const debouncer = createDebouncer<string>(handler, 100)

      debouncer.add('item1')
      debouncer.flush()
      expect(handler).toHaveBeenCalledWith(['item1'])

      debouncer.add('item2')
      vi.advanceTimersByTime(100)
      expect(handler).toHaveBeenCalledTimes(2)
      expect(handler).toHaveBeenLastCalledWith(['item2'])
    })
  })

  describe('cancel()', () => {
    it('should cancel pending emission without calling handler', () => {
      const handler = vi.fn()
      const debouncer = createDebouncer<string>(handler, 100)

      debouncer.add('item1')
      debouncer.add('item2')
      debouncer.cancel()

      vi.advanceTimersByTime(100)
      expect(handler).not.toHaveBeenCalled()
    })

    it('should clear all pending items', () => {
      const handler = vi.fn()
      const debouncer = createDebouncer<string>(handler, 100)

      debouncer.add('item1')
      debouncer.cancel()

      debouncer.flush()
      expect(handler).not.toHaveBeenCalled()
    })

    it('should allow new items after cancel', () => {
      const handler = vi.fn()
      const debouncer = createDebouncer<string>(handler, 100)

      debouncer.add('item1')
      debouncer.cancel()

      debouncer.add('item2')
      vi.advanceTimersByTime(100)
      expect(handler).toHaveBeenCalledTimes(1)
      expect(handler).toHaveBeenCalledWith(['item2'])
    })

    it('should handle cancel when no pending items', () => {
      const handler = vi.fn()
      const debouncer = createDebouncer<string>(handler, 100)

      expect(() => debouncer.cancel()).not.toThrow()
    })
  })

  describe('timing edge cases', () => {
    it('should work with very short delay', () => {
      const handler = vi.fn()
      const debouncer = createDebouncer<string>(handler, 1)

      debouncer.add('item1')
      vi.advanceTimersByTime(1)
      expect(handler).toHaveBeenCalledWith(['item1'])
    })

    it('should work with zero delay', () => {
      const handler = vi.fn()
      const debouncer = createDebouncer<string>(handler, 0)

      debouncer.add('item1')
      vi.advanceTimersByTime(0)
      expect(handler).toHaveBeenCalledWith(['item1'])
    })

    it('should handle many items in rapid succession', () => {
      const handler = vi.fn()
      const debouncer = createDebouncer<number>(handler, 100)

      for (let i = 0; i < 1000; i++) {
        debouncer.add(i)
      }

      vi.advanceTimersByTime(100)
      expect(handler).toHaveBeenCalledTimes(1)
      expect(handler.mock.calls[0]?.[0]).toHaveLength(1000)
    })

    it('should separate batches after delay passes', () => {
      const handler = vi.fn()
      const debouncer = createDebouncer<string>(handler, 100)

      debouncer.add('batch1-item1')
      debouncer.add('batch1-item2')
      vi.advanceTimersByTime(100)

      debouncer.add('batch2-item1')
      vi.advanceTimersByTime(100)

      expect(handler).toHaveBeenCalledTimes(2)
      expect(handler).toHaveBeenNthCalledWith(1, ['batch1-item1', 'batch1-item2'])
      expect(handler).toHaveBeenNthCalledWith(2, ['batch2-item1'])
    })
  })

  describe('return type interface', () => {
    it('should return object with add, flush, cancel methods', () => {
      const handler = vi.fn()
      const debouncer = createDebouncer<string>(handler, 100)

      expect(debouncer.add).toBeTypeOf('function')
      expect(debouncer.flush).toBeTypeOf('function')
      expect(debouncer.cancel).toBeTypeOf('function')
    })
  })
})
