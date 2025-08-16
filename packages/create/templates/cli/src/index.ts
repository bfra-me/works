import {consola} from 'consola'

/**
 * Main function for the <%= it.name %> CLI application.
 */
export async function main(args: string[], options: {verbose?: boolean}): Promise<void> {
  consola.info('Welcome to <%= it.name %>!')

  if (options.verbose) {
    consola.debug('Verbose mode enabled')
    consola.debug('Arguments:', args)
    consola.debug('Options:', options)
  }

  if (args.length === 0) {
    consola.info('No arguments provided. Try running with --help for usage information.')
    return
  }

  // TODO: Implement your CLI logic here
  consola.success(`Processing: ${args.join(', ')}`)
}

export default main
