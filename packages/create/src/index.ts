import fs from 'node:fs/promises'
import path from 'node:path'
import type {CreatePackageOptions} from './types.js'

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

  // Read package.json template and replace placeholders
  const packageJsonTemplate = await fs.readFile(path.join(templateDir, 'package.json'), 'utf-8')

  const packageJsonContent = packageJsonTemplate
    .replace(/{{packageName}}/g, packageName)
    .replace(/{{version}}/g, options.version || '1.0.0')
    .replace(/{{description}}/g, options.description || 'A new package')
    .replace(/{{author}}/g, options.author || '')

  await fs.writeFile(path.join(targetDir, 'package.json'), packageJsonContent)

  // Copy index.ts template
  const indexTsTemplate = await fs.readFile(path.join(templateDir, 'index.ts'), 'utf-8')
  await fs.writeFile(path.join(targetDir, 'index.ts'), indexTsTemplate)

  console.log(`Package ${packageName} created successfully.`)
}
