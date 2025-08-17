import type {ConflictInfo, ProjectInfo} from '../types.js'
import {existsSync} from 'node:fs'
import {readFile} from 'node:fs/promises'
import path from 'node:path'
import {consola} from 'consola'

/**
 * Detect conflicts when adding a feature to a project
 */
export async function detectConflicts(
  projectDir: string,
  feature: string,
  _projectInfo: ProjectInfo,
): Promise<ConflictInfo[]> {
  const conflicts: ConflictInfo[] = []

  switch (feature) {
    case 'eslint':
      await detectESLintConflicts(projectDir, conflicts)
      break
    case 'prettier':
      await detectPrettierConflicts(projectDir, conflicts)
      break
    case 'typescript':
      await detectTypeScriptConflicts(projectDir, conflicts)
      break
    case 'vitest':
      await detectVitestConflicts(projectDir, conflicts)
      break
  }

  // Check for package.json dependency conflicts
  await detectDependencyConflicts(projectDir, feature, conflicts)

  return conflicts
}

/**
 * Resolve conflicts using the specified strategy
 */
export async function resolveConflicts(
  conflicts: ConflictInfo[],
  strategy: string,
  projectDir: string,
): Promise<void> {
  switch (strategy) {
    case 'merge':
      await mergeConflicts(conflicts, projectDir)
      break
    case 'overwrite':
      await overwriteConflicts(conflicts, projectDir)
      break
    case 'skip':
      consola.info('Skipping conflicting files as requested')
      break
    default:
      throw new Error(`Unknown conflict resolution strategy: ${strategy}`)
  }
}

/**
 * Detect ESLint configuration conflicts
 */
async function detectESLintConflicts(projectDir: string, conflicts: ConflictInfo[]): Promise<void> {
  const eslintConfigs = [
    '.eslintrc.js',
    '.eslintrc.json',
    '.eslintrc.yml',
    '.eslintrc.yaml',
    '.eslintrc',
    'eslint.config.js',
    'eslint.config.ts',
  ]

  for (const configFile of eslintConfigs) {
    const configPath = path.join(projectDir, configFile)
    if (existsSync(configPath)) {
      conflicts.push({
        type: 'file',
        description: `Existing ESLint configuration: ${configFile}`,
        existing: configPath,
        proposed: path.join(projectDir, 'eslint.config.ts'),
        severity: 'medium',
      })
    }
  }
}

/**
 * Detect Prettier configuration conflicts
 */
async function detectPrettierConflicts(
  projectDir: string,
  conflicts: ConflictInfo[],
): Promise<void> {
  const prettierConfigs = [
    '.prettierrc',
    '.prettierrc.json',
    '.prettierrc.yml',
    '.prettierrc.yaml',
    '.prettierrc.js',
    'prettier.config.js',
    'prettier.config.cjs',
  ]

  for (const configFile of prettierConfigs) {
    const configPath = path.join(projectDir, configFile)
    if (existsSync(configPath)) {
      conflicts.push({
        type: 'file',
        description: `Existing Prettier configuration: ${configFile}`,
        existing: configPath,
        proposed: path.join(projectDir, '.prettierrc'),
        severity: 'low',
      })
    }
  }
}

/**
 * Detect TypeScript configuration conflicts
 */
async function detectTypeScriptConflicts(
  projectDir: string,
  conflicts: ConflictInfo[],
): Promise<void> {
  const tsconfigPath = path.join(projectDir, 'tsconfig.json')
  if (existsSync(tsconfigPath)) {
    conflicts.push({
      type: 'configuration',
      description: 'Existing TypeScript configuration will be extended',
      existing: tsconfigPath,
      severity: 'low',
    })
  }
}

/**
 * Detect Vitest configuration conflicts
 */
async function detectVitestConflicts(projectDir: string, conflicts: ConflictInfo[]): Promise<void> {
  const vitestConfigs = ['vitest.config.js', 'vitest.config.ts', 'vite.config.js', 'vite.config.ts']

  for (const configFile of vitestConfigs) {
    const configPath = path.join(projectDir, configFile)
    if (existsSync(configPath)) {
      conflicts.push({
        type: 'file',
        description: `Existing test configuration: ${configFile}`,
        existing: configPath,
        proposed: path.join(projectDir, 'vitest.config.ts'),
        severity: 'medium',
      })
    }
  }

  // Check for Jest configuration
  const jestConfigs = ['jest.config.js', 'jest.config.json']
  for (const configFile of jestConfigs) {
    const configPath = path.join(projectDir, configFile)
    if (existsSync(configPath)) {
      conflicts.push({
        type: 'configuration',
        description: `Existing Jest configuration may conflict with Vitest: ${configFile}`,
        existing: configPath,
        severity: 'high',
      })
    }
  }
}

/**
 * Detect package.json dependency conflicts
 */
async function detectDependencyConflicts(
  projectDir: string,
  feature: string,
  conflicts: ConflictInfo[],
): Promise<void> {
  const packageJsonPath = path.join(projectDir, 'package.json')
  if (!existsSync(packageJsonPath)) {
    return
  }

  try {
    const content = await readFile(packageJsonPath, 'utf-8')
    const packageJson = JSON.parse(content) as {
      dependencies?: Record<string, string>
      devDependencies?: Record<string, string>
    }

    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    }

    // Check for conflicting dependencies based on feature
    switch (feature) {
      case 'vitest':
        if ('jest' in allDeps) {
          conflicts.push({
            type: 'dependency',
            description: 'Jest is already installed and may conflict with Vitest',
            severity: 'high',
          })
        }
        break
    }
  } catch {
    // Ignore errors reading package.json
  }
}

/**
 * Merge conflicts by attempting to combine configurations
 */
async function mergeConflicts(conflicts: ConflictInfo[], _projectDir: string): Promise<void> {
  for (const conflict of conflicts) {
    if (
      conflict.type === 'file' &&
      conflict.existing !== undefined &&
      conflict.proposed !== undefined
    ) {
      consola.info(`Merging ${path.basename(conflict.existing)}...`)

      // For now, we'll rename the existing file and create the new one
      // In a more sophisticated implementation, we could parse and merge configurations
      const backupName = `${conflict.existing}.backup`
      try {
        const {rename} = await import('node:fs/promises')
        await rename(conflict.existing, backupName)
        consola.info(`Existing configuration backed up to ${path.basename(backupName)}`)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        consola.warn(`Failed to backup existing configuration: ${errorMessage}`)
      }
    }
  }
}

/**
 * Overwrite conflicts by replacing existing files
 */
async function overwriteConflicts(conflicts: ConflictInfo[], _projectDir: string): Promise<void> {
  for (const conflict of conflicts) {
    if (conflict.type === 'file' && conflict.existing !== undefined) {
      consola.info(`Overwriting ${path.basename(conflict.existing)}...`)

      try {
        const {rm} = await import('node:fs/promises')
        await rm(conflict.existing)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        consola.warn(`Failed to remove existing file: ${errorMessage}`)
      }
    }
  }
}
