import type {AIConfig, DependencyRecommendation, ProjectAnalysis} from '../types.js'
import {LLMClient} from './llm-client.js'

/**
 * AI-powered dependency recommender that suggests packages based on project context
 */
export class DependencyRecommender {
  private readonly llmClient: LLMClient

  constructor(config?: Partial<AIConfig>) {
    this.llmClient = new LLMClient(config)
  }

  /**
   * Recommend dependencies based on project analysis
   */
  async recommendDependencies(
    projectAnalysis: ProjectAnalysis,
    existingDependencies?: string[],
  ): Promise<DependencyRecommendation[]> {
    if (!this.llmClient.isAIAvailable()) {
      return this.createFallbackRecommendations(projectAnalysis, existingDependencies)
    }

    const prompt = this.buildRecommendationPrompt(projectAnalysis, existingDependencies)
    const response = await this.llmClient.complete(prompt, {
      systemPrompt: this.getSystemPrompt(),
      maxTokens: 2000,
      temperature: 0.2, // Lower temperature for more consistent recommendations
    })

    if (!response.success) {
      console.warn('AI dependency recommendation failed, using fallback:', response.error)
      return this.createFallbackRecommendations(projectAnalysis, existingDependencies)
    }

    try {
      return this.parseRecommendations(response.content)
    } catch (error) {
      console.warn('Failed to parse AI recommendations, using fallback:', error)
      return this.createFallbackRecommendations(projectAnalysis, existingDependencies)
    }
  }

  /**
   * Recommend dependencies for specific project features
   */
  async recommendForFeatures(
    features: string[],
    projectType: ProjectAnalysis['projectType'],
    existingDependencies?: string[],
  ): Promise<DependencyRecommendation[]> {
    if (!this.llmClient.isAIAvailable()) {
      return this.createFeatureBasedRecommendations(features, projectType)
    }

    const prompt = this.buildFeaturePrompt(features, projectType, existingDependencies)
    const response = await this.llmClient.complete(prompt, {
      systemPrompt: this.getSystemPrompt(),
      maxTokens: 1500,
      temperature: 0.2,
    })

    if (!response.success) {
      return this.createFeatureBasedRecommendations(features, projectType)
    }

    try {
      return this.parseRecommendations(response.content)
    } catch (error) {
      console.warn('Failed to parse feature-based recommendations:', error)
      return this.createFeatureBasedRecommendations(features, projectType)
    }
  }

  /**
   * Suggest dependency upgrades and alternatives
   */
  async suggestUpgrades(
    currentDependencies: Record<string, string>,
    projectType: ProjectAnalysis['projectType'],
  ): Promise<{
    upgrades: DependencyRecommendation[]
    alternatives: DependencyRecommendation[]
    deprecations: string[]
  }> {
    if (!this.llmClient.isAIAvailable()) {
      return this.createFallbackUpgrades(currentDependencies)
    }

    const prompt = this.buildUpgradePrompt(currentDependencies, projectType)
    const response = await this.llmClient.complete(prompt, {
      systemPrompt: this.getUpgradeSystemPrompt(),
      maxTokens: 2500,
      temperature: 0.1, // Very low temperature for precise upgrade suggestions
    })

    if (!response.success) {
      return this.createFallbackUpgrades(currentDependencies)
    }

    try {
      return this.parseUpgradeRecommendations(response.content)
    } catch (error) {
      console.warn('Failed to parse upgrade recommendations:', error)
      return this.createFallbackUpgrades(currentDependencies)
    }
  }

  private buildRecommendationPrompt(
    projectAnalysis: ProjectAnalysis,
    existingDependencies?: string[],
  ): string {
    const parts = []

    parts.push('Recommend npm packages for the following project:')
    parts.push(`Project Type: ${projectAnalysis.projectType}`)
    parts.push(`Description: ${projectAnalysis.description}`)
    parts.push(`Features: ${projectAnalysis.features.join(', ')}`)

    if (existingDependencies && existingDependencies.length > 0) {
      parts.push(`Existing Dependencies: ${existingDependencies.join(', ')}`)
    }

    parts.push('')
    parts.push('Focus on:')
    parts.push('- Essential packages for the project type')
    parts.push('- Popular, well-maintained packages')
    parts.push('- TypeScript-compatible packages')
    parts.push('- Avoiding duplicate functionality')
    parts.push('')
    parts.push('Respond with JSON array of recommendations:')
    parts.push(
      JSON.stringify(
        [
          {
            name: 'package-name',
            description: 'What this package does',
            reason: "Why it's recommended for this project",
            confidence: 0.9,
            isDev: false,
            version: '^1.0.0',
            installCommand: 'npm install package-name',
          },
        ],
        null,
        2,
      ),
    )

    return parts.join('\n')
  }

  private buildFeaturePrompt(
    features: string[],
    projectType: ProjectAnalysis['projectType'],
    existingDependencies?: string[],
  ): string {
    const parts = []

    parts.push(`Recommend packages to implement these features in a ${projectType} project:`)
    parts.push(`Features: ${features.join(', ')}`)

    if (existingDependencies && existingDependencies.length > 0) {
      parts.push(`Existing Dependencies: ${existingDependencies.join(', ')}`)
    }

    parts.push('')
    parts.push('Provide specific, actionable package recommendations in JSON format.')

    return parts.join('\n')
  }

  private buildUpgradePrompt(
    currentDependencies: Record<string, string>,
    projectType: ProjectAnalysis['projectType'],
  ): string {
    const parts = []

    parts.push(`Analyze these dependencies for a ${projectType} project:`)
    parts.push(JSON.stringify(currentDependencies, null, 2))
    parts.push('')
    parts.push('Provide recommendations for:')
    parts.push('1. Version upgrades with breaking change warnings')
    parts.push('2. Alternative packages that might be better')
    parts.push('3. Deprecated packages that should be replaced')
    parts.push('')
    parts.push('Respond in JSON format:')
    parts.push(
      JSON.stringify(
        {
          upgrades: [],
          alternatives: [],
          deprecations: [],
        },
        null,
        2,
      ),
    )

    return parts.join('\n')
  }

  private getSystemPrompt(): string {
    return `You are an expert Node.js and TypeScript developer who specializes in package selection and dependency management. Your recommendations should:

1. Prioritize well-maintained, popular packages
2. Consider TypeScript compatibility
3. Avoid deprecated or abandoned packages
4. Suggest appropriate version ranges
5. Consider bundle size and performance
6. Follow current best practices
7. Avoid unnecessary dependencies

Always provide practical, up-to-date recommendations with clear reasoning.`
  }

  private getUpgradeSystemPrompt(): string {
    return `You are a dependency management expert. Analyze existing dependencies and provide:

1. Safe upgrade paths with version compatibility notes
2. Better alternative packages when appropriate
3. Warnings about breaking changes
4. Deprecation notices and replacement suggestions
5. Security and performance considerations

Be conservative with breaking change recommendations and always explain the benefits and risks.`
  }

  private parseRecommendations(content: string): DependencyRecommendation[] {
    const jsonMatch = content.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      throw new Error('No JSON array found in response')
    }

    const parsed = JSON.parse(jsonMatch[0]) as DependencyRecommendation[]

    return parsed.map(dep => ({
      name: dep.name || '',
      description: dep.description || '',
      reason: dep.reason || '',
      confidence: Math.max(0, Math.min(1, dep.confidence || 0.7)),
      isDev: Boolean(dep.isDev),
      version: dep.version,
      installCommand: dep.installCommand,
    }))
  }

  private parseUpgradeRecommendations(content: string): {
    upgrades: DependencyRecommendation[]
    alternatives: DependencyRecommendation[]
    deprecations: string[]
  } {
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON object found in response')
    }

    const parsed = JSON.parse(jsonMatch[0]) as {
      upgrades?: unknown[]
      alternatives?: unknown[]
      deprecations?: unknown[]
    }

    return {
      upgrades: Array.isArray(parsed.upgrades)
        ? parsed.upgrades.map((dep: unknown) => this.validateDependencyRecommendation(dep))
        : [],
      alternatives: Array.isArray(parsed.alternatives)
        ? parsed.alternatives.map((dep: unknown) => this.validateDependencyRecommendation(dep))
        : [],
      deprecations: Array.isArray(parsed.deprecations) ? parsed.deprecations.map(String) : [],
    }
  }

  private validateDependencyRecommendation(dep: unknown): DependencyRecommendation {
    const depObj = dep as Partial<DependencyRecommendation>
    return {
      name: typeof depObj.name === 'string' ? depObj.name : '',
      description: typeof depObj.description === 'string' ? depObj.description : '',
      reason: typeof depObj.reason === 'string' ? depObj.reason : '',
      confidence:
        typeof depObj.confidence === 'number' ? Math.max(0, Math.min(1, depObj.confidence)) : 0.7,
      isDev: Boolean(depObj.isDev),
      version: typeof depObj.version === 'string' ? depObj.version : undefined,
      installCommand: typeof depObj.installCommand === 'string' ? depObj.installCommand : undefined,
    }
  }

  private createFallbackRecommendations(
    projectAnalysis: ProjectAnalysis,
    existingDependencies?: string[],
  ): DependencyRecommendation[] {
    const existing = new Set(existingDependencies ?? [])
    const recommendations: DependencyRecommendation[] = []

    // Essential development tools
    if (!existing.has('typescript')) {
      recommendations.push({
        name: 'typescript',
        description: 'TypeScript language and compiler',
        reason: 'Essential for type-safe development',
        confidence: 0.95,
        isDev: true,
        version: '^5.0.0',
        installCommand: 'npm install -D typescript',
      })
    }

    if (!existing.has('eslint')) {
      recommendations.push({
        name: 'eslint',
        description: 'Pluggable JavaScript/TypeScript linter',
        reason: 'Code quality and consistency',
        confidence: 0.9,
        isDev: true,
        version: '^8.0.0',
        installCommand: 'npm install -D eslint',
      })
    }

    if (!existing.has('prettier')) {
      recommendations.push({
        name: 'prettier',
        description: 'Opinionated code formatter',
        reason: 'Consistent code formatting',
        confidence: 0.85,
        isDev: true,
        version: '^3.0.0',
        installCommand: 'npm install -D prettier',
      })
    }

    // Project type specific recommendations
    switch (projectAnalysis.projectType) {
      case 'cli':
        if (!existing.has('commander') && !existing.has('yargs') && !existing.has('cac')) {
          recommendations.push({
            name: 'commander',
            description: 'Complete solution for Node.js command-line interfaces',
            reason: 'Popular and well-maintained CLI framework',
            confidence: 0.8,
            isDev: false,
            version: '^11.0.0',
            installCommand: 'npm install commander',
          })
        }
        break

      case 'web-app':
        if (!existing.has('react') && !existing.has('vue') && !existing.has('svelte')) {
          recommendations.push({
            name: 'react',
            description: 'JavaScript library for building user interfaces',
            reason: 'Most popular frontend framework',
            confidence: 0.8,
            isDev: false,
            version: '^18.0.0',
            installCommand: 'npm install react react-dom',
          })
        }
        break

      case 'api':
        if (!existing.has('express') && !existing.has('fastify') && !existing.has('koa')) {
          recommendations.push({
            name: 'express',
            description: 'Fast, unopinionated, minimalist web framework',
            reason: 'Most popular Node.js web framework',
            confidence: 0.8,
            isDev: false,
            version: '^4.18.0',
            installCommand: 'npm install express',
          })
        }
        break

      case 'library':
        if (!existing.has('tsup') && !existing.has('rollup') && !existing.has('webpack')) {
          recommendations.push({
            name: 'tsup',
            description: 'Bundle your TypeScript library with no config',
            reason: 'Simple and fast build tool for libraries',
            confidence: 0.8,
            isDev: true,
            version: '^8.0.0',
            installCommand: 'npm install -D tsup',
          })
        }
        break

      case 'config':
      case 'other':
        // No specific recommendations for these types
        break
    }

    return recommendations
  }

  private createFeatureBasedRecommendations(
    features: string[],
    _projectType: ProjectAnalysis['projectType'],
  ): DependencyRecommendation[] {
    const recommendations: DependencyRecommendation[] = []

    for (const feature of features) {
      const lowerFeature = feature.toLowerCase()

      if (lowerFeature.includes('test')) {
        recommendations.push({
          name: 'vitest',
          description: 'Next generation testing framework',
          reason: `Required for ${feature}`,
          confidence: 0.8,
          isDev: true,
          version: '^1.0.0',
          installCommand: 'npm install -D vitest',
        })
      }

      if (lowerFeature.includes('validation') || lowerFeature.includes('schema')) {
        recommendations.push({
          name: 'zod',
          description: 'TypeScript-first schema validation',
          reason: `Required for ${feature}`,
          confidence: 0.8,
          isDev: false,
          version: '^3.20.0',
          installCommand: 'npm install zod',
        })
      }

      if (lowerFeature.includes('database') || lowerFeature.includes('sql')) {
        recommendations.push({
          name: 'drizzle-orm',
          description: 'TypeScript ORM that stays true to SQL',
          reason: `Required for ${feature}`,
          confidence: 0.7,
          isDev: false,
          version: '^0.29.0',
          installCommand: 'npm install drizzle-orm',
        })
      }
    }

    return recommendations
  }

  private createFallbackUpgrades(currentDependencies: Record<string, string>): {
    upgrades: DependencyRecommendation[]
    alternatives: DependencyRecommendation[]
    deprecations: string[]
  } {
    const upgrades: DependencyRecommendation[] = []
    const alternatives: DependencyRecommendation[] = []
    const deprecations: string[] = []

    // Check for commonly deprecated packages
    if (currentDependencies.request != null && currentDependencies.request.length > 0) {
      deprecations.push('request')
      alternatives.push({
        name: 'axios',
        description: 'Promise-based HTTP client',
        reason: 'Replace deprecated request package',
        confidence: 0.9,
        isDev: false,
        version: '^1.0.0',
        installCommand: 'npm install axios',
      })
    }

    if (currentDependencies.moment != null && currentDependencies.moment.length > 0) {
      alternatives.push({
        name: 'date-fns',
        description: 'Modern JavaScript date utility library',
        reason: 'Lighter alternative to moment.js',
        confidence: 0.8,
        isDev: false,
        version: '^2.30.0',
        installCommand: 'npm install date-fns',
      })
    }

    return {upgrades, alternatives, deprecations}
  }
}

/**
 * Create a dependency recommender instance
 */
export function createDependencyRecommender(config?: Partial<AIConfig>): DependencyRecommender {
  return new DependencyRecommender(config)
}
