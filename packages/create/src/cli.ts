#!/usr/bin/env node

import type {CreateCommandOptions} from './types.js'
import process from 'node:process'
import cac from 'cac'
import {consola} from 'consola'
import {name, version} from '../package.json'
import {handleAddCommand} from './commands/add.js'
import {displayError} from './commands/error-messages.js'
import {showProjectSummary} from './commands/progress-indicators.js'
import {
  normalizeCreateOptions,
  registerAddCommandOptions,
  registerCreateCommandOptions,
  registerGlobalOptions,
} from './commands/shared-context.js'
import {validateCreateOptions} from './commands/validation-pipeline.js'
import {createPackage} from './index.js'
import {isRetryableError, promptRetry, retry} from './utils/retry.js'
import {logger} from './utils/ui.js'

/**
 * Apply configuration preset to provide sensible defaults
 */
function applyConfigurationPreset(
  preset?: 'minimal' | 'standard' | 'full',
): Partial<CreateCommandOptions> {
  if (preset == null) {
    return {}
  }

  switch (preset) {
    case 'minimal':
      return {
        template: 'default',
        git: false,
        install: false,
        skipPrompts: true,
        interactive: false,
      }
    case 'standard':
      return {
        template: 'library',
        git: true,
        install: true,
        interactive: true,
      }
    case 'full':
      return {
        template: 'library',
        git: true,
        install: true,
        interactive: true,
        verbose: true,
      }
  }
}

const cli = cac(name)

// Register global options using shared infrastructure
registerGlobalOptions(cli)

// Create command - main functionality
const createCommand = cli.command('create [projectName]', 'Create a new project from a template')

// Register create command options using shared infrastructure
registerCreateCommandOptions(createCommand)

createCommand.action(
  async (projectName?: string, options: CreateCommandOptions = {}): Promise<void> => {
    const startTime = Date.now()

    try {
      // Apply configuration preset if specified
      const presetConfig = applyConfigurationPreset(options.preset)

      // Normalize options using shared infrastructure
      const createOptions = normalizeCreateOptions(projectName, {...presetConfig, ...options})

      // Validate options using the validation pipeline
      const validationResult = validateCreateOptions(createOptions)
      if (!validationResult.success) {
        const errorMessages = validationResult.errors.map(e => e.message).join(', ')
        const validationError = new Error(`Validation failed: ${errorMessages}`)
        displayError(validationError, {verbose: options.verbose})
        process.exit(1)
      }

      // Show configuration summary if verbose
      if (options.verbose === true) {
        logger.info('Configuration summary:')
        consola.info({
          project: createOptions.name ?? 'auto-generated',
          template: createOptions.template ?? 'default',
          interactive: createOptions.interactive,
          features: createOptions.features ?? 'none',
          preset: createOptions.preset ?? 'none',
          ai: createOptions.ai === true ? 'enabled' : 'disabled',
          aiDescription:
            createOptions.describe != null && createOptions.describe.length > 0
              ? `"${createOptions.describe}"`
              : 'none',
        })
      }

      // Enhanced project creation with retry logic
      const result = await retry(
        async () => {
          if (options.dryRun === false || options.dryRun === undefined) {
            logger.projectStart(projectName ?? 'new-project')
          }
          return createPackage(createOptions)
        },
        {
          maxAttempts: 3,
          delay: 1000,
          backoff: true,
          onRetry: (error, attempt) => {
            if (isRetryableError(error)) {
              logger.warn(`Attempt ${attempt} failed, retrying...`)
            }
          },
        },
      )

      const duration = Date.now() - startTime

      if (options.dryRun === false || options.dryRun === undefined) {
        if (result.success) {
          logger.projectSuccess(projectName ?? 'new-project', process.cwd())

          // Parse features for display
          const displayFeatures =
            createOptions.features
              ?.split(',')
              .map(f => f.trim())
              .filter(Boolean) ?? []

          showProjectSummary({
            name: projectName ?? 'new-project',
            path: createOptions.outputDir ?? process.cwd(),
            template: createOptions.template ?? 'default',
            features: displayFeatures,
          })

          if (options.verbose) {
            logger.info(`Project created in ${duration}ms`)
          }
        } else {
          throw result.error
        }
      } else {
        logger.info('Dry run completed successfully')
      }
    } catch (error) {
      const err = error as Error

      // Enhanced error handling with retry prompts for interactive mode
      if (options.interactive === true && isRetryableError(err)) {
        const action = await promptRetry(err)

        switch (action) {
          case 'retry': {
            // Recursive retry - parse the same arguments again
            const args = process.argv.slice(2)
            cli.parse(args)
            return
          }
          case 'skip':
            logger.warn('Operation skipped by user')
            return
          case 'abort':
            logger.error('Operation aborted by user')
            process.exit(1)
        }
      }

      // Use shared error display with suggestions
      displayError(err, {verbose: options.verbose, showSuggestions: true})

      process.exit(1)
    }
  },
)

// Add command - for adding features to existing projects
const addCommand = cli.command('add [feature]', 'Add a feature to an existing project')

// Register add command options using shared infrastructure
registerAddCommandOptions(addCommand)

addCommand.action(async (feature?: string, cliOptions: Record<string, unknown> = {}) => {
  try {
    const options = {
      skipConfirm: cliOptions.skipConfirm as boolean | undefined,
      verbose: cliOptions.verbose as boolean | undefined,
      dryRun: cliOptions.dryRun as boolean | undefined,
      list: cliOptions.list as boolean | undefined,
    }

    // Handle list option
    if (options.list === true || feature === 'list') {
      await handleAddCommand({
        feature: 'list',
        skipConfirm: options.skipConfirm,
        verbose: options.verbose,
        dryRun: options.dryRun,
      })
      return
    }

    await handleAddCommand({
      feature: feature ?? '',
      skipConfirm: options.skipConfirm,
      verbose: options.verbose,
      dryRun: options.dryRun,
    })
  } catch (error) {
    const err = error as Error

    // Use shared error display with suggestions
    displayError(err, {verbose: cliOptions.verbose === true, showSuggestions: true})

    process.exit(1)
  }
})

// Legacy compatibility - default command for backward compatibility
cli
  .command('[projectPath]', 'Create a new project (legacy mode)', {ignoreOptionDefaultValue: true})
  .action(async (projectPath?: string) => {
    try {
      // Legacy mode - minimal options
      const createOptions: CreateCommandOptions = {
        outputDir: projectPath ?? process.cwd(),
        interactive: true,
      }

      await createPackage(createOptions)
      consola.success(`Project created successfully at: ${projectPath ?? process.cwd()}`)
    } catch (error) {
      // Use shared error display for legacy mode too
      displayError(error, {showSuggestions: true})
      process.exit(1)
    }
  })

// Help and version
cli.help()
cli.version(version)

// Enhanced error handling
process.on('uncaughtException', error => {
  consola.error('Uncaught exception:', error)
  process.exit(1)
})

process.on('unhandledRejection', reason => {
  consola.error('Unhandled rejection:', reason)
  process.exit(1)
})

// Parse CLI arguments
cli.parse()

// Show help if no arguments provided
if (process.argv.length === 2) {
  cli.outputHelp()
}
