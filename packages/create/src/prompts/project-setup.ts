/**
 * Multi-step project setup workflow using @clack/prompts
 */

import type {
  CreateCommandOptions,
  DependencyRecommendation,
  ProjectAnalysis,
  ProjectCustomization,
  ProjectSetupResult,
  TemplateSelection,
} from '../types.js'
import process from 'node:process'
import {cancel, intro, isCancel, outro, spinner, text} from '@clack/prompts'
import {consola} from 'consola'
import {detect} from 'package-manager-detector'
import {confirmationStep} from './confirmation.js'
import {projectCustomization} from './customization.js'
import {templateSelection} from './template-selection.js'

/**
 * Run the complete multi-step project setup workflow
 */
export async function projectSetup(
  initialOptions: CreateCommandOptions = {},
): Promise<ProjectSetupResult> {
  // Skip interactive prompts if requested or if interactive is explicitly false
  if (initialOptions.skipPrompts || initialOptions.interactive === false) {
    return createNonInteractiveSetup(initialOptions)
  }

  // Step 1: Welcome and introduction
  intro('🚀 Welcome to @bfra.me/create')
  consola.info("Let's create your new TypeScript project step by step!")

  // Check if AI features should be enabled
  const aiEnabled = initialOptions.ai === true || initialOptions.describe != null
  const hasOpenAI = process.env.OPENAI_API_KEY != null && process.env.OPENAI_API_KEY.length > 0
  const hasAnthropic =
    process.env.ANTHROPIC_API_KEY != null && process.env.ANTHROPIC_API_KEY.length > 0
  const hasAIKeys = hasOpenAI || hasAnthropic

  // AI Status indication
  if (aiEnabled && hasAIKeys) {
    consola.info('🤖 AI-powered project analysis enabled')
  } else if (aiEnabled && !hasAIKeys) {
    consola.warn('⚠️  AI features requested but no API keys found - using standard mode')
  }

  try {
    // Step 2: Project name (if not provided)
    let projectName = initialOptions.name
    if (projectName == null || projectName.trim().length === 0) {
      const nameResult = await text({
        message: '📦 What is the name of your project?',
        placeholder: 'my-awesome-project',
        validate: value => {
          if (!value || value.trim().length === 0) {
            return 'Project name is required'
          }
          if (!/^[a-z0-9-]+$/.test(value.trim())) {
            return 'Project name must contain only lowercase letters, numbers, and hyphens'
          }
          return undefined
        },
      })

      if (isCancel(nameResult)) {
        cancel('Project creation cancelled')
        throw new Error('Process exit called')
      }

      projectName = nameResult.trim()
    }

    // Ensure we have a valid project name
    if (!projectName || projectName.trim().length === 0) {
      throw new Error('Project name is required')
    }

    // Step 2.5: AI Analysis (if enabled and available)
    let aiAnalysis: ProjectAnalysis | undefined
    let aiRecommendations: DependencyRecommendation[] = []

    if (aiEnabled && hasAIKeys && initialOptions.describe != null) {
      try {
        const {ProjectAnalyzer} = await import('../ai/project-analyzer.js')
        const {DependencyRecommender} = await import('../ai/dependency-recommender.js')
        const {
          AIProgressIndicator,
          displayAIAnalysisSummary,
          displayDependencyRecommendations,
          displayTemplateRecommendations,
        } = await import('../utils/ui.js')

        const progressIndicator = new AIProgressIndicator()
        await progressIndicator.startAnalysis(initialOptions.describe)

        const projectAnalyzer = new ProjectAnalyzer({
          enabled: true,
          provider: hasOpenAI ? 'openai' : 'anthropic',
        })

        progressIndicator.updateMessage('Analyzing project requirements')
        aiAnalysis = await projectAnalyzer.analyzeProject({
          description: initialOptions.describe,
          name: projectName,
          preferences: {
            packageManager: initialOptions.packageManager,
          },
        })

        progressIndicator.updateMessage('Generating dependency recommendations')
        const dependencyRecommender = new DependencyRecommender({
          enabled: true,
          provider: hasOpenAI ? 'openai' : 'anthropic',
        })

        aiRecommendations = await dependencyRecommender.recommendDependencies(aiAnalysis)

        progressIndicator.complete('AI analysis complete')

        // Display AI insights
        displayAIAnalysisSummary({
          projectType: aiAnalysis.projectType,
          confidence: aiAnalysis.confidence,
          description: aiAnalysis.description,
          features: aiAnalysis.features,
        })

        if (aiAnalysis.templates.length > 0) {
          displayTemplateRecommendations(aiAnalysis.templates)
        }

        if (aiRecommendations.length > 0) {
          displayDependencyRecommendations(aiRecommendations)
        }
      } catch (aiError) {
        const {logger} = await import('../utils/ui.js')
        const {showErrorHelp} = await import('../utils/help.js')

        // Determine the type of AI error for appropriate feedback
        let errorType = 'ai'
        let fallbackReason = 'Unknown error'

        if (aiError instanceof Error) {
          const errorMessage = aiError.message.toLowerCase()
          if (errorMessage.includes('rate limit') || errorMessage.includes('quota')) {
            fallbackReason = 'API rate limit exceeded'
            errorType = 'ai-rate-limit'
          } else if (errorMessage.includes('network') || errorMessage.includes('connection')) {
            fallbackReason = 'Network connection failed'
            errorType = 'network'
          } else if (errorMessage.includes('api key') || errorMessage.includes('unauthorized')) {
            fallbackReason = 'Invalid or missing API key'
            errorType = 'ai-auth'
          } else {
            fallbackReason = aiError.message
          }
        }

        const progressIndicator = new (await import('../utils/ui.js')).AIProgressIndicator()
        progressIndicator.fallback(fallbackReason)

        logger.aiFallback(fallbackReason)

        // Show specific help for AI errors if verbose mode
        if (initialOptions.verbose) {
          showErrorHelp(errorType, aiError instanceof Error ? aiError : undefined)
        } else {
          // Show brief guidance about AI features being optional
          consola.info("💡 Don't worry - the CLI works great without AI features too!")
        }

        aiAnalysis = undefined
        aiRecommendations = []
      }
    }

    // Step 3: Template selection (with AI recommendations if available)
    let templateResult: TemplateSelection
    try {
      // Use AI recommended template if available and no template was specified
      const aiRecommendedTemplate = aiAnalysis?.templates?.[0]?.source?.location
      const templateToUse = initialOptions.template ?? aiRecommendedTemplate

      templateResult = await templateSelection(templateToUse)
      if (isCancel(templateResult)) {
        cancel('Project creation cancelled')
        throw new Error('Process exit called')
      }
    } catch (error) {
      consola.error('Template selection failed:', error)
      throw error
    }

    // Step 4: Project customization (with AI recommendations)
    let customizationResult: ProjectCustomization
    try {
      customizationResult = await projectCustomization({
        projectName,
        template: templateResult,
        initialOptions,
        aiRecommendations,
      })

      if (isCancel(customizationResult)) {
        cancel('Project creation cancelled')
        throw new Error('Process exit called')
      }
    } catch (error) {
      consola.error('Project customization failed:', error)
      throw error
    }

    // Step 5: Confirmation and summary
    let confirmationResult: boolean
    try {
      confirmationResult = await confirmationStep({
        projectName,
        template: templateResult,
        customization: customizationResult,
      })

      if (isCancel(confirmationResult) || confirmationResult !== true) {
        cancel('Project creation cancelled')
        throw new Error('Process exit called')
      }
    } catch (error) {
      consola.error('Confirmation step failed:', error)
      throw error
    }

    // Step 6: Final setup result
    const setupResult: ProjectSetupResult = {
      projectName,
      template: templateResult,
      options: {
        ...initialOptions,
        name: projectName,
        description: customizationResult.description,
        author: customizationResult.author,
        version: customizationResult.version,
        packageManager: customizationResult.packageManager,
        outputDir: customizationResult.outputDir,
      },
      customization: customizationResult,
    }

    outro('✅ Project setup complete! Creating your project...')
    return setupResult
  } catch (error) {
    consola.error('Setup workflow failed:', error)
    cancel('Setup failed due to an error')
    // Re-throw the original error instead of calling process.exit() to allow proper error handling in tests
    throw error
  }
}

/**
 * Create setup result for non-interactive mode
 */
async function createNonInteractiveSetup(
  options: CreateCommandOptions,
): Promise<ProjectSetupResult> {
  // Validate required options for non-interactive mode
  if (options.name == null || options.name.trim().length === 0) {
    throw new Error('Project name is required')
  }

  // Detect package manager if not specified
  let packageManager = options.packageManager
  if (!packageManager) {
    const detected = await detect()
    packageManager = (detected?.name as 'npm' | 'yarn' | 'pnpm' | 'bun') || 'npm'
  }

  // Use defaults for missing values
  const projectName = options.name.trim()
  const template = options.template ?? 'default'

  return {
    projectName,
    template: {
      type: 'builtin' as const,
      location: template,
      metadata: {
        name: template,
        description: `Built-in ${template} template`,
        version: '1.0.0',
      },
    },
    options: {
      ...options,
      name: projectName,
      packageManager,
    },
    customization: {
      description: options.description ?? `A new ${template} project`,
      author: options.author ?? '',
      version: options.version ?? '1.0.0',
      packageManager,
      outputDir: options.outputDir,
      features: [],
    },
  }
}

/**
 * Helper function to handle graceful cancellation
 */
export function handleCancel<T>(result: T | symbol): T {
  if (isCancel(result)) {
    cancel('Operation cancelled')
    throw new Error('Process exit called')
  }
  return result
}

/**
 * Helper function to show progress during long operations
 */
export async function withProgress<T>(message: string, operation: () => Promise<T>): Promise<T> {
  const s = spinner()
  s.start(message)

  try {
    const result = await operation()
    s.stop(`✅ ${message} completed`)
    return result
  } catch (error) {
    s.stop(`❌ ${message} failed`)
    throw error
  }
}
