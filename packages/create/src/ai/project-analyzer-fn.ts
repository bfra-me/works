/**
 * Functional Project Analyzer
 * Part of Phase 3: AI System Modernization
 *
 * Refactored ProjectAnalyzer using functional composition patterns and
 * the new provider-agnostic LLM client factory.
 */

import type {Result} from '@bfra.me/es/result'
import type {
  AIConfig,
  DependencyRecommendation,
  ProjectAnalysis,
  TechStackRecommendation,
  TemplateRecommendation,
  TemplateSource,
} from '../types.js'
import {err, isOk, ok} from '@bfra.me/es/result'
import {AIErrorCode, createAIError} from '../utils/errors.js'
import {createLLMClient} from './llm-client-factory.js'

/**
 * Input for project analysis
 */
export interface ProjectAnalysisInput {
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
}

/**
 * Input for analyzing existing projects
 */
export interface ExistingProjectInput {
  projectPath: string
  packageJson?: Record<string, unknown>
}

/**
 * Project analyzer instance interface
 */
export interface ProjectAnalyzerInstance {
  /** Analyze project requirements and provide recommendations */
  readonly analyzeProject: (input: ProjectAnalysisInput) => Promise<Result<ProjectAnalysis, Error>>
  /** Analyze an existing project and suggest improvements */
  readonly analyzeExistingProject: (
    input: ExistingProjectInput,
  ) => Promise<Result<ProjectAnalysis, Error>>
  /** Check if AI-powered analysis is available */
  readonly isAIAvailable: () => boolean
}

/**
 * Creates a functional project analyzer using the LLM client factory.
 *
 * @param config - Optional AI configuration
 * @returns A project analyzer instance with unified interface
 */
export function createProjectAnalyzerFn(config?: Partial<AIConfig>): ProjectAnalyzerInstance {
  const llmClient = createLLMClient(config)

  const analyzeProject = async (
    input: ProjectAnalysisInput,
  ): Promise<Result<ProjectAnalysis, Error>> => {
    if (!llmClient.isAvailable()) {
      return ok(createFallbackAnalysis(input))
    }

    const prompt = buildAnalysisPrompt(input)
    const response = await llmClient.complete(prompt, {
      systemPrompt: getSystemPrompt(),
      maxTokens: 3000,
      temperature: 0.3,
    })

    if (!isOk(response)) {
      return ok(createFallbackAnalysis(input))
    }

    if (!response.data.success) {
      return ok(createFallbackAnalysis(input))
    }

    const parseResult = parseAnalysisResponse(response.data.content, input)
    if (!isOk(parseResult)) {
      return ok(createFallbackAnalysis(input))
    }

    return ok(parseResult.data)
  }

  const analyzeExistingProject = async (
    input: ExistingProjectInput,
  ): Promise<Result<ProjectAnalysis, Error>> => {
    if (!llmClient.isAvailable()) {
      return ok(createFallbackAnalysisForExisting(input.packageJson))
    }

    const projectContext = buildProjectContext(input.projectPath, input.packageJson)
    const prompt = buildExistingProjectPrompt(projectContext)

    const response = await llmClient.complete(prompt, {
      systemPrompt: getExistingProjectSystemPrompt(),
      maxTokens: 2000,
      temperature: 0.3,
    })

    if (!isOk(response)) {
      return ok(createFallbackAnalysisForExisting(input.packageJson))
    }

    if (!response.data.success) {
      return ok(createFallbackAnalysisForExisting(input.packageJson))
    }

    const parseResult = parseAnalysisResponse(response.data.content, {
      name: input.packageJson?.name as string | undefined,
    })

    if (!isOk(parseResult)) {
      return ok(createFallbackAnalysisForExisting(input.packageJson))
    }

    return ok(parseResult.data)
  }

  const isAIAvailable = (): boolean => {
    return llmClient.isAvailable()
  }

  return {
    analyzeProject,
    analyzeExistingProject,
    isAIAvailable,
  }
}

/**
 * Builds the analysis prompt for the LLM
 */
function buildAnalysisPrompt(input: ProjectAnalysisInput): string {
  const parts: string[] = []

  parts.push('Please analyze the following project requirements and provide recommendations:')

  if (input.name != null && input.name.trim() !== '') {
    parts.push(`Project Name: ${input.name}`)
  }

  if (input.description != null && input.description.trim() !== '') {
    parts.push(`Description: ${input.description}`)
  }

  if (input.keywords != null && input.keywords.length > 0) {
    parts.push(`Keywords: ${input.keywords.join(', ')}`)
  }

  if (input.requirements != null && input.requirements.length > 0) {
    parts.push(`Requirements: ${input.requirements.join(', ')}`)
  }

  if (input.preferences != null) {
    parts.push(`Preferences: ${JSON.stringify(input.preferences, null, 2)}`)
  }

  parts.push('')
  parts.push('Please provide analysis in the following JSON format:')
  parts.push(getExpectedJsonFormat())

  return parts.join('\n')
}

/**
 * Builds the prompt for analyzing existing projects
 */
function buildExistingProjectPrompt(projectContext: string): string {
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

/**
 * Builds context string from project information
 */
function buildProjectContext(_projectPath: string, packageJson?: Record<string, unknown>): string {
  const parts: string[] = []

  if (packageJson != null) {
    parts.push('Package.json:')
    parts.push(JSON.stringify(packageJson, null, 2))
  }

  return parts.join('\n')
}

/**
 * Gets the system prompt for project analysis
 */
function getSystemPrompt(): string {
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

/**
 * Gets the system prompt for existing project analysis
 */
function getExistingProjectSystemPrompt(): string {
  return `You are a software development consultant analyzing an existing project. Evaluate the current setup and suggest improvements that would:

1. Enhance developer experience
2. Improve code quality and maintainability
3. Add missing essential tools
4. Follow modern best practices
5. Increase productivity

Focus on practical improvements that provide clear value without unnecessary complexity.`
}

/**
 * Gets the expected JSON format for responses
 */
function getExpectedJsonFormat(): string {
  return JSON.stringify(
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
  )
}

/**
 * Parses the LLM response into a ProjectAnalysis
 */
function parseAnalysisResponse(
  content: string,
  input: {name?: string},
): Result<ProjectAnalysis, Error> {
  const jsonMatch = content.match(/\{[\s\S]*\}/)
  if (jsonMatch == null) {
    return err(createAIError('No JSON found in AI response', AIErrorCode.AI_RESPONSE_INVALID))
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]) as Partial<ProjectAnalysis>
    return ok(normalizeProjectAnalysis(parsed, input))
  } catch (error) {
    return err(
      createAIError(
        `Failed to parse AI response: ${error instanceof Error ? error.message : String(error)}`,
        AIErrorCode.AI_RESPONSE_INVALID,
      ),
    )
  }
}

/**
 * Normalizes and validates parsed project analysis
 */
function normalizeProjectAnalysis(
  parsed: Partial<ProjectAnalysis>,
  input: {name?: string},
): ProjectAnalysis {
  return {
    projectType: parsed.projectType ?? 'other',
    confidence: normalizeConfidence(parsed.confidence ?? 0.5),
    description:
      parsed.description ??
      (input.name != null && input.name.trim() !== '' ? input.name : 'Project'),
    features: Array.isArray(parsed.features) ? parsed.features : [],
    dependencies: normalizeDependencies(parsed.dependencies),
    techStack: normalizeTechStack(parsed.techStack),
    templates: normalizeTemplates(parsed.templates),
  }
}

/**
 * Normalizes a confidence value to 0-1 range
 */
function normalizeConfidence(value: number): number {
  return Math.max(0, Math.min(1, value))
}

/**
 * Normalizes dependency recommendations
 */
function normalizeDependencies(
  deps: DependencyRecommendation[] | undefined,
): DependencyRecommendation[] {
  if (!Array.isArray(deps)) {
    return []
  }
  return deps.map(dep => ({
    name: dep.name ?? '',
    description: dep.description ?? '',
    reason: dep.reason ?? '',
    confidence: normalizeConfidence(dep.confidence ?? 0.7),
    isDev: Boolean(dep.isDev),
    version: dep.version,
    installCommand: dep.installCommand,
  }))
}

/**
 * Normalizes tech stack recommendations
 */
function normalizeTechStack(
  stack: TechStackRecommendation[] | undefined,
): TechStackRecommendation[] {
  if (!Array.isArray(stack)) {
    return []
  }
  return stack.map(tech => ({
    category: tech.category ?? 'other',
    name: tech.name ?? '',
    reason: tech.reason ?? '',
    confidence: normalizeConfidence(tech.confidence ?? 0.7),
    config: tech.config,
  }))
}

/**
 * Normalizes template recommendations
 */
function normalizeTemplates(
  templates: TemplateRecommendation[] | undefined,
): TemplateRecommendation[] {
  if (!Array.isArray(templates)) {
    return []
  }
  return templates.map(template => ({
    source: template.source ?? createTemplateSource('default'),
    reason: template.reason ?? '',
    confidence: normalizeConfidence(template.confidence ?? 0.7),
    matchScore: normalizeConfidence(template.matchScore ?? 0.5),
  }))
}

/**
 * Creates a template source for builtin templates
 */
function createTemplateSource(name: string): TemplateSource {
  return {
    type: 'builtin',
    location: name,
  }
}

/**
 * Creates fallback analysis when AI is unavailable
 */
function createFallbackAnalysis(input: ProjectAnalysisInput): ProjectAnalysis {
  const description = input.description?.toLowerCase() ?? ''
  const keywords = input.keywords?.map(k => k.toLowerCase()) ?? []
  const requirements = input.requirements?.map(r => r.toLowerCase()) ?? []
  const allText = [description, ...keywords, ...requirements].join(' ')

  const {projectType, templates} = classifyProject(allText)

  return {
    projectType,
    confidence: 0.6,
    description: input.description ?? input.name ?? 'TypeScript project',
    features: ['typescript', 'eslint', 'prettier'],
    dependencies: getBasicDependencies(),
    techStack: getBasicTechStack(),
    templates,
  }
}

/**
 * Creates fallback analysis for existing projects
 */
function createFallbackAnalysisForExisting(packageJson?: Record<string, unknown>): ProjectAnalysis {
  const dependencies = (packageJson?.dependencies as Record<string, string>) ?? {}
  const devDependencies = (packageJson?.devDependencies as Record<string, string>) ?? {}

  const projectType = detectProjectType(packageJson, dependencies, devDependencies)

  return {
    projectType,
    confidence: 0.7,
    description: `Existing ${projectType} project`,
    features: Object.keys({...dependencies, ...devDependencies}),
    dependencies: getBasicDependencies(),
    techStack: getBasicTechStack(),
    templates: [
      {
        source: createTemplateSource('existing'),
        reason: 'Analysis of existing project structure',
        confidence: 1,
        matchScore: 1,
      },
    ],
  }
}

/**
 * Classifies project type based on text analysis
 */
function classifyProject(allText: string): {
  projectType: ProjectAnalysis['projectType']
  templates: TemplateRecommendation[]
} {
  let projectType: ProjectAnalysis['projectType'] = 'other'
  const templates: TemplateRecommendation[] = []

  if (allText.includes('cli') || allText.includes('command')) {
    projectType = 'cli'
    templates.push({
      source: createTemplateSource('cli'),
      reason: 'Detected CLI-related keywords',
      confidence: 0.8,
      matchScore: 0.8,
    })
  } else if (allText.includes('lib') || allText.includes('package') || allText.includes('npm')) {
    projectType = 'library'
    templates.push({
      source: createTemplateSource('library'),
      reason: 'Detected library-related keywords',
      confidence: 0.8,
      matchScore: 0.8,
    })
  } else if (allText.includes('react') || allText.includes('web') || allText.includes('frontend')) {
    projectType = 'web-app'
    templates.push({
      source: createTemplateSource('react'),
      reason: 'Detected web/React keywords',
      confidence: 0.7,
      matchScore: 0.7,
    })
  } else if (allText.includes('api') || allText.includes('server') || allText.includes('backend')) {
    projectType = 'api'
    templates.push({
      source: createTemplateSource('node'),
      reason: 'Detected API/server keywords',
      confidence: 0.7,
      matchScore: 0.7,
    })
  }

  if (templates.length === 0) {
    templates.push({
      source: createTemplateSource('default'),
      reason: 'Default recommendation',
      confidence: 0.6,
      matchScore: 0.6,
    })
  }

  return {projectType, templates}
}

/**
 * Detects project type from package.json
 */
function detectProjectType(
  packageJson: Record<string, unknown> | undefined,
  dependencies: Record<string, string>,
  devDependencies: Record<string, string>,
): ProjectAnalysis['projectType'] {
  if (dependencies.react != null || devDependencies.react != null) {
    return 'web-app'
  }
  if (packageJson?.bin != null) {
    return 'cli'
  }
  if (dependencies.express != null || dependencies.fastify != null) {
    return 'api'
  }
  return 'library'
}

/**
 * Returns basic dependency recommendations
 */
function getBasicDependencies(): DependencyRecommendation[] {
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

/**
 * Returns basic tech stack recommendations
 */
function getBasicTechStack(): TechStackRecommendation[] {
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

/**
 * Pure function to analyze project requirements (convenience wrapper)
 */
export async function analyzeProjectRequirements(
  input: ProjectAnalysisInput,
  config?: Partial<AIConfig>,
): Promise<Result<ProjectAnalysis, Error>> {
  const analyzer = createProjectAnalyzerFn(config)
  return analyzer.analyzeProject(input)
}

/**
 * Pure function to analyze existing project (convenience wrapper)
 */
export async function analyzeExistingProjectFn(
  input: ExistingProjectInput,
  config?: Partial<AIConfig>,
): Promise<Result<ProjectAnalysis, Error>> {
  const analyzer = createProjectAnalyzerFn(config)
  return analyzer.analyzeExistingProject(input)
}
