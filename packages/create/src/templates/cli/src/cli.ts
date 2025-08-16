#!/usr/bin/env node

import {cac} from 'cac'
import {consola} from 'consola'
import {main} from './index.js'

const cli = cac('<%= it.kebabCase(it.name) %>')

cli
  .command('[...args]', 'Run the main command')
  .option('--verbose', 'Enable verbose output')
  .action(async (args: string[], options: {verbose?: boolean}) => {
    if (options.verbose) {
      consola.level = 4 // Debug level
    }

    try {
      await main(args, options)
    } catch (error) {
      consola.error('Command failed:', error)
      process.exit(1)
    }
  })

cli.help()
cli.version('<%= it.version %>')

try {
  cli.parse()
} catch (error) {
  consola.error('CLI parsing failed:', error)
  process.exit(1)
}
