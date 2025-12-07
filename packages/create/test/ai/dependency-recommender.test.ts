/**
 * Tests for AI dependency recommender
 * Part of Phase 5: Comprehensive Testing Implementation (TASK-036, TASK-038)
 */

import type {ProjectAnalysis} from '../../src/types.js'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

const mockComplete = vi.fn()
const mockIsAIAvailable = vi.fn()

vi.mock('../../src/ai/llm-client.js', () => ({
  LLMClient: class MockLLMClient {
    isAIAvailable = mockIsAIAvailable
    complete = mockComplete
  },
}))

const {DependencyRecommender, createDependencyRecommender} =
  await import('../../src/ai/dependency-recommender.js')

describe('DependencyRecommender', () => {
  const mockProjectAnalysis: ProjectAnalysis = {
    projectType: 'library',
    description: 'A test library',
    features: ['typescript', 'testing'],
    techStack: [{name: 'node', category: 'runtime', reason: 'Node.js runtime', confidence: 0.9}],
    dependencies: [],
    templates: [],
    confidence: 0.85,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockIsAIAvailable.mockReturnValue(true)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('constructor', () => {
    it('creates instance with default config', () => {
      const recommender = new DependencyRecommender()
      expect(recommender).toBeInstanceOf(DependencyRecommender)
    })

    it('creates instance with custom config', () => {
      const config = {provider: 'openai' as const}
      const recommender = new DependencyRecommender(config)
      expect(recommender).toBeInstanceOf(DependencyRecommender)
    })
  })

  describe('createDependencyRecommender', () => {
    it('creates DependencyRecommender instance', () => {
      const recommender = createDependencyRecommender()
      expect(recommender).toBeInstanceOf(DependencyRecommender)
    })
  })

  describe('recommendDependencies', () => {
    it('returns fallback when AI is not available', async () => {
      mockIsAIAvailable.mockReturnValue(false)
      const recommender = new DependencyRecommender()

      const result = await recommender.recommendDependencies(mockProjectAnalysis)

      expect(result).toBeInstanceOf(Array)
      expect(result.length).toBeGreaterThan(0)
      expect(mockComplete).not.toHaveBeenCalled()
    })

    it('returns AI recommendations when available', async () => {
      const mockResponse = {
        success: true,
        content: JSON.stringify([
          {name: 'vitest', description: 'Test framework', confidence: 0.9, isDev: true},
          {name: 'tsup', description: 'Build tool', confidence: 0.85, isDev: true},
        ]),
      }
      mockComplete.mockResolvedValue(mockResponse)
      const recommender = new DependencyRecommender()

      const result = await recommender.recommendDependencies(mockProjectAnalysis)

      expect(result).toHaveLength(2)
      expect(result[0]?.name).toBe('vitest')
      expect(result[0]?.confidence).toBe(0.9)
    })

    it('filters out existing dependencies in fallback', async () => {
      mockIsAIAvailable.mockReturnValue(false)
      const recommender = new DependencyRecommender()

      const result = await recommender.recommendDependencies(mockProjectAnalysis, ['typescript'])

      const typeScriptRec = result.find(r => r.name === 'typescript')
      expect(typeScriptRec).toBeUndefined()
    })

    it('returns fallback when AI response fails', async () => {
      mockComplete.mockResolvedValue({success: false, error: 'API error'})
      const recommender = new DependencyRecommender()

      const result = await recommender.recommendDependencies(mockProjectAnalysis)

      expect(result.length).toBeGreaterThan(0)
      expect(result.some(r => r.name === 'typescript')).toBe(true)
    })

    it('returns fallback when JSON parsing fails', async () => {
      mockComplete.mockResolvedValue({success: true, content: 'Invalid response'})
      const recommender = new DependencyRecommender()

      const result = await recommender.recommendDependencies(mockProjectAnalysis)

      expect(result.length).toBeGreaterThan(0)
    })

    it('clamps confidence between 0 and 1', async () => {
      mockComplete.mockResolvedValue({
        success: true,
        content: JSON.stringify([{name: 'test', description: 'Test', confidence: 1.5}]),
      })
      const recommender = new DependencyRecommender()

      const result = await recommender.recommendDependencies(mockProjectAnalysis)

      expect(result[0]?.confidence).toBe(1)
    })

    it('handles missing fields in recommendations', async () => {
      mockComplete.mockResolvedValue({
        success: true,
        content: JSON.stringify([{name: 'test'}]),
      })
      const recommender = new DependencyRecommender()

      const result = await recommender.recommendDependencies(mockProjectAnalysis)

      expect(result[0]?.name).toBe('test')
      expect(result[0]?.description).toBe('')
      expect(result[0]?.confidence).toBe(0.7)
    })
  })

  describe('recommendForFeatures', () => {
    it('returns fallback when AI is not available', async () => {
      mockIsAIAvailable.mockReturnValue(false)
      const recommender = new DependencyRecommender()

      const result = await recommender.recommendForFeatures(['testing', 'validation'], 'library')

      expect(result).toBeInstanceOf(Array)
      expect(mockComplete).not.toHaveBeenCalled()
    })

    it('returns AI recommendations when available', async () => {
      mockComplete.mockResolvedValue({
        success: true,
        content: JSON.stringify([
          {name: 'vitest', description: 'Testing framework', confidence: 0.9},
        ]),
      })
      const recommender = new DependencyRecommender()

      const result = await recommender.recommendForFeatures(['testing'], 'library')

      expect(result[0]?.name).toBe('vitest')
    })

    it('recommends vitest for testing features', async () => {
      mockIsAIAvailable.mockReturnValue(false)
      const recommender = new DependencyRecommender()

      const result = await recommender.recommendForFeatures(['unit testing'], 'library')

      expect(result.some(r => r.name === 'vitest')).toBe(true)
    })

    it('recommends zod for validation features', async () => {
      mockIsAIAvailable.mockReturnValue(false)
      const recommender = new DependencyRecommender()

      const result = await recommender.recommendForFeatures(['schema validation'], 'api')

      expect(result.some(r => r.name === 'zod')).toBe(true)
    })

    it('recommends drizzle-orm for database features', async () => {
      mockIsAIAvailable.mockReturnValue(false)
      const recommender = new DependencyRecommender()

      const result = await recommender.recommendForFeatures(['database integration'], 'api')

      expect(result.some(r => r.name === 'drizzle-orm')).toBe(true)
    })

    it('returns fallback when AI response fails', async () => {
      mockComplete.mockResolvedValue({success: false, error: 'API error'})
      const recommender = new DependencyRecommender()

      const result = await recommender.recommendForFeatures(['testing'], 'library')

      expect(result).toBeInstanceOf(Array)
    })
  })

  describe('suggestUpgrades', () => {
    it('returns fallback when AI is not available', async () => {
      mockIsAIAvailable.mockReturnValue(false)
      const recommender = new DependencyRecommender()

      const result = await recommender.suggestUpgrades({typescript: '^4.0.0'}, 'library')

      expect(result).toHaveProperty('upgrades')
      expect(result).toHaveProperty('alternatives')
      expect(result).toHaveProperty('deprecations')
    })

    it('returns AI suggestions when available', async () => {
      mockComplete.mockResolvedValue({
        success: true,
        content: JSON.stringify({
          upgrades: [{name: 'typescript', description: 'Upgrade to v5', confidence: 0.9}],
          alternatives: [],
          deprecations: [],
        }),
      })
      const recommender = new DependencyRecommender()

      const result = await recommender.suggestUpgrades({typescript: '^4.0.0'}, 'library')

      expect(result.upgrades[0]?.name).toBe('typescript')
    })

    it('identifies deprecated request package', async () => {
      mockIsAIAvailable.mockReturnValue(false)
      const recommender = new DependencyRecommender()

      const result = await recommender.suggestUpgrades({request: '^2.88.0'}, 'api')

      expect(result.deprecations).toContain('request')
      expect(result.alternatives.some(a => a.name === 'axios')).toBe(true)
    })

    it('suggests date-fns as moment alternative', async () => {
      mockIsAIAvailable.mockReturnValue(false)
      const recommender = new DependencyRecommender()

      const result = await recommender.suggestUpgrades({moment: '^2.29.0'}, 'web-app')

      expect(result.alternatives.some(a => a.name === 'date-fns')).toBe(true)
    })

    it('returns fallback when AI response fails', async () => {
      mockComplete.mockResolvedValue({success: false, error: 'API error'})
      const recommender = new DependencyRecommender()

      const result = await recommender.suggestUpgrades({lodash: '^4.17.0'}, 'library')

      expect(result).toHaveProperty('upgrades')
      expect(result).toHaveProperty('alternatives')
      expect(result).toHaveProperty('deprecations')
    })

    it('returns fallback when JSON parsing fails', async () => {
      mockComplete.mockResolvedValue({success: true, content: 'Invalid response'})
      const recommender = new DependencyRecommender()

      const result = await recommender.suggestUpgrades({lodash: '^4.17.0'}, 'library')

      expect(result).toHaveProperty('upgrades')
    })

    it('handles empty arrays in response', async () => {
      mockComplete.mockResolvedValue({
        success: true,
        content: JSON.stringify({upgrades: [], alternatives: [], deprecations: []}),
      })
      const recommender = new DependencyRecommender()

      const result = await recommender.suggestUpgrades({lodash: '^4.17.0'}, 'library')

      expect(result.upgrades).toEqual([])
      expect(result.alternatives).toEqual([])
      expect(result.deprecations).toEqual([])
    })
  })

  describe('fallback recommendations by project type', () => {
    beforeEach(() => {
      mockIsAIAvailable.mockReturnValue(false)
    })

    it('recommends commander for CLI projects', async () => {
      const recommender = new DependencyRecommender()
      const analysis: ProjectAnalysis = {
        ...mockProjectAnalysis,
        projectType: 'cli',
      }

      const result = await recommender.recommendDependencies(analysis)

      expect(result.some(r => r.name === 'commander')).toBe(true)
    })

    it('recommends react for web-app projects', async () => {
      const recommender = new DependencyRecommender()
      const analysis: ProjectAnalysis = {
        ...mockProjectAnalysis,
        projectType: 'web-app',
      }

      const result = await recommender.recommendDependencies(analysis)

      expect(result.some(r => r.name === 'react')).toBe(true)
    })

    it('recommends express for API projects', async () => {
      const recommender = new DependencyRecommender()
      const analysis: ProjectAnalysis = {
        ...mockProjectAnalysis,
        projectType: 'api',
      }

      const result = await recommender.recommendDependencies(analysis)

      expect(result.some(r => r.name === 'express')).toBe(true)
    })

    it('recommends tsup for library projects', async () => {
      const recommender = new DependencyRecommender()

      const result = await recommender.recommendDependencies(mockProjectAnalysis)

      expect(result.some(r => r.name === 'tsup')).toBe(true)
    })

    it('skips CLI framework if one exists', async () => {
      const recommender = new DependencyRecommender()
      const analysis: ProjectAnalysis = {
        ...mockProjectAnalysis,
        projectType: 'cli',
      }

      const result = await recommender.recommendDependencies(analysis, ['cac'])

      expect(result.some(r => r.name === 'commander')).toBe(false)
    })

    it('skips frontend framework if one exists', async () => {
      const recommender = new DependencyRecommender()
      const analysis: ProjectAnalysis = {
        ...mockProjectAnalysis,
        projectType: 'web-app',
      }

      const result = await recommender.recommendDependencies(analysis, ['vue'])

      expect(result.some(r => r.name === 'react')).toBe(false)
    })
  })

  describe('essential development tools', () => {
    beforeEach(() => {
      mockIsAIAvailable.mockReturnValue(false)
    })

    it('recommends typescript if not present', async () => {
      const recommender = new DependencyRecommender()

      const result = await recommender.recommendDependencies(mockProjectAnalysis)

      const tsRec = result.find(r => r.name === 'typescript')
      expect(tsRec).toBeDefined()
      expect(tsRec?.isDev).toBe(true)
    })

    it('recommends eslint if not present', async () => {
      const recommender = new DependencyRecommender()

      const result = await recommender.recommendDependencies(mockProjectAnalysis)

      const eslintRec = result.find(r => r.name === 'eslint')
      expect(eslintRec).toBeDefined()
      expect(eslintRec?.isDev).toBe(true)
    })

    it('recommends prettier if not present', async () => {
      const recommender = new DependencyRecommender()

      const result = await recommender.recommendDependencies(mockProjectAnalysis)

      const prettierRec = result.find(r => r.name === 'prettier')
      expect(prettierRec).toBeDefined()
      expect(prettierRec?.isDev).toBe(true)
    })
  })
})
