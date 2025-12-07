import type {FeatureAddContext, ProjectInfo} from '../../src/types.js'
import {existsSync, mkdirSync, rmSync, writeFileSync} from 'node:fs'
import {readFile} from 'node:fs/promises'
import path from 'node:path'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {addVitestFeature} from '../../src/features/vitest.js'

interface PackageJson {
  name: string
  scripts?: Record<string, string>
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
}

// Mock consola
vi.mock('consola', () => ({
  consola: {
    info: vi.fn(),
    warn: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock package-manager
vi.mock('../../src/utils/package-manager.js', () => ({
  addDependencies: vi.fn().mockResolvedValue(undefined),
}))

describe('vitest feature', () => {
  let tempDir: string
  let defaultProjectInfo: ProjectInfo

  beforeEach(() => {
    vi.clearAllMocks()
    tempDir = path.join(process.cwd(), `test-temp-vitest-${Date.now()}`)
    mkdirSync(tempDir, {recursive: true})
    writeFileSync(
      path.join(tempDir, 'package.json'),
      JSON.stringify({name: 'test-project'}, null, 2),
    )
    defaultProjectInfo = {
      type: 'typescript',
      packageManager: 'pnpm',
    }
  })

  afterEach(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, {recursive: true, force: true})
    }
  })

  describe('addVitestFeature', () => {
    it('should create vitest.config.ts for typescript projects', async () => {
      const context: FeatureAddContext = {
        targetDir: tempDir,
        projectInfo: defaultProjectInfo,
        verbose: false,
        dryRun: false,
      }

      await addVitestFeature(context)

      const configPath = path.join(tempDir, 'vitest.config.ts')
      expect(existsSync(configPath)).toBe(true)

      const content = await readFile(configPath, 'utf-8')
      expect(content).toContain('defineConfig')
      expect(content).toContain('environment: "node"')
    })

    it('should create vitest.config.js for javascript projects', async () => {
      const context: FeatureAddContext = {
        targetDir: tempDir,
        projectInfo: {...defaultProjectInfo, type: 'javascript'},
        verbose: false,
        dryRun: false,
      }

      await addVitestFeature(context)

      const configPath = path.join(tempDir, 'vitest.config.js')
      expect(existsSync(configPath)).toBe(true)
    })

    it('should create test directory and sample test file', async () => {
      const context: FeatureAddContext = {
        targetDir: tempDir,
        projectInfo: defaultProjectInfo,
        verbose: false,
        dryRun: false,
      }

      await addVitestFeature(context)

      const testDir = path.join(tempDir, 'test')
      expect(existsSync(testDir)).toBe(true)

      const testFile = path.join(testDir, 'example.test.ts')
      expect(existsSync(testFile)).toBe(true)

      const content = await readFile(testFile, 'utf-8')
      expect(content).toContain("describe('Example Test Suite'")
      expect(content).toContain('expect(1 + 1).toBe(2)')
    })

    it('should add test scripts to package.json', async () => {
      const context: FeatureAddContext = {
        targetDir: tempDir,
        projectInfo: {...defaultProjectInfo, packageManager: 'npm'},
        verbose: false,
        dryRun: false,
      }

      await addVitestFeature(context)

      const packageJsonContent = await readFile(path.join(tempDir, 'package.json'), 'utf-8')
      const packageJson = JSON.parse(packageJsonContent) as PackageJson

      expect(packageJson.scripts).toBeDefined()
      expect(packageJson.scripts?.test).toBe('vitest run')
      expect(packageJson.scripts?.['test:watch']).toBe('vitest')
      expect(packageJson.scripts?.['test:ui']).toBe('vitest --ui')
      expect(packageJson.scripts?.['test:coverage']).toBe('vitest run --coverage')
    })

    it('should call addDependencies with vitest packages', async () => {
      const {addDependencies} = await import('../../src/utils/package-manager.js')

      const context: FeatureAddContext = {
        targetDir: tempDir,
        projectInfo: defaultProjectInfo,
        verbose: false,
        dryRun: false,
      }

      await addVitestFeature(context)

      expect(addDependencies).toHaveBeenCalledWith(
        tempDir,
        [],
        expect.arrayContaining(['vitest', '@vitest/ui', '@types/node']),
        'pnpm',
        false,
      )
    })

    it('should add React testing dependencies for react projects', async () => {
      const {addDependencies} = await import('../../src/utils/package-manager.js')

      const context: FeatureAddContext = {
        targetDir: tempDir,
        projectInfo: {...defaultProjectInfo, type: 'react'},
        verbose: false,
        dryRun: false,
      }

      await addVitestFeature(context)

      expect(addDependencies).toHaveBeenCalledWith(
        tempDir,
        [],
        expect.arrayContaining(['@testing-library/react', '@testing-library/jest-dom', 'jsdom']),
        'pnpm',
        false,
      )
    })

    it('should add React testing dependencies for Next.js framework', async () => {
      const {addDependencies} = await import('../../src/utils/package-manager.js')

      const context: FeatureAddContext = {
        targetDir: tempDir,
        projectInfo: {...defaultProjectInfo, framework: 'Next.js'},
        verbose: false,
        dryRun: false,
      }

      await addVitestFeature(context)

      expect(addDependencies).toHaveBeenCalledWith(
        tempDir,
        [],
        expect.arrayContaining(['@testing-library/react', 'jsdom']),
        'pnpm',
        false,
      )
    })

    it('should use jsdom environment for react projects', async () => {
      // React projects use .js extension for config since type is 'react' not 'typescript'
      const context: FeatureAddContext = {
        targetDir: tempDir,
        projectInfo: {...defaultProjectInfo, type: 'react'},
        verbose: false,
        dryRun: false,
      }

      await addVitestFeature(context)

      // Config file is .js for react type (type !== 'typescript')
      const configPath = path.join(tempDir, 'vitest.config.js')
      expect(existsSync(configPath)).toBe(true)
      const content = await readFile(configPath, 'utf-8')
      expect(content).toContain('environment: "jsdom"')
    })

    it('should warn when existing test config found with verbose', async () => {
      const {consola} = await import('consola')

      // Create an existing config
      writeFileSync(path.join(tempDir, 'jest.config.js'), '{}')

      const context: FeatureAddContext = {
        targetDir: tempDir,
        projectInfo: defaultProjectInfo,
        verbose: true,
        dryRun: false,
      }

      await addVitestFeature(context)

      expect(consola.warn).toHaveBeenCalledWith('Existing test config found: jest.config.js')
    })

    it('should log info message with verbose enabled', async () => {
      const {consola} = await import('consola')

      const context: FeatureAddContext = {
        targetDir: tempDir,
        projectInfo: defaultProjectInfo,
        verbose: true,
        dryRun: false,
      }

      await addVitestFeature(context)

      expect(consola.info).toHaveBeenCalledWith('Adding Vitest configuration...')
    })

    describe('dry run mode', () => {
      it('should not create files in dry run mode', async () => {
        const context: FeatureAddContext = {
          targetDir: tempDir,
          projectInfo: defaultProjectInfo,
          verbose: false,
          dryRun: true,
        }

        await addVitestFeature(context)

        const configPath = path.join(tempDir, 'vitest.config.ts')
        expect(existsSync(configPath)).toBe(false)
      })

      it('should not call addDependencies in dry run mode', async () => {
        const {addDependencies} = await import('../../src/utils/package-manager.js')

        const context: FeatureAddContext = {
          targetDir: tempDir,
          projectInfo: defaultProjectInfo,
          verbose: false,
          dryRun: true,
        }

        await addVitestFeature(context)

        expect(addDependencies).not.toHaveBeenCalled()
      })

      it('should log what would be created in dry run mode', async () => {
        const {consola} = await import('consola')

        const context: FeatureAddContext = {
          targetDir: tempDir,
          projectInfo: defaultProjectInfo,
          verbose: false,
          dryRun: true,
        }

        await addVitestFeature(context)

        expect(consola.info).toHaveBeenCalledWith('Would create vitest.config.ts')
      })
    })

    it('should not modify scripts if they already exist', async () => {
      writeFileSync(
        path.join(tempDir, 'package.json'),
        JSON.stringify(
          {
            name: 'test-project',
            scripts: {
              test: 'existing-test-script',
              'test:watch': 'existing-watch-script',
            },
          },
          null,
          2,
        ),
      )

      const context: FeatureAddContext = {
        targetDir: tempDir,
        projectInfo: {...defaultProjectInfo, packageManager: 'npm'},
        verbose: false,
        dryRun: false,
      }

      await addVitestFeature(context)

      const packageJsonContent = await readFile(path.join(tempDir, 'package.json'), 'utf-8')
      const packageJson = JSON.parse(packageJsonContent) as PackageJson

      expect(packageJson.scripts?.test).toBe('existing-test-script')
      expect(packageJson.scripts?.['test:watch']).toBe('existing-watch-script')
    })

    it('should detect various existing test config formats', async () => {
      const configFormats = [
        'vitest.config.js',
        'vitest.config.ts',
        'vite.config.js',
        'vite.config.ts',
        'jest.config.js',
        'jest.config.json',
      ]

      for (const configFile of configFormats) {
        // Clean up and recreate temp dir
        if (existsSync(tempDir)) {
          rmSync(tempDir, {recursive: true, force: true})
        }
        mkdirSync(tempDir, {recursive: true})
        writeFileSync(
          path.join(tempDir, 'package.json'),
          JSON.stringify({name: 'test-project'}, null, 2),
        )
        writeFileSync(path.join(tempDir, configFile), '{}')

        const {consola} = await import('consola')
        vi.mocked(consola.warn).mockClear()

        const context: FeatureAddContext = {
          targetDir: tempDir,
          projectInfo: defaultProjectInfo,
          verbose: true,
          dryRun: false,
        }

        await addVitestFeature(context)

        expect(consola.warn).toHaveBeenCalledWith(`Existing test config found: ${configFile}`)
      }
    })

    it('should not create test directory if it already exists', async () => {
      const testDir = path.join(tempDir, 'test')
      mkdirSync(testDir, {recursive: true})
      writeFileSync(path.join(testDir, 'existing.test.ts'), 'existing')

      const context: FeatureAddContext = {
        targetDir: tempDir,
        projectInfo: defaultProjectInfo,
        verbose: false,
        dryRun: false,
      }

      await addVitestFeature(context)

      // Should not overwrite existing files
      const existingContent = await readFile(path.join(testDir, 'existing.test.ts'), 'utf-8')
      expect(existingContent).toBe('existing')
    })
  })
})
