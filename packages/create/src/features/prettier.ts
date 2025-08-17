import type {FeatureAddContext} from '../types.js'
import {existsSync} from 'node:fs'
import {writeFile} from 'node:fs/promises'
import path from 'node:path'
import {consola} from 'consola'
import {addDependencies} from '../utils/package-manager.js'

/**
 * Add Prettier configuration to a project
 */
export async function addPrettierFeature(context: FeatureAddContext): Promise<void> {
  const {targetDir, projectInfo, verbose, dryRun} = context

  if (verbose) {
    consola.info('Adding Prettier configuration...')
  }

  // Check if Prettier config already exists
  const existingConfigs = [
    '.prettierrc',
    '.prettierrc.json',
    '.prettierrc.yml',
    '.prettierrc.yaml',
    '.prettierrc.js',
    'prettier.config.js',
    'prettier.config.cjs',
  ]

  const existingConfig = existingConfigs.find(file => existsSync(path.join(targetDir, file)))

  if (existingConfig !== undefined && verbose) {
    consola.warn(`Existing Prettier config found: ${existingConfig}`)
  }

  // Create .prettierrc file
  const configPath = path.join(targetDir, '.prettierrc')
  const configContent = '"@bfra.me/prettier-config"\n'

  if (dryRun === false || dryRun === undefined) {
    await writeFile(configPath, configContent, 'utf-8')
    if (verbose) {
      consola.success('Created .prettierrc')
    }
  } else {
    consola.info('Would create .prettierrc')
  }

  // Add dependencies
  const devDependencies = ['@bfra.me/prettier-config', 'prettier']

  if (dryRun === false || dryRun === undefined) {
    await addDependencies(targetDir, [], devDependencies, projectInfo.packageManager, verbose)
  } else {
    consola.info(`Would add dev dependencies: ${devDependencies.join(', ')}`)
  }

  // Add format scripts to package.json
  await addFormatScripts(targetDir, dryRun ?? false, verbose)
}

/**
 * Add format scripts to package.json
 */
async function addFormatScripts(
  targetDir: string,
  dryRun: boolean,
  verbose?: boolean,
): Promise<void> {
  const packageJsonPath = path.join(targetDir, 'package.json')

  if (!existsSync(packageJsonPath)) {
    return
  }

  try {
    const {readFile, writeFile: writeFileAsync} = await import('node:fs/promises')
    const content = await readFile(packageJsonPath, 'utf-8')
    const packageJson = JSON.parse(content) as {scripts?: Record<string, string>}

    if (packageJson.scripts === undefined) {
      packageJson.scripts = {}
    }

    // Add format scripts if they don't exist
    const scriptsToAdd = {
      format: 'prettier --write .',
      'format:check': 'prettier --check .',
    }

    let hasChanges = false
    for (const [script, command] of Object.entries(scriptsToAdd)) {
      if (!(script in packageJson.scripts)) {
        packageJson.scripts[script] = command
        hasChanges = true
      }
    }

    if (hasChanges) {
      if (dryRun === false || dryRun === undefined) {
        const updatedContent = JSON.stringify(packageJson, null, 2)
        await writeFileAsync(packageJsonPath, `${updatedContent}\n`, 'utf-8')
        if (verbose) {
          consola.success('Added format scripts to package.json')
        }
      } else {
        consola.info('Would add format scripts to package.json')
      }
    } else if (verbose) {
      consola.info('Format scripts already exist in package.json')
    }
  } catch (error) {
    if (verbose) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      consola.warn('Failed to update package.json scripts:', errorMessage)
    }
  }
}
