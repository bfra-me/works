#!/usr/bin/env node
/**
 * @bfra.me/doc-sync CLI entry point
 *
 * Placeholder for Phase 5 implementation.
 * Will provide sync, watch, and validate commands.
 */

import process from 'node:process'

import {cac} from 'cac'

const cli = cac('doc-sync')

cli
  .command('[...packages]', 'Sync documentation for specified packages (or all if none specified)')
  .option('-r, --root <dir>', 'Root directory of the monorepo')
  .option('-w, --watch', 'Watch for changes and sync automatically')
  .option('-d, --dry-run', 'Preview changes without writing files')
  .option('-v, --verbose', 'Enable verbose output')
  .option('-q, --quiet', 'Suppress non-error output')
  .action((_packages: string[], _options: Record<string, unknown>) => {
    console.log('doc-sync: CLI implementation coming in Phase 5')
    process.exit(0)
  })

cli.help()
cli.version('0.0.1')

cli.parse()
