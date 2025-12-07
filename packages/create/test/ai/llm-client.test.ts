import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

const mockOpenAICreate = vi.fn()
const mockAnthropicCreate = vi.fn()

vi.mock('openai', () => ({
  default: class MockOpenAI {
    chat = {
      completions: {
        create: mockOpenAICreate,
      },
    }

    constructor(config: {apiKey: string; baseURL?: string}) {
      if (!config.apiKey) {
        throw new Error('API key is required')
      }
    }
  },
}))

vi.mock('@anthropic-ai/sdk', () => ({
  default: class MockAnthropic {
    messages = {
      create: mockAnthropicCreate,
    }

    constructor(config: {apiKey: string; baseURL?: string}) {
      if (!config.apiKey) {
        throw new Error('API key is required')
      }
    }
  },
}))

vi.mock('dotenv', () => ({
  config: vi.fn(),
}))

const {LLMClient, createLLMClient, isAIAvailable, AIError} =
  await import('../../src/ai/llm-client.js')

describe('LLMClient', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.clearAllMocks()
    process.env = {...originalEnv}
    delete process.env.OPENAI_API_KEY
    delete process.env.ANTHROPIC_API_KEY
  })

  afterEach(() => {
    vi.restoreAllMocks()
    process.env = originalEnv
  })

  describe('constructor', () => {
    it('should create instance with default config', () => {
      const client = new LLMClient()
      expect(client).toBeInstanceOf(LLMClient)
    })

    it('should create instance with custom config', () => {
      const config = {provider: 'openai' as const, maxTokens: 4000}
      const client = new LLMClient(config)
      expect(client).toBeInstanceOf(LLMClient)
    })

    it('should initialize OpenAI client when API key is provided', () => {
      const client = new LLMClient({openai: {apiKey: 'test-key'}})
      expect(client.isProviderAvailable('openai')).toBe(true)
    })

    it('should initialize OpenAI client from environment variable', () => {
      process.env.OPENAI_API_KEY = 'env-test-key'
      const client = new LLMClient()
      expect(client.isProviderAvailable('openai')).toBe(true)
    })

    it('should initialize Anthropic client when API key is provided', () => {
      const client = new LLMClient({anthropic: {apiKey: 'test-key'}})
      expect(client.isProviderAvailable('anthropic')).toBe(true)
    })

    it('should initialize Anthropic client from environment variable', () => {
      process.env.ANTHROPIC_API_KEY = 'env-test-key'
      const client = new LLMClient()
      expect(client.isProviderAvailable('anthropic')).toBe(true)
    })
  })

  describe('isProviderAvailable', () => {
    it('should return false when no providers are configured', () => {
      const client = new LLMClient()
      expect(client.isProviderAvailable('openai')).toBe(false)
      expect(client.isProviderAvailable('anthropic')).toBe(false)
    })

    it('should return true for configured openai provider', () => {
      const client = new LLMClient({openai: {apiKey: 'test'}})
      expect(client.isProviderAvailable('openai')).toBe(true)
    })

    it('should return true for configured anthropic provider', () => {
      const client = new LLMClient({anthropic: {apiKey: 'test'}})
      expect(client.isProviderAvailable('anthropic')).toBe(true)
    })

    it('should return false for unsupported provider', () => {
      const client = new LLMClient({openai: {apiKey: 'test'}})
      expect(client.isProviderAvailable('unknown' as any)).toBe(false)
    })
  })

  describe('isAIAvailable', () => {
    it('should return false when no providers are configured', () => {
      const client = new LLMClient()
      expect(client.isAIAvailable()).toBe(false)
    })

    it('should return true when OpenAI is configured', () => {
      const client = new LLMClient({openai: {apiKey: 'test'}})
      expect(client.isAIAvailable()).toBe(true)
    })

    it('should return true when Anthropic is configured', () => {
      const client = new LLMClient({anthropic: {apiKey: 'test'}})
      expect(client.isAIAvailable()).toBe(true)
    })
  })

  describe('getAvailableProviders', () => {
    it('should return empty array when no providers configured', () => {
      const client = new LLMClient()
      expect(client.getAvailableProviders()).toEqual([])
    })

    it('should return openai when OpenAI is configured', () => {
      const client = new LLMClient({openai: {apiKey: 'test'}})
      expect(client.getAvailableProviders()).toContain('openai')
    })

    it('should return anthropic when Anthropic is configured', () => {
      const client = new LLMClient({anthropic: {apiKey: 'test'}})
      expect(client.getAvailableProviders()).toContain('anthropic')
    })

    it('should return both when both are configured', () => {
      const client = new LLMClient({
        openai: {apiKey: 'test-openai'},
        anthropic: {apiKey: 'test-anthropic'},
      })
      const providers = client.getAvailableProviders()
      expect(providers).toContain('openai')
      expect(providers).toContain('anthropic')
    })
  })

  describe('updateConfig', () => {
    it('should update configuration', () => {
      const client = new LLMClient()
      expect(client.isProviderAvailable('openai')).toBe(false)

      client.updateConfig({openai: {apiKey: 'new-key'}})
      expect(client.isProviderAvailable('openai')).toBe(true)
    })

    it('should re-initialize clients', () => {
      const client = new LLMClient({openai: {apiKey: 'old-key'}})
      client.updateConfig({anthropic: {apiKey: 'new-key'}})
      expect(client.isProviderAvailable('anthropic')).toBe(true)
    })
  })

  describe('complete', () => {
    it('should return error when AI is disabled', async () => {
      const client = new LLMClient({enabled: false, openai: {apiKey: 'test'}})
      const result = await client.complete('test prompt')

      expect(result.success).toBe(false)
      expect(result.error).toBe('AI features are disabled')
    })

    it('should return error when no provider is available', async () => {
      const client = new LLMClient()
      const result = await client.complete('test prompt')

      expect(result.success).toBe(false)
      expect(result.error).toContain('No LLM provider available')
    })

    it('should use OpenAI when configured', async () => {
      mockOpenAICreate.mockResolvedValueOnce({
        choices: [{message: {content: 'OpenAI response'}, finish_reason: 'stop'}],
        model: 'gpt-4',
        usage: {prompt_tokens: 10, completion_tokens: 20, total_tokens: 30},
      })

      const client = new LLMClient({openai: {apiKey: 'test'}})
      const result = await client.complete('test prompt')

      expect(result.success).toBe(true)
      expect(result.content).toBe('OpenAI response')
      expect(mockOpenAICreate).toHaveBeenCalled()
    })

    it('should use Anthropic when configured as provider', async () => {
      mockAnthropicCreate.mockResolvedValueOnce({
        content: [{type: 'text', text: 'Anthropic response'}],
        model: 'claude-3-sonnet',
        stop_reason: 'end_turn',
        usage: {input_tokens: 10, output_tokens: 20},
      })

      const client = new LLMClient({
        provider: 'anthropic',
        anthropic: {apiKey: 'test'},
      })
      const result = await client.complete('test prompt')

      expect(result.success).toBe(true)
      expect(result.content).toBe('Anthropic response')
      expect(mockAnthropicCreate).toHaveBeenCalled()
    })

    it('should handle empty OpenAI response', async () => {
      mockOpenAICreate.mockResolvedValueOnce({
        choices: [{message: {content: ''}}],
      })

      const client = new LLMClient({openai: {apiKey: 'test'}})
      const result = await client.complete('test prompt')

      expect(result.success).toBe(false)
      expect(result.error).toContain('No content')
    })

    it('should handle non-text Anthropic response', async () => {
      mockAnthropicCreate.mockResolvedValueOnce({
        content: [{type: 'image', source: {}}],
      })

      const client = new LLMClient({
        provider: 'anthropic',
        anthropic: {apiKey: 'test'},
      })
      const result = await client.complete('test prompt')

      expect(result.success).toBe(false)
      expect(result.error).toContain('No text content')
    })

    it('should handle OpenAI API errors', async () => {
      mockOpenAICreate.mockRejectedValueOnce(new Error('API rate limit'))

      const client = new LLMClient({openai: {apiKey: 'test'}})
      const result = await client.complete('test prompt')

      expect(result.success).toBe(false)
      expect(result.error).toContain('OpenAI API error')
    })

    it('should handle Anthropic API errors', async () => {
      mockAnthropicCreate.mockRejectedValueOnce(new Error('API rate limit'))

      const client = new LLMClient({
        provider: 'anthropic',
        anthropic: {apiKey: 'test'},
      })
      const result = await client.complete('test prompt')

      expect(result.success).toBe(false)
      expect(result.error).toContain('Anthropic API error')
    })

    it('should pass custom options to OpenAI', async () => {
      mockOpenAICreate.mockResolvedValueOnce({
        choices: [{message: {content: 'response'}}],
      })

      const client = new LLMClient({openai: {apiKey: 'test'}})
      await client.complete('test prompt', {
        temperature: 0.5,
        maxTokens: 1000,
        systemPrompt: 'Custom system prompt',
      })

      expect(mockOpenAICreate).toHaveBeenCalledWith(
        expect.objectContaining({
          temperature: 0.5,
          max_tokens: 1000,
          messages: expect.arrayContaining([
            expect.objectContaining({role: 'system', content: 'Custom system prompt'}),
          ]),
        }),
      )
    })

    it('should pass custom options to Anthropic', async () => {
      mockAnthropicCreate.mockResolvedValueOnce({
        content: [{type: 'text', text: 'response'}],
      })

      const client = new LLMClient({
        provider: 'anthropic',
        anthropic: {apiKey: 'test'},
      })
      await client.complete('test prompt', {
        maxTokens: 1000,
        systemPrompt: 'Custom system prompt',
      })

      expect(mockAnthropicCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          max_tokens: 1000,
          system: 'Custom system prompt',
        }),
      )
    })

    it('should include usage stats in response', async () => {
      mockOpenAICreate.mockResolvedValueOnce({
        choices: [{message: {content: 'response'}}],
        usage: {prompt_tokens: 10, completion_tokens: 20, total_tokens: 30},
      })

      const client = new LLMClient({openai: {apiKey: 'test'}})
      const result = await client.complete('test prompt')

      expect(result.usage).toEqual({
        promptTokens: 10,
        completionTokens: 20,
        totalTokens: 30,
      })
    })
  })

  describe('healthCheck', () => {
    it('should return false when no provider available', async () => {
      const client = new LLMClient()
      const result = await client.healthCheck()
      expect(result).toBe(false)
    })

    it('should return true when provider responds successfully', async () => {
      mockOpenAICreate.mockResolvedValueOnce({
        choices: [{message: {content: 'ok'}}],
      })

      const client = new LLMClient({openai: {apiKey: 'test'}})
      const result = await client.healthCheck()
      expect(result).toBe(true)
    })

    it('should return false when provider fails', async () => {
      mockOpenAICreate.mockRejectedValueOnce(new Error('API error'))

      const client = new LLMClient({openai: {apiKey: 'test'}})
      const result = await client.healthCheck()
      expect(result).toBe(false)
    })
  })

  describe('provider selection', () => {
    it('should prefer specified provider over auto', async () => {
      mockAnthropicCreate.mockResolvedValueOnce({
        content: [{type: 'text', text: 'Anthropic'}],
      })

      const client = new LLMClient({
        provider: 'anthropic',
        openai: {apiKey: 'test-openai'},
        anthropic: {apiKey: 'test-anthropic'},
      })
      await client.complete('test')

      expect(mockAnthropicCreate).toHaveBeenCalled()
      expect(mockOpenAICreate).not.toHaveBeenCalled()
    })

    it('should auto-select openai first when both available', async () => {
      mockOpenAICreate.mockResolvedValueOnce({
        choices: [{message: {content: 'OpenAI'}}],
      })

      const client = new LLMClient({
        provider: 'auto',
        openai: {apiKey: 'test-openai'},
        anthropic: {apiKey: 'test-anthropic'},
      })
      await client.complete('test')

      expect(mockOpenAICreate).toHaveBeenCalled()
      expect(mockAnthropicCreate).not.toHaveBeenCalled()
    })

    it('should return error for unsupported provider', async () => {
      const client = new LLMClient({provider: 'unsupported' as any})
      const result = await client.complete('test')

      expect(result.success).toBe(false)
    })
  })
})

describe('createLLMClient factory', () => {
  it('should create LLMClient instance', () => {
    const client = createLLMClient()
    expect(client).toBeInstanceOf(LLMClient)
  })

  it('should pass config to LLMClient', () => {
    const client = createLLMClient({maxTokens: 5000})
    expect(client).toBeInstanceOf(LLMClient)
  })
})

describe('isAIAvailable helper', () => {
  it('should return false when no providers configured', () => {
    const originalOpenAI = process.env.OPENAI_API_KEY
    const originalAnthropic = process.env.ANTHROPIC_API_KEY
    delete process.env.OPENAI_API_KEY
    delete process.env.ANTHROPIC_API_KEY

    const result = isAIAvailable()

    expect(result).toBe(false)

    process.env.OPENAI_API_KEY = originalOpenAI
    process.env.ANTHROPIC_API_KEY = originalAnthropic
  })
})

describe('AIError', () => {
  it('should create error with default code', () => {
    const error = new AIError('Test error')
    expect(error.message).toBe('Test error')
    expect(error.code).toBe('GENERATION_FAILED')
    expect(error.name).toBe('AIError')
  })

  it('should create error with custom code', () => {
    const error = new AIError('Test error', 'PROVIDER_UNAVAILABLE')
    expect(error.code).toBe('PROVIDER_UNAVAILABLE')
  })
})
