#!/usr/bin/env node
/**
 * CLI entry point for workspace-analyzer.
 *
 * Provides interactive workspace analysis with progress reporting using @clack/prompts.
 * Uses cac for argument parsing following doc-sync's CLI patterns.
 */

import type {AnalyzeOptions} from './types'

import process from 'node:process'

import {cac} from 'cac'
import {consola} from 'consola'

import {runAnalyze} from './commands/analyze'

const cli = cac('workspace-analyzer')

function registerAnalyzeCommand(
  command: ReturnType<typeof cli.command>,
): ReturnType<typeof cli.command> {
  return command
    .option('-c, --config <path>', 'Path to workspace-analyzer.config.ts file')
    .option('-r, --root <dir>', 'Root directory of the workspace', {default: process.cwd()})
    .option('--json', 'Output results as JSON')
    .option('--markdown', 'Output results as Markdown')
    .option('-i, --interactive', 'Use interactive analyzer selection')
    .option('--fix', 'Attempt to auto-fix issues (placeholder for future)')
    .option('-d, --dry-run', 'Preview what would be analyzed without running')
    .option('-v, --verbose', 'Enable verbose logging')
    .option('-q, --quiet', 'Suppress non-essential output')
    .option(
      '--min-severity <level>',
      'Minimum severity level to report (info, warning, error, critical)',
    )
    .action(async (inputPath = '.', options: AnalyzeOptions) => {
      const workspacePath = String(inputPath)

      if (options.verbose === true) {
        consola.level = 4
      }

      await runAnalyze(workspacePath, options)
    })
}

// Default command: workspace-analyzer [path]
registerAnalyzeCommand(cli.command('[path]', 'Analyze a workspace for issues'))

// Explicit command: workspace-analyzer analyze [path]
registerAnalyzeCommand(cli.command('analyze [path]', 'Analyze a workspace for issues'))

cli.command('version', 'Show version information').action(() => {
  consola.info('@bfra.me/workspace-analyzer v0.0.0')
})

cli.help()
cli.version('0.0.0')

cli.parse()
