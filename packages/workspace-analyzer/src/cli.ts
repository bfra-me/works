#!/usr/bin/env node
/**
 * CLI entry point for workspace-analyzer.
 *
 * Provides interactive workspace analysis with progress reporting using @clack/prompts.
 * Full interactive TUI will be implemented in Phase 10.
 */

import process from 'node:process'

import {intro, log, outro, spinner} from '@clack/prompts'
import cac from 'cac'
import consola from 'consola'

import {analyzeWorkspace} from './api/analyze-workspace'
import {createConsoleReporter} from './reporters/console-reporter'
import {createJsonReporter} from './reporters/json-reporter'
import {createMarkdownReporter} from './reporters/markdown-reporter'

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
  .action(async (inputPath = '.', options: AnalyzeOptions) => {
    const workspacePath = String(inputPath)
    if (options.quiet !== true) {
      intro('🔍 Workspace Analyzer')
    }

    if (options.verbose === true) {
      consola.level = 4
    }

    const s = spinner()
    s.start('Analyzing workspace...')

    const result = await analyzeWorkspace(workspacePath, {
      configPath: options.config,
      verbose: options.verbose,
      onProgress: progress => {
        const totalSuffix = progress.total == null ? '' : `/${progress.total}`
        const currentItem = progress.current ?? ''
        const message = `${progress.phase}: ${currentItem} (${progress.processed}${totalSuffix})`
        s.message(message)
      },
    })

    s.stop('Analysis complete')

    if (result.success) {
      const analysisResult = result.data

      if (options.json === true) {
        const jsonReporter = createJsonReporter()
        const report = jsonReporter.generate(analysisResult)
        console.log(JSON.stringify(report, null, 2))
      } else if (options.markdown === true) {
        const mdReporter = createMarkdownReporter()
        const report = mdReporter.generate(analysisResult)
        console.log(report)
      } else {
        const consoleReporter = createConsoleReporter({verbose: options.verbose})
        consoleReporter.generate(analysisResult)
      }

      if (options.quiet !== true) {
        outro(`Found ${analysisResult.summary.totalIssues} issues`)
      }
    } else {
      log.error(`Analysis failed: ${result.error.message}`)
      process.exit(1)
    }
  })

cli.command('version', 'Show version information').action(() => {
  consola.info('@bfra.me/workspace-analyzer v0.0.0')
})

cli.help()
cli.version('0.0.0')

cli.parse()
