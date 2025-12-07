/**
 * Tests for AI Feature Configuration
 * Part of Phase 5: Comprehensive Testing Implementation (TASK-036)
 *
 * Tests configuration management for AI features with toggle support.
 */

import {afterEach, beforeEach, describe, expect, it} from 'vitest'
import {
  createAIFeatureConfig,
  createConfigWithFeatures,
  getEnabledFeatures,
  isFeatureEnabled,
} from '../../src/ai/feature-config.js'

describe('aI Feature Configuration', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = {...originalEnv}
    delete process.env.AI_ENABLED
    delete process.env.AI_PROVIDER
    delete process.env.AI_FALLBACK_BEHAVIOR
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('createAIFeatureConfig', () => {
    it('creates config with all defaults', () => {
      const config = createAIFeatureConfig()

      expect(config.enabled).toBe(true)
      expect(config.provider).toBe('auto')
      expect(config.fallbackBehavior).toBe('warn')
      expect(config.maxRetries).toBe(2)
      expect(config.timeout).toBe(30000)
    })

    it('enables all features by default', () => {
      const config = createAIFeatureConfig()

      expect(config.features.projectAnalysis).toBe(true)
      expect(config.features.dependencyRecommendations).toBe(true)
      expect(config.features.codeGeneration).toBe(true)
      expect(config.features.documentationGeneration).toBe(true)
      expect(config.features.configurationOptimization).toBe(true)
      expect(config.features.interactiveAssistant).toBe(true)
    })

    it('respects AI_ENABLED env variable', () => {
      process.env.AI_ENABLED = 'false'

      const config = createAIFeatureConfig()

      expect(config.enabled).toBe(false)
    })

    it('respects AI_PROVIDER env variable for openai', () => {
      process.env.AI_PROVIDER = 'openai'

      const config = createAIFeatureConfig()

      expect(config.provider).toBe('openai')
    })

    it('respects AI_PROVIDER env variable for anthropic', () => {
      process.env.AI_PROVIDER = 'anthropic'

      const config = createAIFeatureConfig()

      expect(config.provider).toBe('anthropic')
    })

    it('respects AI_PROVIDER env variable for auto', () => {
      process.env.AI_PROVIDER = 'auto'

      const config = createAIFeatureConfig()

      expect(config.provider).toBe('auto')
    })

    it('ignores invalid AI_PROVIDER values', () => {
      process.env.AI_PROVIDER = 'invalid'

      const config = createAIFeatureConfig()

      expect(config.provider).toBe('auto')
    })

    it('respects AI_FALLBACK_BEHAVIOR env variable', () => {
      process.env.AI_FALLBACK_BEHAVIOR = 'error'

      const config = createAIFeatureConfig()

      expect(config.fallbackBehavior).toBe('error')
    })

    it('respects AI_FALLBACK_BEHAVIOR for silent', () => {
      process.env.AI_FALLBACK_BEHAVIOR = 'silent'

      const config = createAIFeatureConfig()

      expect(config.fallbackBehavior).toBe('silent')
    })

    it('ignores invalid AI_FALLBACK_BEHAVIOR values', () => {
      process.env.AI_FALLBACK_BEHAVIOR = 'invalid'

      const config = createAIFeatureConfig()

      expect(config.fallbackBehavior).toBe('warn')
    })

    it('uses provided options over defaults', () => {
      const config = createAIFeatureConfig({
        enabled: false,
        provider: 'openai',
        fallbackBehavior: 'error',
        maxRetries: 5,
        timeout: 60000,
      })

      expect(config.enabled).toBe(false)
      expect(config.provider).toBe('openai')
      expect(config.fallbackBehavior).toBe('error')
      expect(config.maxRetries).toBe(5)
      expect(config.timeout).toBe(60000)
    })

    it('uses options over env variables', () => {
      process.env.AI_ENABLED = 'false'
      process.env.AI_PROVIDER = 'anthropic'

      const config = createAIFeatureConfig({
        enabled: true,
        provider: 'openai',
      })

      expect(config.enabled).toBe(true)
      expect(config.provider).toBe('openai')
    })

    it('merges feature flags with defaults', () => {
      const config = createAIFeatureConfig({
        features: {
          projectAnalysis: false,
          dependencyRecommendations: true,
          codeGeneration: false,
          documentationGeneration: true,
          configurationOptimization: true,
          interactiveAssistant: true,
        },
      })

      expect(config.features.projectAnalysis).toBe(false)
      expect(config.features.codeGeneration).toBe(false)
      expect(config.features.dependencyRecommendations).toBe(true)
      expect(config.features.documentationGeneration).toBe(true)
    })
  })

  describe('isFeatureEnabled', () => {
    it('returns false when AI globally disabled', () => {
      const config = createAIFeatureConfig({enabled: false})

      expect(isFeatureEnabled('projectAnalysis', config)).toBe(false)
    })

    it('returns true for enabled feature', () => {
      const config = createAIFeatureConfig()

      expect(isFeatureEnabled('projectAnalysis', config)).toBe(true)
    })

    it('returns false for disabled feature', () => {
      const config = createAIFeatureConfig({
        features: {
          projectAnalysis: false,
          dependencyRecommendations: true,
          codeGeneration: true,
          documentationGeneration: true,
          configurationOptimization: true,
          interactiveAssistant: true,
        },
      })

      expect(isFeatureEnabled('projectAnalysis', config)).toBe(false)
    })
  })

  describe('getEnabledFeatures', () => {
    it('returns empty array when AI disabled', () => {
      const config = createAIFeatureConfig({enabled: false})

      const features = getEnabledFeatures(config)

      expect(features).toHaveLength(0)
    })

    it('returns all features when all enabled', () => {
      const config = createAIFeatureConfig()

      const features = getEnabledFeatures(config)

      expect(features).toContain('projectAnalysis')
      expect(features).toContain('dependencyRecommendations')
      expect(features).toContain('codeGeneration')
      expect(features).toContain('documentationGeneration')
      expect(features).toContain('configurationOptimization')
      expect(features).toContain('interactiveAssistant')
    })

    it('returns only enabled features', () => {
      const config = createAIFeatureConfig({
        features: {
          projectAnalysis: true,
          dependencyRecommendations: true,
          codeGeneration: false,
          documentationGeneration: false,
          configurationOptimization: false,
          interactiveAssistant: false,
        },
      })

      const features = getEnabledFeatures(config)

      expect(features).toContain('projectAnalysis')
      expect(features).toContain('dependencyRecommendations')
      expect(features).not.toContain('codeGeneration')
      expect(features).not.toContain('documentationGeneration')
    })
  })

  describe('createConfigWithFeatures', () => {
    it('enables only specified features', () => {
      const config = createConfigWithFeatures(['projectAnalysis', 'codeGeneration'])

      expect(config.features.projectAnalysis).toBe(true)
      expect(config.features.codeGeneration).toBe(true)
      expect(config.features.dependencyRecommendations).toBe(false)
      expect(config.features.documentationGeneration).toBe(false)
      expect(config.features.configurationOptimization).toBe(false)
      expect(config.features.interactiveAssistant).toBe(false)
    })

    it('disables all features when empty array', () => {
      const config = createConfigWithFeatures([])

      expect(config.features.projectAnalysis).toBe(false)
      expect(config.features.dependencyRecommendations).toBe(false)
      expect(config.features.codeGeneration).toBe(false)
      expect(config.features.documentationGeneration).toBe(false)
      expect(config.features.configurationOptimization).toBe(false)
      expect(config.features.interactiveAssistant).toBe(false)
    })

    it('enables single feature', () => {
      const config = createConfigWithFeatures(['documentationGeneration'])

      expect(config.features.documentationGeneration).toBe(true)

      const enabledCount = Object.values(config.features).filter(Boolean).length
      expect(enabledCount).toBe(1)
    })
  })
})
