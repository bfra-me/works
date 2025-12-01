import {describe, expect, it} from 'vitest'

import {identity} from '../../src/functional/identity'

describe('@bfra.me/es/functional - identity()', () => {
  describe('primitive values', () => {
    it.concurrent('should return the same number', () => {
      expect(identity(42)).toBe(42)
      expect(identity(0)).toBe(0)
      expect(identity(-1)).toBe(-1)
      expect(identity(3.14)).toBe(3.14)
    })

    it.concurrent('should return the same string', () => {
      expect(identity('hello')).toBe('hello')
      expect(identity('')).toBe('')
      expect(identity('a')).toBe('a')
    })

    it.concurrent('should return the same boolean', () => {
      expect(identity(true)).toBe(true)
      expect(identity(false)).toBe(false)
    })

    it.concurrent('should return null', () => {
      expect(identity(null)).toBeNull()
    })

    it.concurrent('should return undefined', () => {
      expect(identity(undefined)).toBeUndefined()
    })

    it.concurrent('should return the same symbol', () => {
      const sym = Symbol('test')
      expect(identity(sym)).toBe(sym)
    })

    it.concurrent('should return the same bigint', () => {
      expect(identity(BigInt(9007199254740991))).toBe(BigInt(9007199254740991))
    })
  })

  describe('reference types', () => {
    it.concurrent('should return the same object reference', () => {
      const obj = {name: 'test', value: 42}
      const result = identity(obj)

      expect(result).toBe(obj)
      expect(result).toEqual({name: 'test', value: 42})
    })

    it.concurrent('should return the same array reference', () => {
      const arr = [1, 2, 3]
      const result = identity(arr)

      expect(result).toBe(arr)
      expect(result).toEqual([1, 2, 3])
    })

    it.concurrent('should return the same function reference', () => {
      const fn = () => 42
      const result = identity(fn)

      expect(result).toBe(fn)
      expect(result()).toBe(42)
    })

    it.concurrent('should return the same Date reference', () => {
      const date = new Date('2024-01-01')
      const result = identity(date)

      expect(result).toBe(date)
    })

    it.concurrent('should return the same Map reference', () => {
      const map = new Map([['key', 'value']])
      const result = identity(map)

      expect(result).toBe(map)
    })

    it.concurrent('should return the same Set reference', () => {
      const set = new Set([1, 2, 3])
      const result = identity(set)

      expect(result).toBe(set)
    })

    it.concurrent('should return the same RegExp reference', () => {
      const regex = /test/gi
      const result = identity(regex)

      expect(result).toBe(regex)
    })
  })

  describe('type preservation', () => {
    it.concurrent('should preserve the type of the input', () => {
      const numberResult: number = identity(42)
      const stringResult: string = identity('hello')
      const booleanResult: boolean = identity(true)
      const objectResult: {x: number} = identity({x: 1})

      expect(numberResult).toBe(42)
      expect(stringResult).toBe('hello')
      expect(booleanResult).toBe(true)
      expect(objectResult).toEqual({x: 1})
    })

    it.concurrent('should work with generic types', () => {
      interface User {
        name: string
        age: number
      }

      const user: User = {name: 'Alice', age: 30}
      const result: User = identity(user)

      expect(result).toBe(user)
      expect(result.name).toBe('Alice')
      expect(result.age).toBe(30)
    })
  })

  describe('use in pipelines', () => {
    it.concurrent('should work as a default transformation', () => {
      const values = [1, 2, 3, 4, 5]
      const result = values.map(identity)

      expect(result).toEqual([1, 2, 3, 4, 5])
      expect(result).not.toBe(values)
    })

    it.concurrent('should work as a pass-through in reduce', () => {
      const value = 'initial'
      const result = [identity].reduce((acc, fn) => fn(acc), value)

      expect(result).toBe('initial')
    })

    it.concurrent('should work with filter as a no-op', () => {
      const values = [1, 2, 3]
      const identityFn = (x: number) => identity(x) > 0

      const result = values.filter(identityFn)
      expect(result).toEqual([1, 2, 3])
    })
  })

  describe('edge cases', () => {
    it.concurrent('should handle nested objects', () => {
      const nested = {
        level1: {
          level2: {
            level3: 'deep value',
          },
        },
      }

      const result = identity(nested)
      expect(result).toBe(nested)
      expect(result.level1.level2.level3).toBe('deep value')
    })

    it.concurrent('should handle circular references', () => {
      interface Circular {
        self?: Circular
        value: number
      }
      const obj: Circular = {value: 42}
      obj.self = obj

      const result = identity(obj)
      expect(result).toBe(obj)
      expect(result.self).toBe(result)
    })
  })
})
