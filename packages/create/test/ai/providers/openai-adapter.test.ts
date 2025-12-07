/**
 * Tests for OpenAI Provider Adapter
 * Part of Phase 5: Comprehensive Testing Implementation (TASK-036)
 *
 * Tests the OpenAI adapter with mocked OpenAI SDK.
 */

import type {Result} from '@bfra.me/es/result'
import type {LLMResponse} from '../../../src/types.js'
import {isErr, isOk} from '@bfra.me/es/result'
import {beforeEach, describe, expect, it, vi} from 'vitest'

// Store the mock create function for access in tests
const mockCreate = vi.fn()

// Mock OpenAI SDK before importing the adapter - use factory function
vi.mock('openai', () => {
  const OpenAIMock = vi.fn().mockImplementation(function (this: object) {
    Object.assign(this, {
      chat: {
        completions: {
          create: mockCreate,
        },
      },
    })
  })
  return {default: OpenAIMock}
})

// Import the adapter after mocking
const {createOpenAIAdapter} = await import('../../../src/ai/providers/openai-adapter.js')

/** Helper to assert Result is Ok and return data */
function expectOk<T>(result: Result<T, Error>): T {
  expect(isOk(result)).toBe(true)
  if (!isOk(result)) throw new Error('Expected success')
  return result.data
}

/** Helper to assert Result is Err and return error */
function expectErr(result: Result<unknown, Error>): Error {
  expect(isErr(result)).toBe(true)
  if (!isErr(result)) throw new Error('Expected error')
  return result.error
}

describe('openAI Provider Adapter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCreate.mockReset()
  })

  describe('createOpenAIAdapter', () => {
    it('creates adapter with valid config', () => {
      const adapter = createOpenAIAdapter({
        apiKey: 'test-api-key',
      })

      expect(adapter).toBeDefined()
      expect(adapter.name).toBe('openai')
      expect(adapter.isConfigured).toBeDefined()
      expect(adapter.complete).toBeDefined()
      expect(adapter.healthCheck).toBeDefined()
    })

    it('reports configured when API key provided', () => {
      const adapter = createOpenAIAdapter({
        apiKey: 'test-api-key',
      })

      expect(adapter.isConfigured()).toBe(true)
    })

    it('reports not configured when API key is empty', () => {
      const adapter = createOpenAIAdapter({
        apiKey: '',
      })

      expect(adapter.isConfigured()).toBe(false)
    })

    it('accepts custom baseURL', () => {
      const adapter = createOpenAIAdapter({
        apiKey: 'test-api-key',
        baseURL: 'https://custom.openai.api/v1',
      })

      expect(adapter.isConfigured()).toBe(true)
    })

    it('accepts custom model', () => {
      const adapter = createOpenAIAdapter({
        apiKey: 'test-api-key',
        model: 'gpt-4-turbo',
      })

      expect(adapter.isConfigured()).toBe(true)
    })
  })

  describe('complete method', () => {
    it('returns error when client not initialized', async () => {
      const adapter = createOpenAIAdapter({apiKey: ''})
      const result = await adapter.complete('Test prompt')

      const error = expectErr(result)
      expect(error.message).toContain('not initialized')
    })

    it('returns successful response', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {content: 'Test response'},
            finish_reason: 'stop',
          },
        ],
        model: 'gpt-4',
        usage: {
          prompt_tokens: 10,
          completion_tokens: 20,
          total_tokens: 30,
        },
      })

      const adapter = createOpenAIAdapter({apiKey: 'test-key'})
      const result = await adapter.complete('Test prompt')
      const data = expectOk<LLMResponse>(result)

      expect(data.success).toBe(true)
      expect(data.content).toBe('Test response')
      expect(data.usage).toEqual({
        promptTokens: 10,
        completionTokens: 20,
        totalTokens: 30,
      })
      expect(data.metadata?.provider).toBe('openai')
      expect(data.metadata?.model).toBe('gpt-4')
    })

    it('handles empty response content', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {content: ''},
            finish_reason: 'stop',
          },
        ],
        model: 'gpt-4',
      })

      const adapter = createOpenAIAdapter({apiKey: 'test-key'})
      const result = await adapter.complete('Test prompt')
      const data = expectOk<LLMResponse>(result)

      expect(data.success).toBe(false)
      expect(data.error).toContain('No content')
    })

    it('handles null message content', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {content: null},
            finish_reason: 'stop',
          },
        ],
        model: 'gpt-4',
      })

      const adapter = createOpenAIAdapter({apiKey: 'test-key'})
      const result = await adapter.complete('Test prompt')
      const data = expectOk<LLMResponse>(result)

      expect(data.success).toBe(false)
      expect(data.error).toContain('No content')
    })

    it('handles API errors gracefully', async () => {
      mockCreate.mockRejectedValue(new Error('Rate limit exceeded'))

      const adapter = createOpenAIAdapter({apiKey: 'test-key'})
      const result = await adapter.complete('Test prompt')
      const data = expectOk<LLMResponse>(result)

      expect(data.success).toBe(false)
      expect(data.error).toContain('Rate limit exceeded')
    })

    it('passes custom options to API', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {content: 'Response'},
            finish_reason: 'stop',
          },
        ],
        model: 'gpt-4',
      })

      const adapter = createOpenAIAdapter({apiKey: 'test-key'})

      await adapter.complete('Test prompt', {
        maxTokens: 500,
        temperature: 0.3,
        systemPrompt: 'Custom system prompt',
      })

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          max_tokens: 500,
          temperature: 0.3,
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'system',
              content: 'Custom system prompt',
            }),
          ]),
        }),
      )
    })

    it('uses default options when not provided', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {content: 'Response'},
            finish_reason: 'stop',
          },
        ],
        model: 'gpt-4',
      })

      const adapter = createOpenAIAdapter({apiKey: 'test-key'})

      await adapter.complete('Test prompt')

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          max_tokens: 2000,
          temperature: 0.7,
        }),
      )
    })

    it('uses custom model from config', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {content: 'Response'},
            finish_reason: 'stop',
          },
        ],
        model: 'gpt-4-turbo',
      })

      const adapter = createOpenAIAdapter({
        apiKey: 'test-key',
        model: 'gpt-4-turbo',
      })

      await adapter.complete('Test prompt')

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4-turbo',
        }),
      )
    })

    it('handles response without usage data', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {content: 'Response'},
            finish_reason: 'stop',
          },
        ],
        model: 'gpt-4',
      })

      const adapter = createOpenAIAdapter({apiKey: 'test-key'})
      const result = await adapter.complete('Test prompt')
      const data = expectOk<LLMResponse>(result)

      expect(data.success).toBe(true)
      expect(data.usage).toBeUndefined()
    })
  })

  describe('healthCheck method', () => {
    it('returns error when client not initialized', async () => {
      const adapter = createOpenAIAdapter({apiKey: ''})
      const result = await adapter.healthCheck()

      const error = expectErr(result)
      expect(error.message).toContain('not initialized')
    })

    it('returns true on successful health check', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {content: 'OK'},
            finish_reason: 'stop',
          },
        ],
        model: 'gpt-4',
      })

      const adapter = createOpenAIAdapter({apiKey: 'test-key'})
      const result = await adapter.healthCheck()
      const data = expectOk<boolean>(result)

      expect(data).toBe(true)
    })

    it('returns false on API failure', async () => {
      mockCreate.mockRejectedValue(new Error('API error'))

      const adapter = createOpenAIAdapter({apiKey: 'test-key'})
      const result = await adapter.healthCheck()
      const data = expectOk<boolean>(result)

      expect(data).toBe(false)
    })
  })
})
