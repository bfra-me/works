/**
 * Tests for AI configuration optimizer
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

vi.mock('node:fs', () => ({
  readFileSync: vi.fn(),
}))

const {ConfigurationOptimizer, createConfigurationOptimizer} =
  await import('../../src/ai/configuration-optimizer.js')
const {readFileSync} = await import('node:fs')

describe('ConfigurationOptimizer', () => {
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
      const optimizer = new ConfigurationOptimizer()
      expect(optimizer).toBeInstanceOf(ConfigurationOptimizer)
    })

    it('creates instance with custom config', () => {
      const config = {provider: 'openai' as const}
      const optimizer = new ConfigurationOptimizer(config)
      expect(optimizer).toBeInstanceOf(ConfigurationOptimizer)
    })
  })

  describe('createConfigurationOptimizer', () => {
    it('creates ConfigurationOptimizer instance', () => {
      const optimizer = createConfigurationOptimizer()
      // Factory returns interface with bound methods, not class instance
      expect(optimizer).toBeDefined()
      expect(optimizer.optimizeConfigurations).toBeDefined()
      expect(optimizer.generateOptimizedConfig).toBeDefined()
      expect(optimizer.isOptimizationAvailable).toBeDefined()
      expect(typeof optimizer.optimizeConfigurations).toBe('function')
    })
  })

  describe('isOptimizationAvailable', () => {
    it('returns true when AI is available', () => {
      mockIsAIAvailable.mockReturnValue(true)
      const optimizer = new ConfigurationOptimizer()
      expect(optimizer.isOptimizationAvailable()).toBe(true)
    })

    it('returns false when AI is not available', () => {
      mockIsAIAvailable.mockReturnValue(false)
      const optimizer = new ConfigurationOptimizer()
      expect(optimizer.isOptimizationAvailable()).toBe(false)
    })
  })

  describe('generateOptimizedConfig', () => {
    it('returns fallback when AI is not available', async () => {
      mockIsAIAvailable.mockReturnValue(false)
      const optimizer = new ConfigurationOptimizer()

      const result = await optimizer.generateOptimizedConfig('eslint', mockProjectAnalysis)

      expect(result).toHaveProperty('extends')
      expect(mockComplete).not.toHaveBeenCalled()
    })

    it('returns AI-generated config when available', async () => {
      mockComplete.mockResolvedValue({
        success: true,
        content: JSON.stringify({
          extends: ['@custom/config'],
          rules: {'no-console': 'warn'},
        }),
      })
      const optimizer = new ConfigurationOptimizer()

      const result = await optimizer.generateOptimizedConfig('eslint', mockProjectAnalysis)

      expect(result.extends).toEqual(['@custom/config'])
      expect(result.rules).toEqual({'no-console': 'warn'})
    })

    it('returns fallback when AI response fails', async () => {
      mockComplete.mockResolvedValue({success: false, error: 'API error'})
      const optimizer = new ConfigurationOptimizer()

      const result = await optimizer.generateOptimizedConfig('typescript', mockProjectAnalysis)

      expect(result).toHaveProperty('compilerOptions')
    })

    it('returns fallback when JSON parsing fails', async () => {
      mockComplete.mockResolvedValue({success: true, content: 'Invalid JSON'})
      const optimizer = new ConfigurationOptimizer()

      const result = await optimizer.generateOptimizedConfig('prettier', mockProjectAnalysis)

      expect(result).toHaveProperty('semi')
    })

    it('includes existing config in prompt', async () => {
      mockComplete.mockResolvedValue({
        success: true,
        content: JSON.stringify({extends: ['@custom/config']}),
      })
      const optimizer = new ConfigurationOptimizer()

      await optimizer.generateOptimizedConfig('eslint', mockProjectAnalysis, {
        existingRule: 'value',
      })

      expect(mockComplete).toHaveBeenCalledWith(
        expect.stringContaining('existingRule'),
        expect.anything(),
      )
    })
  })

  describe('optimizeConfigurations', () => {
    it('returns empty array when no configs are found', async () => {
      vi.mocked(readFileSync).mockImplementation(() => {
        throw new Error('File not found')
      })
      const optimizer = new ConfigurationOptimizer()

      const result = await optimizer.optimizeConfigurations('/test/project')

      expect(result).toEqual([])
    })

    it('analyzes found configurations', async () => {
      vi.mocked(readFileSync).mockImplementation(path => {
        if (String(path).includes('tsconfig.json')) {
          return JSON.stringify({compilerOptions: {strict: false}})
        }
        throw new Error('Not found')
      })
      mockIsAIAvailable.mockReturnValue(false)
      const optimizer = new ConfigurationOptimizer()

      const result = await optimizer.optimizeConfigurations('/test/project', mockProjectAnalysis, {
        configTypes: ['typescript'],
      })

      expect(result).toBeInstanceOf(Array)
    })

    it('uses AI for analysis when available', async () => {
      vi.mocked(readFileSync).mockImplementation(path => {
        if (String(path).includes('tsconfig.json')) {
          return JSON.stringify({compilerOptions: {strict: false}})
        }
        throw new Error('Not found')
      })
      mockComplete.mockResolvedValue({
        success: true,
        content: JSON.stringify({
          suggestions: [
            {
              current: {strict: false},
              suggested: {strict: true},
              reason: 'Enable strict mode for better type safety',
              confidence: 0.9,
              impact: 'high',
              breaking: false,
            },
          ],
        }),
      })
      const optimizer = new ConfigurationOptimizer()

      const result = await optimizer.optimizeConfigurations('/test/project', mockProjectAnalysis, {
        configTypes: ['typescript'],
      })

      expect(result.length).toBeGreaterThan(0)
      expect(result[0]?.reason).toContain('strict')
    })

    it('handles JS config files', async () => {
      vi.mocked(readFileSync).mockImplementation(path => {
        if (String(path).includes('eslint.config.ts')) {
          return 'export default { rules: {} }'
        }
        throw new Error('Not found')
      })
      mockIsAIAvailable.mockReturnValue(false)
      const optimizer = new ConfigurationOptimizer()

      const result = await optimizer.optimizeConfigurations('/test/project', undefined, {
        configTypes: ['eslint'],
      })

      expect(result).toBeInstanceOf(Array)
    })

    it('sorts suggestions by confidence', async () => {
      vi.mocked(readFileSync).mockImplementation(path => {
        if (String(path).includes('tsconfig.json')) {
          return JSON.stringify({compilerOptions: {}})
        }
        throw new Error('Not found')
      })
      mockComplete.mockResolvedValue({
        success: true,
        content: JSON.stringify({
          suggestions: [
            {
              current: {},
              suggested: {},
              reason: 'Low',
              confidence: 0.5,
              impact: 'low',
              breaking: false,
            },
            {
              current: {},
              suggested: {},
              reason: 'High',
              confidence: 0.9,
              impact: 'high',
              breaking: false,
            },
          ],
        }),
      })
      const optimizer = new ConfigurationOptimizer()

      const result = await optimizer.optimizeConfigurations('/test/project', mockProjectAnalysis, {
        configTypes: ['typescript'],
      })

      expect(result[0]?.confidence).toBeGreaterThanOrEqual(result[1]?.confidence ?? 0)
    })

    it('respects includeExperimental option', async () => {
      vi.mocked(readFileSync).mockImplementation(path => {
        if (String(path).includes('tsconfig.json')) {
          return JSON.stringify({compilerOptions: {}})
        }
        throw new Error('Not found')
      })
      mockComplete.mockResolvedValue({
        success: true,
        content: JSON.stringify({suggestions: []}),
      })
      const optimizer = new ConfigurationOptimizer()

      await optimizer.optimizeConfigurations('/test/project', mockProjectAnalysis, {
        configTypes: ['typescript'],
        includeExperimental: true,
      })

      expect(mockComplete).toHaveBeenCalledWith(
        expect.stringContaining('experimental'),
        expect.anything(),
      )
    })

    it('respects maxSuggestions option', async () => {
      vi.mocked(readFileSync).mockImplementation(path => {
        if (String(path).includes('tsconfig.json')) {
          return JSON.stringify({compilerOptions: {}})
        }
        throw new Error('Not found')
      })
      mockComplete.mockResolvedValue({
        success: true,
        content: JSON.stringify({suggestions: []}),
      })
      const optimizer = new ConfigurationOptimizer()

      await optimizer.optimizeConfigurations('/test/project', mockProjectAnalysis, {
        configTypes: ['typescript'],
        maxSuggestions: 3,
      })

      expect(mockComplete).toHaveBeenCalledWith(expect.stringContaining('3'), expect.anything())
    })
  })

  describe('fallback configs', () => {
    beforeEach(() => {
      mockIsAIAvailable.mockReturnValue(false)
    })

    it('generates eslint fallback config', async () => {
      const optimizer = new ConfigurationOptimizer()
      const result = await optimizer.generateOptimizedConfig('eslint', mockProjectAnalysis)

      expect(result.extends).toContain('@bfra.me/eslint-config')
      expect(result.parserOptions).toBeDefined()
      expect(result.env).toBeDefined()
    })

    it('generates typescript fallback config', async () => {
      const optimizer = new ConfigurationOptimizer()
      const result = await optimizer.generateOptimizedConfig('typescript', mockProjectAnalysis)

      expect(result.extends).toBe('@bfra.me/tsconfig')
      expect(result.compilerOptions).toHaveProperty('strict', true)
      expect(result.include).toContain('src')
    })

    it('generates prettier fallback config', async () => {
      const optimizer = new ConfigurationOptimizer()
      const result = await optimizer.generateOptimizedConfig('prettier', mockProjectAnalysis)

      expect(result.semi).toBe(false)
      expect(result.singleQuote).toBe(true)
      expect(result.tabWidth).toBe(2)
    })

    it('generates vitest fallback config', async () => {
      const optimizer = new ConfigurationOptimizer()
      const result = await optimizer.generateOptimizedConfig('vitest', mockProjectAnalysis)

      expect(result.test).toBeDefined()
      const test = result.test as {environment: string; coverage: {provider: string}}
      expect(test.environment).toBe('node')
      expect(test.coverage.provider).toBe('v8')
    })

    it('generates package.json fallback config', async () => {
      const optimizer = new ConfigurationOptimizer()
      const result = await optimizer.generateOptimizedConfig('package.json', mockProjectAnalysis)

      expect(result.type).toBe('module')
      expect(result.engines).toBeDefined()
      expect(result.scripts).toBeDefined()
    })
  })

  describe('fallback suggestions', () => {
    beforeEach(() => {
      mockIsAIAvailable.mockReturnValue(false)
    })

    it('suggests eslint extends if missing', async () => {
      vi.mocked(readFileSync).mockImplementation(path => {
        if (String(path).includes('.eslintrc.json')) {
          return JSON.stringify({rules: {}})
        }
        throw new Error('Not found')
      })
      const optimizer = new ConfigurationOptimizer()

      const result = await optimizer.optimizeConfigurations('/test/project', mockProjectAnalysis, {
        configTypes: ['eslint'],
      })

      const suggestion = result.find(s => s.type === 'eslint')
      expect(suggestion?.suggested).toHaveProperty('extends')
    })

    it('suggests typescript extends if missing', async () => {
      vi.mocked(readFileSync).mockImplementation(path => {
        if (String(path).includes('tsconfig.json')) {
          return JSON.stringify({compilerOptions: {}})
        }
        throw new Error('Not found')
      })
      const optimizer = new ConfigurationOptimizer()

      const result = await optimizer.optimizeConfigurations('/test/project', mockProjectAnalysis, {
        configTypes: ['typescript'],
      })

      const suggestion = result.find(s => s.type === 'typescript')
      expect(suggestion?.suggested).toHaveProperty('extends')
    })

    it('suggests ES modules for package.json', async () => {
      vi.mocked(readFileSync).mockImplementation(path => {
        if (String(path).includes('package.json')) {
          return JSON.stringify({name: 'test', type: 'commonjs'})
        }
        throw new Error('Not found')
      })
      const optimizer = new ConfigurationOptimizer()

      const result = await optimizer.optimizeConfigurations('/test/project', mockProjectAnalysis, {
        configTypes: ['package.json'],
      })

      const suggestion = result.find(
        s => s.type === 'package.json' && s.suggested.type === 'module',
      )
      expect(suggestion).toBeDefined()
      expect(suggestion?.breaking).toBe(true)
    })
  })

  describe('config file discovery', () => {
    it('finds eslint.config.ts', async () => {
      vi.mocked(readFileSync).mockImplementation(path => {
        if (String(path).includes('eslint.config.ts')) {
          return 'export default {}'
        }
        throw new Error('Not found')
      })
      mockIsAIAvailable.mockReturnValue(false)
      const optimizer = new ConfigurationOptimizer()

      const result = await optimizer.optimizeConfigurations('/test', undefined, {
        configTypes: ['eslint'],
      })

      expect(result).toBeInstanceOf(Array)
    })

    it('finds .prettierrc.json', async () => {
      vi.mocked(readFileSync).mockImplementation(path => {
        if (String(path).includes('.prettierrc.json')) {
          return JSON.stringify({semi: true})
        }
        throw new Error('Not found')
      })
      mockIsAIAvailable.mockReturnValue(false)
      const optimizer = new ConfigurationOptimizer()

      const result = await optimizer.optimizeConfigurations('/test', undefined, {
        configTypes: ['prettier'],
      })

      expect(result).toBeInstanceOf(Array)
    })

    it('finds vitest.config.ts', async () => {
      vi.mocked(readFileSync).mockImplementation(path => {
        if (String(path).includes('vitest.config.ts')) {
          return 'export default {}'
        }
        throw new Error('Not found')
      })
      mockIsAIAvailable.mockReturnValue(false)
      const optimizer = new ConfigurationOptimizer()

      const result = await optimizer.optimizeConfigurations('/test', undefined, {
        configTypes: ['vitest'],
      })

      expect(result).toBeInstanceOf(Array)
    })
  })

  describe('AI response parsing', () => {
    it('clamps confidence between 0 and 1', async () => {
      vi.mocked(readFileSync).mockImplementation(path => {
        if (String(path).includes('tsconfig.json')) {
          return JSON.stringify({})
        }
        throw new Error('Not found')
      })
      mockComplete.mockResolvedValue({
        success: true,
        content: JSON.stringify({
          suggestions: [
            {
              current: {},
              suggested: {},
              reason: 'Test',
              confidence: 1.5,
              impact: 'high',
              breaking: false,
            },
          ],
        }),
      })
      const optimizer = new ConfigurationOptimizer()

      const result = await optimizer.optimizeConfigurations('/test', mockProjectAnalysis, {
        configTypes: ['typescript'],
      })

      expect(result[0]?.confidence).toBe(1)
    })

    it('normalizes impact to valid values', async () => {
      vi.mocked(readFileSync).mockImplementation(path => {
        if (String(path).includes('tsconfig.json')) {
          return JSON.stringify({})
        }
        throw new Error('Not found')
      })
      mockComplete.mockResolvedValue({
        success: true,
        content: JSON.stringify({
          suggestions: [
            {
              current: {},
              suggested: {},
              reason: 'Test',
              confidence: 0.8,
              impact: 'invalid',
              breaking: false,
            },
          ],
        }),
      })
      const optimizer = new ConfigurationOptimizer()

      const result = await optimizer.optimizeConfigurations('/test', mockProjectAnalysis, {
        configTypes: ['typescript'],
      })

      expect(['low', 'medium', 'high']).toContain(result[0]?.impact)
    })
  })
})
