import type {FeatureAddContext} from '../types.js'
import {existsSync} from 'node:fs'
import {writeFile} from 'node:fs/promises'
import path from 'node:path'
import {consola} from 'consola'
import {addDependencies} from '../utils/package-manager.js'

/**
 * Add TypeScript configuration to a project
 */
export async function addTypeScriptFeature(context: FeatureAddContext): Promise<void> {
  const {targetDir, projectInfo, verbose, dryRun} = context

  if (verbose) {
    consola.info('Adding TypeScript configuration...')
  }

  // Check if tsconfig.json already exists
  const tsconfigPath = path.join(targetDir, 'tsconfig.json')
  const hasExistingConfig = existsSync(tsconfigPath)

  if (hasExistingConfig && verbose) {
    consola.warn('Existing tsconfig.json found - will extend @bfra.me/tsconfig')
  }

  // Generate TypeScript configuration content
  const configContent = generateTSConfig(projectInfo.type, projectInfo.framework, hasExistingConfig)

  if (dryRun === false || dryRun === undefined) {
    if (hasExistingConfig) {
      // Read existing tsconfig and merge
      try {
        const {readFile} = await import('node:fs/promises')
        const existingContent = await readFile(tsconfigPath, 'utf-8')
        const existingConfig = JSON.parse(existingContent) as Record<string, unknown>

        // Merge with @bfra.me/tsconfig extension
        const mergedConfig: Record<string, unknown> = {
          extends: '@bfra.me/tsconfig',
          ...existingConfig,
        }

        await writeFile(tsconfigPath, JSON.stringify(mergedConfig, null, 2), 'utf-8')
        if (verbose) {
          consola.success('Updated tsconfig.json to extend @bfra.me/tsconfig')
        }
      } catch {
        // If merge fails, create new config
        await writeFile(tsconfigPath, configContent, 'utf-8')
        if (verbose) {
          consola.success('Created new tsconfig.json')
        }
      }
    } else {
      await writeFile(tsconfigPath, configContent, 'utf-8')
      if (verbose) {
        consola.success('Created tsconfig.json')
      }
    }
  } else {
    consola.info('Would create/update tsconfig.json')
  }

  // Add dependencies
  const devDependencies = ['@bfra.me/tsconfig', 'typescript']

  // Add additional TypeScript dependencies based on project type
  if (projectInfo.type === 'react' || projectInfo.framework === 'Next.js') {
    devDependencies.push('@types/react', '@types/react-dom')
  }

  if (projectInfo.type === 'node') {
    devDependencies.push('@types/node')
  }

  if (dryRun === false || dryRun === undefined) {
    await addDependencies(targetDir, [], devDependencies, projectInfo.packageManager, verbose)
  } else {
    consola.info(`Would add dev dependencies: ${devDependencies.join(', ')}`)
  }

  // Add TypeScript scripts to package.json
  await addTypeScriptScripts(targetDir, dryRun ?? false, verbose)
}

/**
 * Generate TypeScript configuration content
 */
function generateTSConfig(projectType: string, framework?: string, isUpdate = false): string {
  if (isUpdate) {
    // For updates, just extend the base config
    return JSON.stringify(
      {
        extends: '@bfra.me/tsconfig',
      },
      null,
      2,
    )
  }

  // For new configs, provide more specific configuration
  const config = {
    extends: '@bfra.me/tsconfig',
    include: ['src', 'test'],
    exclude: ['node_modules', 'dist', 'lib'],
    compilerOptions: {},
  }

  // Add project-specific options
  if (projectType === 'react' || framework === 'Next.js') {
    config.compilerOptions = {
      jsx: 'react-jsx',
    }
  }

  return JSON.stringify(config, null, 2)
}

/**
 * Add TypeScript scripts to package.json
 */
async function addTypeScriptScripts(
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

    // Add TypeScript scripts if they don't exist
    const scriptsToAdd = {
      'type-check': 'tsc --noEmit',
      build: 'tsc',
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
          consola.success('Added TypeScript scripts to package.json')
        }
      } else {
        consola.info('Would add TypeScript scripts to package.json')
      }
    } else if (verbose) {
      consola.info('TypeScript scripts already exist in package.json')
    }
  } catch (error) {
    if (verbose) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      consola.warn('Failed to update package.json scripts:', errorMessage)
    }
  }
}
