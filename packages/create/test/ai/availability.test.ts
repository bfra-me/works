/**
 * Tests for AI Availability Detection
 * Part of Phase 5: Comprehensive Testing Implementation (TASK-036)
 *
 * Tests pure functions for detecting AI provider availability.
 */

import {afterEach, beforeEach, describe, expect, it} from 'vitest'
import {
  checkAllProvidersAvailability,
  checkAnthropicAvailability,
  checkOpenAIAvailability,
  getAIAvailabilityStatus,
} from '../../src/ai/availability.js'

describe('aI Availability Detection', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = {...originalEnv}
    delete process.env.OPENAI_API_KEY
    delete process.env.ANTHROPIC_API_KEY
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('checkOpenAIAvailability', () => {
    it('returns unavailable when no API key', () => {
      const result = checkOpenAIAvailability()

      expect(result.provider).toBe('openai')
      expect(result.available).toBe(false)
      expect(result.reason).toContain('not set')
    })

    it('returns unavailable when API key is empty', () => {
      process.env.OPENAI_API_KEY = ''

      const result = checkOpenAIAvailability()

      expect(result.available).toBe(false)
    })

    it('returns unavailable when API key format is invalid', () => {
      process.env.OPENAI_API_KEY = 'invalid-key'

      const result = checkOpenAIAvailability()

      expect(result.available).toBe(false)
      expect(result.reason).toContain('Invalid')
    })

    it('returns available when valid API key from env', () => {
      process.env.OPENAI_API_KEY = 'sk-test-valid-key'

      const result = checkOpenAIAvailability()

      expect(result.provider).toBe('openai')
      expect(result.available).toBe(true)
      expect(result.reason).toBeUndefined()
    })

    it('uses config API key over environment', () => {
      process.env.OPENAI_API_KEY = 'sk-env-key'

      const result = checkOpenAIAvailability({
        openai: {
          apiKey: 'sk-config-key',
        },
      })

      expect(result.available).toBe(true)
    })

    it('returns unavailable when config key is empty', () => {
      process.env.OPENAI_API_KEY = 'sk-env-key'

      const result = checkOpenAIAvailability({
        openai: {
          apiKey: '',
        },
      })

      expect(result.available).toBe(false)
    })
  })

  describe('checkAnthropicAvailability', () => {
    it('returns unavailable when no API key', () => {
      const result = checkAnthropicAvailability()

      expect(result.provider).toBe('anthropic')
      expect(result.available).toBe(false)
      expect(result.reason).toContain('not set')
    })

    it('returns unavailable when API key is empty', () => {
      process.env.ANTHROPIC_API_KEY = ''

      const result = checkAnthropicAvailability()

      expect(result.available).toBe(false)
    })

    it('returns unavailable when API key format is invalid', () => {
      process.env.ANTHROPIC_API_KEY = 'invalid-key'

      const result = checkAnthropicAvailability()

      expect(result.available).toBe(false)
      expect(result.reason).toContain('Invalid')
    })

    it('returns available when valid API key from env', () => {
      process.env.ANTHROPIC_API_KEY = 'sk-ant-test-valid-key'

      const result = checkAnthropicAvailability()

      expect(result.provider).toBe('anthropic')
      expect(result.available).toBe(true)
      expect(result.reason).toBeUndefined()
    })

    it('uses config API key over environment', () => {
      process.env.ANTHROPIC_API_KEY = 'sk-ant-env-key'

      const result = checkAnthropicAvailability({
        anthropic: {
          apiKey: 'sk-ant-config-key',
        },
      })

      expect(result.available).toBe(true)
    })
  })

  describe('checkAllProvidersAvailability', () => {
    it('returns results for all providers', () => {
      const results = checkAllProvidersAvailability()

      expect(results).toHaveLength(2)
      expect(results.map(r => r.provider)).toContain('openai')
      expect(results.map(r => r.provider)).toContain('anthropic')
    })

    it('marks both available when both keys set', () => {
      process.env.OPENAI_API_KEY = 'sk-openai-key'
      process.env.ANTHROPIC_API_KEY = 'sk-ant-anthropic-key'

      const results = checkAllProvidersAvailability()

      expect(results.every(r => r.available)).toBe(true)
    })

    it('marks only one available when one key set', () => {
      process.env.OPENAI_API_KEY = 'sk-openai-key'

      const results = checkAllProvidersAvailability()

      const openaiResult = results.find(r => r.provider === 'openai')
      const anthropicResult = results.find(r => r.provider === 'anthropic')

      expect(openaiResult?.available).toBe(true)
      expect(anthropicResult?.available).toBe(false)
    })
  })

  describe('getAIAvailabilityStatus', () => {
    it('returns unavailable when AI disabled in config', () => {
      process.env.OPENAI_API_KEY = 'sk-valid-key'

      const status = getAIAvailabilityStatus({enabled: false})

      expect(status.available).toBe(false)
      expect(status.providers).toHaveLength(0)
      expect(status.preferredProvider).toBeUndefined()
      expect(status.reason).toContain('disabled')
    })

    it('returns unavailable when no providers available', () => {
      const status = getAIAvailabilityStatus()

      expect(status.available).toBe(false)
      expect(status.providers).toHaveLength(0)
      expect(status.preferredProvider).toBeUndefined()
      expect(status.reason).toContain('No AI providers')
    })

    it('returns available with single provider', () => {
      process.env.OPENAI_API_KEY = 'sk-valid-key'

      const status = getAIAvailabilityStatus()

      expect(status.available).toBe(true)
      expect(status.providers).toContain('openai')
      expect(status.preferredProvider).toBe('openai')
    })

    it('returns available with both providers', () => {
      process.env.OPENAI_API_KEY = 'sk-openai-key'
      process.env.ANTHROPIC_API_KEY = 'sk-ant-anthropic-key'

      const status = getAIAvailabilityStatus()

      expect(status.available).toBe(true)
      expect(status.providers).toContain('openai')
      expect(status.providers).toContain('anthropic')
    })

    it('respects provider preference in config', () => {
      process.env.OPENAI_API_KEY = 'sk-openai-key'
      process.env.ANTHROPIC_API_KEY = 'sk-ant-anthropic-key'

      const status = getAIAvailabilityStatus({provider: 'anthropic'})

      expect(status.preferredProvider).toBe('anthropic')
    })

    it('falls back to available provider when preferred not available', () => {
      process.env.OPENAI_API_KEY = 'sk-openai-key'

      const status = getAIAvailabilityStatus({provider: 'anthropic'})

      expect(status.available).toBe(true)
      expect(status.preferredProvider).toBe('openai')
    })
  })
})
