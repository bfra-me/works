import type {AIConfig, DependencyRecommendation, ProjectAnalysis} from '../types.js'
import process from 'node:process'
import {CodeGenerator, type CodeGenerationResult} from './code-generator.js'
import {DependencyRecommender} from './dependency-recommender.js'
import {ProjectAnalyzer} from './project-analyzer.js'

/**
 * Input for project analysis
 */
export interface ProjectAnalysisInput {
  description?: string
  name?: string
  keywords?: string[]
  targetAudience?: string
  requirements?: string[]
  existingDependencies?: string[]
  preferences?: {
    packageManager?: 'npm' | 'yarn' | 'pnpm' | 'bun'
    framework?: string
    testingFramework?: string
    buildTool?: string
  }
}

/**
 * Result of AI-enhanced CLI operations
 */
export interface AIEnhancementResult {
  /** Whether AI processing was successful */
  success: boolean
  /** Enhanced project analysis */
  analysis?: ProjectAnalysis
  /** Recommended dependencies */
  dependencies?: DependencyRecommendation[]
  /** Generated code suggestions */
  codeGeneration?: CodeGenerationResult
  /** AI processing time in milliseconds */
  processingTime?: number
  /** Any warnings or errors encountered */
  warnings?: string[]
  /** Error message if processing failed */
  error?: string
}

/**
 * CLI integration options for AI features
 */
export interface AICliOptions {
  /** Enable AI-powered features */
  ai?: boolean
  /** AI model configuration */
  aiConfig?: Partial<AIConfig>
  /** Enable project analysis */
  analyze?: boolean
  /** Enable dependency recommendations */
  recommend?: boolean
  /** Enable code generation */
  generate?: boolean
  /** Interactive mode for AI prompts */
  interactive?: boolean
  /** Maximum processing time in milliseconds */
  timeout?: number
}

/**
 * AI-powered CLI enhancement integration
 */
export class CliAIIntegration {
  private readonly analyzer: ProjectAnalyzer
  private readonly recommender: DependencyRecommender
  private readonly generator: CodeGenerator
  private readonly config: Partial<AIConfig>

  constructor(config?: Partial<AIConfig>) {
    this.config = config ?? {}
    this.analyzer = new ProjectAnalyzer(this.config)
    this.recommender = new DependencyRecommender(this.config)
    this.generator = new CodeGenerator(this.config)
  }

  /**
   * Enhance package creation with AI analysis and recommendations
   */
  async enhancePackageCreation(
    projectInput: ProjectAnalysisInput,
    options: AICliOptions = {},
  ): Promise<AIEnhancementResult> {
    const startTime = Date.now()
    const warnings: string[] = []
    const result: AIEnhancementResult = {
      success: false,
      warnings,
    }

    // Early return if AI is disabled
    if (options.ai === false) {
      return {
        success: true,
        warnings: ['AI features disabled'],
      }
    }

    try {
      // Check AI availability
      if (!this.isAIAvailable()) {
        warnings.push('AI services not available, using fallback analysis')
      }

      // Project analysis
      if (options.analyze !== false) {
        try {
          result.analysis = await this.analyzer.analyzeProject(projectInput)
        } catch (error) {
          warnings.push(
            `Analysis failed: ${error instanceof Error ? error.message : String(error)}`,
          )
        }
      }

      // Dependency recommendations (depends on analysis)
      if (options.recommend !== false && result.analysis != null) {
        try {
          result.dependencies = await this.recommender.recommendDependencies(
            result.analysis,
            projectInput.existingDependencies,
          )
        } catch (error) {
          warnings.push(
            `Dependency recommendations failed: ${error instanceof Error ? error.message : String(error)}`,
          )
        }
      }

      // Code generation (if requested)
      if (options.generate === true && result.analysis != null) {
        try {
          result.codeGeneration = await this.generator.generateConfig('package.json', {
            type: result.analysis.projectType,
            features: result.analysis.features,
            dependencies: result.dependencies?.map(dep => dep.name),
          })
        } catch (error) {
          warnings.push(
            `Code generation failed: ${error instanceof Error ? error.message : String(error)}`,
          )
        }
      }

      result.success = true
      result.processingTime = Date.now() - startTime

      return result
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        processingTime: Date.now() - startTime,
        warnings,
      }
    }
  }

  /**
   * Interactive AI prompt for project requirements
   */
  async interactiveAnalysis(
    initialInput: Partial<ProjectAnalysisInput>,
  ): Promise<ProjectAnalysisInput> {
    // This would integrate with inquirer or similar prompt library
    // For now, return the input with defaults
    const result: ProjectAnalysisInput = {
      name: initialInput.name ?? 'my-project',
      description: initialInput.description,
      keywords: initialInput.keywords ?? [],
      requirements: initialInput.requirements ?? [],
      existingDependencies: initialInput.existingDependencies,
    }

    // In a real implementation, this would prompt user for missing information
    // Note: AI analysis will use the provided project information

    return result
  }

  /**
   * Format AI results for CLI display
   */
  formatResults(result: AIEnhancementResult): string {
    const lines: string[] = []

    if (!result.success) {
      lines.push(`❌ AI enhancement failed: ${result.error ?? 'Unknown error'}`)
      return lines.join('\n')
    }

    lines.push('🤖 AI Enhancement Results')
    lines.push('')

    // Analysis results
    if (result.analysis != null) {
      lines.push(`📊 Project Analysis:`)
      lines.push(
        `   Type: ${result.analysis.projectType} (${(result.analysis.confidence * 100).toFixed(0)}% confidence)`,
      )
      lines.push(`   Description: ${result.analysis.description}`)

      if (result.analysis.features.length > 0) {
        lines.push(`   Features: ${result.analysis.features.join(', ')}`)
      }

      if (result.analysis.techStack.length > 0) {
        lines.push(`   Tech Stack: ${result.analysis.techStack.map(t => t.name).join(', ')}`)
      }
      lines.push('')
    }

    // Dependency recommendations
    if (result.dependencies != null && result.dependencies.length > 0) {
      lines.push(`📦 Recommended Dependencies:`)
      result.dependencies.slice(0, 5).forEach((dep: DependencyRecommendation) => {
        const confidence = (dep.confidence * 100).toFixed(0)
        lines.push(`   • ${dep.name}: ${dep.description} (${confidence}% confidence)`)
      })
      if (result.dependencies.length > 5) {
        lines.push(`   ... and ${result.dependencies.length - 5} more`)
      }
      lines.push('')
    }

    // Code generation results
    if (result.codeGeneration?.success === true && result.codeGeneration.code != null) {
      lines.push(`🎯 Generated Configuration:`)
      lines.push(`   File: ${result.codeGeneration.filePath ?? 'config file'}`)
      lines.push(`   Quality: ${((result.codeGeneration.quality ?? 0.7) * 100).toFixed(0)}%`)
      lines.push('')
    }

    // Processing info
    if (result.processingTime != null) {
      lines.push(`⏱️  Processing time: ${result.processingTime}ms`)
    }

    // Warnings
    if (result.warnings != null && result.warnings.length > 0) {
      lines.push('')
      lines.push('⚠️  Warnings:')
      result.warnings.forEach(warning => {
        lines.push(`   • ${warning}`)
      })
    }

    return lines.join('\n')
  }

  /**
   * Check if AI features are available and configured
   */
  isAIAvailable(): boolean {
    // @ts-expect-error - Accessing private property for type checking
    return this.analyzer.llmClient.isAIAvailable()
  }

  /**
   * Get AI configuration status
   */
  getAIStatus(): {
    available: boolean
    providers: string[]
    limitations?: string[]
  } {
    const available = this.isAIAvailable()
    const providers: string[] = []
    const limitations: string[] = []

    if (process.env.OPENAI_API_KEY != null) {
      providers.push('OpenAI')
    }
    if (process.env.ANTHROPIC_API_KEY != null) {
      providers.push('Anthropic')
    }

    if (providers.length === 0) {
      limitations.push('No AI API keys configured')
    }

    if (!available) {
      limitations.push('AI services unavailable - using fallback analysis')
    }

    return {
      available,
      providers,
      limitations: limitations.length > 0 ? limitations : undefined,
    }
  }
}

/**
 * Create CLI AI integration instance
 */
export function createCliAIIntegration(config?: Partial<AIConfig>): CliAIIntegration {
  return new CliAIIntegration(config)
}
