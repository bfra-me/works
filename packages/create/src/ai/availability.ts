/**
 * AI Availability Detection
 * Part of Phase 3: AI System Modernization (TASK-022)
 *
 * Pure functions for detecting AI availability through environment checking.
 */

import type {Result} from '@bfra.me/es/result'
import type {AIConfig} from '../types.js'
import type {LLMProviderName} from './providers/types.js'
import process from 'node:process'
import {ok} from '@bfra.me/es/result'

/**
 * AI availability status
 */
export interface AIAvailabilityStatus {
  /** Whether any AI provider is available */
  available: boolean
  /** List of available providers */
  providers: LLMProviderName[]
  /** The best available provider (first in priority) */
  preferredProvider: LLMProviderName | undefined
  /** Reason if no providers are available */
  reason?: string
}

/**
 * Provider availability check result
 */
export interface ProviderCheckResult {
  provider: LLMProviderName
  available: boolean
  reason?: string
}

/**
 * Checks if OpenAI is available based on environment configuration.
 *
 * @param config - Optional AI configuration override
 * @returns Provider check result
 */
export function checkOpenAIAvailability(config?: Partial<AIConfig>): ProviderCheckResult {
  const apiKey = config?.openai?.apiKey ?? process.env.OPENAI_API_KEY

  if (apiKey == null || apiKey.trim().length === 0) {
    return {
      provider: 'openai',
      available: false,
      reason: 'OPENAI_API_KEY environment variable not set',
    }
  }

  if (!apiKey.startsWith('sk-')) {
    return {
      provider: 'openai',
      available: false,
      reason: 'Invalid OpenAI API key format',
    }
  }

  return {
    provider: 'openai',
    available: true,
  }
}

/**
 * Checks if Anthropic is available based on environment configuration.
 *
 * @param config - Optional AI configuration override
 * @returns Provider check result
 */
export function checkAnthropicAvailability(config?: Partial<AIConfig>): ProviderCheckResult {
  const apiKey = config?.anthropic?.apiKey ?? process.env.ANTHROPIC_API_KEY

  if (apiKey == null || apiKey.trim().length === 0) {
    return {
      provider: 'anthropic',
      available: false,
      reason: 'ANTHROPIC_API_KEY environment variable not set',
    }
  }

  if (!apiKey.startsWith('sk-ant-')) {
    return {
      provider: 'anthropic',
      available: false,
      reason: 'Invalid Anthropic API key format',
    }
  }

  return {
    provider: 'anthropic',
    available: true,
  }
}

/**
 * Checks availability of all supported AI providers.
 *
 * @param config - Optional AI configuration override
 * @returns Array of provider check results
 */
export function checkAllProvidersAvailability(config?: Partial<AIConfig>): ProviderCheckResult[] {
  return [checkOpenAIAvailability(config), checkAnthropicAvailability(config)]
}

/**
 * Gets the comprehensive AI availability status.
 *
 * This is a pure function that checks environment variables and configuration
 * to determine which AI providers are available.
 *
 * @param config - Optional AI configuration override
 * @returns AI availability status
 */
export function getAIAvailabilityStatus(config?: Partial<AIConfig>): AIAvailabilityStatus {
  if (config?.enabled === false) {
    return {
      available: false,
      providers: [],
      preferredProvider: undefined,
      reason: 'AI features are disabled in configuration',
    }
  }

  const checks = checkAllProvidersAvailability(config)
  const availableProviders = checks.filter(check => check.available).map(check => check.provider)

  if (availableProviders.length === 0) {
    const reasons = checks
      .map(check => `${check.provider}: ${check.reason ?? 'unknown'}`)
      .join('; ')

    return {
      available: false,
      providers: [],
      preferredProvider: undefined,
      reason: `No AI providers available. ${reasons}`,
    }
  }

  const preferredProvider = getPreferredProvider(availableProviders, config?.provider)

  return {
    available: true,
    providers: availableProviders,
    preferredProvider,
  }
}

/**
 * Gets the preferred provider based on configuration and availability.
 */
function getPreferredProvider(
  available: LLMProviderName[],
  configuredPreference?: 'openai' | 'anthropic' | 'auto',
): LLMProviderName | undefined {
  if (available.length === 0) {
    return undefined
  }

  if (configuredPreference === 'openai' && available.includes('openai')) {
    return 'openai'
  }

  if (configuredPreference === 'anthropic' && available.includes('anthropic')) {
    return 'anthropic'
  }

  return available[0]
}

/**
 * Pure function to check if AI is available.
 *
 * @param config - Optional AI configuration override
 * @returns True if at least one AI provider is available
 */
export function isAIAvailablePure(config?: Partial<AIConfig>): boolean {
  const status = getAIAvailabilityStatus(config)
  return status.available
}

/**
 * Pure function to check if a specific provider is available.
 *
 * @param provider - The provider to check
 * @param config - Optional AI configuration override
 * @returns True if the specified provider is available
 */
export function isProviderAvailablePure(
  provider: LLMProviderName,
  config?: Partial<AIConfig>,
): boolean {
  switch (provider) {
    case 'openai':
      return checkOpenAIAvailability(config).available
    case 'anthropic':
      return checkAnthropicAvailability(config).available
    default:
      return false
  }
}

/**
 * Gets the list of available providers as a Result.
 *
 * @param config - Optional AI configuration override
 * @returns Result with array of available provider names
 */
export function getAvailableProvidersPure(
  config?: Partial<AIConfig>,
): Result<LLMProviderName[], Error> {
  const status = getAIAvailabilityStatus(config)
  return ok(status.providers)
}

/**
 * Creates a user-friendly message about AI availability.
 *
 * @param config - Optional AI configuration override
 * @returns Human-readable availability message
 */
export function getAIAvailabilityMessage(config?: Partial<AIConfig>): string {
  const status = getAIAvailabilityStatus(config)

  if (status.available) {
    const providersStr = status.providers.join(', ')
    return `AI features available (providers: ${providersStr})`
  }

  return status.reason ?? 'AI features unavailable'
}
