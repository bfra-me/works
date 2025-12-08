/**
 * AI Feature Toggles and Configuration Management
 * Part of Phase 3: AI System Modernization (TASK-023)
 *
 * Provides configuration management for AI features with toggle support.
 */

import type {Result} from '@bfra.me/es/result'
import type {AIConfig} from '../types.js'
import type {LLMProviderName} from './providers/types.js'
import process from 'node:process'
import {ok} from '@bfra.me/es/result'

/**
 * Individual AI feature flags
 */
export interface AIFeatureFlags {
  /** Enable project analysis feature */
  projectAnalysis: boolean
  /** Enable dependency recommendations */
  dependencyRecommendations: boolean
  /** Enable code generation */
  codeGeneration: boolean
  /** Enable documentation generation */
  documentationGeneration: boolean
  /** Enable configuration optimization */
  configurationOptimization: boolean
  /** Enable interactive assistant */
  interactiveAssistant: boolean
}

/**
 * AI feature configuration
 */
export interface AIFeatureConfig {
  /** Global AI enabled flag */
  enabled: boolean
  /** Individual feature flags */
  features: AIFeatureFlags
  /** Provider preference */
  provider: LLMProviderName | 'auto'
  /** Fallback behavior when AI unavailable */
  fallbackBehavior: 'error' | 'silent' | 'warn'
  /** Maximum retry attempts */
  maxRetries: number
  /** Timeout in milliseconds */
  timeout: number
}

/**
 * Default feature flags - all enabled
 */
const DEFAULT_FEATURE_FLAGS: AIFeatureFlags = {
  projectAnalysis: true,
  dependencyRecommendations: true,
  codeGeneration: true,
  documentationGeneration: true,
  configurationOptimization: true,
  interactiveAssistant: true,
}

/**
 * Default AI feature configuration
 */
const DEFAULT_CONFIG: AIFeatureConfig = {
  enabled: true,
  features: DEFAULT_FEATURE_FLAGS,
  provider: 'auto',
  fallbackBehavior: 'warn',
  maxRetries: 2,
  timeout: 30000,
}

/**
 * Creates AI feature configuration from environment and options.
 *
 * @param options - Partial configuration overrides
 * @returns Complete AI feature configuration
 */
export function createAIFeatureConfig(options?: Partial<AIFeatureConfig>): AIFeatureConfig {
  const envEnabled = process.env.AI_ENABLED !== 'false'
  const envProvider = parseProviderFromEnv()
  const envFallback = parseFallbackBehaviorFromEnv()

  // If explicitly provided, use that value
  // Otherwise, check if AI_ENABLED env var says false, or use true as default
  const enabled = options?.enabled ?? envEnabled

  return {
    enabled,
    features: {
      ...DEFAULT_FEATURE_FLAGS,
      ...options?.features,
    },
    provider: options?.provider ?? envProvider ?? DEFAULT_CONFIG.provider,
    fallbackBehavior: options?.fallbackBehavior ?? envFallback ?? DEFAULT_CONFIG.fallbackBehavior,
    maxRetries: options?.maxRetries ?? DEFAULT_CONFIG.maxRetries,
    timeout: options?.timeout ?? DEFAULT_CONFIG.timeout,
  }
}

/**
 * Parses provider preference from environment variable
 */
function parseProviderFromEnv(): LLMProviderName | 'auto' | undefined {
  const envValue = process.env.AI_PROVIDER?.toLowerCase()
  if (envValue === 'openai' || envValue === 'anthropic' || envValue === 'auto') {
    return envValue
  }
  return undefined
}

/**
 * Parses fallback behavior from environment variable
 */
function parseFallbackBehaviorFromEnv(): 'error' | 'silent' | 'warn' | undefined {
  const envValue = process.env.AI_FALLBACK_BEHAVIOR?.toLowerCase()
  if (envValue === 'error' || envValue === 'silent' || envValue === 'warn') {
    return envValue
  }
  return undefined
}

/**
 * Checks if a specific AI feature is enabled.
 *
 * @param feature - The feature to check
 * @param config - The AI feature configuration
 * @returns True if the feature is enabled
 */
export function isFeatureEnabled(feature: keyof AIFeatureFlags, config: AIFeatureConfig): boolean {
  if (!config.enabled) {
    return false
  }
  return config.features[feature]
}

/**
 * Gets list of enabled features.
 *
 * @param config - The AI feature configuration
 * @returns Array of enabled feature names
 */
export function getEnabledFeatures(config: AIFeatureConfig): (keyof AIFeatureFlags)[] {
  if (!config.enabled) {
    return []
  }

  const features: (keyof AIFeatureFlags)[] = []
  for (const [key, value] of Object.entries(config.features)) {
    if (value === true) {
      features.push(key as keyof AIFeatureFlags)
    }
  }
  return features
}

/**
 * Creates a configuration with specific features enabled.
 *
 * @param features - Features to enable (others disabled)
 * @returns AI feature configuration with only specified features enabled
 */
export function createConfigWithFeatures(features: (keyof AIFeatureFlags)[]): AIFeatureConfig {
  const featureFlags: AIFeatureFlags = {
    projectAnalysis: false,
    dependencyRecommendations: false,
    codeGeneration: false,
    documentationGeneration: false,
    configurationOptimization: false,
    interactiveAssistant: false,
  }

  for (const feature of features) {
    featureFlags[feature] = true
  }

  return {
    ...DEFAULT_CONFIG,
    features: featureFlags,
  }
}

/**
 * Disables all AI features.
 *
 * @param config - The original configuration
 * @returns Configuration with AI disabled
 */
export function disableAI(config: AIFeatureConfig): AIFeatureConfig {
  return {
    ...config,
    enabled: false,
  }
}

/**
 * Enables all AI features.
 *
 * @param config - The original configuration
 * @returns Configuration with all features enabled
 */
export function enableAllFeatures(config: AIFeatureConfig): AIFeatureConfig {
  return {
    ...config,
    enabled: true,
    features: {...DEFAULT_FEATURE_FLAGS},
  }
}

/**
 * Converts AI feature config to legacy AIConfig format.
 *
 * @param featureConfig - The feature configuration
 * @returns Legacy AIConfig for backward compatibility
 */
export function toAIConfig(featureConfig: AIFeatureConfig): Partial<AIConfig> {
  return {
    enabled: featureConfig.enabled,
    provider: featureConfig.provider,
    maxTokens: 2000,
    temperature: 0.7,
  }
}

/**
 * Creates feature config from legacy AIConfig.
 *
 * @param aiConfig - Legacy AI configuration
 * @returns AI feature configuration
 */
export function fromAIConfig(aiConfig: Partial<AIConfig>): AIFeatureConfig {
  return createAIFeatureConfig({
    enabled: aiConfig.enabled,
    provider: aiConfig.provider ?? 'auto',
  })
}

/**
 * Validates AI feature configuration.
 *
 * @param config - Configuration to validate
 * @returns Result with validated config or error
 */
export function validateFeatureConfig(config: unknown): Result<AIFeatureConfig, Error> {
  if (config == null || typeof config !== 'object') {
    return ok(DEFAULT_CONFIG)
  }

  const partial = config as Partial<AIFeatureConfig>
  return ok(createAIFeatureConfig(partial))
}

/**
 * Gets feature configuration summary for logging/display.
 *
 * @param config - The AI feature configuration
 * @returns Human-readable summary
 */
export function getFeatureConfigSummary(config: AIFeatureConfig): string {
  if (!config.enabled) {
    return 'AI features: disabled'
  }

  const enabledFeatures = getEnabledFeatures(config)
  const featuresStr = enabledFeatures.length > 0 ? enabledFeatures.join(', ') : 'none'

  return `AI features: enabled (provider: ${config.provider}, features: ${featuresStr})`
}
