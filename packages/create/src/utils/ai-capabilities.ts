/**
 * AI capability detection utilities
 * Part of Phase 1: Foundation & Type System Enhancement
 *
 * This module provides centralized AI provider detection and capability checking,
 * replacing inline environment variable checks throughout the codebase.
 */

import process from 'node:process'

/**
 * Describes the AI capabilities available in the current environment
 */
export interface AICapabilities {
  /** Whether AI features are enabled (any provider available) */
  enabled: boolean
  /** Whether OpenAI API is available */
  openai: boolean
  /** Whether Anthropic API is available */
  anthropic: boolean
  /** Active AI provider (or 'none' if unavailable) */
  provider: 'openai' | 'anthropic' | 'none'
}

/**
 * Detects available AI capabilities based on environment variables
 *
 * @param requestedProvider - Optional specific provider to use ('openai' or 'anthropic')
 * @returns AI capabilities object describing available providers
 *
 * @example
 * ```typescript
 * const capabilities = getAICapabilities()
 * if (capabilities.enabled) {
 *   console.log(`Using ${capabilities.provider} provider`)
 * } else {
 *   console.log('AI features unavailable')
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Request specific provider
 * const capabilities = getAICapabilities('anthropic')
 * if (capabilities.provider === 'anthropic') {
 *   // Use Anthropic
 * } else if (capabilities.enabled) {
 *   // Fallback to available provider
 * }
 * ```
 */
export function getAICapabilities(requestedProvider?: string): AICapabilities {
  const openaiKey = process.env.OPENAI_API_KEY
  const anthropicKey = process.env.ANTHROPIC_API_KEY

  const hasOpenAI = openaiKey !== undefined && openaiKey.trim().length > 0
  const hasAnthropic = anthropicKey !== undefined && anthropicKey.trim().length > 0

  // Determine provider priority
  let provider: 'openai' | 'anthropic' | 'none' = 'none'

  if (requestedProvider === 'openai' && hasOpenAI) {
    provider = 'openai'
  } else if (requestedProvider === 'anthropic' && hasAnthropic) {
    provider = 'anthropic'
  } else if (hasOpenAI) {
    provider = 'openai'
  } else if (hasAnthropic) {
    provider = 'anthropic'
  }

  return {
    enabled: hasOpenAI || hasAnthropic,
    openai: hasOpenAI,
    anthropic: hasAnthropic,
    provider,
  }
}

/**
 * Checks if AI features are available
 *
 * @returns True if at least one AI provider is configured
 */
export function isAIAvailable(): boolean {
  return getAICapabilities().enabled
}

/**
 * Gets the active AI provider name or null if none available
 *
 * @returns Provider name or null
 */
export function getActiveProvider(): 'openai' | 'anthropic' | null {
  const capabilities = getAICapabilities()
  return capabilities.provider === 'none' ? null : capabilities.provider
}
