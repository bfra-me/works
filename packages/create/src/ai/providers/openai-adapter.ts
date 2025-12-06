/**
 * OpenAI Provider Adapter
 * Part of Phase 3: AI System Modernization
 *
 * Implements the LLMProviderAdapter interface for OpenAI.
 */

import type {Result} from '@bfra.me/es/result'
import type {LLMOptions, LLMResponse} from '../../types.js'
import type {LLMProviderAdapter, ProviderConfig} from './types.js'
import {err, isOk, ok} from '@bfra.me/es/result'
import OpenAI from 'openai'
import {AIErrorCode, createAIError} from '../../utils/errors.js'

/** Default model for OpenAI completions */
const DEFAULT_MODEL = 'gpt-4'

/** Default system prompt for OpenAI */
const DEFAULT_SYSTEM_PROMPT = 'You are a helpful AI assistant for software development.'

/**
 * Creates an OpenAI provider adapter
 */
export function createOpenAIAdapter(config: ProviderConfig): LLMProviderAdapter {
  const initializeClient = (): OpenAI | undefined => {
    if (config.apiKey.length === 0) {
      return undefined
    }
    try {
      return new OpenAI({
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
        createAIError('OpenAI client not initialized', AIErrorCode.AI_PROVIDER_UNAVAILABLE),
      )
    }

    const model = config.model ?? DEFAULT_MODEL
    const temperature = options?.temperature ?? 0.7
    const maxTokens = options?.maxTokens ?? 2000
    const systemPrompt = options?.systemPrompt ?? DEFAULT_SYSTEM_PROMPT

    try {
      const response = await client.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature,
        max_tokens: maxTokens,
        stream: false,
      })

      const choice = response.choices[0]
      if (choice?.message?.content == null || choice.message.content.length === 0) {
        return ok({
          success: false,
          content: '',
          error: 'No content in OpenAI response',
        })
      }

      const usage = response.usage
      return ok({
        success: true,
        content: choice.message.content,
        usage:
          usage == null
            ? undefined
            : {
                promptTokens: usage.prompt_tokens,
                completionTokens: usage.completion_tokens,
                totalTokens: usage.total_tokens,
              },
        metadata: {
          provider: 'openai',
          model: response.model,
          finishReason: choice.finish_reason,
        },
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return ok({
        success: false,
        content: '',
        error: `OpenAI API error: ${message}`,
      })
    }
  }

  const healthCheck = async (): Promise<Result<boolean, Error>> => {
    if (client == null) {
      return err(
        createAIError('OpenAI client not initialized', AIErrorCode.AI_PROVIDER_UNAVAILABLE),
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
    name: 'openai',
    isConfigured,
    complete,
    healthCheck,
  }
}
