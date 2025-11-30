import {describe, expect, it} from 'vitest'

import {
  hasProperty,
  isArray,
  isFunction,
  isNonNullable,
  isNumber,
  isObject,
  isString,
} from '../../src/types'

describe('@bfra.me/es/types - type guards', () => {
  describe('isString()', () => {
    it.concurrent('should return true for strings', () => {
      expect(isString('hello')).toBe(true)
      expect(isString('')).toBe(true)
      expect(isString(String('test'))).toBe(true)
    })

    it.concurrent('should return false for non-strings', () => {
      expect(isString(123)).toBe(false)
      expect(isString(null)).toBe(false)
      expect(isString(undefined)).toBe(false)
      expect(isString({})).toBe(false)
      expect(isString([])).toBe(false)
      expect(isString(true)).toBe(false)
    })
  })

  describe('isNumber()', () => {
    it.concurrent('should return true for valid numbers', () => {
      expect(isNumber(42)).toBe(true)
      expect(isNumber(0)).toBe(true)
      expect(isNumber(-1)).toBe(true)
      expect(isNumber(3.14)).toBe(true)
      expect(isNumber(Infinity)).toBe(true)
      expect(isNumber(-Infinity)).toBe(true)
    })

    it.concurrent('should return false for NaN', () => {
      expect(isNumber(Number.NaN)).toBe(false)
    })

    it.concurrent('should return false for non-numbers', () => {
      expect(isNumber('42')).toBe(false)
      expect(isNumber(null)).toBe(false)
      expect(isNumber(undefined)).toBe(false)
      expect(isNumber({})).toBe(false)
    })
  })

  describe('isObject()', () => {
    it.concurrent('should return true for plain objects', () => {
      expect(isObject({})).toBe(true)
      expect(isObject({foo: 'bar'})).toBe(true)
      expect(isObject(Object.create(null))).toBe(true)
    })

    it.concurrent('should return false for null', () => {
      expect(isObject(null)).toBe(false)
    })

    it.concurrent('should return false for arrays', () => {
      expect(isObject([])).toBe(false)
      expect(isObject([1, 2, 3])).toBe(false)
    })

    it.concurrent('should return false for primitives', () => {
      expect(isObject('string')).toBe(false)
      expect(isObject(123)).toBe(false)
      expect(isObject(true)).toBe(false)
      expect(isObject(undefined)).toBe(false)
    })
  })

  describe('isArray()', () => {
    it.concurrent('should return true for arrays', () => {
      expect(isArray([])).toBe(true)
      expect(isArray([1, 2, 3])).toBe(true)
      expect(isArray(Array.from({length: 5}))).toBe(true)
    })

    it.concurrent('should return false for non-arrays', () => {
      expect(isArray({})).toBe(false)
      expect(isArray('string')).toBe(false)
      expect(isArray(null)).toBe(false)
      expect(isArray(undefined)).toBe(false)
    })

    it.concurrent('should return false for array-like objects', () => {
      expect(isArray({length: 3})).toBe(false)
    })
  })

  describe('isFunction()', () => {
    it.concurrent('should return true for functions', () => {
      expect(isFunction(() => {})).toBe(true)
      const namedFn = (): void => {}
      expect(isFunction(namedFn)).toBe(true)
      expect(isFunction(async () => {})).toBe(true)
    })

    it.concurrent('should return true for generator functions', () => {
      // eslint-disable-next-line unicorn/consistent-function-scoping -- Test requires inline definition
      function* generatorFn(): Generator<number> {
        yield 1
      }
      expect(isFunction(generatorFn)).toBe(true)
    })

    it.concurrent('should return true for class constructors', () => {
      class MyClass {
        value = 0
      }
      expect(isFunction(MyClass)).toBe(true)
    })

    it.concurrent('should return false for non-functions', () => {
      expect(isFunction({})).toBe(false)
      expect(isFunction('string')).toBe(false)
      expect(isFunction(123)).toBe(false)
      expect(isFunction(null)).toBe(false)
    })
  })

  describe('hasProperty()', () => {
    it.concurrent('should return true when object has property', () => {
      const obj = {foo: 'bar', count: 42}
      expect(hasProperty(obj, 'foo')).toBe(true)
      expect(hasProperty(obj, 'count')).toBe(true)
    })

    it.concurrent('should return false when object lacks property', () => {
      const obj = {foo: 'bar'}
      expect(hasProperty(obj, 'missing')).toBe(false)
    })

    it.concurrent('should return true for inherited properties', () => {
      const obj = Object.create({inherited: true}) as Record<string, unknown>
      expect(hasProperty(obj, 'inherited')).toBe(true)
    })

    it.concurrent('should return false for non-objects', () => {
      expect(hasProperty(null, 'foo')).toBe(false)
      expect(hasProperty(undefined, 'foo')).toBe(false)
      expect(hasProperty('string', 'length')).toBe(false)
      expect(hasProperty([], 'length')).toBe(false)
    })

    it.concurrent('should work with symbol keys', () => {
      const sym = Symbol('test')
      const obj = {[sym]: 'value'}
      expect(hasProperty(obj, sym)).toBe(true)
    })

    it.concurrent('should work with numeric keys', () => {
      const obj = {0: 'zero', 1: 'one'}
      expect(hasProperty(obj, 0)).toBe(true)
      expect(hasProperty(obj, 2)).toBe(false)
    })
  })

  describe('isNonNullable()', () => {
    it.concurrent('should return true for defined values', () => {
      expect(isNonNullable('string')).toBe(true)
      expect(isNonNullable(0)).toBe(true)
      expect(isNonNullable(false)).toBe(true)
      expect(isNonNullable('')).toBe(true)
      expect(isNonNullable({})).toBe(true)
      expect(isNonNullable([])).toBe(true)
    })

    it.concurrent('should return false for null', () => {
      expect(isNonNullable(null)).toBe(false)
    })

    it.concurrent('should return false for undefined', () => {
      expect(isNonNullable(undefined)).toBe(false)
    })

    it.concurrent('should narrow types correctly', () => {
      const value: string | null = 'hello'
      expect(isNonNullable(value)).toBe(true)
      const result: string = isNonNullable(value) ? value : ''
      expect(result).toBe('hello')
    })
  })

  describe('type narrowing', () => {
    it.concurrent('isString should narrow to string', () => {
      const value: unknown = 'test'
      expect(isString(value)).toBe(true)
      const result: string = isString(value) ? value.toUpperCase() : ''
      expect(result).toBe('TEST')
    })

    it.concurrent('isNumber should narrow to number', () => {
      const value: unknown = 42
      expect(isNumber(value)).toBe(true)
      const result: number = isNumber(value) ? value * 2 : 0
      expect(result).toBe(84)
    })

    it.concurrent('isObject should narrow to Record<string, unknown>', () => {
      const value: unknown = {foo: 'bar'}
      expect(isObject(value)).toBe(true)
      const result = isObject(value) ? value.foo : undefined
      expect(result).toBe('bar')
    })

    it.concurrent('isArray should narrow to unknown[]', () => {
      const value: unknown = [1, 2, 3]
      expect(isArray(value)).toBe(true)
      const result = isArray(value) ? value.length : 0
      expect(result).toBe(3)
    })

    it.concurrent('isFunction should narrow to function type', () => {
      const value: unknown = () => 'hello'
      expect(isFunction(value)).toBe(true)
      const result = isFunction(value) ? value() : ''
      expect(result).toBe('hello')
    })

    it.concurrent('hasProperty should narrow object type', () => {
      const value: unknown = {name: 'Alice', age: 30}
      expect(hasProperty(value, 'name')).toBe(true)
      const result = hasProperty(value, 'name') ? value.name : ''
      expect(result).toBe('Alice')
    })
  })
})
