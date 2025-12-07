#!/usr/bin/env node
/**
 * CLI entry point for workspace-analyzer.
 *
 * Provides interactive workspace analysis with progress reporting using @clack/prompts.
 */

import {intro, log, outro} from '@clack/prompts'
import cac from 'cac'
import consola from 'consola'

/**
 * CLI command options for workspace analysis.
 */
interface AnalyzeOptions {
  config?: string
  json?: boolean
  markdown?: boolean
  verbose?: boolean
  quiet?: boolean
}

const cli = cac('workspace-analyzer')

cli
  .command('[path]', 'Analyze a workspace for issues')
  .option('--config <path>', 'Path to configuration file')
  .option('--json', 'Output results as JSON')
  .option('--markdown', 'Output results as Markdown')
  .option('--verbose', 'Enable verbose logging')
  .option('--quiet', 'Suppress non-essential output')
  .action(async (path = '.', options: AnalyzeOptions) => {
    if (!options.quiet) {
      intro('🔍 Workspace Analyzer')
    }

    if (options.verbose) {
      consola.level = 4
    }

    log.info(`Analyzing workspace at: ${path}`)

    if (options.config != null) {
      log.info(`Using config: ${options.config}`)
    }

    // Full analysis pipeline implemented in Phase 9-10
    log.warn('Analysis implementation coming in Phase 9-10')

    if (!options.quiet) {
      outro('Analysis complete!')
    }
  })

cli.command('version', 'Show version information').action(() => {
  consola.info('@bfra.me/workspace-analyzer v0.0.0')
})

cli.help()
cli.version('0.0.0')

cli.parse()
