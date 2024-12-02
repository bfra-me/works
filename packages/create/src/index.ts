import type {CreatePackageOptions} from './types.js'
import fs from 'node:fs/promises'
import path from 'node:path'
import {run} from '@sxzz/create'

/**
 * Creates a new package based on a specified template.
 *
 * @param packageName - The name of the new package.
 * @param options - Options for creating the package, including the template to use, version, description, and author.
 * @returns A Promise that resolves when the package has been created.
 */
export async function createPackage(
  packageName: string,
  options: CreatePackageOptions,
): Promise<void> {
  const template = options.template || 'default'
  const templateDir = path.join(import.meta.dirname, 'templates', template)
  const targetDir = path.join(options.outputDir || process.cwd(), packageName)

  // Create target directory
  await fs.mkdir(targetDir, {recursive: true})

  await run(targetDir, {
    templates: [
      {
        name: 'default',
        // Point to the template directory
        url: `file://${templateDir}`,
      },
    ],
  })

  console.log(`Package ${packageName} created successfully.`)
}
