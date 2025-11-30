import {describe, expect, it} from 'vitest'

import {assertType, isNumber, isString} from '../../src/types'

describe('@bfra.me/es/types - assertions', () => {
  describe('assertType()', () => {
    it.concurrent('should not throw when guard returns true', () => {
      const value: unknown = 'hello'
      expect(() => assertType(value, isString)).not.toThrow()
    })

    it.concurrent('should throw when guard returns false', () => {
      const value: unknown = 123
      expect(() => assertType(value, isString)).toThrow('Type assertion failed')
    })

    it.concurrent('should throw with custom message', () => {
      const value: unknown = 'not a number'
      expect(() => assertType(value, isNumber, 'Expected a number')).toThrow('Expected a number')
    })

    it.concurrent('should narrow the type after successful assertion', () => {
      const value: unknown = 'test'
      assertType(value, isString)
      const result: string = value.toUpperCase()
      expect(result).toBe('TEST')
    })

    it.concurrent('should work with isNumber guard', () => {
      const value: unknown = 42
      assertType(value, isNumber)
      const result: number = value * 2
      expect(result).toBe(84)
    })

    it.concurrent('should work with custom type guards', () => {
      interface User {
        name: string
        age: number
      }

      function isUser(value: unknown): value is User {
        return (
          typeof value === 'object' &&
          value !== null &&
          'name' in value &&
          'age' in value &&
          typeof (value as User).name === 'string' &&
          typeof (value as User).age === 'number'
        )
      }

      const value: unknown = {name: 'Alice', age: 30}
      assertType(value, isUser)
      expect(value.name).toBe('Alice')
      expect(value.age).toBe(30)
    })

    it.concurrent('should throw for null when using isString', () => {
      expect(() => assertType(null, isString)).toThrow('Type assertion failed')
    })

    it.concurrent('should throw for undefined when using isNumber', () => {
      expect(() => assertType(undefined, isNumber)).toThrow('Type assertion failed')
    })
  })
})
