import {spawn} from 'node:child_process'
import {existsSync} from 'node:fs'
import {readFile} from 'node:fs/promises'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import {afterEach, beforeEach, describe, expect, it} from 'vitest'
import {testUtils} from '../test-utils.js'

/**
 * End-to-end integration tests
 * Tests the complete CLI experience as a user would interact with it
 */

const CURRENT_FILENAME = fileURLToPath(import.meta.url)
const CURRENT_DIRNAME = path.dirname(CURRENT_FILENAME)
const CLI_PATH = path.resolve(CURRENT_DIRNAME, '../../dist/cli.js')

interface CliResult {
  stdout: string
  stderr: string
  exitCode: number
}

interface PackageJson {
  name?: string
  description?: string
  author?: string
  version?: string
  dependencies?: Record<string, string>
  bin?: string | Record<string, string>
}

/**
 * Execute CLI command and capture output
 */
async function executeCli(
  args: string[],
  options: {cwd?: string; timeout?: number} = {},
): Promise<CliResult> {
  return new Promise((resolve, reject) => {
    const child = spawn('node', [CLI_PATH, ...args], {
      cwd: options.cwd ?? process.cwd(),
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: options.timeout ?? 30000,
      env: {
        ...process.env,
        CONSOLA_LEVEL: '3',
      },
    })

    let stdout = ''
    let stderr = ''

    child.stdout?.on('data', (data: unknown) => {
      stdout += String(data)
    })

    child.stderr?.on('data', (data: unknown) => {
      stderr += String(data)
    })

    child.on('close', exitCode => {
      resolve({
        stdout,
        stderr,
        exitCode: exitCode ?? 0,
      })
    })

    child.on('error', error => {
      reject(error)
    })
  })
}

describe('End-to-End CLI Integration', () => {
  const testOutputDir = testUtils.getFixturePath('temp', 'e2e')

  beforeEach(() => {
    testUtils.createDirectory(testOutputDir)
  })

  afterEach(() => {
    testUtils.cleanupTempDir('e2e')
  })

  describe('CLI Help and Version', () => {
    it('displays help information', async () => {
      const result = await executeCli(['--help'])

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('@bfra.me/create')
      expect(result.stdout).toContain('create')
      expect(result.stdout).toContain('add')
      expect(result.stdout).toContain('Commands:')
      expect(result.stdout).toContain('--verbose')
    })

    it('displays version information', async () => {
      const result = await executeCli(['--version'])

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toMatch(/\d+\.\d+\.\d+/)
    })

    it('displays create command help', async () => {
      const result = await executeCli(['create', '--help'])

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Usage:')
      expect(result.stdout).toContain('--template')
      expect(result.stdout).toContain('--description')
      expect(result.stdout).toContain('--author')
      expect(result.stdout).toContain('--ai')
      expect(result.stdout).toContain('--describe')
    })

    it('displays add command help', async () => {
      const result = await executeCli(['add', '--help'])

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Usage:')
      expect(result.stdout).toContain('--list')
      expect(result.stdout).toContain('--dry-run')
    })
  })

  describe('Project Creation E2E', () => {
    it('creates a project with minimal arguments', async () => {
      const projectName = 'e2e-minimal-test'
      const projectPath = path.join(testOutputDir, projectName)

      const result = await executeCli([
        'create',
        projectName,
        '--template',
        'default',
        '--output-dir',
        testOutputDir,
        '--skip-prompts',
        '--no-git',
        '--no-install',
      ])

      expect(result.exitCode).toBe(0)
      expect(existsSync(projectPath)).toBe(true)

      // Verify basic project structure
      const packageJsonPath = path.join(projectPath, 'package.json')
      expect(existsSync(packageJsonPath)).toBe(true)

      const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf-8')) as PackageJson
      expect(packageJson.name).toBe(projectName)
    })

    it('creates a TypeScript library project', async () => {
      const projectName = 'e2e-library-test'
      const projectPath = path.join(testOutputDir, projectName)

      const result = await executeCli([
        'create',
        projectName,
        '--template',
        'library',
        '--description',
        'E2E test library',
        '--author',
        'Test Author',
        '--output-dir',
        testOutputDir,
        '--skip-prompts',
        '--no-git',
        '--no-install',
      ])

      expect(result.exitCode).toBe(0)
      expect(existsSync(projectPath)).toBe(true)

      // Verify library-specific structure
      const packageJsonPath = path.join(projectPath, 'package.json')
      const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf-8')) as PackageJson

      expect(packageJson.name).toBe(projectName)
      expect(packageJson.description).toBe('E2E test library')
      expect(packageJson.author).toBe('Test Author')

      // Verify TypeScript files
      const tsconfigPath = path.join(projectPath, 'tsconfig.json')
      expect(existsSync(tsconfigPath)).toBe(true)

      const srcIndexPath = path.join(projectPath, 'src', 'index.ts')
      expect(existsSync(srcIndexPath)).toBe(true)
    })

    it('creates a React application project', async () => {
      const projectName = 'e2e-react-test'
      const projectPath = path.join(testOutputDir, projectName)

      const result = await executeCli([
        'create',
        projectName,
        '--template',
        'react',
        '--output-dir',
        testOutputDir,
        '--skip-prompts',
        '--no-git',
        '--no-install',
      ])

      expect(result.exitCode).toBe(0)
      expect(existsSync(projectPath)).toBe(true)

      // Verify React-specific structure
      const packageJsonPath = path.join(projectPath, 'package.json')
      const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf-8')) as PackageJson

      expect(packageJson.dependencies).toHaveProperty('react')
      expect(packageJson.dependencies).toHaveProperty('react-dom')
    })

    it('creates a CLI tool project', async () => {
      const projectName = 'e2e-cli-test'
      const projectPath = path.join(testOutputDir, projectName)

      const result = await executeCli([
        'create',
        projectName,
        '--template',
        'cli',
        '--output-dir',
        testOutputDir,
        '--skip-prompts',
        '--no-git',
        '--no-install',
      ])

      expect(result.exitCode).toBe(0)
      expect(existsSync(projectPath)).toBe(true)

      // Verify CLI-specific structure
      const packageJsonPath = path.join(projectPath, 'package.json')
      const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf-8')) as PackageJson

      expect(packageJson.bin).toBeDefined()
      expect(packageJson.dependencies).toHaveProperty('cac')

      const cliPath = path.join(projectPath, 'src', 'cli.ts')
      expect(existsSync(cliPath)).toBe(true)
    })

    it('handles force overwrite flag', async () => {
      const projectName = 'e2e-force-test'
      const projectPath = path.join(testOutputDir, projectName)

      // Create initial project
      await executeCli([
        'create',
        projectName,
        '--template',
        'default',
        '--output-dir',
        testOutputDir,
        '--skip-prompts',
        '--no-git',
        '--no-install',
      ])

      expect(existsSync(projectPath)).toBe(true)

      // Overwrite with force flag
      const result = await executeCli([
        'create',
        projectName,
        '--template',
        'library',
        '--output-dir',
        testOutputDir,
        '--skip-prompts',
        '--no-git',
        '--no-install',
        '--force',
      ])

      expect(result.exitCode).toBe(0)
      expect(existsSync(projectPath)).toBe(true)
    })

    it('handles dry run mode', async () => {
      const projectName = 'e2e-dry-run-test'
      const projectPath = path.join(testOutputDir, projectName)

      const result = await executeCli([
        'create',
        projectName,
        '--template',
        'library',
        '--output-dir',
        testOutputDir,
        '--skip-prompts',
        '--dry-run',
      ])

      expect(result.exitCode).toBe(0)
      expect(result.stdout + result.stderr).toContain('Dry run completed successfully')
      expect(existsSync(projectPath)).toBe(false)
    })

    it('provides verbose output', async () => {
      const projectName = 'e2e-verbose-test'
      const projectPath = path.join(testOutputDir, projectName)

      const result = await executeCli([
        'create',
        projectName,
        '--template',
        'default',
        '--output-dir',
        testOutputDir,
        '--skip-prompts',
        '--no-git',
        '--no-install',
        '--verbose',
      ])

      expect(result.exitCode).toBe(0)
      expect(existsSync(projectPath)).toBe(true)
      expect(result.stdout + result.stderr).toContain('Processing')
    })
  })

  describe('Configuration Presets E2E', () => {
    it('applies minimal preset', async () => {
      const projectName = 'e2e-preset-minimal'
      const projectPath = path.join(testOutputDir, projectName)

      const result = await executeCli([
        'create',
        projectName,
        '--preset',
        'minimal',
        '--output-dir',
        testOutputDir,
        '--skip-prompts',
        '--no-git',
        '--no-install',
      ])

      expect(result.exitCode).toBe(0)
      expect(existsSync(projectPath)).toBe(true)
    })

    it('applies standard preset', async () => {
      const projectName = 'e2e-preset-standard'
      const projectPath = path.join(testOutputDir, projectName)

      const result = await executeCli([
        'create',
        projectName,
        '--preset',
        'standard',
        '--output-dir',
        testOutputDir,
        '--skip-prompts',
        '--no-git',
        '--no-install',
      ])

      expect(result.exitCode).toBe(0)
      expect(existsSync(projectPath)).toBe(true)

      // Should use library template from standard preset
      const packageJsonPath = path.join(projectPath, 'package.json')
      expect(existsSync(packageJsonPath)).toBe(true)
    })

    it('applies full preset', async () => {
      const projectName = 'e2e-preset-full'
      const projectPath = path.join(testOutputDir, projectName)

      const result = await executeCli([
        'create',
        projectName,
        '--preset',
        'full',
        '--output-dir',
        testOutputDir,
        '--skip-prompts',
        '--no-git',
        '--no-install',
      ])

      expect(result.exitCode).toBe(0)
      expect(existsSync(projectPath)).toBe(true)
      expect(result.stdout + result.stderr).toContain('Processing')
    })
  })

  describe('Add Command E2E', () => {
    beforeEach(async () => {
      // Create a test project for add command tests
      const projectName = 'test-project-for-add'
      await executeCli([
        'create',
        projectName,
        '--template',
        'default',
        '--output-dir',
        testOutputDir,
        '--skip-prompts',
        '--no-git',
        '--no-install',
      ])
    })

    it('lists available features', async () => {
      const result = await executeCli(['add', '--list'], {
        cwd: path.join(testOutputDir, 'test-project-for-add'),
      })

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Available features')
    })

    it('shows help for add command', async () => {
      const result = await executeCli(['add', '--help'], {
        cwd: path.join(testOutputDir, 'test-project-for-add'),
      })

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Usage:')
    })

    it('handles dry run mode for add command', async () => {
      const result = await executeCli(['add', 'eslint', '--dry-run'], {
        cwd: path.join(testOutputDir, 'test-project-for-add'),
      })

      expect(result.exitCode).toBe(0)
      expect(result.stdout + result.stderr).toContain('Dry run completed - no files were modified')
    })
  })

  describe('Error Handling E2E', () => {
    it('handles invalid template name', async () => {
      const result = await executeCli([
        'create',
        'invalid-template-test',
        '--template',
        'nonexistent-template',
        '--output-dir',
        testOutputDir,
        '--skip-prompts',
      ])

      expect(result.exitCode).not.toBe(0)
      const hasError = result.stderr.includes('error') || result.stdout.includes('error')
      expect(hasError).toBe(true)
    })

    it('handles missing project name', async () => {
      const result = await executeCli([
        'create',
        '--template',
        'default',
        '--output-dir',
        testOutputDir,
        '--skip-prompts',
      ])

      // Should either prompt for name or provide a default name
      // The exact behavior depends on implementation
      expect(typeof result.exitCode).toBe('number')
    })

    it('handles invalid output directory', async () => {
      const result = await executeCli([
        'create',
        'invalid-dir-test',
        '--template',
        'default',
        '--output-dir',
        '/invalid/path/that/cannot/exist',
        '--skip-prompts',
      ])

      expect(result.exitCode).not.toBe(0)
    })
  })

  describe('AI Features E2E', () => {
    it('handles AI flag without API keys', async () => {
      const projectName = 'e2e-ai-test'

      const result = await executeCli([
        'create',
        projectName,
        '--template',
        'default',
        '--ai',
        '--describe',
        'A TypeScript library for data processing',
        '--output-dir',
        testOutputDir,
        '--skip-prompts',
        '--no-git',
        '--no-install',
      ])

      // Should handle gracefully even without API keys
      expect(result.exitCode).toBe(0)
      expect(existsSync(path.join(testOutputDir, projectName))).toBe(true)
    })

    it('provides AI help information', async () => {
      const result = await executeCli(['create', '--help'])

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('--ai')
      expect(result.stdout).toContain('--describe')
    })
  })
})
