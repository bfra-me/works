#!/usr/bin/env node
/**
 * CLI entry point for synthetic package.
 */

import {ok} from '@bfra.me/es/result'
import {createCli} from './index'

const cli = createCli('synthetic', '1.0.0')

cli.register({
  name: 'hello',
  description: 'Say hello',
  options: [
    {name: 'name', alias: 'n', description: 'Name to greet', defaultValue: 'World'},
  ],
  async execute(_args, options) {
    return ok(`Hello, ${options.name}!`)
  },
})

cli.register({
  name: 'version',
  description: 'Show version',
  async execute() {
    return ok(cli.version)
  },
})

const result = await cli.run(process.argv.slice(2))

if (result.success) {
  console.log(result.data)
  process.exit(0)
} else {
  console.error(`Error: ${result.error.message}`)
  process.exit(1)
}
