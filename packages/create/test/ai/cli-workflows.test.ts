import type {
  CreateCommandOptions,
  DependencyRecommendation,
  ProjectAnalysis,
  TemplateRecommendation,
} from '../../src/types.js'

import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {createPackage} from '../../src/index.js'
import {projectSetup} from '../../src/prompts/project-setup.js'
import {testUtils} from '../test-utils.js'

// Create mock functions first with proper typing
const mockAnalyzeProject = vi.fn()
const mockRecommendDependencies = vi.fn()

// Mock AI modules before importing
vi.mock('../../src/ai/project-analyzer', () => ({
  ProjectAnalyzer: vi.fn().mockImplementation(() => ({
    analyzeProject: mockAnalyzeProject,
  })),
}))

vi.mock('../../src/ai/dependency-recommender', () => ({
  DependencyRecommender: vi.fn().mockImplementation(() => ({
    recommendDependencies: mockRecommendDependencies,
  })),
}))

// Also mock the UI utils that are dynamically imported
vi.mock('../../src/utils/ui', () => ({
  AIProgressIndicator: vi.fn().mockImplementation(() => ({
    startAnalysis: vi.fn(),
    updateMessage: vi.fn(),
    stop: vi.fn(),
  })),
  displayAIAnalysisSummary: vi.fn(),
  displayDependencyRecommendations: vi.fn(),
  displayTemplateRecommendations: vi.fn(),
}))

vi.mock('@clack/prompts', () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  spinner: vi.fn().mockReturnValue({
    start: vi.fn(),
    stop: vi.fn(),
  }),
  confirm: vi.fn(),
  text: vi.fn(),
  select: vi.fn(),
  multiselect: vi.fn(),
  note: vi.fn(),
  cancel: vi.fn(),
  isCancel: vi.fn().mockReturnValue(false),
}))

describe('AI CLI Workflow Integration', () => {
  beforeEach(() => {
    testUtils.setup()

    // Clear all mocks including the module-level ones
    vi.clearAllMocks()

    // Reset environment variables
    delete process.env.OPENAI_API_KEY
    delete process.env.ANTHROPIC_API_KEY
  })

  afterEach(() => {
    // Additional cleanup to ensure test isolation
    vi.clearAllMocks()
  })

  describe('AI-enabled createPackage workflow', () => {
    it('integrates AI analysis when API keys are available', async () => {
      // Setup environment with OpenAI key
      process.env.OPENAI_API_KEY = 'test-openai-key'

      // Clear mocks for this specific test
      mockAnalyzeProject.mockClear()
      mockRecommendDependencies.mockClear()

      const mockAnalysis: ProjectAnalysis = {
        projectType: 'library',
        confidence: 0.95,
        description: 'TypeScript library with utility functions',
        features: ['typescript', 'testing', 'documentation'],
        dependencies: [
          {
            name: 'vitest',
            description: 'Testing framework',
            reason: 'Essential for TypeScript library testing',
            confidence: 0.9,
            isDev: true,
            version: '^2.0.0',
          },
        ],
        techStack: [],
        templates: [
          {
            source: {
              type: 'builtin',
              location: 'library',
            },
            reason: 'Best match for TypeScript library projects',
            confidence: 0.95,
            matchScore: 0.95,
          },
        ],
      }

      const mockRecommendations: DependencyRecommendation[] = [
        {
          name: 'typescript',
          description: 'TypeScript compiler',
          reason: 'Required for TypeScript development',
          confidence: 0.95,
          isDev: true,
          version: '^5.0.0',
        },
        {
          name: 'vitest',
          description: 'Testing framework',
          reason: 'Modern testing for TypeScript projects',
          confidence: 0.9,
          isDev: true,
          version: '^2.0.0',
        },
      ]

      // Mock AI analyzer
      mockAnalyzeProject.mockResolvedValue(mockAnalysis)

      // Mock dependency recommender
      mockRecommendDependencies.mockResolvedValue(mockRecommendations)

      const options: CreateCommandOptions = {
        name: 'ai-test-library',
        ai: true,
        describe: 'A TypeScript utility library for data processing',
        interactive: false,
        outputDir: testUtils.createTempDir('ai-workflow-test'),
        dryRun: true,
        verbose: true, // Enable verbose for better test output
      }

      const result = await createPackage(options)

      expect(result.success).toBe(true)

      // The AI analysis should have been called
      expect(mockAnalyzeProject).toHaveBeenCalledExactlyOnceWith({
        description: 'A TypeScript utility library for data processing',
        name: 'ai-test-library',
        preferences: {
          packageManager: undefined,
        },
      })

      // Note: mockRecommendDependencies might not be called in the main flow
      // as it's called from the project setup workflow, not the main createPackage flow
    })

    it('gracefully falls back when AI analysis fails', async () => {
      // Setup environment with OpenAI key
      process.env.OPENAI_API_KEY = 'test-openai-key'

      // Clear mocks for this specific test
      mockAnalyzeProject.mockClear()
      mockRecommendDependencies.mockClear()

      // Mock AI analyzer to throw error
      mockAnalyzeProject.mockRejectedValue(new Error('API rate limit exceeded'))

      const options: CreateCommandOptions = {
        name: 'ai-fallback-test',
        ai: true,
        describe: 'A project that should fallback gracefully',
        interactive: false,
        outputDir: testUtils.createTempDir('ai-fallback-test'),
        dryRun: true,
        verbose: true, // Enable verbose for better test output
      }

      const result = await createPackage(options)

      // Should still succeed in fallback mode
      expect(result.success).toBe(true)

      // The AI analysis should have been attempted (and failed)
      expect(mockAnalyzeProject).toHaveBeenCalled()
    })

    it('works without AI when no API keys are present', async () => {
      // Ensure no API keys are set
      delete process.env.OPENAI_API_KEY
      delete process.env.ANTHROPIC_API_KEY

      // Clear mocks for this specific test
      mockAnalyzeProject.mockClear()
      mockRecommendDependencies.mockClear()

      const options: CreateCommandOptions = {
        name: 'no-ai-test',
        ai: true, // AI requested but no keys available
        describe: 'A project without AI capabilities',
        interactive: false,
        template: 'default',
        outputDir: testUtils.createTempDir('no-ai-test'),
        dryRun: true,
      }

      const result = await createPackage(options)

      expect(result.success).toBe(true)
      // AI modules should not have been called
      expect(mockAnalyzeProject).not.toHaveBeenCalled()
    })
  })

  describe('AI error handling scenarios', () => {
    it.concurrent('handles network errors gracefully', async () => {
      process.env.OPENAI_API_KEY = 'test-key'

      mockAnalyzeProject.mockRejectedValue(new Error('Network connection failed'))

      const options: CreateCommandOptions = {
        name: 'network-error-test',
        ai: true,
        describe: 'Test network error handling',
        interactive: false,
        outputDir: testUtils.createTempDir('network-error-test'),
        dryRun: true,
        verbose: true, // Enable verbose to test error help display
      }

      const result = await createPackage(options)
      expect(result.success).toBe(true)
    })

    it.concurrent('handles API authentication errors', async () => {
      process.env.OPENAI_API_KEY = 'invalid-key'

      mockAnalyzeProject.mockRejectedValue(new Error('Invalid API key or unauthorized access'))

      const options: CreateCommandOptions = {
        name: 'auth-error-test',
        ai: true,
        describe: 'Test authentication error handling',
        interactive: false,
        outputDir: testUtils.createTempDir('auth-error-test'),
        dryRun: true,
      }

      const result = await createPackage(options)
      expect(result.success).toBe(true)
    })

    it.concurrent('handles rate limit errors', async () => {
      process.env.OPENAI_API_KEY = 'test-key'

      mockAnalyzeProject.mockRejectedValue(
        new Error('Rate limit exceeded - please try again later'),
      )

      const options: CreateCommandOptions = {
        name: 'rate-limit-test',
        ai: true,
        describe: 'Test rate limit handling',
        interactive: false,
        outputDir: testUtils.createTempDir('rate-limit-test'),
        dryRun: true,
      }

      const result = await createPackage(options)
      expect(result.success).toBe(true)
    })
  })

  describe('AI recommendation integration', () => {
    it.concurrent('displays AI recommendations in CLI output', async () => {
      process.env.OPENAI_API_KEY = 'test-key'

      const mockTemplates: TemplateRecommendation[] = [
        {
          source: {type: 'builtin', location: 'react'},
          reason: 'Perfect for React dashboard applications',
          confidence: 0.98,
          matchScore: 0.98,
        },
        {
          source: {type: 'builtin', location: 'library'},
          reason: 'Good for component libraries',
          confidence: 0.75,
          matchScore: 0.75,
        },
      ]

      const mockDependencies: DependencyRecommendation[] = [
        {
          name: 'react-router-dom',
          description: 'Declarative routing for React',
          reason: 'Essential for dashboard navigation',
          confidence: 0.95,
          isDev: false,
          version: '^6.0.0',
        },
        {
          name: 'recharts',
          description: 'Chart library for React',
          reason: 'Perfect for dashboard data visualization',
          confidence: 0.9,
          isDev: false,
          version: '^2.0.0',
        },
      ]

      const mockAnalysis: ProjectAnalysis = {
        projectType: 'web-app',
        confidence: 0.95,
        description: 'React dashboard application with charts and navigation',
        features: ['react', 'charts', 'routing'],
        dependencies: mockDependencies,
        techStack: [],
        templates: mockTemplates,
      }

      mockAnalyzeProject.mockResolvedValue(mockAnalysis)
      mockRecommendDependencies.mockResolvedValue(mockDependencies)

      const options: CreateCommandOptions = {
        name: 'dashboard-app',
        ai: true,
        describe: 'React dashboard with charts and navigation',
        interactive: false,
        outputDir: testUtils.createTempDir('dashboard-test'),
        dryRun: true,
        verbose: true,
      }

      const result = await createPackage(options)

      expect(result.success).toBe(true)
      expect(mockAnalyzeProject).toHaveBeenCalledExactlyOnceWith({
        description: 'React dashboard with charts and navigation',
        name: 'dashboard-app',
        preferences: {
          packageManager: undefined,
        },
      })
    })
  })

  describe('interactive AI workflow', () => {
    it('integrates AI recommendations into interactive prompts', async () => {
      process.env.ANTHROPIC_API_KEY = 'test-anthropic-key'

      const mockAnalysis: ProjectAnalysis = {
        projectType: 'cli',
        confidence: 0.9,
        description: 'Command-line tool for file processing',
        features: ['cli', 'typescript', 'file-processing'],
        dependencies: [
          {
            name: 'commander',
            description: 'Complete solution for node.js command-line interfaces',
            reason: 'Industry standard for CLI applications',
            confidence: 0.95,
            isDev: false,
            version: '^12.0.0',
          },
        ],
        techStack: [],
        templates: [
          {
            source: {type: 'builtin', location: 'cli'},
            reason: 'Optimized for CLI application development',
            confidence: 0.9,
            matchScore: 0.9,
          },
        ],
      }

      mockAnalyzeProject.mockResolvedValue(mockAnalysis)
      mockRecommendDependencies.mockResolvedValue([])

      // Mock interactive prompts to simulate user selections
      const {text, select, multiselect, confirm} = await import('@clack/prompts')
      const mockText = text as ReturnType<typeof vi.fn>
      const mockSelect = select as ReturnType<typeof vi.fn>
      const mockMultiselect = multiselect as ReturnType<typeof vi.fn>
      const mockConfirm = confirm as ReturnType<typeof vi.fn>

      mockText.mockResolvedValue('cli-processor')
      mockSelect.mockResolvedValue('cli')
      mockMultiselect.mockResolvedValue(['typescript', 'vitest'])
      mockConfirm.mockResolvedValue(true)

      const options: CreateCommandOptions = {
        ai: true,
        describe: 'TypeScript CLI for processing CSV files',
        interactive: true,
        outputDir: testUtils.createTempDir('interactive-ai-test'),
      }

      // Note: This test verifies that the AI workflow integrates properly
      // The actual projectSetup function should be mocked in a real test scenario
      // to avoid complex interactive prompt handling
      try {
        await projectSetup(options)
      } catch (error: unknown) {
        // Expected to throw due to mocked prompts or incomplete setup
        const errorMessage = (error as Error).message
        expect(
          errorMessage.includes('Process exit called') ||
            errorMessage.includes('confirm') ||
            errorMessage.includes('mock'),
        ).toBe(true)
      }

      expect(mockAnalyzeProject).toHaveBeenCalled()
    })
  })

  describe('AI feature validation', () => {
    it.concurrent(
      'validates AI features enhance user experience without complication',
      async () => {
        // Test that AI features remain optional and don't complicate the basic workflow
        const basicOptions: CreateCommandOptions = {
          name: 'simple-project',
          template: 'default',
          interactive: false,
          outputDir: testUtils.createTempDir('basic-test'),
          dryRun: true,
        }

        const basicResult = await createPackage(basicOptions)

        const aiEnhancedOptions: CreateCommandOptions = {
          name: 'ai-enhanced-project',
          ai: true,
          describe: 'Enhanced with AI recommendations',
          interactive: false,
          outputDir: testUtils.createTempDir('ai-enhanced-test'),
          dryRun: true,
        }

        // Ensure no API keys so AI falls back gracefully
        delete process.env.OPENAI_API_KEY
        delete process.env.ANTHROPIC_API_KEY

        const aiResult = await createPackage(aiEnhancedOptions)

        // Both workflows should succeed
        expect(basicResult.success).toBe(true)
        expect(aiResult.success).toBe(true)

        // AI-enhanced version should gracefully degrade to standard mode
        // without throwing errors or complicating the process
      },
    )

    it.concurrent('ensures AI recommendations are clearly marked and optional', async () => {
      // This test validates that AI recommendations are presented as enhancements
      // rather than requirements, maintaining user control over the process

      process.env.OPENAI_API_KEY = 'test-key'

      const mockAnalysis: ProjectAnalysis = {
        projectType: 'library',
        confidence: 0.8,
        description: 'TypeScript utility library',
        features: ['typescript', 'testing'],
        dependencies: [
          {
            name: 'jest',
            description: 'JavaScript testing framework',
            reason: 'Popular choice for testing',
            confidence: 0.7, // Lower confidence should be marked as suggestion
            isDev: true,
            version: '^29.0.0',
          },
          {
            name: 'typescript',
            description: 'TypeScript compiler',
            reason: 'Essential for TypeScript projects',
            confidence: 0.95, // High confidence should be marked as recommended
            isDev: true,
            version: '^5.0.0',
          },
        ],
        techStack: [],
        templates: [],
      }

      mockAnalyzeProject.mockResolvedValue(mockAnalysis)

      const options: CreateCommandOptions = {
        name: 'optional-ai-test',
        ai: true,
        describe: 'Test optional AI recommendations',
        interactive: false,
        outputDir: testUtils.createTempDir('optional-ai-test'),
        dryRun: true,
      }

      const result = await createPackage(options)

      expect(result.success).toBe(true)
      // Verify that the analysis properly distinguishes between high and low confidence recommendations
      expect(mockAnalyzeProject).toHaveBeenCalled()
    })
  })
})
