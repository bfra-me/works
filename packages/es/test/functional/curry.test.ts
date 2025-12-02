import {describe, expect, it} from 'vitest'

import {curry} from '../../src/functional/curry'

describe('@bfra.me/es/functional - curry()', () => {
  describe('single argument functions', () => {
    it.concurrent('should curry a single argument function', () => {
      const addOne = (x: number) => x + 1
      const curried = curry(addOne)

      expect(curried(5)).toBe(6)
    })
  })

  describe('two argument functions', () => {
    it.concurrent('should curry a two argument function', () => {
      const add = (a: number, b: number) => a + b
      const curried = curry(add)

      expect(curried(1)(2)).toBe(3)
    })

    it.concurrent('should allow calling with both arguments at once', () => {
      const add = (a: number, b: number) => a + b
      const curried = curry(add)

      expect(curried(1, 2)).toBe(3)
    })
  })

  describe('three argument functions', () => {
    it.concurrent('should curry a three argument function', () => {
      const add3 = (a: number, b: number, c: number) => a + b + c
      const curried = curry(add3)

      expect(curried(1)(2)(3)).toBe(6)
    })

    it.concurrent('should allow partial application with multiple arguments', () => {
      const add3 = (a: number, b: number, c: number) => a + b + c
      const curried = curry(add3)

      expect(curried(1, 2)(3)).toBe(6)
      expect(curried(1)(2, 3)).toBe(6)
      expect(curried(1, 2, 3)).toBe(6)
    })

    it.concurrent('should allow step-by-step partial application', () => {
      const add3 = (a: number, b: number, c: number) => a + b + c
      const curried = curry(add3)

      const add1 = curried(1)
      const add1And2 = add1(2)
      const result = add1And2(3)

      expect(result).toBe(6)
    })
  })

  describe('four argument functions', () => {
    it.concurrent('should curry a four argument function', () => {
      const add4 = (a: number, b: number, c: number, d: number) => a + b + c + d
      const curried = curry(add4)

      expect(curried(1)(2)(3)(4)).toBe(10)
    })

    it.concurrent('should allow various partial application patterns', () => {
      const add4 = (a: number, b: number, c: number, d: number) => a + b + c + d
      const curried = curry(add4)

      expect(curried(1, 2)(3, 4)).toBe(10)
      expect(curried(1)(2, 3)(4)).toBe(10)
      expect(curried(1, 2, 3)(4)).toBe(10)
      expect(curried(1)(2)(3, 4)).toBe(10)
      expect(curried(1, 2, 3, 4)).toBe(10)
    })
  })

  describe('five argument functions', () => {
    it.concurrent('should curry a five argument function', () => {
      const add5 = (a: number, b: number, c: number, d: number, e: number) => a + b + c + d + e
      const curried = curry(add5)

      expect(curried(1)(2)(3)(4)(5)).toBe(15)
    })

    it.concurrent('should allow various partial application patterns', () => {
      const add5 = (a: number, b: number, c: number, d: number, e: number) => a + b + c + d + e
      const curried = curry(add5)

      expect(curried(1, 2)(3, 4)(5)).toBe(15)
      expect(curried(1, 2, 3)(4, 5)).toBe(15)
      expect(curried(1)(2, 3, 4, 5)).toBe(15)
      expect(curried(1, 2, 3, 4, 5)).toBe(15)
    })
  })

  describe('with different types', () => {
    it.concurrent('should curry functions with string arguments', () => {
      const greet = (greeting: string, name: string) => `${greeting}, ${name}!`
      const curried = curry(greet)

      expect(curried('Hello')('World')).toBe('Hello, World!')
      expect(curried('Hello', 'World')).toBe('Hello, World!')
    })

    it.concurrent('should curry functions with mixed argument types', () => {
      const createPerson = (name: string, age: number, active: boolean) => ({name, age, active})
      const curried = curry(createPerson)

      expect(curried('Alice')(25)(true)).toEqual({name: 'Alice', age: 25, active: true})
      expect(curried('Bob', 30, false)).toEqual({name: 'Bob', age: 30, active: false})
    })

    it.concurrent('should curry functions with object arguments', () => {
      interface Point {
        x: number
        y: number
      }
      const add = (p1: Point, p2: Point) => ({x: p1.x + p2.x, y: p1.y + p2.y})
      const curried = curry(add)

      expect(curried({x: 1, y: 2})({x: 3, y: 4})).toEqual({x: 4, y: 6})
    })

    it.concurrent('should curry functions with array arguments', () => {
      const concat = (arr1: number[], arr2: number[]) => [...arr1, ...arr2]
      const curried = curry(concat)

      expect(curried([1, 2])([3, 4])).toEqual([1, 2, 3, 4])
    })
  })

  describe('reusability', () => {
    it.concurrent('should create reusable partially applied functions', () => {
      const multiply = (a: number, b: number) => a * b
      const curried = curry(multiply)

      const double = curried(2)
      const triple = curried(3)

      expect(double(5)).toBe(10)
      expect(triple(5)).toBe(15)
      expect(double(10)).toBe(20)
      expect(triple(10)).toBe(30)
    })

    it.concurrent('should not share state between calls', () => {
      const add3 = (a: number, b: number, c: number) => a + b + c
      const curried = curry(add3)

      const addTo1 = curried(1)
      const addTo1And2 = addTo1(2)

      expect(addTo1And2(3)).toBe(6)
      expect(addTo1(5)(3)).toBe(9)
      expect(addTo1And2(10)).toBe(13)
    })
  })

  describe('edge cases', () => {
    it.concurrent('should handle functions returning functions', () => {
      const createMultiplier = (factor: number) => (x: number) => x * factor
      const curried = curry(createMultiplier)

      const double = curried(2)
      expect(double(5)).toBe(10)
    })

    it.concurrent('should preserve function behavior with undefined arguments', () => {
      const showValue = (a: string | undefined, b: string) => `${a ?? 'default'}: ${b}`
      const curried = curry(showValue)

      expect(curried(undefined)('test')).toBe('default: test')
      expect(curried('key')('value')).toBe('key: value')
    })

    it.concurrent('should preserve function behavior with null arguments', () => {
      const showValue = (a: string | null, b: string) => `${a ?? 'default'}: ${b}`
      const curried = curry(showValue)

      expect(curried(null)('test')).toBe('default: test')
      expect(curried('key')('value')).toBe('key: value')
    })
  })

  describe('type inference', () => {
    it.concurrent('should maintain correct type inference', () => {
      const divide = (a: number, b: number): number => a / b
      const curried = curry(divide)

      const divideBy2 = curried(10)
      const result: number = divideBy2(2)

      expect(result).toBe(5)
    })
  })
})
