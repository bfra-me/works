import {describe, expect, it, vi} from 'vitest'

import {tap} from '../../src/functional/tap'

describe('@bfra.me/es/functional - tap()', () => {
  describe('basic behavior', () => {
    it.concurrent('should call the provided function with the value', () => {
      const mockFn = vi.fn()
      const tapped = tap(mockFn)

      tapped(42)

      expect(mockFn).toHaveBeenCalledTimes(1)
      expect(mockFn).toHaveBeenCalledWith(42)
    })

    it.concurrent('should return the original value unchanged', () => {
      const mockFn = vi.fn()
      const tapped = tap(mockFn)

      const result = tapped(42)

      expect(result).toBe(42)
    })

    it.concurrent('should pass through values regardless of side effect function', () => {
      const tapped = tap(() => 'ignored return value')

      expect(tapped(42)).toBe(42)
      expect(tapped('hello')).toBe('hello')
      expect(tapped(null)).toBe(null)
    })
  })

  describe('with different value types', () => {
    it.concurrent('should work with numbers', () => {
      const values: number[] = []
      const tapped = tap((x: number) => values.push(x))

      expect(tapped(1)).toBe(1)
      expect(tapped(2)).toBe(2)
      expect(tapped(3)).toBe(3)
      expect(values).toEqual([1, 2, 3])
    })

    it.concurrent('should work with strings', () => {
      let captured = ''
      const tapped = tap((s: string) => {
        captured = s
      })

      expect(tapped('hello')).toBe('hello')
      expect(captured).toBe('hello')
    })

    it.concurrent('should work with objects', () => {
      const original = {name: 'test', value: 42}
      let capturedObj: typeof original | null = null

      const tapped = tap((obj: typeof original) => {
        capturedObj = obj
      })

      const result = tapped(original)

      expect(result).toBe(original)
      expect(capturedObj).toBe(original)
    })

    it.concurrent('should work with arrays', () => {
      const original = [1, 2, 3]
      let capturedArr: number[] | null = null

      const tapped = tap((arr: number[]) => {
        capturedArr = arr
      })

      const result = tapped(original)

      expect(result).toBe(original)
      expect(capturedArr).toBe(original)
    })

    it.concurrent('should work with null', () => {
      const mockFn = vi.fn()
      const tapped = tap(mockFn)

      const result = tapped(null)

      expect(result).toBeNull()
      expect(mockFn).toHaveBeenCalledWith(null)
    })

    it.concurrent('should work with undefined', () => {
      const mockFn = vi.fn()
      const tapped = tap(mockFn)

      const result = tapped(undefined)

      expect(result).toBeUndefined()
      expect(mockFn).toHaveBeenCalledWith(undefined)
    })
  })

  describe('side effects', () => {
    it.concurrent('should allow logging side effects', () => {
      const logs: string[] = []
      const logTap = tap((value: number) => {
        logs.push(`Value: ${value}`)
      })

      logTap(1)
      logTap(2)
      logTap(3)

      expect(logs).toEqual(['Value: 1', 'Value: 2', 'Value: 3'])
    })

    it.concurrent('should allow mutation side effects on the value', () => {
      const obj = {count: 0}
      const incrementTap = tap((o: {count: number}) => {
        o.count += 1
      })

      const result = incrementTap(obj)

      expect(result).toBe(obj)
      expect(obj.count).toBe(1)
    })

    it.concurrent('should allow external state mutation', () => {
      let counter = 0
      const countTap = tap((_value: unknown) => {
        counter += 1
      })

      countTap('a')
      countTap('b')
      countTap('c')

      expect(counter).toBe(3)
    })
  })

  describe('in pipelines', () => {
    it.concurrent('should work in array method chains', () => {
      const logs: number[] = []
      const logTap = tap((x: number) => logs.push(x))

      const result = [1, 2, 3]
        .map(x => x * 2)
        .map(logTap)
        .map(x => x + 1)

      expect(result).toEqual([3, 5, 7])
      expect(logs).toEqual([2, 4, 6])
    })

    it.concurrent('should work with reduce', () => {
      const steps: number[] = []
      const logTap = tap((x: number) => steps.push(x))

      const result = [1, 2, 3].reduce((acc, curr) => {
        const sum = acc + curr
        logTap(sum)
        return sum
      }, 0)

      expect(result).toBe(6)
      expect(steps).toEqual([1, 3, 6])
    })
  })

  describe('error handling', () => {
    it.concurrent('should propagate errors from the side effect function', () => {
      const errorTap = tap(() => {
        throw new Error('Side effect error')
      })

      expect(() => errorTap(42)).toThrow('Side effect error')
    })

    it.concurrent('should not catch errors thrown by the side effect', () => {
      const throwingTap = tap(() => {
        throw new TypeError('Type error in side effect')
      })

      expect(() => throwingTap('value')).toThrow(TypeError)
      expect(() => throwingTap('value')).toThrow('Type error in side effect')
    })
  })

  describe('reusability', () => {
    it.concurrent('should create reusable tap functions', () => {
      const values: number[] = []
      const collectTap = tap((x: number) => values.push(x))

      const doubledValues = [1, 2, 3].map(x => x * 2).map(collectTap)
      const tripledValues = [1, 2, 3].map(x => x * 3).map(collectTap)

      expect(doubledValues).toEqual([2, 4, 6])
      expect(tripledValues).toEqual([3, 6, 9])
      expect(values).toEqual([2, 4, 6, 3, 6, 9])
    })

    it.concurrent('should not share state between tap instances', () => {
      const log1: number[] = []
      const log2: number[] = []

      const tap1 = tap((x: number) => log1.push(x))
      const tap2 = tap((x: number) => log2.push(x))

      ;[1, 2].forEach(tap1)
      ;[3, 4].forEach(tap2)

      expect(log1).toEqual([1, 2])
      expect(log2).toEqual([3, 4])
    })
  })

  describe('type preservation', () => {
    it.concurrent('should preserve generic types', () => {
      interface User {
        name: string
        age: number
      }

      const users: User[] = []
      const collectUser = tap((user: User) => users.push(user))

      const user: User = {name: 'Alice', age: 30}
      const result: User = collectUser(user)

      expect(result).toBe(user)
      expect(users).toEqual([{name: 'Alice', age: 30}])
    })
  })
})
