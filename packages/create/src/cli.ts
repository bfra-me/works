#!/usr/bin/env node

import type {AddCommandOptions, CreateCommandOptions} from './types.js'
import process from 'node:process'
import cac from 'cac'
import {consola} from 'consola'
import {name, version} from '../package.json'
import {createPackage} from './index.js'

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
  .action(async (projectName?: string, options: CreateCommandOptions = {}) => {
    try {
      // Merge CLI options
      const createOptions: CreateCommandOptions = {
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
      }

      await createPackage(createOptions)

      if (!options.dryRun) {
        consola.success(`Project "${projectName ?? 'new-project'}" created successfully!`)
      }
    } catch (error) {
      consola.error('Failed to create project:', error)
      process.exit(1)
    }
  })

// Add command - for adding features to existing projects
cli
  .command('add <feature>', 'Add a feature to an existing project')
  .option('--skip-confirm', 'Skip confirmation prompts')
  .action(async (feature: string, options: Omit<AddCommandOptions, 'feature'> = {}) => {
    try {
      consola.info(`Adding feature: ${feature}`)

      // TODO: Implement add command in future phases
      consola.warn('Add command is not yet implemented. Coming in Phase 5!')

      // Placeholder for future implementation
      const addOptions: AddCommandOptions = {
        feature,
        skipConfirm: options.skipConfirm,
        verbose: options.verbose,
        dryRun: options.dryRun,
      }

      console.log('Add options:', addOptions)
    } catch (error) {
      consola.error('Failed to add feature:', error)
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
