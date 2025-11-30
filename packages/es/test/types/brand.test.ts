import type {
  AbsolutePath,
  Brand,
  NonEmptyString,
  Opaque,
  PositiveInteger,
  ValidPath,
} from '../../src/types'

import {describe, expect, it} from 'vitest'

import {brand, unbrand} from '../../src/types'

describe('@bfra.me/es/types - branded types', () => {
  describe('brand()', () => {
    it.concurrent('should brand a string value', () => {
      const value = 'hello'
      const branded = brand<string, 'TestBrand'>(value)
      expect(branded).toBe('hello')
    })

    it.concurrent('should brand a number value', () => {
      const value = 42
      const branded = brand<number, 'TestNumber'>(value)
      expect(branded).toBe(42)
    })

    it.concurrent('should brand an object value', () => {
      const value = {foo: 'bar'}
      const branded = brand<typeof value, 'TestObject'>(value)
      expect(branded).toEqual({foo: 'bar'})
    })

    it.concurrent('should preserve reference identity for objects', () => {
      const value = {foo: 'bar'}
      const branded = brand<typeof value, 'TestObject'>(value)
      expect(branded).toBe(value)
    })
  })

  describe('unbrand()', () => {
    it.concurrent('should unbrand a branded string', () => {
      const branded = brand<string, 'TestBrand'>('hello')
      const unbranded = unbrand(branded)
      expect(unbranded).toBe('hello')
    })

    it.concurrent('should unbrand a branded number', () => {
      const branded = brand<number, 'TestNumber'>(42)
      const unbranded = unbrand(branded)
      expect(unbranded).toBe(42)
    })

    it.concurrent('should unbrand a branded object', () => {
      const original = {foo: 'bar'}
      const branded = brand<typeof original, 'TestObject'>(original)
      const unbranded = unbrand(branded)
      expect(unbranded).toEqual({foo: 'bar'})
      expect(unbranded).toBe(original)
    })
  })

  describe('brand type', () => {
    it.concurrent('should work with type assertions', () => {
      type UserId = Brand<string, 'UserId'>
      const userId = 'user-123' as UserId
      expect(userId).toBe('user-123')
    })

    it.concurrent('should work with branded factory', () => {
      type Email = Brand<string, 'Email'>
      const email: Email = brand<string, 'Email'>('test@example.com')
      expect(email).toBe('test@example.com')
    })
  })

  describe('opaque type', () => {
    it.concurrent('should work similar to Brand', () => {
      type Token = Opaque<string, 'Token'>
      const token = 'secret-token' as Token
      expect(token).toBe('secret-token')
    })
  })

  describe('nonEmptyString type', () => {
    it.concurrent('should brand non-empty strings', () => {
      const value: NonEmptyString = brand<string, 'NonEmptyString'>('hello')
      expect(value).toBe('hello')
    })

    it.concurrent('should allow any string at runtime (validation is separate concern)', () => {
      const value: NonEmptyString = brand<string, 'NonEmptyString'>('')
      expect(value).toBe('')
    })
  })

  describe('positiveInteger type', () => {
    it.concurrent('should brand positive integers', () => {
      const value: PositiveInteger = brand<number, 'PositiveInteger'>(42)
      expect(value).toBe(42)
    })

    it.concurrent('should allow any number at runtime (validation is separate concern)', () => {
      const value: PositiveInteger = brand<number, 'PositiveInteger'>(-5)
      expect(value).toBe(-5)
    })
  })

  describe('validPath type', () => {
    it.concurrent('should brand valid paths', () => {
      const value: ValidPath = brand<string, 'ValidPath'>('/home/user/file.txt')
      expect(value).toBe('/home/user/file.txt')
    })

    it.concurrent('should brand relative paths', () => {
      const value: ValidPath = brand<string, 'ValidPath'>('./relative/path')
      expect(value).toBe('./relative/path')
    })
  })

  describe('absolutePath type', () => {
    it.concurrent('should brand absolute Unix paths', () => {
      const value: AbsolutePath = brand<string, 'AbsolutePath'>('/usr/local/bin')
      expect(value).toBe('/usr/local/bin')
    })

    it.concurrent('should brand absolute Windows paths', () => {
      const value: AbsolutePath = brand<string, 'AbsolutePath'>(String.raw`C:\Users\Test`)
      expect(value).toBe(String.raw`C:\Users\Test`)
    })
  })

  describe('type safety (compile-time)', () => {
    it.concurrent('branded values should be usable as base type', () => {
      type UserId = Brand<string, 'UserId'>
      const userId: UserId = brand<string, 'UserId'>('user-123')

      const acceptsString = (s: string): string => s.toUpperCase()
      expect(acceptsString(userId)).toBe('USER-123')
    })

    it.concurrent('branded numbers should support arithmetic', () => {
      type Score = Brand<number, 'Score'>
      const score: Score = brand<number, 'Score'>(100)

      const doubled: number = score * 2
      expect(doubled).toBe(200)
    })
  })
})
