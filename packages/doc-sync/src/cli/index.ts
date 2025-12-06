#!/usr/bin/env node
/**
 * @bfra.me/doc-sync CLI entry point
 *
 * Modern TUI for documentation synchronization using @clack/prompts.
 */

import type {GlobalOptions} from './types.js'

import process from 'node:process'

import {cac} from 'cac'
import {runSync} from './commands/sync.js'
import {runValidate} from './commands/validate.js'
import {runWatch} from './commands/watch.js'

const cli = cac('doc-sync')

cli
  .command(
    'sync [...packages]',
    'Sync documentation for specified packages (or all if none specified)',
  )
  .option('-r, --root <dir>', 'Root directory of the monorepo', {default: process.cwd()})
  .option('-d, --dry-run', 'Preview changes without writing files')
  .option('-v, --verbose', 'Enable verbose output')
  .option('-q, --quiet', 'Suppress non-error output')
  .option('-i, --interactive', 'Use interactive package selection')
  .action(async (packages: string[], options: GlobalOptions) => {
    await runSync(packages, options)
  })

cli
  .command('watch [...packages]', 'Watch for changes and sync automatically')
  .option('-r, --root <dir>', 'Root directory of the monorepo', {default: process.cwd()})
  .option('-d, --dry-run', 'Preview changes without writing files')
  .option('-v, --verbose', 'Enable verbose output')
  .option('-q, --quiet', 'Suppress non-error output')
  .action(async (packages: string[], options: GlobalOptions) => {
    await runWatch(packages, options)
  })

cli
  .command('validate [...packages]', 'Check documentation freshness and validate MDX syntax')
  .option('-r, --root <dir>', 'Root directory of the monorepo', {default: process.cwd()})
  .option('-v, --verbose', 'Enable verbose output')
  .option('-q, --quiet', 'Suppress non-error output')
  .action(async (packages: string[], options: GlobalOptions) => {
    await runValidate(packages, options)
  })

cli
  .command('[...packages]', 'Sync documentation (default command)')
  .option('-r, --root <dir>', 'Root directory of the monorepo', {default: process.cwd()})
  .option('-w, --watch', 'Watch for changes and sync automatically')
  .option('-d, --dry-run', 'Preview changes without writing files')
  .option('-v, --verbose', 'Enable verbose output')
  .option('-q, --quiet', 'Suppress non-error output')
  .option('-i, --interactive', 'Use interactive package selection')
  .action(async (packages: string[], options: GlobalOptions & {watch?: boolean}) => {
    if (options.watch === true) {
      await runWatch(packages, options)
    } else {
      await runSync(packages, options)
    }
  })

cli.help()
cli.version('0.0.1')

cli.parse()
