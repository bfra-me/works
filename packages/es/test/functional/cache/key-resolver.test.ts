import {describe, expect, it} from 'vitest'

import {
  createCustomKeyResolver,
  createKeyResolver,
} from '../../../src/functional/cache/key-resolver'

describe('@bfra.me/es/functional/cache - createKeyResolver()', () => {
  describe('map serialization', () => {
    it('produces the same key for Maps with identical entries in different insertion order', () => {
      const mapA = new Map([
        ['a', 1],
        ['b', 2],
        ['c', 3],
      ])
      const mapB = new Map([
        ['c', 3],
        ['a', 1],
        ['b', 2],
      ])

      expect(createKeyResolver([mapA])).toBe(createKeyResolver([mapB]))
    })

    it('produces different keys for Maps with different values for the same keys', () => {
      const mapA = new Map([['a', 1]])
      const mapB = new Map([['a', 2]])

      expect(createKeyResolver([mapA])).not.toBe(createKeyResolver([mapB]))
    })

    it('produces different keys for Maps with different sizes', () => {
      const mapA = new Map([['a', 1]])
      const mapB = new Map([
        ['a', 1],
        ['b', 2],
      ])

      expect(createKeyResolver([mapA])).not.toBe(createKeyResolver([mapB]))
    })
  })

  describe('set serialization', () => {
    it('produces the same key for Sets with identical members in different order', () => {
      const setA = new Set([1, 2, 3])
      const setB = new Set([3, 1, 2])

      expect(createKeyResolver([setA])).toBe(createKeyResolver([setB]))
    })

    it('produces different keys for Sets with different members', () => {
      const setA = new Set([1, 2, 3])
      const setB = new Set([1, 2, 4])

      expect(createKeyResolver([setA])).not.toBe(createKeyResolver([setB]))
    })

    it('produces different keys for Sets with different sizes', () => {
      const setA = new Set([1, 2])
      const setB = new Set([1, 2, 3])

      expect(createKeyResolver([setA])).not.toBe(createKeyResolver([setB]))
    })
  })

  describe('nested Map/Set inside arrays and objects', () => {
    it('produces the same key for arrays containing Maps with reordered entries', () => {
      const arrA = [
        1,
        new Map([
          ['x', 1],
          ['y', 2],
        ]),
      ]
      const arrB = [
        1,
        new Map([
          ['y', 2],
          ['x', 1],
        ]),
      ]

      expect(createKeyResolver([arrA])).toBe(createKeyResolver([arrB]))
    })

    it('produces the same key for objects containing Sets with reordered members', () => {
      const objA = {tags: new Set(['a', 'b', 'c'])}
      const objB = {tags: new Set(['c', 'a', 'b'])}

      expect(createKeyResolver([objA])).toBe(createKeyResolver([objB]))
    })

    it('produces different keys when nested Map/Set contents differ', () => {
      const objA = {tags: new Set(['a', 'b'])}
      const objB = {tags: new Set(['a', 'c'])}

      expect(createKeyResolver([objA])).not.toBe(createKeyResolver([objB]))
    })
  })

  describe('array and plain object cases', () => {
    it('produces the same key for arrays with identical elements', () => {
      expect(createKeyResolver([[1, 2, 3]])).toBe(createKeyResolver([[1, 2, 3]]))
    })

    it('produces different keys for arrays with different elements', () => {
      expect(createKeyResolver([[1, 2, 3]])).not.toBe(createKeyResolver([[1, 2, 4]]))
    })

    it('produces the same key for plain objects regardless of property order', () => {
      expect(createKeyResolver([{a: 1, b: 2}])).toBe(createKeyResolver([{b: 2, a: 1}]))
    })

    it('produces different keys for plain objects with different values', () => {
      expect(createKeyResolver([{a: 1}])).not.toBe(createKeyResolver([{a: 2}]))
    })
  })

  describe('createCustomKeyResolver()', () => {
    it('creates a resolver bound to the given options that also normalizes Map/Set order', () => {
      const resolver = createCustomKeyResolver({maxDepth: 5})
      const mapA = new Map([
        ['a', 1],
        ['b', 2],
      ])
      const mapB = new Map([
        ['b', 2],
        ['a', 1],
      ])

      expect(resolver([mapA])).toBe(resolver([mapB]))
    })

    it('creates a resolver that still distinguishes Sets with different members', () => {
      const resolver = createCustomKeyResolver({maxDepth: 5})

      expect(resolver([new Set([1, 2])])).not.toBe(resolver([new Set([1, 3])]))
    })
  })
})
