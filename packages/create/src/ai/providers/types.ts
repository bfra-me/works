/**
 * Provider adapter types for the AI system
 * Part of Phase 3: AI System Modernization
 *
 * Defines the interfaces for provider-agnostic AI integration using the adapter pattern.
 */

import type {Result} from '@bfra.me/es/result'
import type {AIConfig, LLMOptions, LLMResponse} from '../../types.js'

/**
 * Supported LLM provider names
 */
export type LLMProviderName = 'openai' | 'anthropic'

/**
 * Provider-specific configuration
 */
export interface ProviderConfig {
  /** API key for authentication */
  apiKey: string
  /** Optional base URL override */
  baseURL?: string
  /** Model to use */
  model?: string
}

/**
 * Provider adapter interface - unified abstraction over different AI providers
 */
export interface LLMProviderAdapter {
  /** Provider identifier */
  readonly name: LLMProviderName
  /** Check if the provider is properly configured */
  readonly isConfigured: () => boolean
  /** Generate a completion from the provider */
  readonly complete: (prompt: string, options?: LLMOptions) => Promise<Result<LLMResponse, Error>>
  /** Perform a health check */
  readonly healthCheck: () => Promise<Result<boolean, Error>>
}

/**
 * Factory function type for creating provider adapters
 */
export type ProviderAdapterFactory = (config: ProviderConfig) => LLMProviderAdapter

/**
 * LLM Client configuration with provider-specific settings
 */
export interface LLMClientConfig {
  /** Whether AI features are enabled */
  enabled: boolean
  /** Preferred provider ('openai', 'anthropic', or 'auto' for automatic selection) */
  provider: LLMProviderName | 'auto'
  /** Maximum tokens for AI responses */
  maxTokens: number
  /** Temperature for AI responses (0-1) */
  temperature: number
  /** OpenAI-specific configuration */
  openai?: ProviderConfig
  /** Anthropic-specific configuration */
  anthropic?: ProviderConfig
}

/**
 * LLM Client interface for the functional factory
 */
export interface LLMClientInstance {
  /** Generate a completion using the best available provider */
  readonly complete: (prompt: string, options?: LLMOptions) => Promise<Result<LLMResponse, Error>>
  /** Check if any provider is available */
  readonly isAvailable: () => boolean
  /** Get list of available providers */
  readonly getAvailableProviders: () => LLMProviderName[]
  /** Check if a specific provider is available */
  readonly isProviderAvailable: (provider: LLMProviderName) => boolean
  /** Perform a health check on the current provider */
  readonly healthCheck: () => Promise<Result<boolean, Error>>
  /** Get the current configuration */
  readonly getConfig: () => LLMClientConfig
  /** Update the configuration */
  readonly updateConfig: (newConfig: Partial<LLMClientConfig>) => void
}

/**
 * Extracts provider config from the unified AI configuration
 */
export function extractProviderConfig(
  aiConfig: AIConfig,
  provider: LLMProviderName,
): ProviderConfig | undefined {
  const providerSettings = aiConfig[provider]
  if (providerSettings?.apiKey == null || providerSettings.apiKey.length === 0) {
    return undefined
  }
  return {
    apiKey: providerSettings.apiKey,
    baseURL: providerSettings.baseURL,
    model: providerSettings.model,
  }
}

/**
 * Creates default client configuration from AI config
 */
export function createClientConfig(aiConfig: Partial<AIConfig> = {}): LLMClientConfig {
  const openaiKey = aiConfig.openai?.apiKey
  const anthropicKey = aiConfig.anthropic?.apiKey

  return {
    enabled: aiConfig.enabled ?? true,
    provider: aiConfig.provider ?? 'auto',
    maxTokens: aiConfig.maxTokens ?? 2000,
    temperature: aiConfig.temperature ?? 0.7,
    openai:
      openaiKey == null
        ? undefined
        : {
            apiKey: openaiKey,
            baseURL: aiConfig.openai?.baseURL,
            model: aiConfig.openai?.model,
          },
    anthropic:
      anthropicKey == null
        ? undefined
        : {
            apiKey: anthropicKey,
            baseURL: aiConfig.anthropic?.baseURL,
            model: aiConfig.anthropic?.model,
          },
  }
}
