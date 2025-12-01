import {describe, expect, it} from 'vitest'

import {constant} from '../../src/functional/constant'

describe('@bfra.me/es/functional - constant()', () => {
  describe('with primitive values', () => {
    it.concurrent('should always return the same number', () => {
      const always42 = constant(42)

      expect(always42()).toBe(42)
      expect(always42()).toBe(42)
      expect(always42()).toBe(42)
    })

    it.concurrent('should work with zero', () => {
      const alwaysZero = constant(0)

      expect(alwaysZero()).toBe(0)
    })

    it.concurrent('should work with negative numbers', () => {
      const alwaysNegative = constant(-1)

      expect(alwaysNegative()).toBe(-1)
    })

    it.concurrent('should work with floating point numbers', () => {
      const alwaysPi = constant(3.14159)

      expect(alwaysPi()).toBe(3.14159)
    })

    it.concurrent('should always return the same string', () => {
      const alwaysHello = constant('hello')

      expect(alwaysHello()).toBe('hello')
      expect(alwaysHello()).toBe('hello')
    })

    it.concurrent('should work with empty string', () => {
      const alwaysEmpty = constant('')

      expect(alwaysEmpty()).toBe('')
    })

    it.concurrent('should always return the same boolean', () => {
      const alwaysTrue = constant(true)
      const alwaysFalse = constant(false)

      expect(alwaysTrue()).toBe(true)
      expect(alwaysFalse()).toBe(false)
    })

    it.concurrent('should work with null', () => {
      const alwaysNull = constant(null)

      expect(alwaysNull()).toBeNull()
    })

    it.concurrent('should work with undefined', () => {
      const alwaysUndefined = constant(undefined)

      expect(alwaysUndefined()).toBeUndefined()
    })

    it.concurrent('should work with symbols', () => {
      const sym = Symbol('test')
      const alwaysSym = constant(sym)

      expect(alwaysSym()).toBe(sym)
    })

    it.concurrent('should work with bigint', () => {
      const bigValue = BigInt(9007199254740991)
      const alwaysBig = constant(bigValue)

      expect(alwaysBig()).toBe(bigValue)
    })
  })

  describe('with reference types', () => {
    it.concurrent('should always return the same object reference', () => {
      const obj = {name: 'test', value: 42}
      const alwaysObj = constant(obj)

      const result1 = alwaysObj()
      const result2 = alwaysObj()

      expect(result1).toBe(obj)
      expect(result2).toBe(obj)
      expect(result1).toBe(result2)
    })

    it.concurrent('should always return the same array reference', () => {
      const arr = [1, 2, 3]
      const alwaysArr = constant(arr)

      const result1 = alwaysArr()
      const result2 = alwaysArr()

      expect(result1).toBe(arr)
      expect(result2).toBe(arr)
    })

    it.concurrent('should always return the same function reference', () => {
      const fn = () => 'result'
      const alwaysFn = constant(fn)

      expect(alwaysFn()).toBe(fn)
      expect(alwaysFn()()).toBe('result')
    })

    it.concurrent('should always return the same Date reference', () => {
      const date = new Date('2024-01-01')
      const alwaysDate = constant(date)

      expect(alwaysDate()).toBe(date)
    })

    it.concurrent('should always return the same Map reference', () => {
      const map = new Map([['key', 'value']])
      const alwaysMap = constant(map)

      expect(alwaysMap()).toBe(map)
      expect(alwaysMap().get('key')).toBe('value')
    })

    it.concurrent('should always return the same Set reference', () => {
      const set = new Set([1, 2, 3])
      const alwaysSet = constant(set)

      expect(alwaysSet()).toBe(set)
      expect(alwaysSet().has(2)).toBe(true)
    })
  })

  describe('use cases', () => {
    it.concurrent('should work as a default value factory', () => {
      const defaults = {
        getDefault: constant('default value'),
      }

      expect(defaults.getDefault()).toBe('default value')
    })

    it.concurrent('should work as a placeholder in map operations', () => {
      const alwaysZero = constant(0)
      const result = [1, 2, 3, 4, 5].map(alwaysZero)

      expect(result).toEqual([0, 0, 0, 0, 0])
    })

    it.concurrent('should work as a fallback in conditional expressions', () => {
      const getValueOrDefault = (value: number | null, defaultFn: () => number) => {
        return value ?? defaultFn()
      }

      const always100 = constant(100)

      expect(getValueOrDefault(42, always100)).toBe(42)
      expect(getValueOrDefault(null, always100)).toBe(100)
    })

    it.concurrent('should work in reduce as initial value provider', () => {
      const emptyArray = constant([] as number[])

      const result = [
        [1, 2],
        [3, 4],
        [5, 6],
      ].reduce((acc, curr) => [...acc, ...curr], emptyArray())

      expect(result).toEqual([1, 2, 3, 4, 5, 6])
    })

    it.concurrent('should work as a mock function', () => {
      const mockResponse = constant({status: 200, data: 'success'})

      const fetch1 = mockResponse()
      const fetch2 = mockResponse()

      expect(fetch1).toEqual({status: 200, data: 'success'})
      expect(fetch2).toEqual({status: 200, data: 'success'})
      expect(fetch1).toBe(fetch2)
    })
  })

  describe('type preservation', () => {
    it.concurrent('should preserve number type', () => {
      const fn = constant(42)
      const value: number = fn()

      expect(value).toBe(42)
    })

    it.concurrent('should preserve string type', () => {
      const fn = constant('test')
      const value: string = fn()

      expect(value).toBe('test')
    })

    it.concurrent('should preserve complex object type', () => {
      interface User {
        name: string
        age: number
      }

      const user: User = {name: 'Alice', age: 30}
      const alwaysUser = constant(user)
      const result: User = alwaysUser()

      expect(result.name).toBe('Alice')
      expect(result.age).toBe(30)
    })

    it.concurrent('should preserve union types', () => {
      const value: string | number = 'hello'
      const fn = constant(value)
      const result: string | number = fn()

      expect(result).toBe('hello')
    })
  })

  describe('edge cases', () => {
    it.concurrent('should handle nested objects', () => {
      const nested = {
        level1: {
          level2: {
            value: 'deep',
          },
        },
      }
      const alwaysNested = constant(nested)

      expect(alwaysNested()).toBe(nested)
      expect(alwaysNested().level1.level2.value).toBe('deep')
    })

    it.concurrent('should handle circular references', () => {
      interface Circular {
        self?: Circular
        value: number
      }
      const obj: Circular = {value: 42}
      obj.self = obj

      const alwaysCircular = constant(obj)
      const result = alwaysCircular()

      expect(result).toBe(obj)
      expect(result.self).toBe(result)
    })

    it.concurrent('should not be affected by mutations to returned object', () => {
      const obj = {value: 1}
      const alwaysObj = constant(obj)

      const result1 = alwaysObj()
      result1.value = 999

      const result2 = alwaysObj()
      expect(result2.value).toBe(999)
      expect(result1).toBe(result2)
    })
  })

  describe('multiple constant functions', () => {
    it.concurrent('should maintain independence between different constants', () => {
      const always1 = constant(1)
      const always2 = constant(2)
      const always3 = constant(3)

      expect(always1()).toBe(1)
      expect(always2()).toBe(2)
      expect(always3()).toBe(3)

      expect(always1()).toBe(1)
    })
  })
})
