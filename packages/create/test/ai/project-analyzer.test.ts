/**
 * Tests for AI project analyzer
 * Part of Phase 5: Comprehensive Testing Implementation (TASK-036, TASK-038)
 */

import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

const mockComplete = vi.fn()
const mockIsAIAvailable = vi.fn()

vi.mock('../../src/ai/llm-client.js', () => ({
  LLMClient: class MockLLMClient {
    isAIAvailable = mockIsAIAvailable
    complete = mockComplete
  },
}))

const {ProjectAnalyzer, createProjectAnalyzer} = await import('../../src/ai/project-analyzer.js')

describe('ProjectAnalyzer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsAIAvailable.mockReturnValue(true)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('constructor', () => {
    it('creates instance with default config', () => {
      const analyzer = new ProjectAnalyzer()
      expect(analyzer).toBeInstanceOf(ProjectAnalyzer)
    })

    it('creates instance with custom config', () => {
      const config = {provider: 'openai' as const}
      const analyzer = new ProjectAnalyzer(config)
      expect(analyzer).toBeInstanceOf(ProjectAnalyzer)
    })
  })

  describe('createProjectAnalyzer', () => {
    it('creates ProjectAnalyzer instance', () => {
      const analyzer = createProjectAnalyzer()
      expect(analyzer).toBeInstanceOf(ProjectAnalyzer)
    })
  })

  describe('analyzeProject', () => {
    it('returns fallback when AI is not available', async () => {
      mockIsAIAvailable.mockReturnValue(false)
      const analyzer = new ProjectAnalyzer()

      const result = await analyzer.analyzeProject({
        name: 'test-project',
        description: 'A test CLI tool',
      })

      expect(result.projectType).toBeDefined()
      expect(result.features).toContain('typescript')
      expect(mockComplete).not.toHaveBeenCalled()
    })

    it('returns AI analysis when available', async () => {
      mockComplete.mockResolvedValue({
        success: true,
        content: JSON.stringify({
          projectType: 'cli',
          confidence: 0.95,
          description: 'A CLI tool',
          features: ['typescript', 'testing'],
          dependencies: [{name: 'commander', description: 'CLI framework', confidence: 0.9}],
          techStack: [
            {name: 'Node.js', category: 'runtime', reason: 'CLI runtime', confidence: 0.9},
          ],
          templates: [
            {source: {type: 'builtin', location: 'cli'}, reason: 'CLI template', confidence: 0.9},
          ],
        }),
      })
      const analyzer = new ProjectAnalyzer()

      const result = await analyzer.analyzeProject({
        name: 'my-cli',
        description: 'A command line tool',
      })

      expect(result.projectType).toBe('cli')
      expect(result.confidence).toBe(0.95)
      expect(mockComplete).toHaveBeenCalled()
    })

    it('returns fallback when AI response fails', async () => {
      mockComplete.mockResolvedValue({success: false, error: 'API error'})
      const analyzer = new ProjectAnalyzer()

      const result = await analyzer.analyzeProject({name: 'test'})

      expect(result.projectType).toBeDefined()
    })

    it('returns fallback when JSON parsing fails', async () => {
      mockComplete.mockResolvedValue({success: true, content: 'Invalid JSON'})
      const analyzer = new ProjectAnalyzer()

      const result = await analyzer.analyzeProject({name: 'test'})

      expect(result.projectType).toBeDefined()
    })

    it('clamps confidence between 0 and 1', async () => {
      mockComplete.mockResolvedValue({
        success: true,
        content: JSON.stringify({
          projectType: 'library',
          confidence: 1.5,
          description: 'Test',
          features: [],
          dependencies: [],
          techStack: [],
          templates: [],
        }),
      })
      const analyzer = new ProjectAnalyzer()

      const result = await analyzer.analyzeProject({name: 'test'})

      expect(result.confidence).toBe(1)
    })

    it('handles missing fields in response', async () => {
      mockComplete.mockResolvedValue({
        success: true,
        content: JSON.stringify({
          projectType: 'library',
        }),
      })
      const analyzer = new ProjectAnalyzer()

      const result = await analyzer.analyzeProject({name: 'test'})

      expect(result.features).toEqual([])
      expect(result.dependencies).toEqual([])
      expect(result.techStack).toEqual([])
      expect(result.templates).toEqual([])
    })

    it('includes input preferences in prompt', async () => {
      mockComplete.mockResolvedValue({
        success: true,
        content: JSON.stringify({
          projectType: 'library',
          confidence: 0.8,
        }),
      })
      const analyzer = new ProjectAnalyzer()

      await analyzer.analyzeProject({
        name: 'test',
        preferences: {
          packageManager: 'pnpm',
          framework: 'react',
          testingFramework: 'vitest',
        },
      })

      expect(mockComplete).toHaveBeenCalledWith(expect.stringContaining('pnpm'), expect.anything())
    })
  })

  describe('analyzeExistingProject', () => {
    it('returns fallback when AI is not available', async () => {
      mockIsAIAvailable.mockReturnValue(false)
      const analyzer = new ProjectAnalyzer()

      const result = await analyzer.analyzeExistingProject('/test/project', {
        name: 'test-project',
        dependencies: {react: '^18.0.0'},
      })

      expect(result.projectType).toBeDefined()
      expect(mockComplete).not.toHaveBeenCalled()
    })

    it('returns AI analysis when available', async () => {
      mockComplete.mockResolvedValue({
        success: true,
        content: JSON.stringify({
          projectType: 'web-app',
          confidence: 0.9,
          description: 'React app',
          features: ['react', 'typescript'],
          dependencies: [],
          techStack: [],
          templates: [],
        }),
      })
      const analyzer = new ProjectAnalyzer()

      const result = await analyzer.analyzeExistingProject('/test/project', {
        name: 'react-app',
        dependencies: {react: '^18.0.0'},
      })

      expect(result.projectType).toBe('web-app')
    })

    it('returns fallback when AI response fails', async () => {
      mockComplete.mockResolvedValue({success: false, error: 'API error'})
      const analyzer = new ProjectAnalyzer()

      const result = await analyzer.analyzeExistingProject('/test/project', {
        name: 'test',
      })

      expect(result.projectType).toBeDefined()
    })

    it('detects web-app from react dependency', async () => {
      mockIsAIAvailable.mockReturnValue(false)
      const analyzer = new ProjectAnalyzer()

      const result = await analyzer.analyzeExistingProject('/test', {
        dependencies: {react: '^18.0.0'},
      })

      expect(result.projectType).toBe('web-app')
    })

    it('detects CLI from bin field', async () => {
      mockIsAIAvailable.mockReturnValue(false)
      const analyzer = new ProjectAnalyzer()

      const result = await analyzer.analyzeExistingProject('/test', {
        bin: {cli: './dist/cli.js'},
      })

      expect(result.projectType).toBe('cli')
    })

    it('detects API from express dependency', async () => {
      mockIsAIAvailable.mockReturnValue(false)
      const analyzer = new ProjectAnalyzer()

      const result = await analyzer.analyzeExistingProject('/test', {
        dependencies: {express: '^4.18.0'},
      })

      expect(result.projectType).toBe('api')
    })

    it('detects API from fastify dependency', async () => {
      mockIsAIAvailable.mockReturnValue(false)
      const analyzer = new ProjectAnalyzer()

      const result = await analyzer.analyzeExistingProject('/test', {
        dependencies: {fastify: '^4.0.0'},
      })

      expect(result.projectType).toBe('api')
    })

    it('defaults to library for other projects', async () => {
      mockIsAIAvailable.mockReturnValue(false)
      const analyzer = new ProjectAnalyzer()

      const result = await analyzer.analyzeExistingProject('/test', {
        dependencies: {lodash: '^4.17.0'},
      })

      expect(result.projectType).toBe('library')
    })
  })

  describe('fallback keyword-based classification', () => {
    beforeEach(() => {
      mockIsAIAvailable.mockReturnValue(false)
    })

    it('detects CLI from keywords', async () => {
      const analyzer = new ProjectAnalyzer()

      const result = await analyzer.analyzeProject({
        description: 'A command line interface tool',
      })

      expect(result.projectType).toBe('cli')
      expect(result.templates.some(t => t.source.location === 'cli')).toBe(true)
    })

    it('detects library from keywords', async () => {
      const analyzer = new ProjectAnalyzer()

      const result = await analyzer.analyzeProject({
        description: 'A utility library for npm',
        keywords: ['lib', 'package'],
      })

      expect(result.projectType).toBe('library')
    })

    it('detects web-app from react keywords', async () => {
      const analyzer = new ProjectAnalyzer()

      const result = await analyzer.analyzeProject({
        description: 'A React web application',
      })

      expect(result.projectType).toBe('web-app')
    })

    it('detects web-app from frontend keywords', async () => {
      const analyzer = new ProjectAnalyzer()

      const result = await analyzer.analyzeProject({
        keywords: ['frontend', 'web'],
      })

      expect(result.projectType).toBe('web-app')
    })

    it('detects API from server keywords', async () => {
      const analyzer = new ProjectAnalyzer()

      const result = await analyzer.analyzeProject({
        description: 'A REST API server',
      })

      expect(result.projectType).toBe('api')
    })

    it('detects API from backend keywords', async () => {
      const analyzer = new ProjectAnalyzer()

      const result = await analyzer.analyzeProject({
        requirements: ['backend service'],
      })

      expect(result.projectType).toBe('api')
    })

    it('defaults to other with no keywords', async () => {
      const analyzer = new ProjectAnalyzer()

      const result = await analyzer.analyzeProject({
        name: 'generic-project',
      })

      expect(result.projectType).toBe('other')
    })

    it('uses default template when no keywords match', async () => {
      const analyzer = new ProjectAnalyzer()

      const result = await analyzer.analyzeProject({
        name: 'generic-project',
      })

      expect(result.templates.some(t => t.source.location === 'default')).toBe(true)
    })
  })

  describe('basic recommendations', () => {
    beforeEach(() => {
      mockIsAIAvailable.mockReturnValue(false)
    })

    it('includes basic dependencies', async () => {
      const analyzer = new ProjectAnalyzer()

      const result = await analyzer.analyzeProject({name: 'test'})

      expect(result.dependencies.some(d => d.name === 'typescript')).toBe(true)
      expect(result.dependencies.some(d => d.name === 'eslint')).toBe(true)
      expect(result.dependencies.some(d => d.name === 'prettier')).toBe(true)
    })

    it('includes basic tech stack', async () => {
      const analyzer = new ProjectAnalyzer()

      const result = await analyzer.analyzeProject({name: 'test'})

      expect(result.techStack.some(t => t.name === 'TypeScript')).toBe(true)
      expect(result.techStack.some(t => t.name === 'ESLint')).toBe(true)
      expect(result.techStack.some(t => t.name === 'Prettier')).toBe(true)
    })

    it('includes basic features', async () => {
      const analyzer = new ProjectAnalyzer()

      const result = await analyzer.analyzeProject({name: 'test'})

      expect(result.features).toContain('typescript')
      expect(result.features).toContain('eslint')
      expect(result.features).toContain('prettier')
    })
  })

  describe('AI response validation', () => {
    it('validates dependency objects', async () => {
      mockComplete.mockResolvedValue({
        success: true,
        content: JSON.stringify({
          projectType: 'library',
          confidence: 0.8,
          dependencies: [
            {name: 'test', confidence: 1.5}, // Invalid confidence
          ],
          techStack: [],
          templates: [],
          features: [],
        }),
      })
      const analyzer = new ProjectAnalyzer()

      const result = await analyzer.analyzeProject({name: 'test'})

      expect(result.dependencies[0]?.confidence).toBe(1)
      expect(result.dependencies[0]?.description).toBe('')
      expect(result.dependencies[0]?.isDev).toBe(false)
    })

    it('validates tech stack objects', async () => {
      mockComplete.mockResolvedValue({
        success: true,
        content: JSON.stringify({
          projectType: 'library',
          confidence: 0.8,
          dependencies: [],
          techStack: [
            {name: 'Node.js', confidence: -0.5}, // Invalid confidence
          ],
          templates: [],
          features: [],
        }),
      })
      const analyzer = new ProjectAnalyzer()

      const result = await analyzer.analyzeProject({name: 'test'})

      expect(result.techStack[0]?.confidence).toBe(0)
      expect(result.techStack[0]?.category).toBe('other')
    })

    it('validates template objects', async () => {
      mockComplete.mockResolvedValue({
        success: true,
        content: JSON.stringify({
          projectType: 'library',
          confidence: 0.8,
          dependencies: [],
          techStack: [],
          templates: [
            {reason: 'Test', confidence: 0.5}, // Missing source
          ],
          features: [],
        }),
      })
      const analyzer = new ProjectAnalyzer()

      const result = await analyzer.analyzeProject({name: 'test'})

      expect(result.templates[0]?.source).toBeDefined()
      expect(result.templates[0]?.source.type).toBe('builtin')
    })
  })
})
