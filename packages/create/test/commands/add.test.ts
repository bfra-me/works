import type {AddFeatureOptions} from '../../src/commands/add.js'
import {existsSync, mkdirSync, rmSync, writeFileSync} from 'node:fs'
import {readFile} from 'node:fs/promises'
import path from 'node:path'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {addFeatureToProject} from '../../src/commands/add.js'
import {testUtils} from '../test-utils.js'

interface PackageJson {
  name: string
  version: string
  description?: string
  type?: string
  scripts?: Record<string, string>
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
}

async function readPackageJson(projectPath: string): Promise<PackageJson> {
  const content = await readFile(path.join(projectPath, 'package.json'), 'utf-8')
  return JSON.parse(content) as PackageJson
}

describe('add command', () => {
  let tempOutputDir: string
  let projectDir: string

  beforeEach(() => {
    // Setup test environment first
    testUtils.setup()

    // Create a unique temp directory for this test
    tempOutputDir = testUtils.createTempDir(
      `add-command-test-${Math.random().toString(36).slice(2)}`,
    )
    projectDir = path.join(tempOutputDir, 'test-project')

    // Create the project directory explicitly
    mkdirSync(projectDir, {recursive: true})

    // Mock prompts to skip interactive mode
    vi.mock('@clack/prompts', () => ({
      intro: vi.fn(),
      outro: vi.fn(),
      spinner: vi.fn(() => ({
        start: vi.fn(),
        stop: vi.fn(),
      })),
      select: vi.fn(),
      isCancel: vi.fn(() => false),
    }))
  })

  afterEach(() => {
    if (existsSync(tempOutputDir)) {
      rmSync(tempOutputDir, {recursive: true, force: true})
    }
    vi.restoreAllMocks()
  })

  describe('error handling', () => {
    it('throws error for invalid project directory', async () => {
      const invalidDir = path.join(tempOutputDir, 'non-existent')

      const options: AddFeatureOptions = {
        feature: 'eslint',
        targetDir: invalidDir,
        skipConfirm: true,
        verbose: false,
        dryRun: false,
      }

      await expect(addFeatureToProject(options)).rejects.toThrow(
        'Target directory does not contain a valid Node.js project',
      )
    })

    it('throws error for non-Node.js project', async () => {
      // Create directory without package.json
      const nonNodeDir = path.join(tempOutputDir, 'non-node-project')
      mkdirSync(nonNodeDir, {recursive: true})
      writeFileSync(path.join(nonNodeDir, 'README.md'), '# Not a Node.js project')

      const options: AddFeatureOptions = {
        feature: 'eslint',
        targetDir: nonNodeDir,
        skipConfirm: true,
        verbose: false,
        dryRun: false,
      }

      await expect(addFeatureToProject(options)).rejects.toThrow(
        'Target directory does not contain a valid Node.js project',
      )
    })

    it('handles unsupported feature-framework combinations', async () => {
      // Create a Node.js project (will be detected as 'node' type)
      writeFileSync(
        path.join(projectDir, 'package.json'),
        JSON.stringify(
          {
            name: 'test-node-project',
            version: '1.0.0',
            description: 'Test Node.js project',
            type: 'module',
          },
          null,
          2,
        ),
      )

      // Vitest doesn't support 'node' projects
      const options: AddFeatureOptions = {
        feature: 'vitest',
        targetDir: projectDir,
        skipConfirm: true,
        verbose: false,
        dryRun: false,
      }

      await expect(addFeatureToProject(options)).rejects.toThrow(
        'Feature "vitest" is not supported for node projects',
      )
    })
  })

  describe('basic functionality', () => {
    it('handles dry run mode correctly', async () => {
      // Create a TypeScript project
      writeFileSync(
        path.join(projectDir, 'package.json'),
        JSON.stringify(
          {
            name: 'test-project',
            version: '1.0.0',
            type: 'module',
            devDependencies: {
              typescript: '^5.0.0',
            },
          },
          null,
          2,
        ),
      )

      writeFileSync(
        path.join(projectDir, 'tsconfig.json'),
        JSON.stringify({extends: '@bfra.me/tsconfig'}, null, 2),
      )

      mkdirSync(path.join(projectDir, 'src'), {recursive: true})
      writeFileSync(
        path.join(projectDir, 'src', 'index.ts'),
        'export function hello() { return "world" }',
      )

      const options: AddFeatureOptions = {
        feature: 'eslint',
        targetDir: projectDir,
        skipConfirm: true,
        verbose: false,
        dryRun: true,
      }

      // Dry run should not throw but also not modify files
      await expect(addFeatureToProject(options)).resolves.not.toThrow()

      // Check that no files were actually created in dry run mode
      expect(existsSync(path.join(projectDir, 'eslint.config.ts'))).toBe(false)
      expect(existsSync(path.join(projectDir, 'eslint.config.js'))).toBe(false)

      // Check that package.json was not modified
      const packageJson = await readPackageJson(projectDir)
      expect(packageJson.devDependencies || {}).not.toHaveProperty('@bfra.me/eslint-config')
    })

    it('provides verbose output when requested', async () => {
      // Create a TypeScript project
      writeFileSync(
        path.join(projectDir, 'package.json'),
        JSON.stringify(
          {
            name: 'test-project',
            version: '1.0.0',
            type: 'module',
            devDependencies: {
              typescript: '^5.0.0',
            },
          },
          null,
          2,
        ),
      )

      writeFileSync(
        path.join(projectDir, 'tsconfig.json'),
        JSON.stringify({extends: '@bfra.me/tsconfig'}, null, 2),
      )

      mkdirSync(path.join(projectDir, 'src'), {recursive: true})
      writeFileSync(
        path.join(projectDir, 'src', 'index.ts'),
        'export function hello() { return "world" }',
      )

      const options: AddFeatureOptions = {
        feature: 'eslint',
        targetDir: projectDir,
        skipConfirm: true,
        verbose: true,
        dryRun: true, // Use dry run to avoid actual modifications
      }

      // Verbose mode should not throw
      await expect(addFeatureToProject(options)).resolves.not.toThrow()
    })
  })

  describe('feature support validation', () => {
    it('validates ESLint support for TypeScript projects', async () => {
      // Create a TypeScript project
      writeFileSync(
        path.join(projectDir, 'package.json'),
        JSON.stringify(
          {
            name: 'test-project',
            version: '1.0.0',
            type: 'module',
            devDependencies: {
              typescript: '^5.0.0',
            },
          },
          null,
          2,
        ),
      )

      writeFileSync(
        path.join(projectDir, 'tsconfig.json'),
        JSON.stringify({extends: '@bfra.me/tsconfig'}, null, 2),
      )

      mkdirSync(path.join(projectDir, 'src'), {recursive: true})
      writeFileSync(
        path.join(projectDir, 'src', 'index.ts'),
        'export function hello() { return "world" }',
      )

      const options: AddFeatureOptions = {
        feature: 'eslint',
        targetDir: projectDir,
        skipConfirm: true,
        verbose: false,
        dryRun: true, // Use dry run to test validation without side effects
      }

      // ESLint should be supported for TypeScript projects
      await expect(addFeatureToProject(options)).resolves.not.toThrow()
    })

    it('validates TypeScript support for Node.js projects', async () => {
      // Create a plain Node.js project (no TypeScript)
      writeFileSync(
        path.join(projectDir, 'package.json'),
        JSON.stringify(
          {
            name: 'test-node-project',
            version: '1.0.0',
            type: 'module',
          },
          null,
          2,
        ),
      )

      mkdirSync(path.join(projectDir, 'src'), {recursive: true})
      writeFileSync(
        path.join(projectDir, 'src', 'index.js'),
        'export function hello() { return "world" }',
      )

      const options: AddFeatureOptions = {
        feature: 'typescript',
        targetDir: projectDir,
        skipConfirm: true,
        verbose: false,
        dryRun: true,
      }

      // TypeScript should be supported for Node.js projects
      await expect(addFeatureToProject(options)).resolves.not.toThrow()
    })

    it('rejects unsupported feature combinations', async () => {
      // Create a Node.js project
      writeFileSync(
        path.join(projectDir, 'package.json'),
        JSON.stringify(
          {
            name: 'test-node-project',
            version: '1.0.0',
            type: 'module',
          },
          null,
          2,
        ),
      )

      const options: AddFeatureOptions = {
        feature: 'vitest',
        targetDir: projectDir,
        skipConfirm: true,
        verbose: false,
        dryRun: false,
      }

      // Vitest is not supported for node projects
      await expect(addFeatureToProject(options)).rejects.toThrow(
        'Feature "vitest" is not supported for node projects',
      )
    })
  })

  describe('conflict detection', () => {
    it('handles existing configuration files gracefully', async () => {
      // Create a TypeScript project
      writeFileSync(
        path.join(projectDir, 'package.json'),
        JSON.stringify(
          {
            name: 'test-project',
            version: '1.0.0',
            type: 'module',
            devDependencies: {
              typescript: '^5.0.0',
            },
          },
          null,
          2,
        ),
      )

      writeFileSync(
        path.join(projectDir, 'tsconfig.json'),
        JSON.stringify({extends: '@bfra.me/tsconfig'}, null, 2),
      )

      mkdirSync(path.join(projectDir, 'src'), {recursive: true})
      writeFileSync(
        path.join(projectDir, 'src', 'index.ts'),
        'export function hello() { return "world" }',
      )

      // Create existing ESLint config
      writeFileSync(path.join(projectDir, 'eslint.config.ts'), 'export default {}')

      const options: AddFeatureOptions = {
        feature: 'eslint',
        targetDir: projectDir,
        skipConfirm: true,
        verbose: true, // Enable verbose to see conflict handling
        dryRun: true,
      }

      // Should handle conflicts gracefully
      await expect(addFeatureToProject(options)).resolves.not.toThrow()
    })
  })

  describe('feature-specific options', () => {
    it('accepts feature-specific options in the options parameter', async () => {
      // Create a TypeScript project
      writeFileSync(
        path.join(projectDir, 'package.json'),
        JSON.stringify(
          {
            name: 'test-project',
            version: '1.0.0',
            type: 'module',
            devDependencies: {
              typescript: '^5.0.0',
            },
          },
          null,
          2,
        ),
      )

      writeFileSync(
        path.join(projectDir, 'tsconfig.json'),
        JSON.stringify({extends: '@bfra.me/tsconfig'}, null, 2),
      )

      mkdirSync(path.join(projectDir, 'src'), {recursive: true})
      writeFileSync(
        path.join(projectDir, 'src', 'index.ts'),
        'export function hello() { return "world" }',
      )

      const options: AddFeatureOptions = {
        feature: 'eslint',
        targetDir: projectDir,
        skipConfirm: true,
        verbose: false,
        dryRun: true,
        options: {
          typescript: true,
          prettier: true,
        },
      }

      // Should accept custom options without error
      await expect(addFeatureToProject(options)).resolves.not.toThrow()
    })
  })
})
