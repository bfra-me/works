/**
 * Functional LLM Client Factory
 * Part of Phase 3: AI System Modernization
 *
 * Provider-agnostic factory supporting OpenAI and Anthropic via adapter pattern,
 * eliminating parallel client implementations.
 */

import type {Result} from '@bfra.me/es/result'
import type {AIConfig, LLMOptions, LLMResponse} from '../types.js'
import type {
  LLMClientConfig,
  LLMClientInstance,
  LLMProviderAdapter,
  LLMProviderName,
} from './providers/types.js'
import process from 'node:process'
import {err, ok} from '@bfra.me/es/result'
import {config as dotenvConfig} from 'dotenv'
import {AIErrorCode, createAIError} from '../utils/errors.js'
import {createLogger} from '../utils/logger.js'
import {createAnthropicAdapter} from './providers/anthropic-adapter.js'
import {createOpenAIAdapter} from './providers/openai-adapter.js'
import {createClientConfig} from './providers/types.js'

const logger = createLogger({tag: 'llm-client'})

dotenvConfig({quiet: true})

/**
 * Creates a provider-agnostic LLM client using the adapter pattern.
 *
 * This factory function creates an LLM client that can work with multiple providers
 * (OpenAI, Anthropic) through a unified interface. It automatically selects the best
 * available provider based on configuration or falls back to any available provider.
 *
 * @param config - Partial AI configuration, will be merged with defaults
 * @returns An LLM client instance with unified interface
 *
 * @example
 * ```ts
 * const client = createLLMClient({ provider: 'auto' })
 * const result = await client.complete('Explain TypeScript')
 * if (isOk(result) && result.data.success) {
 *   console.log(result.data.content)
 * }
 * ```
 */
export function createLLMClient(config?: Partial<AIConfig>): LLMClientInstance {
  let clientConfig = createClientConfigWithEnv(config)
  const adapters = initializeAdapters(clientConfig)

  const getAdapter = (provider: LLMProviderName): LLMProviderAdapter | undefined => {
    return adapters.get(provider)
  }

  const getBestProvider = (): LLMProviderName | undefined => {
    const preferredProvider = clientConfig.provider

    if (preferredProvider === 'openai') {
      const adapter = getAdapter('openai')
      if (adapter?.isConfigured()) {
        return 'openai'
      }
    }

    if (preferredProvider === 'anthropic') {
      const adapter = getAdapter('anthropic')
      if (adapter?.isConfigured()) {
        return 'anthropic'
      }
    }

    if (preferredProvider === 'auto') {
      const openaiAdapter = getAdapter('openai')
      if (openaiAdapter?.isConfigured()) {
        return 'openai'
      }

      const anthropicAdapter = getAdapter('anthropic')
      if (anthropicAdapter?.isConfigured()) {
        return 'anthropic'
      }
    }

    return undefined
  }

  const complete = async (
    prompt: string,
    options?: LLMOptions,
  ): Promise<Result<LLMResponse, Error>> => {
    if (!clientConfig.enabled) {
      return ok({
        success: false,
        content: '',
        error: 'AI features are disabled',
      })
    }

    const provider = getBestProvider()
    if (provider == null) {
      return ok({
        success: false,
        content: '',
        error: 'No LLM provider available. Please check your API key configuration.',
      })
    }

    const adapter = getAdapter(provider)
    if (adapter == null) {
      return err(
        createAIError(
          `Provider adapter not found: ${provider}`,
          AIErrorCode.AI_PROVIDER_UNAVAILABLE,
        ),
      )
    }

    const mergedOptions: LLMOptions = {
      maxTokens: options?.maxTokens ?? clientConfig.maxTokens,
      temperature: options?.temperature ?? clientConfig.temperature,
      systemPrompt: options?.systemPrompt,
      context: options?.context,
    }

    return adapter.complete(prompt, mergedOptions)
  }

  const isAvailable = (): boolean => {
    return getBestProvider() != null
  }

  const getAvailableProviders = (): LLMProviderName[] => {
    const providers: LLMProviderName[] = []
    for (const [name, adapter] of adapters) {
      if (adapter.isConfigured()) {
        providers.push(name)
      }
    }
    return providers
  }

  const isProviderAvailable = (provider: LLMProviderName): boolean => {
    const adapter = getAdapter(provider)
    return adapter?.isConfigured() ?? false
  }

  const healthCheck = async (): Promise<Result<boolean, Error>> => {
    const provider = getBestProvider()
    if (provider == null) {
      return ok(false)
    }

    const adapter = getAdapter(provider)
    if (adapter == null) {
      return ok(false)
    }

    return adapter.healthCheck()
  }

  const getConfig = (): LLMClientConfig => {
    return {...clientConfig}
  }

  const updateConfig = (newConfig: Partial<LLMClientConfig>): void => {
    clientConfig = {...clientConfig, ...newConfig}

    const newAdapters = initializeAdapters(clientConfig)
    adapters.clear()
    for (const [name, adapter] of newAdapters) {
      adapters.set(name, adapter)
    }
  }

  return {
    complete,
    isAvailable,
    getAvailableProviders,
    isProviderAvailable,
    healthCheck,
    getConfig,
    updateConfig,
  }
}

/**
 * Creates client configuration with environment variable fallbacks.
 */
function createClientConfigWithEnv(config?: Partial<AIConfig>): LLMClientConfig {
  const openaiKey = config?.openai?.apiKey ?? process.env.OPENAI_API_KEY
  const anthropicKey = config?.anthropic?.apiKey ?? process.env.ANTHROPIC_API_KEY

  const mergedConfig: Partial<AIConfig> = {
    ...config,
    openai:
      openaiKey == null
        ? undefined
        : {
            apiKey: openaiKey,
            baseURL: config?.openai?.baseURL,
            model: config?.openai?.model,
          },
    anthropic:
      anthropicKey == null
        ? undefined
        : {
            apiKey: anthropicKey,
            baseURL: config?.anthropic?.baseURL,
            model: config?.anthropic?.model,
          },
  }

  return createClientConfig(mergedConfig)
}

/**
 * Initializes provider adapters based on configuration.
 */
function initializeAdapters(config: LLMClientConfig): Map<LLMProviderName, LLMProviderAdapter> {
  const adapters = new Map<LLMProviderName, LLMProviderAdapter>()

  if (config.openai != null) {
    try {
      const adapter = createOpenAIAdapter(config.openai)
      adapters.set('openai', adapter)
    } catch (error) {
      logger.warn('Failed to initialize OpenAI adapter:', error)
    }
  }

  if (config.anthropic != null) {
    try {
      const adapter = createAnthropicAdapter(config.anthropic)
      adapters.set('anthropic', adapter)
    } catch (error) {
      logger.warn('Failed to initialize Anthropic adapter:', error)
    }
  }

  return adapters
}

/**
 * Checks if any LLM provider is available based on environment variables.
 * This is a pure function for checking AI availability without creating a full client.
 *
 * @returns True if at least one provider is available
 */
export function isAIAvailable(): boolean {
  const client = createLLMClient()
  return client.isAvailable()
}

/**
 * Gets the list of available providers based on environment configuration.
 * This is a pure function for checking provider availability.
 *
 * @returns Array of available provider names
 */
export function getAvailableProviders(): LLMProviderName[] {
  const client = createLLMClient()
  return client.getAvailableProviders()
}

/**
 * Creates an LLM client with a specific provider.
 * Throws if the provider is not available.
 *
 * @param provider - The provider to use
 * @param config - Optional additional configuration
 * @returns An LLM client instance configured for the specified provider
 */
export function createLLMClientWithProvider(
  provider: LLMProviderName,
  config?: Partial<AIConfig>,
): Result<LLMClientInstance, Error> {
  const client = createLLMClient({...config, provider})

  if (!client.isProviderAvailable(provider)) {
    return err(
      createAIError(
        `Provider ${provider} is not available. Please check your API key configuration.`,
        AIErrorCode.AI_PROVIDER_UNAVAILABLE,
      ),
    )
  }

  return ok(client)
}
