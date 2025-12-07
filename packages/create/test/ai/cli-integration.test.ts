/**
 * Tests for AI CLI integration
 * Part of Phase 5: Comprehensive Testing Implementation (TASK-036, TASK-037, TASK-038)
 */

import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

const mockAnalyze = vi.fn()
const mockRecommend = vi.fn()
const mockGenerate = vi.fn()
const mockIsAIAvailable = vi.fn()

vi.mock('../../src/ai/project-analyzer.js', () => ({
  ProjectAnalyzer: class MockProjectAnalyzer {
    llmClient = {isAIAvailable: mockIsAIAvailable}
    analyzeProject = mockAnalyze
  },
}))

vi.mock('../../src/ai/dependency-recommender.js', () => ({
  DependencyRecommender: class MockDependencyRecommender {
    recommendDependencies = mockRecommend
  },
}))

vi.mock('../../src/ai/code-generator.js', () => ({
  CodeGenerator: class MockCodeGenerator {
    generateConfig = mockGenerate
  },
}))

const {CliAIIntegration, createCliAIIntegration} = await import('../../src/ai/cli-integration.js')

describe('CliAIIntegration', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.clearAllMocks()
    process.env = {...originalEnv}
    mockIsAIAvailable.mockReturnValue(true)
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('constructor', () => {
    it('creates instance with default config', () => {
      const integration = new CliAIIntegration()
      expect(integration).toBeInstanceOf(CliAIIntegration)
    })

    it('creates instance with custom config', () => {
      const config = {provider: 'openai' as const, maxTokens: 4000}
      const integration = new CliAIIntegration(config)
      expect(integration).toBeInstanceOf(CliAIIntegration)
    })
  })

  describe('createCliAIIntegration', () => {
    it('creates CliAIIntegration instance', () => {
      const integration = createCliAIIntegration()
      expect(integration).toBeInstanceOf(CliAIIntegration)
    })

    it('passes config to constructor', () => {
      const config = {maxTokens: 2000}
      const integration = createCliAIIntegration(config)
      expect(integration).toBeInstanceOf(CliAIIntegration)
    })
  })

  describe('enhancePackageCreation', () => {
    it('returns success when AI is disabled', async () => {
      const integration = new CliAIIntegration()
      const result = await integration.enhancePackageCreation({name: 'test'}, {ai: false})

      expect(result.success).toBe(true)
      expect(result.warnings).toContain('AI features disabled')
      expect(mockAnalyze).not.toHaveBeenCalled()
    })

    it('performs analysis when enabled', async () => {
      const mockAnalysis = {
        projectType: 'library',
        description: 'Test project',
        features: ['typescript'],
        techStack: [{name: 'node'}],
        confidence: 0.9,
      }
      mockAnalyze.mockResolvedValue(mockAnalysis)
      mockRecommend.mockResolvedValue([])

      const integration = new CliAIIntegration()
      const result = await integration.enhancePackageCreation({
        name: 'test-project',
        description: 'Test',
      })

      expect(result.success).toBe(true)
      expect(result.analysis).toEqual(mockAnalysis)
      expect(mockAnalyze).toHaveBeenCalled()
    })

    it('skips analysis when analyze is false', async () => {
      const integration = new CliAIIntegration()
      await integration.enhancePackageCreation({name: 'test'}, {analyze: false})

      expect(mockAnalyze).not.toHaveBeenCalled()
    })

    it('recommends dependencies when analysis succeeds', async () => {
      const mockAnalysis = {
        projectType: 'library',
        description: 'Test',
        features: [],
        techStack: [],
        confidence: 0.8,
      }
      const mockDeps = [{name: 'typescript', description: 'TypeScript', confidence: 0.9}]

      mockAnalyze.mockResolvedValue(mockAnalysis)
      mockRecommend.mockResolvedValue(mockDeps)

      const integration = new CliAIIntegration()
      const result = await integration.enhancePackageCreation({name: 'test'})

      expect(result.dependencies).toEqual(mockDeps)
      expect(mockRecommend).toHaveBeenCalledWith(mockAnalysis, undefined)
    })

    it('skips recommendations when recommend is false', async () => {
      const mockAnalysis = {
        projectType: 'library',
        description: 'Test',
        features: [],
        techStack: [],
        confidence: 0.8,
      }
      mockAnalyze.mockResolvedValue(mockAnalysis)

      const integration = new CliAIIntegration()
      await integration.enhancePackageCreation({name: 'test'}, {recommend: false})

      expect(mockRecommend).not.toHaveBeenCalled()
    })

    it('generates code when generate is true', async () => {
      const mockAnalysis = {
        projectType: 'library',
        description: 'Test',
        features: ['testing'],
        techStack: [],
        confidence: 0.9,
      }
      const mockGenResult = {
        success: true,
        code: '{}',
        filePath: 'package.json',
        quality: 0.85,
      }

      mockAnalyze.mockResolvedValue(mockAnalysis)
      mockRecommend.mockResolvedValue([])
      mockGenerate.mockResolvedValue(mockGenResult)

      const integration = new CliAIIntegration()
      const result = await integration.enhancePackageCreation({name: 'test'}, {generate: true})

      expect(result.codeGeneration).toEqual(mockGenResult)
      expect(mockGenerate).toHaveBeenCalled()
    })

    it('skips code generation when generate is not true', async () => {
      mockAnalyze.mockResolvedValue({
        projectType: 'lib',
        description: 'Test',
        features: [],
        techStack: [],
        confidence: 0.8,
      })
      mockRecommend.mockResolvedValue([])

      const integration = new CliAIIntegration()
      await integration.enhancePackageCreation({name: 'test'})

      expect(mockGenerate).not.toHaveBeenCalled()
    })

    it('handles analysis errors gracefully', async () => {
      mockAnalyze.mockRejectedValue(new Error('Analysis failed'))

      const integration = new CliAIIntegration()
      const result = await integration.enhancePackageCreation({name: 'test'})

      expect(result.success).toBe(true)
      expect(result.warnings).toContain('Analysis failed: Analysis failed')
    })

    it('handles recommendation errors gracefully', async () => {
      mockAnalyze.mockResolvedValue({
        projectType: 'lib',
        description: 'Test',
        features: [],
        techStack: [],
        confidence: 0.8,
      })
      mockRecommend.mockRejectedValue(new Error('Recommendation failed'))

      const integration = new CliAIIntegration()
      const result = await integration.enhancePackageCreation({name: 'test'})

      expect(result.success).toBe(true)
      expect(result.warnings).toContain('Dependency recommendations failed: Recommendation failed')
    })

    it('handles code generation errors gracefully', async () => {
      mockAnalyze.mockResolvedValue({
        projectType: 'lib',
        description: 'Test',
        features: [],
        techStack: [],
        confidence: 0.8,
      })
      mockRecommend.mockResolvedValue([])
      mockGenerate.mockRejectedValue(new Error('Generation failed'))

      const integration = new CliAIIntegration()
      const result = await integration.enhancePackageCreation({name: 'test'}, {generate: true})

      expect(result.success).toBe(true)
      expect(result.warnings).toContain('Code generation failed: Generation failed')
    })

    it('adds warning when AI is not available', async () => {
      mockIsAIAvailable.mockReturnValue(false)

      const integration = new CliAIIntegration()
      const result = await integration.enhancePackageCreation({name: 'test'}, {analyze: false})

      expect(result.warnings).toContain('AI services not available, using fallback analysis')
    })

    it('includes processing time', async () => {
      mockAnalyze.mockResolvedValue({
        projectType: 'lib',
        description: 'Test',
        features: [],
        techStack: [],
        confidence: 0.8,
      })
      mockRecommend.mockResolvedValue([])

      const integration = new CliAIIntegration()
      const result = await integration.enhancePackageCreation({name: 'test'})

      expect(result.processingTime).toBeGreaterThanOrEqual(0)
    })

    it('passes existing dependencies to recommender', async () => {
      mockAnalyze.mockResolvedValue({
        projectType: 'lib',
        description: 'Test',
        features: [],
        techStack: [],
        confidence: 0.8,
      })
      mockRecommend.mockResolvedValue([])

      const integration = new CliAIIntegration()
      await integration.enhancePackageCreation({
        name: 'test',
        existingDependencies: ['react', 'typescript'],
      })

      expect(mockRecommend).toHaveBeenCalledWith(expect.anything(), ['react', 'typescript'])
    })
  })

  describe('interactiveAnalysis', () => {
    it('returns input with defaults', async () => {
      const integration = new CliAIIntegration()
      const result = await integration.interactiveAnalysis({
        description: 'Test project',
      })

      expect(result.name).toBe('my-project')
      expect(result.description).toBe('Test project')
      expect(result.keywords).toEqual([])
      expect(result.requirements).toEqual([])
    })

    it('preserves provided values', async () => {
      const integration = new CliAIIntegration()
      const result = await integration.interactiveAnalysis({
        name: 'custom-name',
        keywords: ['test', 'project'],
        requirements: ['typescript'],
        existingDependencies: ['react'],
      })

      expect(result.name).toBe('custom-name')
      expect(result.keywords).toEqual(['test', 'project'])
      expect(result.requirements).toEqual(['typescript'])
      expect(result.existingDependencies).toEqual(['react'])
    })
  })

  describe('formatResults', () => {
    it('formats failed result', () => {
      const integration = new CliAIIntegration()
      const result = integration.formatResults({
        success: false,
        error: 'Test error',
        warnings: [],
      })

      expect(result).toContain('❌ AI enhancement failed')
      expect(result).toContain('Test error')
    })

    it('formats unknown error', () => {
      const integration = new CliAIIntegration()
      const result = integration.formatResults({
        success: false,
        warnings: [],
      })

      expect(result).toContain('Unknown error')
    })

    it('formats successful result with analysis', () => {
      const integration = new CliAIIntegration()
      const result = integration.formatResults({
        success: true,
        analysis: {
          projectType: 'library',
          description: 'A test library',
          features: ['typescript', 'testing'],
          techStack: [
            {name: 'node', category: 'runtime', reason: 'Node.js runtime', confidence: 0.9},
          ],
          dependencies: [],
          templates: [],
          confidence: 0.85,
        },
        warnings: [],
      })

      expect(result).toContain('🤖 AI Enhancement Results')
      expect(result).toContain('📊 Project Analysis')
      expect(result).toContain('library')
      expect(result).toContain('85%')
      expect(result).toContain('typescript, testing')
      expect(result).toContain('node')
    })

    it('formats result with dependencies', () => {
      const integration = new CliAIIntegration()
      const result = integration.formatResults({
        success: true,
        dependencies: [
          {
            name: 'typescript',
            description: 'TypeScript compiler',
            reason: 'Type safety',
            confidence: 0.95,
            isDev: true,
          },
          {
            name: 'vitest',
            description: 'Test framework',
            reason: 'Testing',
            confidence: 0.9,
            isDev: true,
          },
        ],
        warnings: [],
      })

      expect(result).toContain('📦 Recommended Dependencies')
      expect(result).toContain('typescript')
      expect(result).toContain('95%')
    })

    it('limits displayed dependencies to 5', () => {
      const integration = new CliAIIntegration()
      const deps = Array.from({length: 10}, (_, i) => ({
        name: `dep-${i}`,
        description: `Dep ${i}`,
        reason: `Reason ${i}`,
        confidence: 0.8,
        isDev: false,
      }))

      const result = integration.formatResults({
        success: true,
        dependencies: deps,
        warnings: [],
      })

      expect(result).toContain('... and 5 more')
    })

    it('formats result with code generation', () => {
      const integration = new CliAIIntegration()
      const result = integration.formatResults({
        success: true,
        codeGeneration: {
          success: true,
          code: '{}',
          filePath: 'package.json',
          quality: 0.9,
        },
        warnings: [],
      })

      expect(result).toContain('🎯 Generated Configuration')
      expect(result).toContain('package.json')
      expect(result).toContain('90%')
    })

    it('uses default quality when not provided', () => {
      const integration = new CliAIIntegration()
      const result = integration.formatResults({
        success: true,
        codeGeneration: {
          success: true,
          code: '{}',
        },
        warnings: [],
      })

      expect(result).toContain('70%')
    })

    it('formats processing time', () => {
      const integration = new CliAIIntegration()
      const result = integration.formatResults({
        success: true,
        processingTime: 1234,
        warnings: [],
      })

      expect(result).toContain('⏱️  Processing time: 1234ms')
    })

    it('formats warnings', () => {
      const integration = new CliAIIntegration()
      const result = integration.formatResults({
        success: true,
        warnings: ['Warning 1', 'Warning 2'],
      })

      expect(result).toContain('⚠️  Warnings')
      expect(result).toContain('Warning 1')
      expect(result).toContain('Warning 2')
    })

    it('omits sections with no data', () => {
      const integration = new CliAIIntegration()
      const result = integration.formatResults({
        success: true,
        warnings: [],
      })

      expect(result).not.toContain('📊 Project Analysis')
      expect(result).not.toContain('📦 Recommended Dependencies')
      expect(result).not.toContain('🎯 Generated Configuration')
      expect(result).not.toContain('⚠️  Warnings')
    })
  })

  describe('isAIAvailable', () => {
    it('returns true when AI is available', () => {
      mockIsAIAvailable.mockReturnValue(true)
      const integration = new CliAIIntegration()
      expect(integration.isAIAvailable()).toBe(true)
    })

    it('returns false when AI is not available', () => {
      mockIsAIAvailable.mockReturnValue(false)
      const integration = new CliAIIntegration()
      expect(integration.isAIAvailable()).toBe(false)
    })
  })

  describe('getAIStatus', () => {
    it('returns available status with providers', () => {
      process.env.OPENAI_API_KEY = 'test-key'
      process.env.ANTHROPIC_API_KEY = 'test-key'
      mockIsAIAvailable.mockReturnValue(true)

      const integration = new CliAIIntegration()
      const status = integration.getAIStatus()

      expect(status.available).toBe(true)
      expect(status.providers).toContain('OpenAI')
      expect(status.providers).toContain('Anthropic')
      expect(status.limitations).toBeUndefined()
    })

    it('returns unavailable status with limitations', () => {
      delete process.env.OPENAI_API_KEY
      delete process.env.ANTHROPIC_API_KEY
      mockIsAIAvailable.mockReturnValue(false)

      const integration = new CliAIIntegration()
      const status = integration.getAIStatus()

      expect(status.available).toBe(false)
      expect(status.providers).toEqual([])
      expect(status.limitations).toContain('No AI API keys configured')
      expect(status.limitations).toContain('AI services unavailable - using fallback analysis')
    })

    it('returns partial status with OpenAI only', () => {
      process.env.OPENAI_API_KEY = 'test-key'
      delete process.env.ANTHROPIC_API_KEY
      mockIsAIAvailable.mockReturnValue(true)

      const integration = new CliAIIntegration()
      const status = integration.getAIStatus()

      expect(status.providers).toContain('OpenAI')
      expect(status.providers).not.toContain('Anthropic')
    })

    it('returns partial status with Anthropic only', () => {
      delete process.env.OPENAI_API_KEY
      process.env.ANTHROPIC_API_KEY = 'test-key'
      mockIsAIAvailable.mockReturnValue(true)

      const integration = new CliAIIntegration()
      const status = integration.getAIStatus()

      expect(status.providers).not.toContain('OpenAI')
      expect(status.providers).toContain('Anthropic')
    })
  })
})
