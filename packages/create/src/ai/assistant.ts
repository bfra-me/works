import type {
  AIAssistantMessage,
  AIAssistSession,
  AIConfig,
  CreateCommandOptions,
  ProjectAnalysis,
} from '../types.js'
import {randomBytes} from 'node:crypto'
import {confirm, intro, multiselect, outro, select, spinner, text} from '@clack/prompts'
import {LLMClient} from './llm-client.js'
import {ProjectAnalyzer} from './project-analyzer.js'

/**
 * AI-powered assistant for conversational project setup
 * Provides an interactive, guided experience for creating new projects
 */
export class AIAssistant {
  private readonly llmClient: LLMClient
  private readonly analyzer: ProjectAnalyzer
  private readonly config: Partial<AIConfig>

  constructor(config?: Partial<AIConfig>) {
    this.config = config ?? {}
    this.llmClient = new LLMClient(config)
    this.analyzer = new ProjectAnalyzer(config)
    // Additional AI services are available for future extensions
  }

  /**
   * Start an interactive AI-assisted project setup session
   */
  async startAssistSession(
    initialOptions?: Partial<CreateCommandOptions>,
  ): Promise<CreateCommandOptions> {
    const session = this.createSession()

    intro('🤖 AI Project Assistant')

    if (!this.isAIAvailable()) {
      await this.handleNoAI(session)
      return this.fallbackToTraditionalSetup(initialOptions)
    }

    // Add initial system message
    this.addMessage(session, {
      role: 'system',
      content: this.getSystemPrompt(),
    })

    // Start conversation
    this.addMessage(session, {
      role: 'assistant',
      content:
        "Hi! I'm your AI project assistant. I'll help you create the perfect project setup. Tell me about what you want to build!",
      context: {
        step: 'introduction',
        suggestions: [
          'A TypeScript library for data validation',
          'A React web application',
          'A CLI tool for developers',
          'A Node.js API server',
        ],
      },
    })

    return this.runConversationalSetup(session, initialOptions)
  }

  /**
   * Continue an existing assist session
   */
  async continueSession(_sessionId: string): Promise<CreateCommandOptions | null> {
    // In a real implementation, you'd load the session from storage
    // For now, return null to indicate session not found
    return null
  }

  /**
   * Check if AI assistant features are available
   */
  isAIAvailable(): boolean {
    return this.llmClient.isAIAvailable()
  }

  private createSession(): AIAssistSession {
    return {
      id: randomBytes(16).toString('hex'),
      messages: [],
      projectContext: {},
      config: this.config as AIConfig,
      startTime: new Date(),
      active: true,
    }
  }

  private addMessage(session: AIAssistSession, message: Omit<AIAssistantMessage, 'timestamp'>) {
    session.messages.push({
      ...message,
      timestamp: new Date(),
    })
  }

  private async runConversationalSetup(
    session: AIAssistSession,
    initialOptions?: Partial<CreateCommandOptions>,
  ): Promise<CreateCommandOptions> {
    try {
      // Step 1: Gather project description
      const projectDescription = await this.gatherProjectDescription(session)
      session.projectContext.description = projectDescription

      // Step 2: Analyze requirements with AI
      const analysis = await this.analyzeProjectWithAI(session, projectDescription)
      session.projectContext.type = analysis.projectType

      // Step 3: Interactive refinement
      const refinedOptions = await this.refineProjectOptions(session, analysis, initialOptions)

      // Step 4: Final confirmation
      const finalOptions = await this.confirmProjectSetup(session, refinedOptions)

      outro('✨ Perfect! Your project configuration is ready.')

      return finalOptions
    } catch (error) {
      console.error('AI assistant session failed:', error)
      outro('⚠️  AI assistant encountered an error. Falling back to standard setup.')
      return this.fallbackToTraditionalSetup(initialOptions)
    }
  }

  private async gatherProjectDescription(session: AIAssistSession): Promise<string> {
    const response = await text({
      message: 'What would you like to build? Describe your project:',
      placeholder: 'e.g., "A TypeScript library for validating user input forms"',
      validate(value) {
        if (value.length < 10) {
          return 'Please provide a more detailed description (at least 10 characters)'
        }
        return undefined
      },
    })

    if (typeof response === 'string') {
      this.addMessage(session, {
        role: 'user',
        content: response,
        context: {step: 'description'},
      })

      return response
    }

    throw new Error('User cancelled project description')
  }

  private async analyzeProjectWithAI(
    session: AIAssistSession,
    description: string,
  ): Promise<ProjectAnalysis> {
    const s = spinner()
    s.start('🧠 Analyzing your project requirements...')

    try {
      const analysis = await this.analyzer.analyzeProject({
        description,
        name: session.projectContext.name,
      })

      s.stop('✅ Analysis complete!')

      // Show AI insights
      this.addMessage(session, {
        role: 'assistant',
        content: this.formatAnalysisInsights(analysis),
        context: {
          step: 'analysis',
          suggestions: analysis.templates.map(t => `${t.source.location}: ${t.reason}`),
        },
      })

      return analysis
    } catch (error) {
      s.stop('❌ Analysis failed')
      throw error
    }
  }

  private async refineProjectOptions(
    session: AIAssistSession,
    analysis: ProjectAnalysis,
    initialOptions?: Partial<CreateCommandOptions>,
  ): Promise<CreateCommandOptions> {
    // Template selection
    const selectedTemplate = await this.selectTemplate(analysis)

    // Project name
    const projectName = await this.getProjectName(session, initialOptions?.name)

    // Additional features
    const features = await this.selectFeatures(analysis)

    // Package manager
    const packageManager = await this.selectPackageManager()

    return {
      name: projectName,
      template: selectedTemplate,
      description: session.projectContext.description,
      features: features.join(','),
      packageManager,
      interactive: false, // We've handled interactivity here
      ...initialOptions,
    }
  }

  private async selectTemplate(analysis: ProjectAnalysis): Promise<string> {
    if (analysis.templates.length === 0) {
      return 'default'
    }

    if (analysis.templates.length === 1) {
      const shouldUse = await confirm({
        message: `Use recommended template "${analysis.templates[0]?.source.location}"?`,
        initialValue: true,
      })
      return shouldUse === true ? (analysis.templates[0]?.source.location ?? 'default') : 'default'
    }

    const template = await select({
      message: 'Which template would you like to use?',
      options: analysis.templates.map(t => ({
        value: t.source.location,
        label: `${t.source.location} (${Math.round(t.confidence * 100)}% match)`,
        hint: t.reason,
      })),
    })

    return template as string
  }

  private async getProjectName(session: AIAssistSession, initialName?: string): Promise<string> {
    if (initialName != null && initialName.trim() !== '') {
      return initialName
    }

    const response = await text({
      message: 'What would you like to name your project?',
      placeholder: 'my-awesome-project',
      validate(value) {
        if (value.length < 1) {
          return 'Project name is required'
        }
        if (!/^[\w\-@/]+$/.test(value)) {
          return 'Project name can only contain letters, numbers, hyphens, underscores, @ and /'
        }
        return undefined
      },
    })

    if (typeof response === 'string') {
      session.projectContext.name = response
      return response
    }

    throw new Error('User cancelled project name input')
  }

  private async selectFeatures(analysis: ProjectAnalysis): Promise<string[]> {
    if (analysis.features.length === 0) {
      return ['typescript', 'eslint', 'prettier']
    }

    const selectedFeatures = await multiselect({
      message: 'Select features for your project:',
      options: [
        ...analysis.features.map(feature => ({
          value: feature,
          label: feature,
          hint: 'Recommended based on your project',
        })),
        {value: 'vitest', label: 'vitest', hint: 'Testing framework'},
        {value: 'husky', label: 'husky', hint: 'Git hooks'},
        {value: 'commitlint', label: 'commitlint', hint: 'Commit message linting'},
      ].filter(
        (option, index, array) => array.findIndex(item => item.value === option.value) === index,
      ),
      required: false,
    })

    return selectedFeatures as string[]
  }

  private async selectPackageManager(): Promise<'npm' | 'yarn' | 'pnpm' | 'bun'> {
    const packageManager = await select({
      message: 'Which package manager would you like to use?',
      options: [
        {value: 'pnpm', label: 'pnpm', hint: 'Fast, disk space efficient'},
        {value: 'npm', label: 'npm', hint: 'Default Node.js package manager'},
        {value: 'yarn', label: 'yarn', hint: 'Fast, reliable, secure'},
        {value: 'bun', label: 'bun', hint: 'Ultra-fast JavaScript runtime'},
      ],
      initialValue: 'pnpm',
    })

    return packageManager as 'npm' | 'yarn' | 'pnpm' | 'bun'
  }

  private async confirmProjectSetup(
    session: AIAssistSession,
    options: CreateCommandOptions,
  ): Promise<CreateCommandOptions> {
    const summary = this.formatProjectSummary(options)

    this.addMessage(session, {
      role: 'assistant',
      content: summary,
      context: {step: 'confirmation'},
    })

    const confirmed = await confirm({
      message: 'Does this look good?',
      initialValue: true,
    })

    if (confirmed === false) {
      const shouldRestart = await confirm({
        message: 'Would you like to start over?',
        initialValue: false,
      })

      if (shouldRestart === true) {
        return this.runConversationalSetup(session, options)
      }
    }

    return options
  }

  private async handleNoAI(session: AIAssistSession): Promise<void> {
    this.addMessage(session, {
      role: 'assistant',
      content:
        'AI features are not available right now, but I can still help you set up your project using our standard interactive prompts.',
      context: {step: 'fallback'},
    })
  }

  private fallbackToTraditionalSetup(
    initialOptions?: Partial<CreateCommandOptions>,
  ): CreateCommandOptions {
    // Return sensible defaults for traditional setup
    return {
      name: initialOptions?.name ?? 'my-project',
      template: initialOptions?.template ?? 'default',
      description: initialOptions?.description,
      interactive: true,
      ...initialOptions,
    }
  }

  private getSystemPrompt(): string {
    return `You are an expert software development assistant helping users create new projects. Your role is to:

1. Understand project requirements from natural language descriptions
2. Recommend appropriate technologies and templates
3. Guide users through project setup decisions
4. Provide helpful explanations and context

Focus on modern best practices, TypeScript-first development, and creating maintainable, well-structured projects. Be conversational, helpful, and concise in your responses.`
  }

  private formatAnalysisInsights(analysis: ProjectAnalysis): string {
    const parts = [
      `🎯 I think you're building a **${analysis.projectType}** project.`,
      '',
      `**Key Features Detected:**`,
      ...analysis.features.map(f => `• ${f}`),
    ]

    if (analysis.templates.length > 0) {
      parts.push(
        '',
        '**Template Recommendations:**',
        ...analysis.templates
          .slice(0, 3)
          .map(
            t =>
              `• **${t.source.location}** (${Math.round(t.confidence * 100)}% match) - ${t.reason}`,
          ),
      )
    }

    if (analysis.dependencies.length > 0) {
      parts.push(
        '',
        '**Suggested Dependencies:**',
        ...analysis.dependencies.slice(0, 5).map(d => `• **${d.name}** - ${d.description}`),
      )
    }

    return parts.join('\n')
  }

  private formatProjectSummary(options: CreateCommandOptions): string {
    const parts = [
      '📋 **Project Summary:**',
      '',
      `**Name:** ${options.name}`,
      `**Template:** ${options.template}`,
    ]

    if (options.description != null && options.description.trim() !== '') {
      parts.push(`**Description:** ${options.description}`)
    }

    if (options.features != null && options.features.trim() !== '') {
      parts.push(`**Features:** ${options.features}`)
    }

    if (options.packageManager) {
      parts.push(`**Package Manager:** ${options.packageManager}`)
    }

    return parts.join('\n')
  }
}

/**
 * Create an AI assistant instance
 */
export function createAIAssistant(config?: Partial<AIConfig>): AIAssistant {
  return new AIAssistant(config)
}
