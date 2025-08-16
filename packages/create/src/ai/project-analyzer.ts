import type {
  AIConfig,
  DependencyRecommendation,
  ProjectAnalysis,
  TechStackRecommendation,
  TemplateRecommendation,
  TemplateSource,
} from '../types.js'
import {LLMClient} from './llm-client.js'

/**
 * AI-powered project analyzer that examines user input and recommends
 * project configurations, dependencies, and templates
 */
export class ProjectAnalyzer {
  private readonly llmClient: LLMClient

  constructor(config?: Partial<AIConfig>) {
    this.llmClient = new LLMClient(config)
  }

  /**
   * Analyze user input and provide project recommendations
   */
  async analyzeProject(input: {
    description?: string
    name?: string
    keywords?: string[]
    targetAudience?: string
    requirements?: string[]
    preferences?: {
      packageManager?: 'npm' | 'yarn' | 'pnpm' | 'bun'
      framework?: string
      testingFramework?: string
      buildTool?: string
    }
  }): Promise<ProjectAnalysis> {
    if (!this.llmClient.isAIAvailable()) {
      return this.createFallbackAnalysis(input)
    }

    const prompt = this.buildAnalysisPrompt(input)
    const response = await this.llmClient.complete(prompt, {
      systemPrompt: this.getSystemPrompt(),
      maxTokens: 3000,
      temperature: 0.3, // Lower temperature for more consistent analysis
    })

    if (!response.success) {
      console.warn('AI analysis failed, using fallback:', response.error)
      return this.createFallbackAnalysis(input)
    }

    try {
      return this.parseAnalysisResponse(response.content, input)
    } catch (error) {
      console.warn('Failed to parse AI response, using fallback:', error)
      return this.createFallbackAnalysis(input)
    }
  }

  /**
   * Analyze existing project structure and suggest improvements
   */
  async analyzeExistingProject(
    projectPath: string,
    packageJson?: Record<string, unknown>,
  ): Promise<ProjectAnalysis> {
    if (!this.llmClient.isAIAvailable()) {
      return this.createFallbackAnalysisForExisting(packageJson)
    }

    const projectContext = this.buildProjectContext(projectPath, packageJson)
    const prompt = this.buildExistingProjectPrompt(projectContext)

    const response = await this.llmClient.complete(prompt, {
      systemPrompt: this.getExistingProjectSystemPrompt(),
      maxTokens: 2000,
      temperature: 0.3,
    })

    if (!response.success) {
      return this.createFallbackAnalysisForExisting(packageJson)
    }

    try {
      return this.parseAnalysisResponse(response.content, {name: packageJson?.name as string})
    } catch (error) {
      console.warn('Failed to parse existing project analysis:', error)
      return this.createFallbackAnalysisForExisting(packageJson)
    }
  }

  private buildAnalysisPrompt(input: {
    description?: string
    name?: string
    keywords?: string[]
    requirements?: string[]
    preferences?: Record<string, unknown>
  }): string {
    const parts = []

    parts.push('Please analyze the following project requirements and provide recommendations:')

    if (input.name != null && input.name.trim() !== '') {
      parts.push(`Project Name: ${input.name}`)
    }

    if (input.description != null && input.description.trim() !== '') {
      parts.push(`Description: ${input.description}`)
    }

    if (input.keywords && input.keywords.length > 0) {
      parts.push(`Keywords: ${input.keywords.join(', ')}`)
    }

    if (input.requirements && input.requirements.length > 0) {
      parts.push(`Requirements: ${input.requirements.join(', ')}`)
    }

    if (input.preferences) {
      parts.push(`Preferences: ${JSON.stringify(input.preferences, null, 2)}`)
    }

    parts.push('')
    parts.push('Please provide analysis in the following JSON format:')
    parts.push(
      JSON.stringify(
        {
          projectType: 'library | cli | web-app | api | config | other',
          confidence: 0.95,
          description: 'Brief project summary',
          features: ['feature1', 'feature2'],
          dependencies: [
            {
              name: 'package-name',
              description: 'Package description',
              reason: 'Why this package is recommended',
              type: 'runtime | dev | peer',
              priority: 1,
            },
          ],
          techStack: [
            {
              category: 'framework | testing | build | lint | format',
              name: 'Technology name',
              reason: 'Why this is recommended',
              priority: 1,
            },
          ],
          templates: [
            {
              name: 'template-name',
              description: 'Template description',
              matchScore: 0.9,
              reason: 'Why this template fits',
            },
          ],
        },
        null,
        2,
      ),
    )

    return parts.join('\n')
  }

  private buildExistingProjectPrompt(projectContext: string): string {
    return `
Analyze the existing project structure and suggest improvements:

${projectContext}

Provide recommendations for:
1. Missing dependencies that could be useful
2. Development tools that could improve the workflow
3. Configuration improvements
4. Best practices that could be applied

Respond in the same JSON format as for new projects.
    `.trim()
  }

  private buildProjectContext(_projectPath: string, packageJson?: Record<string, unknown>): string {
    const parts = []

    if (packageJson) {
      parts.push('Package.json:')
      parts.push(JSON.stringify(packageJson, null, 2))
    }

    // Additional context could be added here (file structure, etc.)

    return parts.join('\n')
  }

  private getSystemPrompt(): string {
    return `You are an expert software development consultant specializing in TypeScript, Node.js, and modern web development. Your role is to analyze project requirements and provide intelligent recommendations for:

1. Project type classification
2. Essential dependencies and packages
3. Development tools and frameworks
4. Project templates and scaffolding
5. Best practices and configuration

Always consider:
- Modern best practices and industry standards
- TypeScript-first development
- Developer experience and productivity
- Maintainability and scalability
- Testing and quality assurance
- Security and performance

Provide practical, actionable recommendations with clear reasoning.`
  }

  private getExistingProjectSystemPrompt(): string {
    return `You are a software development consultant analyzing an existing project. Evaluate the current setup and suggest improvements that would:

1. Enhance developer experience
2. Improve code quality and maintainability
3. Add missing essential tools
4. Follow modern best practices
5. Increase productivity

Focus on practical improvements that provide clear value without unnecessary complexity.`
  }

  private parseAnalysisResponse(content: string, input: {name?: string}): ProjectAnalysis {
    // Try to extract JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON found in response')
    }

    const parsed = JSON.parse(jsonMatch[0]) as ProjectAnalysis

    // Validate and provide defaults
    return {
      projectType: parsed.projectType || 'other',
      confidence: Math.max(0, Math.min(1, parsed.confidence || 0.5)),
      description:
        parsed.description ||
        (input.name != null && input.name.trim() !== '' ? input.name : 'Project'),
      features: Array.isArray(parsed.features) ? parsed.features : [],
      dependencies: Array.isArray(parsed.dependencies)
        ? parsed.dependencies.map(dep => ({
            name: dep.name || '',
            description: dep.description || '',
            reason: dep.reason || '',
            confidence: Math.max(0, Math.min(1, dep.confidence || 0.7)),
            isDev: Boolean(dep.isDev),
            version: dep.version,
            installCommand: dep.installCommand,
          }))
        : [],
      techStack: Array.isArray(parsed.techStack)
        ? parsed.techStack.map(tech => ({
            category: tech.category || 'other',
            name: tech.name || '',
            reason: tech.reason || '',
            confidence: Math.max(0, Math.min(1, tech.confidence || 0.7)),
            config: tech.config,
          }))
        : [],
      templates: Array.isArray(parsed.templates)
        ? parsed.templates.map(template => ({
            source: template.source ?? this.createTemplateSource('default'),
            reason: template.reason || '',
            confidence: Math.max(0, Math.min(1, template.confidence || 0.7)),
            matchScore: Math.max(0, Math.min(1, template.matchScore || 0.5)),
          }))
        : [],
    }
  }

  private createTemplateSource(name: string): TemplateSource {
    return {
      type: 'builtin',
      location: name,
    }
  }

  private createFallbackAnalysis(input: {
    description?: string
    name?: string
    keywords?: string[]
    requirements?: string[]
  }): ProjectAnalysis {
    // Basic analysis based on keywords and description
    const description = input.description?.toLowerCase() ?? ''
    const keywords = input.keywords?.map(k => k.toLowerCase()) ?? []
    const requirements = input.requirements?.map(r => r.toLowerCase()) ?? []

    const allText = [description, ...keywords, ...requirements].join(' ')

    let projectType: ProjectAnalysis['projectType'] = 'other'
    const templates: TemplateRecommendation[] = []

    // Simple keyword-based classification
    if (allText.includes('cli') || allText.includes('command')) {
      projectType = 'cli'
      templates.push({
        source: this.createTemplateSource('cli'),
        reason: 'Detected CLI-related keywords',
        confidence: 0.8,
        matchScore: 0.8,
      })
    } else if (allText.includes('lib') || allText.includes('package') || allText.includes('npm')) {
      projectType = 'library'
      templates.push({
        source: this.createTemplateSource('library'),
        reason: 'Detected library-related keywords',
        confidence: 0.8,
        matchScore: 0.8,
      })
    } else if (
      allText.includes('react') ||
      allText.includes('web') ||
      allText.includes('frontend')
    ) {
      projectType = 'web-app'
      templates.push({
        source: this.createTemplateSource('react'),
        reason: 'Detected web/React keywords',
        confidence: 0.7,
        matchScore: 0.7,
      })
    } else if (
      allText.includes('api') ||
      allText.includes('server') ||
      allText.includes('backend')
    ) {
      projectType = 'api'
      templates.push({
        source: this.createTemplateSource('node'),
        reason: 'Detected API/server keywords',
        confidence: 0.7,
        matchScore: 0.7,
      })
    }

    // Add default template if none matched
    if (templates.length === 0) {
      templates.push({
        source: this.createTemplateSource('default'),
        reason: 'Default recommendation',
        confidence: 0.6,
        matchScore: 0.6,
      })
    }

    return {
      projectType,
      confidence: 0.6, // Lower confidence for fallback
      description: input.description ?? input.name ?? 'TypeScript project',
      features: ['typescript', 'eslint', 'prettier'],
      dependencies: this.getBasicDependencies(),
      techStack: this.getBasicTechStack(),
      templates,
    }
  }

  private createFallbackAnalysisForExisting(
    packageJson?: Record<string, unknown>,
  ): ProjectAnalysis {
    const dependencies = (packageJson?.dependencies as Record<string, string>) ?? {}
    const devDependencies = (packageJson?.devDependencies as Record<string, string>) ?? {}

    let projectType: ProjectAnalysis['projectType'] = 'other'

    if (dependencies.react != null || devDependencies.react != null) {
      projectType = 'web-app'
    } else if (packageJson?.bin != null) {
      projectType = 'cli'
    } else if (dependencies.express != null || dependencies.fastify != null) {
      projectType = 'api'
    } else {
      projectType = 'library'
    }

    return {
      projectType,
      confidence: 0.7,
      description: `Existing ${projectType} project`,
      features: Object.keys({...dependencies, ...devDependencies}),
      dependencies: this.getBasicDependencies(),
      techStack: this.getBasicTechStack(),
      templates: [
        {
          source: this.createTemplateSource('existing'),
          reason: 'Analysis of existing project structure',
          confidence: 1,
          matchScore: 1,
        },
      ],
    }
  }

  private getBasicDependencies(): DependencyRecommendation[] {
    return [
      {
        name: 'typescript',
        description: 'TypeScript language support',
        reason: 'Essential for type-safe development',
        confidence: 0.9,
        isDev: true,
      },
      {
        name: 'eslint',
        description: 'Code linting and quality checks',
        reason: 'Maintains code quality and consistency',
        confidence: 0.8,
        isDev: true,
      },
      {
        name: 'prettier',
        description: 'Code formatting',
        reason: 'Consistent code style across the project',
        confidence: 0.8,
        isDev: true,
      },
    ]
  }

  private getBasicTechStack(): TechStackRecommendation[] {
    return [
      {
        category: 'runtime',
        name: 'TypeScript',
        reason: 'Type safety and better developer experience',
        confidence: 0.9,
      },
      {
        category: 'linting',
        name: 'ESLint',
        reason: 'Code quality and consistency',
        confidence: 0.8,
      },
      {
        category: 'other',
        name: 'Prettier',
        reason: 'Automated code formatting',
        confidence: 0.8,
      },
    ]
  }
}

/**
 * Create a project analyzer instance
 */
export function createProjectAnalyzer(config?: Partial<AIConfig>): ProjectAnalyzer {
  return new ProjectAnalyzer(config)
}
