/**
 * AI Providers Module
 * Part of Phase 3: AI System Modernization
 *
 * Exports provider adapters and the main LLM client factory.
 */

export {createAnthropicAdapter} from './anthropic-adapter.js'
export {createOpenAIAdapter} from './openai-adapter.js'
export type {
  LLMClientConfig,
  LLMClientInstance,
  LLMProviderAdapter,
  LLMProviderName,
  ProviderAdapterFactory,
  ProviderConfig,
} from './types.js'
export {createClientConfig, extractProviderConfig} from './types.js'
