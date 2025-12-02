/**
 * Performance benchmarks for pipe() and compose() functions.
 *
 * Validates TEST-034: `pipe()` performance within 5% of hand-written function chains
 *
 * These benchmarks compare the functional composition utilities against
 * equivalent hand-written function chains to ensure minimal performance overhead.
 */

import {bench, describe} from 'vitest'

import {compose} from '../../src/functional/compose'
import {pipe} from '../../src/functional/pipe'

/**
 * Result holder to prevent JIT from eliminating benchmark code.
 * Using an object with a volatile property pattern.
 */
const results = {value: undefined as unknown}

// Simple transformation functions for benchmarking
const addOne = (x: number): number => x + 1
const double = (x: number): number => x * 2
const square = (x: number): number => x * x
const half = (x: number): number => x / 2
const negate = (x: number): number => -x

// String transformation functions
const toUpperCase = (s: string): string => s.toUpperCase()
const addPrefix = (s: string): string => `prefix_${s}`
const addSuffix = (s: string): string => `${s}_suffix`
const trim = (s: string): string => s.trim()
const reverse = (s: string): string => s.split('').reverse().join('')

describe('pipe() vs hand-written - numeric operations', () => {
  const input = 10

  describe('2-function chain', () => {
    bench('hand-written (baseline)', () => {
      results.value = double(addOne(input))
    })

    bench('pipe()', () => {
      const fn = pipe(addOne, double)
      results.value = fn(input)
    })
  })

  describe('3-function chain', () => {
    bench('hand-written (baseline)', () => {
      results.value = square(double(addOne(input)))
    })

    bench('pipe()', () => {
      const fn = pipe(addOne, double, square)
      results.value = fn(input)
    })
  })

  describe('5-function chain', () => {
    bench('hand-written (baseline)', () => {
      results.value = negate(half(square(double(addOne(input)))))
    })

    bench('pipe()', () => {
      const fn = pipe(addOne, double, square, half, negate)
      results.value = fn(input)
    })
  })

  describe('10-function chain', () => {
    bench('hand-written (baseline)', () => {
      results.value = double(
        addOne(negate(half(square(double(addOne(negate(half(addOne(input))))))))),
      )
    })

    bench('pipe()', () => {
      const fn = pipe(addOne, half, negate, addOne, double, square, half, negate, addOne, double)
      results.value = fn(input)
    })
  })
})

describe('compose() vs hand-written - numeric operations', () => {
  const input = 10

  describe('2-function chain', () => {
    bench('hand-written (baseline)', () => {
      results.value = double(addOne(input))
    })

    bench('compose()', () => {
      const fn = compose(double, addOne)
      results.value = fn(input)
    })
  })

  describe('3-function chain', () => {
    bench('hand-written (baseline)', () => {
      results.value = square(double(addOne(input)))
    })

    bench('compose()', () => {
      const fn = compose(square, double, addOne)
      results.value = fn(input)
    })
  })

  describe('5-function chain', () => {
    bench('hand-written (baseline)', () => {
      results.value = negate(half(square(double(addOne(input)))))
    })

    bench('compose()', () => {
      const fn = compose(negate, half, square, double, addOne)
      results.value = fn(input)
    })
  })
})

describe('pipe() vs hand-written - string operations', () => {
  const input = '  hello world  '

  describe('3-function chain', () => {
    bench('hand-written (baseline)', () => {
      results.value = addPrefix(toUpperCase(trim(input)))
    })

    bench('pipe()', () => {
      const fn = pipe(trim, toUpperCase, addPrefix)
      results.value = fn(input)
    })
  })

  describe('5-function chain', () => {
    bench('hand-written (baseline)', () => {
      results.value = reverse(addSuffix(addPrefix(toUpperCase(trim(input)))))
    })

    bench('pipe()', () => {
      const fn = pipe(trim, toUpperCase, addPrefix, addSuffix, reverse)
      results.value = fn(input)
    })
  })
})

describe('pipe() - pre-composed vs inline composition', () => {
  const input = 10

  // Pre-compose the function once
  const preComposedPipe = pipe(addOne, double, square, half, negate)

  describe('5-function chain', () => {
    bench('pre-composed pipe (reused function)', () => {
      results.value = preComposedPipe(input)
    })

    bench('inline composition (recreated each call)', () => {
      const fn = pipe(addOne, double, square, half, negate)
      results.value = fn(input)
    })
  })
})

describe('composition overhead analysis', () => {
  const input = 10

  describe('single function baseline', () => {
    bench('direct call', () => {
      results.value = addOne(input)
    })

    bench('pipe (1 function)', () => {
      const fn = pipe(addOne)
      results.value = fn(input)
    })
  })

  describe('measuring reduce() overhead', () => {
    bench('hand-written nested calls', () => {
      results.value = square(double(addOne(input)))
    })

    bench('array.reduce() simulation', () => {
      const fns = [addOne, double, square] as const
      results.value = fns.reduce((acc, fn) => fn(acc), input)
    })

    bench('pipe() implementation', () => {
      const fn = pipe(addOne, double, square)
      results.value = fn(input)
    })
  })
})

describe('real-world transformation scenarios', () => {
  interface User {
    name: string
    age: number
    email: string
  }

  const normalizeEmail = (user: User): User => ({...user, email: user.email.toLowerCase()})
  const incrementAge = (user: User): User => ({...user, age: user.age + 1})
  const uppercaseName = (user: User): User => ({...user, name: user.name.toUpperCase()})
  const addTimestamp = (user: User): User & {timestamp: number} => ({
    ...user,
    timestamp: Date.now(),
  })

  const testUser: User = {name: 'John Doe', age: 30, email: 'John.Doe@Example.COM'}

  describe('object transformation pipeline', () => {
    bench('hand-written (baseline)', () => {
      results.value = addTimestamp(uppercaseName(incrementAge(normalizeEmail(testUser))))
    })

    bench('pipe()', () => {
      const fn = pipe(normalizeEmail, incrementAge, uppercaseName, addTimestamp)
      results.value = fn(testUser)
    })
  })
})

describe('array transformation scenarios', () => {
  const numbers = Array.from({length: 100}, (_, i) => i)

  const filterEven = (arr: number[]): number[] => arr.filter(n => n % 2 === 0)
  const mapDouble = (arr: number[]): number[] => arr.map(n => n * 2)
  const take10 = (arr: number[]): number[] => arr.slice(0, 10)
  const sum = (arr: number[]): number => arr.reduce((a, b) => a + b, 0)

  describe('array processing pipeline', () => {
    bench('hand-written (baseline)', () => {
      results.value = sum(take10(mapDouble(filterEven(numbers))))
    })

    bench('pipe()', () => {
      const fn = pipe(filterEven, mapDouble, take10, sum)
      results.value = fn(numbers)
    })
  })
})
