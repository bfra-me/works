/**
 * Tests for AI capability detection utilities
 * Part of Phase 1: Foundation & Type System Enhancement (Task 1.2)
 */

import process from 'node:process'
import {afterEach, beforeEach, describe, expect, it} from 'vitest'
import {
  getActiveProvider,
  getAICapabilities,
  isAIAvailable,
} from '../../src/utils/ai-capabilities.js'

describe('AI capability detection', () => {
  const originalEnv = {...process.env}

  beforeEach(() => {
    // Clear environment variables before each test
    delete process.env.OPENAI_API_KEY
    delete process.env.ANTHROPIC_API_KEY
  })

  afterEach(() => {
    // Restore original environment
    process.env = {...originalEnv}
  })

  describe('getAICapabilities', () => {
    it('should return no capabilities when no API keys are set', () => {
      const capabilities = getAICapabilities()

      expect(capabilities).toEqual({
        enabled: false,
        openai: false,
        anthropic: false,
        provider: 'none',
      })
    })

    it('should detect OpenAI when OPENAI_API_KEY is set', () => {
      process.env.OPENAI_API_KEY = 'sk-test-key'
      const capabilities = getAICapabilities()

      expect(capabilities).toEqual({
        enabled: true,
        openai: true,
        anthropic: false,
        provider: 'openai',
      })
    })

    it('should detect Anthropic when ANTHROPIC_API_KEY is set', () => {
      process.env.ANTHROPIC_API_KEY = 'sk-ant-test-key'
      const capabilities = getAICapabilities()

      expect(capabilities).toEqual({
        enabled: true,
        openai: false,
        anthropic: true,
        provider: 'anthropic',
      })
    })

    it('should prefer OpenAI when both keys are set', () => {
      process.env.OPENAI_API_KEY = 'sk-test-key'
      process.env.ANTHROPIC_API_KEY = 'sk-ant-test-key'
      const capabilities = getAICapabilities()

      expect(capabilities).toEqual({
        enabled: true,
        openai: true,
        anthropic: true,
        provider: 'openai',
      })
    })

    it('should respect requested provider when specified', () => {
      process.env.OPENAI_API_KEY = 'sk-test-key'
      process.env.ANTHROPIC_API_KEY = 'sk-ant-test-key'

      const anthropicCapabilities = getAICapabilities('anthropic')
      expect(anthropicCapabilities.provider).toBe('anthropic')

      const openaiCapabilities = getAICapabilities('openai')
      expect(openaiCapabilities.provider).toBe('openai')
    })

    it('should ignore requested provider if key is not available', () => {
      process.env.OPENAI_API_KEY = 'sk-test-key'

      const capabilities = getAICapabilities('anthropic')
      // Should fallback to available provider (openai)
      expect(capabilities.provider).toBe('openai')
    })

    it('should return none when requested provider is unavailable and no fallback', () => {
      const capabilities = getAICapabilities('anthropic')
      expect(capabilities.provider).toBe('none')
    })

    it('should ignore empty API keys', () => {
      process.env.OPENAI_API_KEY = ''
      process.env.ANTHROPIC_API_KEY = '   '

      const capabilities = getAICapabilities()
      expect(capabilities.enabled).toBe(false)
    })

    it('should handle undefined API keys', () => {
      delete process.env.OPENAI_API_KEY
      delete process.env.ANTHROPIC_API_KEY

      const capabilities = getAICapabilities()
      expect(capabilities).toEqual({
        enabled: false,
        openai: false,
        anthropic: false,
        provider: 'none',
      })
    })
  })

  describe('isAIAvailable', () => {
    it('should return false when no API keys are set', () => {
      expect(isAIAvailable()).toBe(false)
    })

    it('should return true when OpenAI key is set', () => {
      process.env.OPENAI_API_KEY = 'sk-test-key'
      expect(isAIAvailable()).toBe(true)
    })

    it('should return true when Anthropic key is set', () => {
      process.env.ANTHROPIC_API_KEY = 'sk-ant-test-key'
      expect(isAIAvailable()).toBe(true)
    })

    it('should return true when both keys are set', () => {
      process.env.OPENAI_API_KEY = 'sk-test-key'
      process.env.ANTHROPIC_API_KEY = 'sk-ant-test-key'
      expect(isAIAvailable()).toBe(true)
    })
  })

  describe('getActiveProvider', () => {
    it('should return null when no API keys are set', () => {
      expect(getActiveProvider()).toBeNull()
    })

    it('should return openai when only OpenAI key is set', () => {
      process.env.OPENAI_API_KEY = 'sk-test-key'
      expect(getActiveProvider()).toBe('openai')
    })

    it('should return anthropic when only Anthropic key is set', () => {
      process.env.ANTHROPIC_API_KEY = 'sk-ant-test-key'
      expect(getActiveProvider()).toBe('anthropic')
    })

    it('should return openai when both keys are set (priority)', () => {
      process.env.OPENAI_API_KEY = 'sk-test-key'
      process.env.ANTHROPIC_API_KEY = 'sk-ant-test-key'
      expect(getActiveProvider()).toBe('openai')
    })
  })
})
