#!/usr/bin/env node

import type {CreateCommandOptions} from './types.js'
import process from 'node:process'
import cac from 'cac'
import {consola} from 'consola'
import {name, version} from '../package.json'
import {handleAddCommand} from './commands/add.js'
import {createPackage} from './index.js'
import {isRetryableError, promptRetry, retry} from './utils/retry.js'
import {displayProjectSummary, logger} from './utils/ui.js'

/**
 * Apply configuration preset to provide sensible defaults
 */
function applyConfigurationPreset(
  preset?: 'minimal' | 'standard' | 'full',
): Partial<CreateCommandOptions> {
  if (!preset) {
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

// Global options
cli
  .option('--verbose', 'Enable verbose output')
  .option('--dry-run', 'Show what would be done without making changes')

// Create command - main functionality
cli
  .command('create [projectName]', 'Create a new project from a template')
  .option('-t, --template <template>', 'Template to use (GitHub repo, URL, or built-in name)')
  .option('-d, --description <desc>', 'Project description')
  .option('-a, --author <author>', 'Project author')
  .option('-v, --version <version>', 'Project version', {default: '1.0.0'})
  .option('-o, --output-dir <dir>', 'Output directory for the project')
  .option('--package-manager <pm>', 'Package manager to use (npm, yarn, pnpm, bun)')
  .option('--skip-prompts', 'Skip interactive prompts and use defaults')
  .option('--force', 'Force overwrite existing files')
  .option('--no-interactive', 'Disable interactive mode')
  .option('--template-ref <ref>', 'Git branch or tag for GitHub templates')
  .option('--template-subdir <subdir>', 'Subdirectory within template repository')
  .option('--features <features>', 'Comma-separated list of features to include')
  .option('--no-git', 'Skip git repository initialization')
  .option('--no-install', 'Skip dependency installation')
  .option('--preset <preset>', 'Use a configuration preset (minimal, standard, full)')
  .action(async (projectName?: string, options: CreateCommandOptions = {}): Promise<void> => {
    const startTime = Date.now()

    try {
      // Parse features string into array
      const features =
        options.features
          ?.split(',')
          .map(f => f.trim())
          .filter(Boolean) || []

      // Apply configuration preset if specified
      const presetConfig = applyConfigurationPreset(options.preset)

      // Merge CLI options with preset config
      const createOptions: CreateCommandOptions = {
        ...presetConfig,
        name: projectName,
        template: options.template,
        description: options.description,
        author: options.author,
        version: options.version,
        outputDir: options.outputDir,
        packageManager: options.packageManager,
        skipPrompts: options.skipPrompts,
        force: options.force,
        interactive: options.interactive !== false,
        verbose: options.verbose,
        dryRun: options.dryRun,
        templateRef: options.templateRef,
        templateSubdir: options.templateSubdir,
        features: features.join(','),
        git: options.git !== false,
        install: options.install !== false,
        preset: options.preset,
      }

      // Show configuration summary if verbose
      if (options.verbose) {
        logger.info('Configuration summary:')
        consola.info({
          project: createOptions.name ?? 'auto-generated',
          template: createOptions.template ?? 'default',
          interactive: createOptions.interactive,
          features: features.length > 0 ? features : 'none',
          preset: createOptions.preset ?? 'none',
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
        logger.projectSuccess(projectName ?? 'new-project', process.cwd())

        // Display enhanced project summary
        if (result.success) {
          displayProjectSummary({
            name: projectName ?? 'new-project',
            template: createOptions.template ?? 'default',
            location: createOptions.outputDir ?? process.cwd(),
            dependencies: features,
            scripts: ['build', 'test', 'lint'],
          })
        }

        if (options.verbose) {
          logger.info(`Project created in ${duration}ms`)
        }
      } else {
        logger.info('Dry run completed successfully')
      }
    } catch (error) {
      const err = error as Error

      // Enhanced error handling with retry prompts for interactive mode
      if (options.interactive && isRetryableError(err)) {
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

      logger.error(`Failed to create project: ${err.message}`)

      if (options.verbose) {
        consola.error(err.stack)
      }

      process.exit(1)
    }
  })

// Add command - for adding features to existing projects
cli
  .command('add [feature]', 'Add a feature to an existing project')
  .option('--skip-confirm', 'Skip confirmation prompts')
  .option('--list', 'List available features')
  .action(async (feature?: string, cliOptions: Record<string, unknown> = {}) => {
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
      consola.error(`Failed to add feature: ${err.message}`)

      if (cliOptions.verbose === true) {
        consola.error(err.stack)
      }

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
      consola.error('Failed to create project:', error)
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
