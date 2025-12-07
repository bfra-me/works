/**
 * Tests for Anthropic Provider Adapter
 * Part of Phase 5: Comprehensive Testing Implementation (TASK-036)
 *
 * Tests the Anthropic adapter with mocked Anthropic SDK.
 */

import type {Result} from '@bfra.me/es/result'
import type {LLMResponse} from '../../../src/types.js'
import {isErr, isOk} from '@bfra.me/es/result'
import {beforeEach, describe, expect, it, vi} from 'vitest'

// Store the mock create function for access in tests
const mockCreate = vi.fn()

// Mock Anthropic SDK before importing the adapter - use factory function
vi.mock('@anthropic-ai/sdk', () => {
  const AnthropicMock = vi.fn().mockImplementation(function (this: object) {
    Object.assign(this, {
      messages: {
        create: mockCreate,
      },
    })
  })
  return {default: AnthropicMock}
})

// Import the adapter after mocking
const {createAnthropicAdapter} = await import('../../../src/ai/providers/anthropic-adapter.js')

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

describe('anthropic Provider Adapter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCreate.mockReset()
  })

  describe('createAnthropicAdapter', () => {
    it('creates adapter with valid config', () => {
      const adapter = createAnthropicAdapter({
        apiKey: 'test-api-key',
      })

      expect(adapter).toBeDefined()
      expect(adapter.name).toBe('anthropic')
      expect(adapter.isConfigured).toBeDefined()
      expect(adapter.complete).toBeDefined()
      expect(adapter.healthCheck).toBeDefined()
    })

    it('reports configured when API key provided', () => {
      const adapter = createAnthropicAdapter({
        apiKey: 'test-api-key',
      })

      expect(adapter.isConfigured()).toBe(true)
    })

    it('reports not configured when API key is empty', () => {
      const adapter = createAnthropicAdapter({
        apiKey: '',
      })

      expect(adapter.isConfigured()).toBe(false)
    })

    it('accepts custom baseURL', () => {
      const adapter = createAnthropicAdapter({
        apiKey: 'test-api-key',
        baseURL: 'https://custom.anthropic.api/v1',
      })

      expect(adapter.isConfigured()).toBe(true)
    })

    it('accepts custom model', () => {
      const adapter = createAnthropicAdapter({
        apiKey: 'test-api-key',
        model: 'claude-3-opus-20240229',
      })

      expect(adapter.isConfigured()).toBe(true)
    })
  })

  describe('complete method', () => {
    it('returns error when client not initialized', async () => {
      const adapter = createAnthropicAdapter({apiKey: ''})
      const result = await adapter.complete('Test prompt')

      const error = expectErr(result)
      expect(error.message).toContain('not initialized')
    })

    it('returns successful response', async () => {
      mockCreate.mockResolvedValue({
        content: [
          {
            type: 'text',
            text: 'Test response',
          },
        ],
        model: 'claude-3-sonnet-20240229',
        stop_reason: 'end_turn',
        usage: {
          input_tokens: 10,
          output_tokens: 20,
        },
      })

      const adapter = createAnthropicAdapter({apiKey: 'test-key'})
      const result = await adapter.complete('Test prompt')
      const data = expectOk<LLMResponse>(result)

      expect(data.success).toBe(true)
      expect(data.content).toBe('Test response')
      expect(data.usage).toEqual({
        promptTokens: 10,
        completionTokens: 20,
        totalTokens: 30,
      })
      expect(data.metadata?.provider).toBe('anthropic')
      expect(data.metadata?.model).toBe('claude-3-sonnet-20240229')
    })

    it('handles non-text content type', async () => {
      mockCreate.mockResolvedValue({
        content: [
          {
            type: 'image',
            source: {},
          },
        ],
        model: 'claude-3-sonnet-20240229',
      })

      const adapter = createAnthropicAdapter({apiKey: 'test-key'})
      const result = await adapter.complete('Test prompt')
      const data = expectOk<LLMResponse>(result)

      expect(data.success).toBe(false)
      expect(data.error).toContain('No text content')
    })

    it('handles API errors gracefully', async () => {
      mockCreate.mockRejectedValue(new Error('Rate limit exceeded'))

      const adapter = createAnthropicAdapter({apiKey: 'test-key'})
      const result = await adapter.complete('Test prompt')
      const data = expectOk<LLMResponse>(result)

      expect(data.success).toBe(false)
      expect(data.error).toContain('Rate limit exceeded')
    })

    it('passes custom options to API', async () => {
      mockCreate.mockResolvedValue({
        content: [{type: 'text', text: 'Response'}],
        model: 'claude-3-sonnet-20240229',
        usage: {input_tokens: 5, output_tokens: 10},
      })

      const adapter = createAnthropicAdapter({apiKey: 'test-key'})

      await adapter.complete('Test prompt', {
        maxTokens: 500,
        systemPrompt: 'Custom system prompt',
      })

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          max_tokens: 500,
          system: 'Custom system prompt',
        }),
      )
    })

    it('uses default options when not provided', async () => {
      mockCreate.mockResolvedValue({
        content: [{type: 'text', text: 'Response'}],
        model: 'claude-3-sonnet-20240229',
        usage: {input_tokens: 5, output_tokens: 10},
      })

      const adapter = createAnthropicAdapter({apiKey: 'test-key'})

      await adapter.complete('Test prompt')

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          max_tokens: 2000,
        }),
      )
    })

    it('uses custom model from config', async () => {
      mockCreate.mockResolvedValue({
        content: [{type: 'text', text: 'Response'}],
        model: 'claude-3-opus-20240229',
        usage: {input_tokens: 5, output_tokens: 10},
      })

      const adapter = createAnthropicAdapter({
        apiKey: 'test-key',
        model: 'claude-3-opus-20240229',
      })

      await adapter.complete('Test prompt')

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'claude-3-opus-20240229',
        }),
      )
    })
  })

  describe('healthCheck method', () => {
    it('returns error when client not initialized', async () => {
      const adapter = createAnthropicAdapter({apiKey: ''})
      const result = await adapter.healthCheck()

      const error = expectErr(result)
      expect(error.message).toContain('not initialized')
    })

    it('returns true on successful health check', async () => {
      mockCreate.mockResolvedValue({
        content: [{type: 'text', text: 'OK'}],
        model: 'claude-3-sonnet-20240229',
        usage: {input_tokens: 1, output_tokens: 1},
      })

      const adapter = createAnthropicAdapter({apiKey: 'test-key'})
      const result = await adapter.healthCheck()
      const data = expectOk<boolean>(result)

      expect(data).toBe(true)
    })

    it('returns false on API failure', async () => {
      mockCreate.mockRejectedValue(new Error('API error'))

      const adapter = createAnthropicAdapter({apiKey: 'test-key'})
      const result = await adapter.healthCheck()
      const data = expectOk<boolean>(result)

      expect(data).toBe(false)
    })
  })
})
