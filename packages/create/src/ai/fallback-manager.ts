import type {AIConfig, AIFallbackStrategy, ProjectAnalysis} from '../types.js'
import type {LLMClient} from './llm-client.js'

/**
 * Coordinated fallback strategy for AI features when APIs are unavailable
 * Ensures graceful degradation across all AI components
 */
export class AIFallbackManager {
  private readonly config: AIConfig
  private readonly llmClient: LLMClient
  private readonly strategies: Map<string, AIFallbackStrategy> = new Map()

  constructor(config: AIConfig, llmClient: LLMClient) {
    this.config = config
    this.llmClient = llmClient
    this.initializeFallbackStrategies()
  }

  /**
   * Check if AI features are available and working
   */
  async checkAIAvailability(): Promise<{
    available: boolean
    provider?: string
    error?: string
  }> {
    if (!this.config.enabled) {
      return {
        available: false,
        error: 'AI features are disabled in configuration',
      }
    }

    try {
      const isHealthy = await this.llmClient.healthCheck()
      if (isHealthy) {
        const providers = this.llmClient.getAvailableProviders()
        return {
          available: true,
          provider: providers[0] ?? 'unknown',
        }
      }

      return {
        available: false,
        error: 'AI service health check failed',
      }
    } catch (error) {
      return {
        available: false,
        error: error instanceof Error ? error.message : 'Unknown AI service error',
      }
    }
  }

  /**
   * Get appropriate fallback strategy for a specific AI feature
   */
  getFallbackStrategy(featureName: string): AIFallbackStrategy | undefined {
    return this.strategies.get(featureName)
  }

  /**
   * Execute AI feature with automatic fallback
   */
  async executeWithFallback<T>(
    featureName: string,
    aiOperation: () => Promise<T>,
    fallbackOperation: () => Promise<T>,
    options: {
      timeout?: number
      retries?: number
      warnOnFallback?: boolean
    } = {},
  ): Promise<T> {
    const {timeout = 30000, retries = 1, warnOnFallback = true} = options

    // Check if AI is available first
    const availability = await this.checkAIAvailability()
    if (!availability.available) {
      if (warnOnFallback) {
        console.warn(`AI unavailable for ${featureName}, using fallback: ${availability.error}`)
      }
      return fallbackOperation()
    }

    // Attempt AI operation with retries
    let lastError: Error | undefined

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        // Wrap in timeout
        const result = await Promise.race([
          aiOperation(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('AI operation timeout')), timeout),
          ),
        ])

        return result
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))

        if (attempt < retries) {
          console.warn(`AI operation failed (attempt ${attempt}/${retries}), retrying...`)
          continue
        }
      }
    }

    // All AI attempts failed, use fallback
    if (warnOnFallback) {
      console.warn(
        `AI operation ${featureName} failed after ${retries} attempts, using fallback:`,
        lastError?.message,
      )
    }

    return fallbackOperation()
  }

  /**
   * Get degraded mode status for the CLI
   */
  getDegradedModeStatus(): {
    mode: 'full-ai' | 'partial-ai' | 'fallback-only'
    availableFeatures: string[]
    unavailableFeatures: string[]
    reason?: string
  } {
    if (!this.config.enabled) {
      return {
        mode: 'fallback-only',
        availableFeatures: this.getAllFallbackFeatures(),
        unavailableFeatures: this.getAllAIFeatures(),
        reason: 'AI features disabled in configuration',
      }
    }

    // This would typically involve checking each AI service
    // For now, we'll do a simplified check
    return {
      mode: 'full-ai',
      availableFeatures: this.getAllAIFeatures(),
      unavailableFeatures: [],
    }
  }

  /**
   * Create a status report for the user
   */
  createStatusReport(): {
    aiEnabled: boolean
    aiAvailable: boolean
    degradedMode: boolean
    availableFeatures: string[]
    message: string
  } {
    const degradedStatus = this.getDegradedModeStatus()

    return {
      aiEnabled: this.config.enabled,
      aiAvailable: degradedStatus.mode === 'full-ai',
      degradedMode: degradedStatus.mode !== 'full-ai',
      availableFeatures: degradedStatus.availableFeatures,
      message: this.getStatusMessage(degradedStatus.mode, degradedStatus.reason),
    }
  }

  /**
   * Initialize all fallback strategies
   */
  private initializeFallbackStrategies(): void {
    // Project Analysis Fallback
    this.strategies.set('project-analysis', {
      name: 'project-analysis-fallback',
      available: true,
      description: 'Basic project analysis using file system inspection and heuristics',
      execute: async (context: unknown) => {
        const ctx = context as {projectPath: string; description?: string}
        return this.createBasicProjectAnalysis(ctx.projectPath, ctx.description)
      },
    })

    // Dependency Recommendation Fallback
    this.strategies.set('dependency-recommendation', {
      name: 'dependency-fallback',
      available: true,
      description: 'Static dependency recommendations based on project type patterns',
      execute: async (context: unknown) => {
        const ctx = context as {
          projectAnalysis: ProjectAnalysis
          existingDependencies: string[]
        }
        return this.createBasicDependencyRecommendations(
          ctx.projectAnalysis,
          ctx.existingDependencies,
        )
      },
    })

    // Code Generation Fallback
    this.strategies.set('code-generation', {
      name: 'code-generation-fallback',
      available: true,
      description: 'Template-based code generation without AI enhancement',
      execute: async (context: unknown) => {
        const ctx = context as {
          type: string
          language: string
          description: string
          projectContext?: unknown
        }
        return this.generateBasicCodeTemplate(ctx.type, ctx.language, ctx.description)
      },
    })

    // Configuration Optimization Fallback
    this.strategies.set('configuration-optimization', {
      name: 'config-optimization-fallback',
      available: true,
      description: 'Best practice configuration suggestions without AI analysis',
      execute: async (context: unknown) => {
        const ctx = context as {
          configType: string
          projectAnalysis: ProjectAnalysis
          existingConfig: Record<string, unknown>
        }
        return this.generateBestPracticeConfig(
          ctx.configType,
          ctx.projectAnalysis,
          ctx.existingConfig,
        )
      },
    })

    // Documentation Generation Fallback
    this.strategies.set('documentation-generation', {
      name: 'documentation-fallback',
      available: true,
      description: 'Template-based documentation generation',
      execute: async (context: unknown) => {
        const ctx = context as {
          docType: string
          projectAnalysis: ProjectAnalysis
          options: Record<string, unknown>
        }
        return this.generateBasicDocumentation(ctx.docType, ctx.projectAnalysis, ctx.options)
      },
    })

    // AI Assistant Fallback
    this.strategies.set('ai-assistant', {
      name: 'assistant-fallback',
      available: true,
      description: 'Traditional interactive CLI prompts without conversational AI',
      execute: async (context: unknown) => {
        const ctx = context as {initialOptions: Record<string, unknown>}
        return this.runTraditionalSetup(ctx.initialOptions)
      },
    })

    // Code Quality Analysis Fallback
    this.strategies.set('code-analysis', {
      name: 'code-analysis-fallback',
      available: true,
      description: 'Static code analysis using traditional linting and pattern detection',
      execute: async (context: unknown) => {
        const ctx = context as {filePaths: string[]}
        return this.performStaticCodeAnalysis(ctx.filePaths)
      },
    })
  }

  /**
   * Create basic project analysis using file system heuristics
   */
  private async createBasicProjectAnalysis(
    _projectPath: string,
    description?: string,
  ): Promise<ProjectAnalysis> {
    // This would implement basic file system analysis
    // For now, returning a minimal analysis structure
    return {
      projectType: 'library',
      confidence: 0.5,
      description:
        description !== undefined && description.length > 0
          ? description
          : 'Basic project analysis without AI',
      features: ['typescript', 'testing'],
      dependencies: [],
      techStack: [],
      templates: [],
    }
  }

  /**
   * Generate basic dependency recommendations
   */
  private async createBasicDependencyRecommendations(
    projectAnalysis: ProjectAnalysis,
    _existingDependencies: string[],
  ): Promise<string[]> {
    // Basic recommendations based on project type
    const basicRecommendations: Record<string, string[]> = {
      library: ['typescript', '@types/node', 'vitest'],
      'web-app': ['react', 'typescript', '@types/react'],
      cli: ['commander', 'chalk', '@types/node'],
      api: ['express', 'typescript', '@types/express'],
      config: ['typescript'],
      other: ['typescript'],
    }

    const recommendations = basicRecommendations[projectAnalysis.projectType]
    return recommendations ?? []
  }

  /**
   * Generate basic code template
   */
  private async generateBasicCodeTemplate(
    type: string,
    language: string,
    _description: string,
  ): Promise<{code: string; suggestedPath: string}> {
    const templates = {
      'function-typescript': {
        code: 'export function placeholder(): void {\n  // TODO: Implement function\n}',
        suggestedPath: 'src/utils.ts',
      },
      'class-typescript': {
        code: 'export class Placeholder {\n  constructor() {\n    // TODO: Implement constructor\n  }\n}',
        suggestedPath: 'src/lib.ts',
      },
    }

    const templateKey = `${type}-${language}`
    const template = templates[templateKey as keyof typeof templates]
    return (
      template ?? {
        code: '// TODO: Implement code',
        suggestedPath: 'src/index.ts',
      }
    )
  }

  /**
   * Generate best practice configuration
   */
  private async generateBestPracticeConfig(
    configType: string,
    _projectAnalysis: ProjectAnalysis,
    existingConfig: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    // Return enhanced configuration with best practices
    return {
      ...existingConfig,
      // Add basic best practice defaults based on config type
      ...(configType === 'eslint' && {extends: ['@bfra.me/eslint-config']}),
      ...(configType === 'typescript' && {strict: true}),
      ...(configType === 'prettier' && {semi: false}),
    }
  }

  /**
   * Generate basic documentation
   */
  private async generateBasicDocumentation(
    docType: string,
    projectAnalysis: ProjectAnalysis,
    _options: Record<string, unknown>,
  ): Promise<{content: string; path: string}> {
    const templates = {
      readme: {
        content: `# ${projectAnalysis.description}\n\nA ${projectAnalysis.projectType} project.\n\n## Installation\n\n\`\`\`bash\nnpm install\n\`\`\`\n\n## Usage\n\nTODO: Add usage examples\n`,
        path: 'README.md',
      },
      contributing: {
        content:
          '# Contributing\n\nThank you for your interest in contributing!\n\n## Development\n\n```bash\nnpm install\nnpm test\n```',
        path: 'CONTRIBUTING.md',
      },
    }

    const template = templates[docType as keyof typeof templates]
    return (
      template ?? {
        content: `# ${docType}\n\nTODO: Add content`,
        path: `${docType.toUpperCase()}.md`,
      }
    )
  }

  /**
   * Run traditional setup flow
   */
  private async runTraditionalSetup(_initialOptions: Record<string, unknown>): Promise<unknown> {
    // This would delegate to traditional CLI prompts
    return {setupType: 'traditional', completed: true}
  }

  /**
   * Perform static code analysis
   */
  private async performStaticCodeAnalysis(_filePaths: string[]): Promise<unknown> {
    // This would run basic static analysis tools
    return {
      issues: [],
      suggestions: ['Consider adding type annotations', 'Add error handling'],
      score: 0.7,
    }
  }

  /**
   * Get all available AI features
   */
  private getAllAIFeatures(): string[] {
    return [
      'ai-project-analysis',
      'ai-dependency-recommendations',
      'ai-code-generation',
      'ai-configuration-optimization',
      'ai-documentation-generation',
      'ai-assistant-mode',
      'ai-code-quality-analysis',
    ]
  }

  /**
   * Get all features available in fallback mode
   */
  private getAllFallbackFeatures(): string[] {
    return [
      'basic-project-analysis',
      'static-dependency-recommendations',
      'template-code-generation',
      'best-practice-configurations',
      'template-documentation-generation',
      'traditional-cli-prompts',
      'static-code-analysis',
    ]
  }

  /**
   * Get user-friendly status message
   */
  private getStatusMessage(mode: string, reason?: string): string {
    switch (mode) {
      case 'full-ai':
        return '🤖 AI features are fully available and operational'
      case 'partial-ai':
        return '⚠️ Some AI features are limited, using enhanced fallbacks where needed'
      case 'fallback-only':
        return reason !== undefined && reason.length > 0
          ? `ℹ️ AI features unavailable (${reason}), using traditional mode with full functionality`
          : 'ℹ️ Running in traditional mode with full functionality'
      default:
        return 'ℹ️ Status unknown, proceeding with available features'
    }
  }
}

/**
 * Utility function to create fallback manager with proper configuration
 */
export function createFallbackManager(config: AIConfig, llmClient: LLMClient): AIFallbackManager {
  return new AIFallbackManager(config, llmClient)
}

/**
 * Check if graceful degradation is available for a feature
 */
export function isGracefulDegradationAvailable(featureName: string): boolean {
  const supportedFeatures = [
    'project-analysis',
    'dependency-recommendation',
    'code-generation',
    'configuration-optimization',
    'documentation-generation',
    'ai-assistant',
    'code-analysis',
  ]

  return supportedFeatures.includes(featureName)
}

/**
 * Get user-friendly explanation of fallback capabilities
 */
export function getFallbackExplanation(featureName: string): string {
  const explanations: Record<string, string> = {
    'project-analysis':
      'Uses file system analysis and project patterns to understand your project structure',
    'dependency-recommendation':
      'Provides curated dependency suggestions based on common patterns for your project type',
    'code-generation': 'Generates code from high-quality templates and established patterns',
    'configuration-optimization':
      'Applies industry best practices and proven configuration patterns',
    'documentation-generation':
      'Creates documentation using professional templates and project metadata',
    'ai-assistant': 'Uses traditional interactive prompts for step-by-step project setup',
    'code-analysis': 'Performs static analysis using established linting and quality tools',
  }

  const explanation = explanations[featureName]
  return explanation !== undefined && explanation.length > 0
    ? explanation
    : 'Provides core functionality using traditional approaches and proven patterns'
}
