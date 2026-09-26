import {describe, expect, it} from 'vitest'
import {add, greet} from './index'

describe('greet', () => {
  it('returns a greeting for the given name', () => {
    expect(greet('World')).toBe('Hello, World!')
  })
})

describe('add', () => {
  it('returns the sum of two numbers', () => {
    expect(add(2, 3)).toBe(5)
  })
})
