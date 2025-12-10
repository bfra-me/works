#!/usr/bin/env node
/**
 * CLI entry point for workspace-analyzer.
 *
 * Provides interactive workspace analysis with progress reporting using @clack/prompts.
 * Uses cac for argument parsing following doc-sync's CLI patterns.
 */

import type {AnalyzeOptions, VisualizeOptions} from './types'

import process from 'node:process'

import {cac} from 'cac'
import {consola} from 'consola'

import {runAnalyze} from './commands/analyze'
import {runVisualize} from './commands/visualize'

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

/**
 * Registers the visualize command with all options.
 */
function registerVisualizeCommand(
  command: ReturnType<typeof cli.command>,
): ReturnType<typeof cli.command> {
  return command
    .option('-r, --root <dir>', 'Root directory of the workspace', {default: process.cwd()})
    .option('-o, --output <path>', 'Output path for generated file', {
      default: './workspace-graph.html',
    })
    .option('-f, --format <format>', 'Output format: html, json, or both', {default: 'html'})
    .option('--no-open', 'Disable auto-opening generated file in browser')
    .option('-t, --title <title>', 'Title for the visualization', {
      default: 'Workspace Dependency Graph',
    })
    .option('--max-nodes <n>', 'Maximum nodes to render (for performance)', {default: 1000})
    .option('--include-type-imports', 'Include type-only imports in the graph')
    .option('-i, --interactive', 'Use interactive mode for options selection')
    .option('-v, --verbose', 'Enable verbose logging')
    .option('-q, --quiet', 'Suppress non-essential output')
    .action(async (inputPath = '.', options: VisualizeOptions) => {
      const workspacePath = String(inputPath)

      if (options.verbose === true) {
        consola.level = 4
      }

      await runVisualize(workspacePath, options)
    })
}

// Default command: workspace-analyzer [path]
registerAnalyzeCommand(cli.command('[path]', 'Analyze a workspace for issues'))

// Explicit command: workspace-analyzer analyze [path]
registerAnalyzeCommand(cli.command('analyze [path]', 'Analyze a workspace for issues'))

// Visualize command: workspace-analyzer visualize [path]
registerVisualizeCommand(
  cli
    .command('visualize [path]', 'Generate interactive HTML visualization of dependency graph')
    .example('workspace-analyzer visualize')
    .example('workspace-analyzer visualize ./packages')
    .example('workspace-analyzer visualize --output ./docs/deps.html')
    .example('workspace-analyzer visualize --format json --no-open')
    .example('workspace-analyzer visualize -i'),
)

cli.command('version', 'Show version information').action(() => {
  consola.info('@bfra.me/workspace-analyzer v0.0.0')
})

cli.help()
cli.version('0.0.0')

cli.parse()
