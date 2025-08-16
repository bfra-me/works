/**
 * Multi-step project setup workflow using @clack/prompts
 */

import type {
  CreateCommandOptions,
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
  // Skip interactive prompts if requested
  if (initialOptions.skipPrompts || !initialOptions.interactive) {
    return createNonInteractiveSetup(initialOptions)
  }

  // Step 1: Welcome and introduction
  intro('🚀 Welcome to @bfra.me/create')
  consola.info("Let's create your new TypeScript project step by step!")

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
        process.exit(0)
      }

      projectName = nameResult.trim()
    }

    // Ensure we have a valid project name
    if (!projectName || projectName.trim().length === 0) {
      throw new Error('Project name is required')
    }

    // Step 3: Template selection
    let templateResult: TemplateSelection
    try {
      templateResult = await templateSelection(initialOptions.template)
      if (isCancel(templateResult)) {
        cancel('Project creation cancelled')
        process.exit(0)
      }
    } catch (error) {
      consola.error('Template selection failed:', error)
      throw error
    }

    // Step 4: Project customization
    let customizationResult: ProjectCustomization
    try {
      customizationResult = await projectCustomization({
        projectName,
        template: templateResult,
        initialOptions,
      })

      if (isCancel(customizationResult)) {
        cancel('Project creation cancelled')
        process.exit(0)
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
        process.exit(0)
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
    process.exit(1)
  }
}

/**
 * Create setup result for non-interactive mode
 */
async function createNonInteractiveSetup(
  options: CreateCommandOptions,
): Promise<ProjectSetupResult> {
  // Detect package manager if not specified
  let packageManager = options.packageManager
  if (!packageManager) {
    const detected = await detect()
    packageManager = (detected?.name as 'npm' | 'yarn' | 'pnpm' | 'bun') || 'npm'
  }

  // Use defaults for missing values
  const projectName = options.name ?? 'new-project'
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
    process.exit(0)
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
