/**
 * Tests for Provider Types Helper Functions
 * Part of Phase 5: Comprehensive Testing Implementation (TASK-036)
 *
 * Tests the helper functions in provider types.
 */

import type {AIConfig} from '../../../src/types.js'
import {describe, expect, it} from 'vitest'
import {createClientConfig, extractProviderConfig} from '../../../src/ai/providers/types.js'

describe('provider Types', () => {
  describe('extractProviderConfig', () => {
    it('extracts OpenAI config when present', () => {
      const aiConfig: AIConfig = {
        enabled: true,
        provider: 'openai',
        maxTokens: 2000,
        temperature: 0.7,
        openai: {
          apiKey: 'test-openai-key',
          baseURL: 'https://custom.api',
          model: 'gpt-4-turbo',
        },
      }

      const result = extractProviderConfig(aiConfig, 'openai')

      expect(result).toBeDefined()
      expect(result?.apiKey).toBe('test-openai-key')
      expect(result?.baseURL).toBe('https://custom.api')
      expect(result?.model).toBe('gpt-4-turbo')
    })

    it('extracts Anthropic config when present', () => {
      const aiConfig: AIConfig = {
        enabled: true,
        provider: 'anthropic',
        maxTokens: 2000,
        temperature: 0.7,
        anthropic: {
          apiKey: 'test-anthropic-key',
          model: 'claude-3-opus',
        },
      }

      const result = extractProviderConfig(aiConfig, 'anthropic')

      expect(result).toBeDefined()
      expect(result?.apiKey).toBe('test-anthropic-key')
      expect(result?.model).toBe('claude-3-opus')
    })

    it('returns undefined when provider config is missing', () => {
      const aiConfig: AIConfig = {
        enabled: true,
        provider: 'openai',
        maxTokens: 2000,
        temperature: 0.7,
      }

      const result = extractProviderConfig(aiConfig, 'openai')

      expect(result).toBeUndefined()
    })

    it('returns undefined when API key is empty', () => {
      const aiConfig: AIConfig = {
        enabled: true,
        provider: 'openai',
        maxTokens: 2000,
        temperature: 0.7,
        openai: {
          apiKey: '',
          model: 'gpt-4',
        },
      }

      const result = extractProviderConfig(aiConfig, 'openai')

      expect(result).toBeUndefined()
    })
  })

  describe('createClientConfig', () => {
    it('creates config with defaults when empty config provided', () => {
      const result = createClientConfig({})

      expect(result.enabled).toBe(true)
      expect(result.provider).toBe('auto')
      expect(result.maxTokens).toBe(2000)
      expect(result.temperature).toBe(0.7)
      expect(result.openai).toBeUndefined()
      expect(result.anthropic).toBeUndefined()
    })

    it('uses provided values over defaults', () => {
      const config: Partial<AIConfig> = {
        enabled: false,
        provider: 'anthropic',
        maxTokens: 4000,
        temperature: 0.5,
      }

      const result = createClientConfig(config)

      expect(result.enabled).toBe(false)
      expect(result.provider).toBe('anthropic')
      expect(result.maxTokens).toBe(4000)
      expect(result.temperature).toBe(0.5)
    })

    it('includes OpenAI config when API key provided', () => {
      const config: Partial<AIConfig> = {
        openai: {
          apiKey: 'test-key',
          model: 'gpt-4',
        },
      }

      const result = createClientConfig(config)

      expect(result.openai).toBeDefined()
      expect(result.openai?.apiKey).toBe('test-key')
      expect(result.openai?.model).toBe('gpt-4')
    })

    it('excludes OpenAI config when API key not provided', () => {
      const config: Partial<AIConfig> = {
        openai: {
          model: 'gpt-4',
        } as AIConfig['openai'],
      }

      const result = createClientConfig(config)

      expect(result.openai).toBeUndefined()
    })

    it('includes Anthropic config when API key provided', () => {
      const config: Partial<AIConfig> = {
        anthropic: {
          apiKey: 'test-key',
          model: 'claude-3',
        },
      }

      const result = createClientConfig(config)

      expect(result.anthropic).toBeDefined()
      expect(result.anthropic?.apiKey).toBe('test-key')
      expect(result.anthropic?.model).toBe('claude-3')
    })

    it('excludes Anthropic config when API key not provided', () => {
      const config: Partial<AIConfig> = {
        anthropic: {
          model: 'claude-3',
        } as AIConfig['anthropic'],
      }

      const result = createClientConfig(config)

      expect(result.anthropic).toBeUndefined()
    })

    it('handles both providers', () => {
      const config: Partial<AIConfig> = {
        openai: {
          apiKey: 'openai-key',
        },
        anthropic: {
          apiKey: 'anthropic-key',
        },
      }

      const result = createClientConfig(config)

      expect(result.openai).toBeDefined()
      expect(result.anthropic).toBeDefined()
    })
  })
})
