/**
 * Anthropic Provider Adapter
 * Part of Phase 3: AI System Modernization
 *
 * Implements the LLMProviderAdapter interface for Anthropic Claude.
 */

import type {Result} from '@bfra.me/es/result'
import type {LLMOptions, LLMResponse} from '../../types.js'
import type {LLMProviderAdapter, ProviderConfig} from './types.js'
import Anthropic from '@anthropic-ai/sdk'
import {err, isOk, ok} from '@bfra.me/es/result'
import {AIErrorCode, createAIError} from '../../utils/errors.js'

/** Default model for Anthropic completions */
const DEFAULT_MODEL = 'claude-3-sonnet-20240229'

/** Default system prompt for Anthropic */
const DEFAULT_SYSTEM_PROMPT = 'You are a helpful AI assistant for software development.'

/**
 * Creates an Anthropic provider adapter
 */
export function createAnthropicAdapter(config: ProviderConfig): LLMProviderAdapter {
  const initializeClient = (): Anthropic | undefined => {
    if (config.apiKey.length === 0) {
      return undefined
    }
    try {
      return new Anthropic({
        apiKey: config.apiKey,
        baseURL: config.baseURL,
      })
    } catch {
      return undefined
    }
  }

  const client = initializeClient()

  const isConfigured = (): boolean => {
    return client != null
  }

  const complete = async (
    prompt: string,
    options?: LLMOptions,
  ): Promise<Result<LLMResponse, Error>> => {
    if (client == null) {
      return err(
        createAIError('Anthropic client not initialized', AIErrorCode.AI_PROVIDER_UNAVAILABLE),
      )
    }

    const model = config.model ?? DEFAULT_MODEL
    const maxTokens = options?.maxTokens ?? 2000
    const systemPrompt = options?.systemPrompt ?? DEFAULT_SYSTEM_PROMPT

    try {
      const response = await client.messages.create({
        model,
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      })

      const content = response.content[0]
      if (content?.type !== 'text') {
        return ok({
          success: false,
          content: '',
          error: 'No text content in Anthropic response',
        })
      }

      const usage = response.usage
      return ok({
        success: true,
        content: content.text,
        usage:
          usage == null
            ? undefined
            : {
                promptTokens: usage.input_tokens,
                completionTokens: usage.output_tokens,
                totalTokens: usage.input_tokens + usage.output_tokens,
              },
        metadata: {
          provider: 'anthropic',
          model: response.model,
          stopReason: response.stop_reason,
        },
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return ok({
        success: false,
        content: '',
        error: `Anthropic API error: ${message}`,
      })
    }
  }

  const healthCheck = async (): Promise<Result<boolean, Error>> => {
    if (client == null) {
      return err(
        createAIError('Anthropic client not initialized', AIErrorCode.AI_PROVIDER_UNAVAILABLE),
      )
    }

    try {
      const response = await complete('Test', {maxTokens: 10})
      if (isOk(response)) {
        return ok(response.data.success)
      }
      return ok(false)
    } catch {
      return ok(false)
    }
  }

  return {
    name: 'anthropic',
    isConfigured,
    complete,
    healthCheck,
  }
}
