import {describe, expect, it} from 'vitest'
import {increment} from './counter'

describe('increment', () => {
  it('increases the count by one', () => {
    expect(increment(0)).toBe(1)
    expect(increment(41)).toBe(42)
  })
})
