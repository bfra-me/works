import process from 'node:process'
import {afterEach, beforeEach, describe, expect, it} from 'vitest'
import {hasNonEmptyEnv} from '../../src/env/helpers'

describe('@bfra.me/es/env - helpers', () => {
  const originalEnv = {...process.env}

  beforeEach(() => {
    process.env = {...originalEnv}
  })

  afterEach(() => {
    process.env = {...originalEnv}
  })

  describe('hasNonEmptyEnv', () => {
    it('should return true for an existing non-empty environment variable', () => {
      process.env.TEST_VAR = 'some-value'
      expect(hasNonEmptyEnv('TEST_VAR')).toBe(true)
    })

    it('should return false for an empty string environment variable', () => {
      process.env.TEST_VAR = ''
      expect(hasNonEmptyEnv('TEST_VAR')).toBe(false)
    })

    it('should return false for an undefined environment variable', () => {
      delete process.env.TEST_VAR
      expect(hasNonEmptyEnv('TEST_VAR')).toBe(false)
    })

    it('should return true for whitespace-only value', () => {
      process.env.TEST_VAR = '   '
      expect(hasNonEmptyEnv('TEST_VAR')).toBe(true)
    })

    it('should return true for single character value', () => {
      process.env.TEST_VAR = 'x'
      expect(hasNonEmptyEnv('TEST_VAR')).toBe(true)
    })

    it('should handle environment variables with special characters', () => {
      process.env.TEST_VAR = '!@#$%^&*()'
      expect(hasNonEmptyEnv('TEST_VAR')).toBe(true)
    })

    it('should handle environment variables with numbers', () => {
      process.env.TEST_VAR = '12345'
      expect(hasNonEmptyEnv('TEST_VAR')).toBe(true)
    })

    it('should handle environment variables with paths', () => {
      process.env.TEST_VAR = '/usr/local/bin'
      expect(hasNonEmptyEnv('TEST_VAR')).toBe(true)
    })

    it('should return a boolean type', () => {
      const result = hasNonEmptyEnv('NONEXISTENT_VAR')
      expect(typeof result).toBe('boolean')
    })

    it('should handle commonly used environment variable names', () => {
      process.env.PATH = '/usr/bin:/usr/local/bin'
      expect(hasNonEmptyEnv('PATH')).toBe(true)
    })
  })
})
