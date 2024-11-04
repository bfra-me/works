#!/usr/bin/env node

// This file implements the command-line interface for the create utility.

import yargs from 'yargs/yargs'
import {hideBin} from 'yargs/helpers'
import {createPackage} from './index.js'
import type {CreatePackageOptions} from './types.js'
import type {ArgumentsCamelCase} from 'yargs'

/**
 * Implements the command-line interface for the create utility.
 * This function is the entry point for the create CLI, which allows users to create new packages with various options.
 *
 * @returns A Promise that resolves when the CLI has completed.
 */
export const main = async (): Promise<void> => {
  await yargs(hideBin(process.argv))
    .usage('Usage: create <package-name> [options]')
    .command(
      '$0 <packageName>',
      'Create a new package',
      {
        packageName: {
          describe: 'Name of the package to create',
          type: 'string',
          demandOption: true,
        },
        template: {
          alias: 't',
          type: 'string',
          description: 'Template to use',
          default: 'default',
        },
        version: {
          alias: 'v',
          type: 'string',
          description: 'Package version',
          default: '1.0.0',
        },
        description: {
          alias: 'd',
          type: 'string',
          description: 'Package description',
          default: 'A new package',
        },
        author: {
          type: 'string',
          description: 'Author of the package',
          default: '',
        },
        outputDir: {
          alias: 'o',
          type: 'string',
          description: 'Output directory',
          default: process.cwd(),
        },
      },
      async (
        argv: ArgumentsCamelCase<{
          packageName: string
          template: string
          version: string
          description: string
          author: string
          outputDir: string
        }>,
      ) => {
        const {packageName, template, version, description, author, outputDir} = argv

        if (!packageName) {
          console.error('Error: packageName is required.')
          process.exit(1)
        }

        const options: CreatePackageOptions = {
          template,
          version,
          description,
          author,
          outputDir,
        }

        try {
          await createPackage(packageName, options)
          console.log(`Package "${packageName}" has been created successfully.`)
        } catch (error) {
          if (error instanceof Error) {
            console.error('An error occurred while creating the package:', error.message)
          } else {
            console.error('An unknown error occurred while creating the package')
          }
          process.exit(1)
        }
      },
    )
    .help()
    .parse()
}
await main()
