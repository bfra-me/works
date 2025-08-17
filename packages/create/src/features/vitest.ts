import type {FeatureAddContext} from '../types.js'
import {existsSync, mkdirSync} from 'node:fs'
import {writeFile} from 'node:fs/promises'
import path from 'node:path'
import {consola} from 'consola'
import {addDependencies} from '../utils/package-manager.js'

/**
 * Add Vitest configuration to a project
 */
export async function addVitestFeature(context: FeatureAddContext): Promise<void> {
  const {targetDir, projectInfo, verbose, dryRun} = context

  if (verbose) {
    consola.info('Adding Vitest configuration...')
  }

  // Check if test configuration already exists
  const existingConfigs = [
    'vitest.config.js',
    'vitest.config.ts',
    'vite.config.js',
    'vite.config.ts',
    'jest.config.js',
    'jest.config.json',
  ]

  const existingConfig = existingConfigs.find(file => existsSync(path.join(targetDir, file)))

  if (existingConfig !== undefined && verbose) {
    consola.warn(`Existing test config found: ${existingConfig}`)
  }

  // Determine config file name based on project type
  const configFileName = projectInfo.type === 'typescript' ? 'vitest.config.ts' : 'vitest.config.js'
  const configPath = path.join(targetDir, configFileName)

  // Generate Vitest configuration content
  const configContent = generateVitestConfig(projectInfo.type, projectInfo.framework)

  if (dryRun === false || dryRun === undefined) {
    await writeFile(configPath, configContent, 'utf-8')
    if (verbose) {
      consola.success(`Created ${configFileName}`)
    }
  } else {
    consola.info(`Would create ${configFileName}`)
  }

  // Create test directory and sample test
  const testDir = path.join(targetDir, 'test')
  if (!existsSync(testDir)) {
    if (dryRun === false || dryRun === undefined) {
      mkdirSync(testDir, {recursive: true})

      // Create sample test file
      const sampleTestContent = generateSampleTest(projectInfo.type)
      const testFileName = projectInfo.type === 'typescript' ? 'example.test.ts' : 'example.test.js'
      const testFilePath = path.join(testDir, testFileName)

      await writeFile(testFilePath, sampleTestContent, 'utf-8')

      if (verbose) {
        consola.success(`Created test directory and sample test: ${testFileName}`)
      }
    } else {
      consola.info('Would create test directory and sample test file')
    }
  }

  // Add dependencies
  const devDependencies = ['vitest', '@vitest/ui']

  // Add React testing dependencies if needed
  if (projectInfo.type === 'react' || projectInfo.framework === 'Next.js') {
    devDependencies.push('@testing-library/react', '@testing-library/jest-dom', 'jsdom')
  }

  // Add TypeScript testing dependencies if needed
  if (projectInfo.type === 'typescript') {
    devDependencies.push('@types/node')
  }

  if (dryRun === false || dryRun === undefined) {
    await addDependencies(targetDir, [], devDependencies, projectInfo.packageManager, verbose)
  } else {
    consola.info(`Would add dev dependencies: ${devDependencies.join(', ')}`)
  }

  // Add test scripts to package.json
  await addTestScripts(targetDir, dryRun ?? false, verbose)
}

/**
 * Generate Vitest configuration content
 */
function generateVitestConfig(projectType: string, framework?: string): string {
  const isTypeScript = projectType === 'typescript' || projectType === 'react'
  const isReact = projectType === 'react' || framework === 'Next.js'

  if (isTypeScript) {
    return `import {defineConfig} from "vitest/config"

export default defineConfig({
  test: {
    globals: true,
    environment: "${isReact ? 'jsdom' : 'node'}",
    include: ["test/**/*.test.${isReact ? '{ts,tsx}' : 'ts'}"],${isReact ? '\n    setupFiles: ["./test/setup.ts"],' : ''}
  },
  coverage: {
    provider: "v8",
    reporter: ["text", "json", "html"],
  },
})
`
  }

  return `import {defineConfig} from "vitest/config"

export default defineConfig({
  test: {
    globals: true,
    environment: "${isReact ? 'jsdom' : 'node'}",
    include: ["test/**/*.test.js"],${isReact ? '\n    setupFiles: ["./test/setup.js"],' : ''}
  },
  coverage: {
    provider: "v8",
    reporter: ["text", "json", "html"],
  },
})
`
}

/**
 * Generate sample test content
 */
function generateSampleTest(projectType: string): string {
  const isTypeScript = projectType === 'typescript' || projectType === 'react'

  if (isTypeScript) {
    return `import {describe, expect, it} from 'vitest'

describe('Example Test Suite', () => {
  it('should pass a basic test', () => {
    expect(1 + 1).toBe(2)
  })

  it('should handle async operations', async () => {
    const result = await Promise.resolve('hello')
    expect(result).toBe('hello')
  })
})
`
  }

  return `import {describe, expect, it} from 'vitest'

describe('Example Test Suite', () => {
  it('should pass a basic test', () => {
    expect(1 + 1).toBe(2)
  })

  it('should handle async operations', async () => {
    const result = await Promise.resolve('hello')
    expect(result).toBe('hello')
  })
})
`
}

/**
 * Add test scripts to package.json
 */
async function addTestScripts(
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

    // Add test scripts if they don't exist
    const scriptsToAdd = {
      test: 'vitest run',
      'test:watch': 'vitest',
      'test:ui': 'vitest --ui',
      'test:coverage': 'vitest run --coverage',
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
          consola.success('Added test scripts to package.json')
        }
      } else {
        consola.info('Would add test scripts to package.json')
      }
    } else if (verbose) {
      consola.info('Test scripts already exist in package.json')
    }
  } catch (error) {
    if (verbose) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      consola.warn('Failed to update package.json scripts:', errorMessage)
    }
  }
}
