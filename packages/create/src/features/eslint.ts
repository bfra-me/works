import type {FeatureAddContext} from '../types.js'
import {existsSync} from 'node:fs'
import {writeFile} from 'node:fs/promises'
import path from 'node:path'
import {consola} from 'consola'
import {addDependencies} from '../utils/package-manager.js'

/**
 * Add ESLint configuration to a project
 */
export async function addESLintFeature(context: FeatureAddContext): Promise<void> {
  const {targetDir, projectInfo, verbose, dryRun} = context

  if (verbose) {
    consola.info('Adding ESLint configuration...')
  }

  // Determine config file name based on project type
  const configFileName = projectInfo.type === 'typescript' ? 'eslint.config.ts' : 'eslint.config.js'
  const configPath = path.join(targetDir, configFileName)

  // Check if ESLint config already exists
  const existingConfigs = [
    '.eslintrc.js',
    '.eslintrc.json',
    '.eslintrc.yml',
    '.eslintrc.yaml',
    '.eslintrc',
    'eslint.config.js',
    'eslint.config.ts',
  ]

  const existingConfig = existingConfigs.find(file => existsSync(path.join(targetDir, file)))

  if (existingConfig !== undefined && verbose) {
    consola.warn(`Existing ESLint config found: ${existingConfig}`)
  }

  // Generate ESLint configuration content
  const configContent = generateESLintConfig(projectInfo.type, projectInfo.framework)

  // Write configuration file
  if (dryRun === false || dryRun === undefined) {
    await writeFile(configPath, configContent, 'utf-8')
    if (verbose) {
      consola.success(`Created ${configFileName}`)
    }
  } else {
    consola.info(`Would create ${configFileName}`)
  }

  // Add dependencies
  const devDependencies = ['@bfra.me/eslint-config', 'eslint']

  // Add TypeScript ESLint if TypeScript project
  if (projectInfo.type === 'typescript') {
    devDependencies.push('@typescript-eslint/parser', '@typescript-eslint/eslint-plugin')
  }

  // Add React ESLint plugin if React project
  if (projectInfo.type === 'react' || projectInfo.framework === 'Next.js') {
    devDependencies.push(
      'eslint-plugin-react',
      'eslint-plugin-react-hooks',
      'eslint-plugin-jsx-a11y',
    )
  }

  if (dryRun === false || dryRun === undefined) {
    await addDependencies(targetDir, [], devDependencies, projectInfo.packageManager, verbose)
  } else {
    consola.info(`Would add dev dependencies: ${devDependencies.join(', ')}`)
  }

  // Add lint script to package.json if it doesn't exist
  await addLintScript(targetDir, dryRun ?? false, verbose)
}

/**
 * Generate ESLint configuration content
 */
function generateESLintConfig(projectType: string, framework?: string): string {
  const isTypeScript = projectType === 'typescript' || projectType === 'react'
  const isReact = projectType === 'react' || framework === 'Next.js'

  if (isTypeScript) {
    return `import {defineConfig} from '@bfra.me/eslint-config'

export default defineConfig({
  name: '${framework?.toLowerCase() ?? projectType}',
  typescript: {
    tsconfigPath: './tsconfig.json',
    typeAware: true,
  },${isReact ? '\n  react: true,' : ''}
  prettier: true,
  vitest: true,
})
`
  }

  return `const {defineConfig} = require('@bfra.me/eslint-config')

module.exports = defineConfig({
  name: '${framework?.toLowerCase() ?? projectType}',${isReact ? '\n  react: true,' : ''}
  prettier: true,
  vitest: true,
})
`
}

/**
 * Add lint script to package.json
 */
async function addLintScript(targetDir: string, dryRun: boolean, verbose?: boolean): Promise<void> {
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

    // Add lint scripts if they don't exist
    const scriptsToAdd = {
      lint: 'eslint .',
      'lint:fix': 'eslint . --fix',
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
          consola.success('Added lint scripts to package.json')
        }
      } else {
        consola.info('Would add lint scripts to package.json')
      }
    } else if (verbose) {
      consola.info('Lint scripts already exist in package.json')
    }
  } catch (error) {
    if (verbose) {
      consola.warn('Failed to update package.json scripts:', error)
    }
  }
}
