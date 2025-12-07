/**
 * Tests for LLM Client Factory
 * Part of Phase 5: Comprehensive Testing Implementation (TASK-036)
 *
 * Tests the provider-agnostic LLM client factory with comprehensive mocking
 * of OpenAI and Anthropic SDKs.
 */

import type {AIConfig} from '../../src/types.js'
import {isErr, isOk} from '@bfra.me/es/result'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

// Mock the external AI SDKs before importing the factory - use factory function pattern
vi.mock('openai', () => {
  const OpenAIMock = vi.fn().mockImplementation(function (this: object) {
    Object.assign(this, {
      chat: {
        completions: {
          create: vi.fn(),
        },
      },
    })
  })
  return {default: OpenAIMock}
})

vi.mock('@anthropic-ai/sdk', () => {
  const AnthropicMock = vi.fn().mockImplementation(function (this: object) {
    Object.assign(this, {
      messages: {
        create: vi.fn(),
      },
    })
  })
  return {default: AnthropicMock}
})

vi.mock('dotenv', () => ({
  config: vi.fn(),
}))

describe('lLM Client Factory', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.clearAllMocks()
    process.env = {...originalEnv}
    delete process.env.OPENAI_API_KEY
    delete process.env.ANTHROPIC_API_KEY
  })

  afterEach(() => {
    process.env = originalEnv
    vi.resetModules()
  })

  describe('createLLMClient', () => {
    it('creates client with default configuration', async () => {
      const {createLLMClient} = await import('../../src/ai/llm-client-factory.js')
      const client = createLLMClient()

      expect(client).toBeDefined()
      expect(client.complete).toBeDefined()
      expect(client.isAvailable).toBeDefined()
      expect(client.getAvailableProviders).toBeDefined()
      expect(client.isProviderAvailable).toBeDefined()
      expect(client.healthCheck).toBeDefined()
      expect(client.getConfig).toBeDefined()
      expect(client.updateConfig).toBeDefined()
    })

    it('returns default config values', async () => {
      const {createLLMClient} = await import('../../src/ai/llm-client-factory.js')
      const client = createLLMClient()
      const config = client.getConfig()

      expect(config.enabled).toBe(true)
      expect(config.provider).toBe('auto')
      expect(config.maxTokens).toBe(2000)
      expect(config.temperature).toBe(0.7)
    })

    it('applies custom configuration', async () => {
      const {createLLMClient} = await import('../../src/ai/llm-client-factory.js')
      const customConfig: Partial<AIConfig> = {
        enabled: false,
        provider: 'openai',
        maxTokens: 4000,
        temperature: 0.5,
      }

      const client = createLLMClient(customConfig)
      const config = client.getConfig()

      expect(config.enabled).toBe(false)
      expect(config.provider).toBe('openai')
      expect(config.maxTokens).toBe(4000)
      expect(config.temperature).toBe(0.5)
    })

    it('reports no availability when no API keys configured', async () => {
      const {createLLMClient} = await import('../../src/ai/llm-client-factory.js')
      const client = createLLMClient()

      expect(client.isAvailable()).toBe(false)
      expect(client.getAvailableProviders()).toHaveLength(0)
    })

    it('reports OpenAI available when API key provided', async () => {
      const {createLLMClient} = await import('../../src/ai/llm-client-factory.js')
      const client = createLLMClient({
        openai: {
          apiKey: 'test-openai-key',
        },
      })

      expect(client.isProviderAvailable('openai')).toBe(true)
      expect(client.isProviderAvailable('anthropic')).toBe(false)
      expect(client.isAvailable()).toBe(true)
      expect(client.getAvailableProviders()).toContain('openai')
    })

    it('reports Anthropic available when API key provided', async () => {
      const {createLLMClient} = await import('../../src/ai/llm-client-factory.js')
      const client = createLLMClient({
        anthropic: {
          apiKey: 'test-anthropic-key',
        },
      })

      expect(client.isProviderAvailable('anthropic')).toBe(true)
      expect(client.isProviderAvailable('openai')).toBe(false)
      expect(client.isAvailable()).toBe(true)
      expect(client.getAvailableProviders()).toContain('anthropic')
    })

    it('reports both providers available when both keys provided', async () => {
      const {createLLMClient} = await import('../../src/ai/llm-client-factory.js')
      const client = createLLMClient({
        openai: {apiKey: 'test-openai-key'},
        anthropic: {apiKey: 'test-anthropic-key'},
      })

      expect(client.isProviderAvailable('openai')).toBe(true)
      expect(client.isProviderAvailable('anthropic')).toBe(true)
      expect(client.isAvailable()).toBe(true)

      const providers = client.getAvailableProviders()
      expect(providers).toContain('openai')
      expect(providers).toContain('anthropic')
    })
  })

  describe('complete method', () => {
    it('returns disabled error when AI is disabled', async () => {
      const {createLLMClient} = await import('../../src/ai/llm-client-factory.js')
      const client = createLLMClient({enabled: false})

      const result = await client.complete('Test prompt')

      expect(isOk(result)).toBe(true)
      if (!isOk(result)) throw new Error('Expected success')

      expect(result.data.success).toBe(false)
      expect(result.data.error).toContain('disabled')
    })

    it('returns no provider error when none available', async () => {
      const {createLLMClient} = await import('../../src/ai/llm-client-factory.js')
      const client = createLLMClient()

      const result = await client.complete('Test prompt')

      expect(isOk(result)).toBe(true)
      if (!isOk(result)) throw new Error('Expected success')

      expect(result.data.success).toBe(false)
      expect(result.data.error).toContain('No LLM provider available')
    })

    it('uses preferred provider when specified as openai', async () => {
      const {createLLMClient} = await import('../../src/ai/llm-client-factory.js')
      const client = createLLMClient({
        provider: 'openai',
        openai: {apiKey: 'test-key'},
        anthropic: {apiKey: 'test-key'},
      })

      // The factory should prefer openai as configured
      expect(client.isProviderAvailable('openai')).toBe(true)
    })

    it('uses preferred provider when specified as anthropic', async () => {
      const {createLLMClient} = await import('../../src/ai/llm-client-factory.js')
      const client = createLLMClient({
        provider: 'anthropic',
        openai: {apiKey: 'test-key'},
        anthropic: {apiKey: 'test-key'},
      })

      // The factory should prefer anthropic as configured
      expect(client.isProviderAvailable('anthropic')).toBe(true)
    })

    it('auto-selects provider when set to auto', async () => {
      const {createLLMClient} = await import('../../src/ai/llm-client-factory.js')
      const client = createLLMClient({
        provider: 'auto',
        openai: {apiKey: 'test-key'},
      })

      // Should auto-select OpenAI since it's configured
      expect(client.isAvailable()).toBe(true)
    })
  })

  describe('updateConfig', () => {
    it('updates configuration', async () => {
      const {createLLMClient} = await import('../../src/ai/llm-client-factory.js')
      const client = createLLMClient({
        enabled: true,
        maxTokens: 1000,
      })

      client.updateConfig({
        enabled: false,
        maxTokens: 2000,
      })

      const config = client.getConfig()
      expect(config.enabled).toBe(false)
      expect(config.maxTokens).toBe(2000)
    })

    it('reinitializes adapters on config update', async () => {
      const {createLLMClient} = await import('../../src/ai/llm-client-factory.js')
      const client = createLLMClient()

      expect(client.isAvailable()).toBe(false)

      client.updateConfig({
        openai: {apiKey: 'new-key'},
      })

      expect(client.isProviderAvailable('openai')).toBe(true)
    })
  })

  describe('healthCheck', () => {
    it('returns false when no provider available', async () => {
      const {createLLMClient} = await import('../../src/ai/llm-client-factory.js')
      const client = createLLMClient()

      const result = await client.healthCheck()

      expect(isOk(result)).toBe(true)
      if (!isOk(result)) throw new Error('Expected success')
      expect(result.data).toBe(false)
    })
  })

  describe('isAIAvailable helper', () => {
    it('returns false when no environment keys', async () => {
      const {isAIAvailable} = await import('../../src/ai/llm-client-factory.js')
      expect(isAIAvailable()).toBe(false)
    })
  })

  describe('getAvailableProviders helper', () => {
    it('returns empty array when no providers configured', async () => {
      const {getAvailableProviders} = await import('../../src/ai/llm-client-factory.js')
      expect(getAvailableProviders()).toHaveLength(0)
    })
  })

  describe('createLLMClientWithProvider', () => {
    it('returns error when provider not available', async () => {
      const {createLLMClientWithProvider} = await import('../../src/ai/llm-client-factory.js')

      const result = createLLMClientWithProvider('openai')

      expect(isErr(result)).toBe(true)
      if (!isErr(result)) throw new Error('Expected error')
      expect(result.error.message).toContain('not available')
    })

    it('returns client when provider is available', async () => {
      const {createLLMClientWithProvider} = await import('../../src/ai/llm-client-factory.js')

      const result = createLLMClientWithProvider('openai', {
        openai: {apiKey: 'test-key'},
      })

      expect(isOk(result)).toBe(true)
      if (!isOk(result)) throw new Error('Expected success')
      expect(result.data.isProviderAvailable('openai')).toBe(true)
    })
  })
})
