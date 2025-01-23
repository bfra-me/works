import type {CreatePackageOptions} from './types.js'
import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import {run} from '@sxzz/create'

/**
 * Creates a new package based on a specified template.
 *
 * @param options - Options for creating the package, including the template to use, version, description, and author.
 * @returns A Promise that resolves when the package has been created.
 */
export async function createPackage(options: CreatePackageOptions) {
  const template = options.template || 'default'
  const templateDir = path.join(import.meta.dirname, 'templates', template)
  const targetDir = options.outputDir || process.cwd()

  // Create target directory
  await fs.mkdir(targetDir, {recursive: true})

  await run({
    projectPath: targetDir,
    config: {
      templates: [
        {
          name: 'default',
          // Point to the template directory
          url: `${templateDir}`,
        },
      ],
    },
  })

  console.log(`Package created successfully.`)
}
