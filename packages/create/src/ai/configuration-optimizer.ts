import type {AIConfig, ConfigOptimizationSuggestion, ProjectAnalysis} from '../types.js'
import {readFileSync} from 'node:fs'
import {join} from 'node:path'
import {LLMClient} from './llm-client.js'

/**
 * AI-powered configuration optimizer that analyzes project configurations
 * and suggests improvements for ESLint, TypeScript, Prettier, and other tools
 */
export class ConfigurationOptimizer {
  private readonly llmClient: LLMClient

  constructor(config?: Partial<AIConfig>) {
    this.llmClient = new LLMClient(config)
  }

  /**
   * Analyze project configurations and suggest optimizations
   */
  async optimizeConfigurations(
    projectPath: string,
    projectAnalysis?: ProjectAnalysis,
    options: {
      /** Configuration types to analyze */
      configTypes?: ('eslint' | 'typescript' | 'prettier' | 'vitest' | 'package.json')[]
      /** Include experimental suggestions */
      includeExperimental?: boolean
      /** Maximum number of suggestions per config type */
      maxSuggestions?: number
    } = {},
  ): Promise<ConfigOptimizationSuggestion[]> {
    const {
      configTypes = ['eslint', 'typescript', 'prettier', 'vitest', 'package.json'],
      includeExperimental = false,
      maxSuggestions = 5,
    } = options

    const suggestions: ConfigOptimizationSuggestion[] = []

    for (const configType of configTypes) {
      try {
        const currentConfig = this.loadConfiguration(projectPath, configType)
        if (currentConfig) {
          const configSuggestions = await this.analyzeConfiguration(
            configType,
            currentConfig,
            projectAnalysis,
            {includeExperimental, maxSuggestions},
          )
          suggestions.push(...configSuggestions)
        }
      } catch (error) {
        console.warn(`Failed to analyze ${configType} configuration:`, error)
      }
    }

    return suggestions.sort((a, b) => b.confidence - a.confidence)
  }

  /**
   * Generate optimized configuration for a specific type
   */
  async generateOptimizedConfig(
    configType: 'eslint' | 'typescript' | 'prettier' | 'vitest' | 'package.json',
    projectAnalysis: ProjectAnalysis,
    existingConfig?: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    if (!this.llmClient.isAIAvailable()) {
      return this.generateFallbackConfig(configType, projectAnalysis, existingConfig)
    }

    const prompt = this.buildConfigGenerationPrompt(configType, projectAnalysis, existingConfig)
    const response = await this.llmClient.complete(prompt, {
      systemPrompt: this.getConfigSystemPrompt(),
      maxTokens: 2000,
      temperature: 0.2, // Lower temperature for more consistent configurations
    })

    if (!response.success) {
      console.warn('AI config generation failed, using fallback:', response.error)
      return this.generateFallbackConfig(configType, projectAnalysis, existingConfig)
    }

    try {
      return this.parseConfigResponse(response.content, configType)
    } catch (error) {
      console.warn('Failed to parse AI config response:', error)
      return this.generateFallbackConfig(configType, projectAnalysis, existingConfig)
    }
  }

  /**
   * Check if configuration optimization is available
   */
  isOptimizationAvailable(): boolean {
    return this.llmClient.isAIAvailable()
  }

  private async analyzeConfiguration(
    type: 'eslint' | 'typescript' | 'prettier' | 'vitest' | 'package.json',
    currentConfig: Record<string, unknown>,
    projectAnalysis?: ProjectAnalysis,
    options: {includeExperimental: boolean; maxSuggestions: number} = {
      includeExperimental: false,
      maxSuggestions: 5,
    },
  ): Promise<ConfigOptimizationSuggestion[]> {
    if (!this.llmClient.isAIAvailable()) {
      return this.generateFallbackSuggestions(type, currentConfig, projectAnalysis)
    }

    const prompt = this.buildAnalysisPrompt(type, currentConfig, projectAnalysis, options)
    const response = await this.llmClient.complete(prompt, {
      systemPrompt: this.getAnalysisSystemPrompt(),
      maxTokens: 1500,
      temperature: 0.3,
    })

    if (!response.success) {
      return this.generateFallbackSuggestions(type, currentConfig, projectAnalysis)
    }

    try {
      return this.parseAnalysisResponse(response.content, type)
    } catch (error) {
      console.warn('Failed to parse configuration analysis:', error)
      return this.generateFallbackSuggestions(type, currentConfig, projectAnalysis)
    }
  }

  private loadConfiguration(
    projectPath: string,
    type: 'eslint' | 'typescript' | 'prettier' | 'vitest' | 'package.json',
  ): Record<string, unknown> | null {
    const configFiles = this.getConfigFilePaths(type)

    for (const fileName of configFiles) {
      try {
        const filePath = join(projectPath, fileName)
        const content = readFileSync(filePath, 'utf8')

        if (fileName.endsWith('.json')) {
          return JSON.parse(content) as Record<string, unknown>
        } else if (fileName.endsWith('.js') || fileName.endsWith('.ts')) {
          // For JS/TS config files, we'll need a basic parser or fallback
          return this.parseJsConfig(content, type)
        }
      } catch {
        // File doesn't exist or can't be read, continue to next option
      }
    }

    return null
  }

  private getConfigFilePaths(
    type: 'eslint' | 'typescript' | 'prettier' | 'vitest' | 'package.json',
  ): string[] {
    switch (type) {
      case 'eslint': {
        return [
          'eslint.config.js',
          'eslint.config.ts',
          'eslint.config.mjs',
          '.eslintrc.json',
          '.eslintrc.js',
          '.eslintrc.yaml',
          '.eslintrc.yml',
        ]
      }
      case 'typescript': {
        return ['tsconfig.json', 'tsconfig.eslint.json']
      }
      case 'prettier': {
        return [
          'prettier.config.js',
          'prettier.config.ts',
          '.prettierrc.json',
          '.prettierrc.js',
          '.prettierrc.yaml',
          '.prettierrc.yml',
        ]
      }
      case 'vitest': {
        return ['vitest.config.js', 'vitest.config.ts', 'vitest.config.mjs']
      }
      case 'package.json': {
        return ['package.json']
      }
      default: {
        return []
      }
    }
  }

  private parseJsConfig(content: string, type: string): Record<string, unknown> {
    // Basic extraction for common config patterns
    try {
      // Try to extract exported object from simple patterns
      const exportMatch = content.match(/export\s+default\s+(\{[\s\S]*?\});?\s*$/m)
      if (exportMatch != null) {
        // This is a simplified parser - in a real implementation,
        // you might want to use a proper JS parser like @babel/parser
        return {_raw: content, _type: type}
      }
    } catch {
      // Fall back to raw content storage
    }

    return {_raw: content, _type: type}
  }

  private buildConfigGenerationPrompt(
    type: string,
    projectAnalysis: ProjectAnalysis,
    existingConfig?: Record<string, unknown>,
  ): string {
    const parts = [
      `Generate an optimized ${type} configuration for the following project:`,
      '',
      `Project Type: ${projectAnalysis.projectType}`,
      `Features: ${projectAnalysis.features.join(', ')}`,
      `Tech Stack: ${projectAnalysis.techStack.map(t => t.name).join(', ')}`,
    ]

    if (existingConfig && Object.keys(existingConfig).length > 0) {
      parts.push('', 'Current Configuration:')
      parts.push(JSON.stringify(existingConfig, null, 2))
    }

    parts.push(
      '',
      'Please provide an optimized configuration that:',
      '1. Follows modern best practices',
      '2. Is appropriate for the project type and tech stack',
      '3. Includes essential rules and settings',
      '4. Is performant and maintainable',
      '5. Follows TypeScript-first patterns when applicable',
      '',
      'Respond with valid JSON configuration only.',
    )

    return parts.join('\n')
  }

  private buildAnalysisPrompt(
    type: string,
    currentConfig: Record<string, unknown>,
    projectAnalysis?: ProjectAnalysis,
    options: {includeExperimental: boolean; maxSuggestions: number} = {
      includeExperimental: false,
      maxSuggestions: 5,
    },
  ): string {
    const parts = [
      `Analyze the following ${type} configuration and suggest improvements:`,
      '',
      'Current Configuration:',
      JSON.stringify(currentConfig, null, 2),
    ]

    if (projectAnalysis) {
      parts.push(
        '',
        'Project Context:',
        `Type: ${projectAnalysis.projectType}`,
        `Features: ${projectAnalysis.features.join(', ')}`,
        `Tech Stack: ${projectAnalysis.techStack.map(t => t.name).join(', ')}`,
      )
    }

    parts.push(
      '',
      'Please analyze and suggest improvements in the following JSON format:',
      JSON.stringify(
        {
          suggestions: [
            {
              current: {},
              suggested: {},
              reason: 'Explanation of why this change is beneficial',
              confidence: 0.9,
              impact: 'high',
              breaking: false,
            },
          ],
        },
        null,
        2,
      ),
      '',
      'Guidelines:',
      '- Focus on practical improvements that add real value',
      '- Consider modern best practices and performance',
      '- Ensure suggestions are appropriate for the project type',
      '- Limit breaking changes unless absolutely necessary',
      `- Provide up to ${options.maxSuggestions} suggestions`,
    )

    if (options.includeExperimental) {
      parts.push('- Include experimental features where beneficial')
    }

    return parts.join('\n')
  }

  private getConfigSystemPrompt(): string {
    return `You are a senior software engineer specializing in project configuration optimization.
Generate clean, modern, and well-structured configurations that follow current best practices.
Focus on developer experience, performance, and maintainability. Always consider the project context and existing setup.`
  }

  private getAnalysisSystemPrompt(): string {
    return `You are a configuration expert analyzing project setups. Identify opportunities for improvement that will:

1. Enhance developer experience and productivity
2. Improve code quality and consistency
3. Follow modern best practices and standards
4. Optimize performance where possible
5. Reduce maintenance overhead

Prioritize practical suggestions that provide clear benefits. Consider the project type and tech stack when making recommendations.`
  }

  private parseConfigResponse(content: string, _type: string): Record<string, unknown> {
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON configuration found in response')
    }

    const config = JSON.parse(jsonMatch[0]) as Record<string, unknown>
    return config
  }

  private parseAnalysisResponse(
    content: string,
    type: 'eslint' | 'typescript' | 'prettier' | 'vitest' | 'package.json',
  ): ConfigOptimizationSuggestion[] {
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON found in analysis response')
    }

    const parsed = JSON.parse(jsonMatch[0]) as {
      suggestions: {
        current: Record<string, unknown>
        suggested: Record<string, unknown>
        reason: string
        confidence: number
        impact: string
        breaking: boolean
      }[]
    }

    return parsed.suggestions.map(suggestion => ({
      type,
      current: suggestion.current,
      suggested: suggestion.suggested,
      reason: suggestion.reason,
      confidence: Math.max(0, Math.min(1, suggestion.confidence)),
      impact: ['low', 'medium', 'high'].includes(suggestion.impact)
        ? (suggestion.impact as 'low' | 'medium' | 'high')
        : 'medium',
      breaking: Boolean(suggestion.breaking),
    }))
  }

  private generateFallbackConfig(
    type: 'eslint' | 'typescript' | 'prettier' | 'vitest' | 'package.json',
    _projectAnalysis: ProjectAnalysis,
    _existingConfig?: Record<string, unknown>,
  ): Record<string, unknown> {
    switch (type) {
      case 'eslint': {
        return {
          extends: ['@bfra.me/eslint-config'],
          parserOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
          },
          env: {
            node: true,
            es2022: true,
          },
        }
      }
      case 'typescript': {
        return {
          extends: '@bfra.me/tsconfig',
          compilerOptions: {
            target: 'ES2022',
            module: 'ESNext',
            strict: true,
            esModuleInterop: true,
            skipLibCheck: true,
            forceConsistentCasingInFileNames: true,
          },
          include: ['src'],
          exclude: ['dist', 'node_modules'],
        }
      }
      case 'prettier': {
        return {
          semi: false,
          singleQuote: true,
          tabWidth: 2,
          trailingComma: 'all',
          printWidth: 100,
        }
      }
      case 'vitest': {
        return {
          test: {
            environment: 'node',
            coverage: {
              provider: 'v8',
              reporter: ['text', 'json', 'html'],
            },
          },
        }
      }
      case 'package.json': {
        return {
          type: 'module',
          engines: {
            node: '>=18.0.0',
          },
          scripts: {
            build: 'tsc',
            test: 'vitest run',
            lint: 'eslint .',
            format: 'prettier --write .',
          },
        }
      }
      default: {
        return {}
      }
    }
  }

  private generateFallbackSuggestions(
    type: 'eslint' | 'typescript' | 'prettier' | 'vitest' | 'package.json',
    currentConfig: Record<string, unknown>,
    _projectAnalysis?: ProjectAnalysis,
  ): ConfigOptimizationSuggestion[] {
    const suggestions: ConfigOptimizationSuggestion[] = []

    switch (type) {
      case 'eslint': {
        if (currentConfig.extends == null) {
          suggestions.push({
            type,
            current: {extends: undefined},
            suggested: {extends: ['@bfra.me/eslint-config']},
            reason: 'Use shared ESLint configuration for consistency',
            confidence: 0.8,
            impact: 'medium',
            breaking: false,
          })
        }
        break
      }
      case 'typescript': {
        if (currentConfig.extends == null) {
          suggestions.push({
            type,
            current: {extends: undefined},
            suggested: {extends: '@bfra.me/tsconfig'},
            reason: 'Use shared TypeScript configuration for consistency',
            confidence: 0.8,
            impact: 'medium',
            breaking: false,
          })
        }
        break
      }
      case 'package.json': {
        if (currentConfig.type !== 'module') {
          suggestions.push({
            type,
            current: {type: currentConfig.type},
            suggested: {type: 'module'},
            reason: 'Use ES modules for modern JavaScript development',
            confidence: 0.7,
            impact: 'medium',
            breaking: true,
          })
        }
        break
      }
      case 'prettier':
      case 'vitest': {
        // No fallback suggestions for these config types
        break
      }
    }

    return suggestions
  }
}

/**
 * Create a configuration optimizer instance
 */
export function createConfigurationOptimizer(config?: Partial<AIConfig>): ConfigurationOptimizer {
  return new ConfigurationOptimizer(config)
}
