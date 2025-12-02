import {describe, expect, it} from 'vitest'

import {compose} from '../../src/functional/compose'

describe('@bfra.me/es/functional - compose()', () => {
  describe('basic composition', () => {
    it.concurrent('should compose a single function', () => {
      const addOne = (x: number) => x + 1
      const fn = compose(addOne)

      expect(fn(5)).toBe(6)
    })

    it.concurrent('should compose two functions right-to-left', () => {
      const addOne = (x: number) => x + 1
      const double = (x: number) => x * 2

      const fn = compose(double, addOne)

      expect(fn(5)).toBe(12)
    })

    it.concurrent('should compose three functions right-to-left', () => {
      const addOne = (x: number) => x + 1
      const double = (x: number) => x * 2
      const square = (x: number) => x * x

      const fn = compose(square, double, addOne)

      expect(fn(5)).toBe(144)
    })

    it.concurrent('should compose ten functions', () => {
      const addOne = (x: number) => x + 1

      const fn = compose(
        addOne,
        addOne,
        addOne,
        addOne,
        addOne,
        addOne,
        addOne,
        addOne,
        addOne,
        addOne,
      )

      expect(fn(0)).toBe(10)
    })
  })

  describe('type transformations', () => {
    it.concurrent('should handle type transformation through composition', () => {
      const numToString = (x: number) => x.toString()
      const addPrefix = (s: string) => `Value: ${s}`
      const getLength = (s: string) => s.length

      const fn = compose(getLength, addPrefix, numToString)

      expect(fn(42)).toBe(9)
    })

    it.concurrent('should handle object transformations', () => {
      interface User {
        name: string
        age: number
      }

      const createUser = (name: string): User => ({name, age: 0})
      const setAge = (user: User): User => ({...user, age: 25})
      const getUserInfo = (user: User): string => `${user.name} is ${user.age} years old`

      const fn = compose(getUserInfo, setAge, createUser)

      expect(fn('Alice')).toBe('Alice is 25 years old')
    })

    it.concurrent('should handle array transformations', () => {
      const toArray = (x: number) => [x]
      const doubleAll = (arr: number[]) => arr.map(x => x * 2)
      const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0)

      const fn = compose(sum, doubleAll, toArray)

      expect(fn(5)).toBe(10)
    })
  })

  describe('edge cases', () => {
    it.concurrent('should handle null values in composition', () => {
      const maybeNull = (x: number): number | null => (x > 0 ? x : null)
      const handleNull = (x: number | null): string => (x === null ? 'null' : x.toString())

      const fn = compose(handleNull, maybeNull)

      expect(fn(5)).toBe('5')
      expect(fn(-1)).toBe('null')
    })

    it.concurrent('should handle undefined values in composition', () => {
      const maybeUndefined = (x: number): number | undefined => (x > 0 ? x : undefined)
      const handleUndefined = (x: number | undefined): string =>
        x === undefined ? 'undefined' : x.toString()

      const fn = compose(handleUndefined, maybeUndefined)

      expect(fn(5)).toBe('5')
      expect(fn(-1)).toBe('undefined')
    })

    it.concurrent('should handle empty arrays', () => {
      const toEmpty = (_x: number) => [] as number[]
      const length = (arr: number[]) => arr.length

      const fn = compose(length, toEmpty)

      expect(fn(5)).toBe(0)
    })
  })

  describe('composition order', () => {
    it.concurrent('should execute functions in right-to-left order', () => {
      const executionOrder: number[] = []

      const first = (x: number) => {
        executionOrder.push(1)
        return x + 1
      }
      const second = (x: number) => {
        executionOrder.push(2)
        return x * 2
      }
      const third = (x: number) => {
        executionOrder.push(3)
        return x - 1
      }

      const fn = compose(third, second, first)
      fn(5)

      expect(executionOrder).toEqual([1, 2, 3])
    })

    it.concurrent('should pass result from one function to next in reverse order', () => {
      const results: number[] = []

      const captureAndAdd = (x: number) => {
        results.push(x)
        return x + 10
      }

      const fn = compose(captureAndAdd, captureAndAdd, captureAndAdd)
      const result = fn(0)

      expect(results).toEqual([0, 10, 20])
      expect(result).toBe(30)
    })
  })

  describe('compose vs pipe equivalence', () => {
    it.concurrent('should produce same result as reversed pipe', () => {
      const addOne = (x: number) => x + 1
      const double = (x: number) => x * 2
      const square = (x: number) => x * x

      const composed = compose(square, double, addOne)

      expect(composed(5)).toBe(144)
    })
  })

  describe('with complex types', () => {
    it.concurrent('should work with Promise-returning functions', async () => {
      const asyncDouble = async (x: number) => x * 2
      const asyncAddOne = async (p: Promise<number>) => (await p) + 1

      const fn = compose(asyncAddOne, asyncDouble)
      const result = await fn(5)

      expect(result).toBe(11)
    })

    it.concurrent('should work with generics', () => {
      const wrap = <T>(value: T) => ({value})
      const extractValue = <T>(wrapped: {value: T}) => wrapped.value

      const fn = compose(extractValue<number>, wrap<number>)

      expect(fn(42)).toBe(42)
    })
  })
})
