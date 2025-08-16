import type {AIConfig, LLMOptions, LLMResponse} from '../types.js'
import process from 'node:process'
import Anthropic from '@anthropic-ai/sdk'
import {config} from 'dotenv'
import OpenAI from 'openai'

// Load environment variables
config()

export type LLMProviderName = 'openai' | 'anthropic'

/**
 * Error class for AI-related operations
 */
export class AIError extends Error {
  constructor(
    message: string,
    public code:
      | 'PROVIDER_UNAVAILABLE'
      | 'GENERATION_FAILED'
      | 'INVALID_RESPONSE'
      | 'CONFIG_ERROR' = 'GENERATION_FAILED',
  ) {
    super(message)
    this.name = 'AIError'
  }
}

/**
 * LLM Client for interacting with various language model providers
 */
export class LLMClient {
  private openai?: OpenAI
  private anthropic?: Anthropic
  private config: AIConfig

  constructor(config: Partial<AIConfig> = {}) {
    this.config = {
      enabled: config.enabled ?? true,
      provider: config.provider ?? 'auto',
      maxTokens: config.maxTokens ?? 2000,
      temperature: config.temperature ?? 0.7,
      ...config,
    }

    this.initializeClients()
  }

  /**
   * Check if the specified provider is available
   */
  isProviderAvailable(provider: LLMProviderName): boolean {
    switch (provider) {
      case 'openai':
        return Boolean(this.openai)
      case 'anthropic':
        return Boolean(this.anthropic)
      default:
        return false
    }
  }

  /**
   * Generate a response using the configured LLM provider
   */
  async complete(prompt: string, options?: LLMOptions): Promise<LLMResponse> {
    if (!this.config.enabled) {
      return {
        success: false,
        content: '',
        error: 'AI features are disabled',
      }
    }

    const provider = this.getBestProvider()
    if (!provider) {
      return {
        success: false,
        content: '',
        error: 'No LLM provider available. Please check your API key configuration.',
      }
    }

    try {
      switch (provider) {
        case 'openai':
          return await this.generateOpenAIResponse(prompt, options)
        case 'anthropic':
          return await this.generateAnthropicResponse(prompt, options)
        default:
          return {
            success: false,
            content: '',
            error: `Unsupported provider: ${String(provider)}`,
          }
      }
    } catch (error) {
      return {
        success: false,
        content: '',
        error: `Failed to generate response: ${error instanceof Error ? error.message : String(error)}`,
      }
    }
  }

  /**
   * Check if any LLM provider is available
   */
  isAIAvailable(): boolean {
    return this.getBestProvider() !== null
  }

  /**
   * Get available providers
   */
  getAvailableProviders(): LLMProviderName[] {
    const providers: LLMProviderName[] = []
    if (this.isProviderAvailable('openai')) {
      providers.push('openai')
    }
    if (this.isProviderAvailable('anthropic')) {
      providers.push('anthropic')
    }
    return providers
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<AIConfig>): void {
    this.config = {...this.config, ...newConfig}
    this.initializeClients()
  }

  /**
   * Health check for the current provider
   */
  async healthCheck(): Promise<boolean> {
    const provider = this.getBestProvider()
    if (!provider) return false

    try {
      const response = await this.complete('Test', {maxTokens: 10})
      return response.success
    } catch {
      return false
    }
  }

  private initializeClients(): void {
    // Initialize OpenAI client if API key is available
    const openaiKey = this.config.openai?.apiKey ?? process.env.OPENAI_API_KEY
    if (openaiKey != null && openaiKey.length > 0) {
      try {
        this.openai = new OpenAI({
          apiKey: openaiKey,
          baseURL: this.config.openai?.baseURL,
        })
      } catch (error) {
        console.warn('Failed to initialize OpenAI client:', error)
      }
    }

    // Initialize Anthropic client if API key is available
    const anthropicKey = this.config.anthropic?.apiKey ?? process.env.ANTHROPIC_API_KEY
    if (anthropicKey != null && anthropicKey.length > 0) {
      try {
        this.anthropic = new Anthropic({
          apiKey: anthropicKey,
          baseURL: this.config.anthropic?.baseURL,
        })
      } catch (error) {
        console.warn('Failed to initialize Anthropic client:', error)
      }
    }
  }

  /**
   * Get the best available provider based on configuration
   */
  private getBestProvider(): LLMProviderName | null {
    if (this.config.provider === 'openai' && this.isProviderAvailable('openai')) {
      return 'openai'
    }
    if (this.config.provider === 'anthropic' && this.isProviderAvailable('anthropic')) {
      return 'anthropic'
    }
    if (this.config.provider === 'auto') {
      if (this.isProviderAvailable('openai')) return 'openai'
      if (this.isProviderAvailable('anthropic')) return 'anthropic'
    }
    return null
  }

  /**
   * Generate response using OpenAI
   */
  private async generateOpenAIResponse(prompt: string, options?: LLMOptions): Promise<LLMResponse> {
    if (this.openai == null) {
      throw new AIError('OpenAI client not initialized', 'PROVIDER_UNAVAILABLE')
    }

    const model = this.config.openai?.model ?? 'gpt-4'
    const temperature = options?.temperature ?? this.config.temperature ?? 0.7
    const maxTokens = options?.maxTokens ?? this.config.maxTokens ?? 2000

    try {
      const response = await this.openai.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content:
              options?.systemPrompt ?? 'You are a helpful AI assistant for software development.',
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
        return {
          success: false,
          content: '',
          error: 'No content in OpenAI response',
        }
      }

      return {
        success: true,
        content: choice.message.content,
        usage:
          response.usage == null
            ? undefined
            : {
                promptTokens: response.usage.prompt_tokens,
                completionTokens: response.usage.completion_tokens,
                totalTokens: response.usage.total_tokens,
              },
        metadata: {
          provider: 'openai',
          model: response.model,
          finishReason: choice.finish_reason,
        },
      }
    } catch (error) {
      return {
        success: false,
        content: '',
        error: `OpenAI API error: ${error instanceof Error ? error.message : String(error)}`,
      }
    }
  }

  /**
   * Generate response using Anthropic Claude
   */
  private async generateAnthropicResponse(
    prompt: string,
    options?: LLMOptions,
  ): Promise<LLMResponse> {
    if (this.anthropic == null) {
      throw new AIError('Anthropic client not initialized', 'PROVIDER_UNAVAILABLE')
    }

    const model = this.config.anthropic?.model ?? 'claude-3-sonnet-20240229'
    const maxTokens = options?.maxTokens ?? this.config.maxTokens ?? 2000

    const systemPrompt =
      options?.systemPrompt ?? 'You are a helpful AI assistant for software development.'

    try {
      const response = await this.anthropic.messages.create({
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
        return {
          success: false,
          content: '',
          error: 'No text content in Anthropic response',
        }
      }

      return {
        success: true,
        content: content.text,
        usage:
          response.usage == null
            ? undefined
            : {
                promptTokens: response.usage.input_tokens,
                completionTokens: response.usage.output_tokens,
                totalTokens: response.usage.input_tokens + response.usage.output_tokens,
              },
        metadata: {
          provider: 'anthropic',
          model: response.model,
          stopReason: response.stop_reason,
        },
      }
    } catch (error) {
      return {
        success: false,
        content: '',
        error: `Anthropic API error: ${error instanceof Error ? error.message : String(error)}`,
      }
    }
  }
}

/**
 * Create a default LLM client instance
 */
export function createLLMClient(config?: Partial<AIConfig>): LLMClient {
  return new LLMClient(config)
}

/**
 * Check if any LLM provider is available
 */
export function isAIAvailable(): boolean {
  const client = new LLMClient()
  return client.isAIAvailable()
}
