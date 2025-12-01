import {describe, expect, it} from 'vitest'

import {flip} from '../../src/functional/flip'

describe('@bfra.me/es/functional - flip()', () => {
  describe('basic argument reversal', () => {
    it.concurrent('should flip the order of two arguments', () => {
      const subtract = (a: number, b: number) => a - b
      const flipped = flip(subtract)

      expect(subtract(10, 3)).toBe(7)
      expect(flipped(10, 3)).toBe(-7)
    })

    it.concurrent('should work with division', () => {
      const divide = (a: number, b: number) => a / b
      const flipped = flip(divide)

      expect(divide(10, 2)).toBe(5)
      expect(flipped(10, 2)).toBe(0.2)
    })
  })

  describe('with different argument types', () => {
    it.concurrent('should flip string arguments', () => {
      const concat = (a: string, b: string) => a + b
      const flipped = flip(concat)

      expect(concat('Hello', 'World')).toBe('HelloWorld')
      expect(flipped('Hello', 'World')).toBe('WorldHello')
    })

    it.concurrent('should flip with mixed argument types', () => {
      const repeat = (str: string, times: number) => str.repeat(times)
      const flipped = flip(repeat)

      expect(repeat('ab', 3)).toBe('ababab')
      expect(flipped(3, 'ab')).toBe('ababab')
    })

    it.concurrent('should flip object arguments', () => {
      interface Point {
        x: number
        y: number
      }
      const addPoints = (p1: Point, p2: Point) => ({
        x: p1.x + p2.x,
        y: p1.y + p2.y,
        first: p1,
      })

      const flipped = flip(addPoints)
      const result = flipped({x: 1, y: 2}, {x: 3, y: 4})

      expect(result.first).toEqual({x: 3, y: 4})
    })

    it.concurrent('should flip array arguments', () => {
      const takeFromFirst = (arr1: number[], arr2: number[]) => ({
        fromFirst: arr1[0],
        fromSecond: arr2[0],
      })

      const flipped = flip(takeFromFirst)

      expect(takeFromFirst([1, 2], [3, 4])).toEqual({fromFirst: 1, fromSecond: 3})
      expect(flipped([1, 2], [3, 4])).toEqual({fromFirst: 3, fromSecond: 1})
    })
  })

  describe('with functions returning different types', () => {
    it.concurrent('should work with functions returning numbers', () => {
      const power = (base: number, exponent: number) => base ** exponent
      const flipped = flip(power)

      expect(power(2, 3)).toBe(8)
      expect(flipped(2, 3)).toBe(9)
    })

    it.concurrent('should work with functions returning strings', () => {
      const format = (template: string, value: number) => template.replace('{}', value.toString())
      const flipped = flip(format)

      expect(format('Value: {}', 42)).toBe('Value: 42')
      expect(flipped(42, 'Value: {}')).toBe('Value: 42')
    })

    it.concurrent('should work with functions returning booleans', () => {
      const isGreater = (a: number, b: number) => a > b
      const flipped = flip(isGreater)

      expect(isGreater(5, 3)).toBe(true)
      expect(flipped(5, 3)).toBe(false)
    })

    it.concurrent('should work with functions returning objects', () => {
      const createPair = <A, B>(a: A, b: B) => ({first: a, second: b})
      const flipped = flip(createPair)

      expect(createPair(1, 'a')).toEqual({first: 1, second: 'a'})
      expect(flipped(1, 'a')).toEqual({first: 'a', second: 1})
    })

    it.concurrent('should work with functions returning arrays', () => {
      const makeArray = <A, B>(a: A, b: B): [A, B] => [a, b]
      const flipped = flip(makeArray)

      expect(makeArray(1, 2)).toEqual([1, 2])
      expect(flipped(1, 2)).toEqual([2, 1])
    })
  })

  describe('double flipping', () => {
    it.concurrent('should return to original behavior when flipped twice', () => {
      const subtract = (a: number, b: number) => a - b
      const flippedOnce = flip(subtract)
      const flippedTwice = flip(flippedOnce)

      expect(subtract(10, 3)).toBe(7)
      expect(flippedOnce(10, 3)).toBe(-7)
      expect(flippedTwice(10, 3)).toBe(7)
    })
  })

  describe('reusability', () => {
    it.concurrent('should create reusable flipped functions', () => {
      const divide = (a: number, b: number) => a / b
      const divideInto = flip(divide)

      expect(divideInto(2, 10)).toBe(5)
      expect(divideInto(4, 100)).toBe(25)
      expect(divideInto(5, 1)).toBe(0.2)
    })

    it.concurrent('should not affect original function', () => {
      const subtract = (a: number, b: number) => a - b
      const flipped = flip(subtract)

      expect(subtract(10, 3)).toBe(7)
      expect(flipped(10, 3)).toBe(-7)
      expect(subtract(10, 3)).toBe(7)
    })
  })

  describe('edge cases', () => {
    it.concurrent('should work with null arguments', () => {
      const handleNull = (a: string | null, b: string) => `${a ?? 'null'}: ${b}`
      const flipped = flip(handleNull)

      expect(handleNull(null, 'value')).toBe('null: value')
      expect(flipped('value', null)).toBe('null: value')
    })

    it.concurrent('should work with undefined arguments', () => {
      const handleUndefined = (a: string | undefined, b: string) => `${a ?? 'undefined'}: ${b}`
      const flipped = flip(handleUndefined)

      expect(handleUndefined(undefined, 'value')).toBe('undefined: value')
      expect(flipped('value', undefined)).toBe('undefined: value')
    })

    it.concurrent('should work with same-type arguments', () => {
      const compare = (a: number, b: number) => a - b
      const flipped = flip(compare)

      expect(compare(5, 5)).toBe(0)
      expect(flipped(5, 5)).toBe(0)
    })
  })

  describe('practical use cases', () => {
    it.concurrent('should be useful for point-free programming', () => {
      const includes = (container: string, search: string) => container.includes(search)
      const isContainedIn = flip(includes)

      expect(includes('hello world', 'world')).toBe(true)
      expect(isContainedIn('world', 'hello world')).toBe(true)
    })

    it.concurrent('should work with array methods', () => {
      const getAt = (arr: number[], index: number) => arr[index]
      const getFromIndex = flip(getAt)

      const arrays = [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
      ]
      const firstElements = arrays.map(arr => getFromIndex(0, arr))

      expect(firstElements).toEqual([1, 4, 7])
    })
  })

  describe('type preservation', () => {
    it.concurrent('should preserve return type', () => {
      interface Result {
        value: number
        label: string
      }

      const createResult = (value: number, label: string): Result => ({value, label})
      const flipped = flip(createResult)

      const result: Result = flipped('test', 42)
      expect(result).toEqual({value: 42, label: 'test'})
    })
  })
})
