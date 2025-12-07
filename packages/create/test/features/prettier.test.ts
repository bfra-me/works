import type {FeatureAddContext, ProjectInfo} from '../../src/types.js'
import {existsSync, mkdirSync, rmSync, writeFileSync} from 'node:fs'
import {readFile} from 'node:fs/promises'
import path from 'node:path'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {addPrettierFeature} from '../../src/features/prettier.js'

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

describe('prettier feature', () => {
  let tempDir: string
  let defaultProjectInfo: ProjectInfo

  beforeEach(() => {
    vi.clearAllMocks()
    tempDir = path.join(process.cwd(), `test-temp-prettier-${Date.now()}`)
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

  describe('addPrettierFeature', () => {
    it('should create .prettierrc file with correct content', async () => {
      const context: FeatureAddContext = {
        targetDir: tempDir,
        projectInfo: defaultProjectInfo,
        verbose: false,
        dryRun: false,
      }

      await addPrettierFeature(context)

      const prettierrcPath = path.join(tempDir, '.prettierrc')
      expect(existsSync(prettierrcPath)).toBe(true)

      const content = await readFile(prettierrcPath, 'utf-8')
      expect(content).toBe('"@bfra.me/prettier-config"\n')
    })

    it('should add format scripts to package.json', async () => {
      const context: FeatureAddContext = {
        targetDir: tempDir,
        projectInfo: {...defaultProjectInfo, packageManager: 'npm'},
        verbose: false,
        dryRun: false,
      }

      await addPrettierFeature(context)

      const packageJsonContent = await readFile(path.join(tempDir, 'package.json'), 'utf-8')
      const packageJson = JSON.parse(packageJsonContent) as PackageJson

      expect(packageJson.scripts).toBeDefined()
      expect(packageJson.scripts?.format).toBe('prettier --write .')
      expect(packageJson.scripts?.['format:check']).toBe('prettier --check .')
    })

    it('should call addDependencies with correct packages', async () => {
      const {addDependencies} = await import('../../src/utils/package-manager.js')

      const context: FeatureAddContext = {
        targetDir: tempDir,
        projectInfo: defaultProjectInfo,
        verbose: false,
        dryRun: false,
      }

      await addPrettierFeature(context)

      expect(addDependencies).toHaveBeenCalledWith(
        tempDir,
        [],
        ['@bfra.me/prettier-config', 'prettier'],
        'pnpm',
        false,
      )
    })

    it('should warn when existing prettier config found with verbose', async () => {
      const {consola} = await import('consola')

      // Create an existing config
      writeFileSync(path.join(tempDir, '.prettierrc.json'), '{}')

      const context: FeatureAddContext = {
        targetDir: tempDir,
        projectInfo: defaultProjectInfo,
        verbose: true,
        dryRun: false,
      }

      await addPrettierFeature(context)

      expect(consola.warn).toHaveBeenCalledWith('Existing Prettier config found: .prettierrc.json')
    })

    it('should log info message with verbose enabled', async () => {
      const {consola} = await import('consola')

      const context: FeatureAddContext = {
        targetDir: tempDir,
        projectInfo: {...defaultProjectInfo, packageManager: 'npm'},
        verbose: true,
        dryRun: false,
      }

      await addPrettierFeature(context)

      expect(consola.info).toHaveBeenCalledWith('Adding Prettier configuration...')
    })

    describe('dry run mode', () => {
      it('should not create files in dry run mode', async () => {
        const context: FeatureAddContext = {
          targetDir: tempDir,
          projectInfo: defaultProjectInfo,
          verbose: false,
          dryRun: true,
        }

        await addPrettierFeature(context)

        const prettierrcPath = path.join(tempDir, '.prettierrc')
        expect(existsSync(prettierrcPath)).toBe(false)
      })

      it('should not call addDependencies in dry run mode', async () => {
        const {addDependencies} = await import('../../src/utils/package-manager.js')

        const context: FeatureAddContext = {
          targetDir: tempDir,
          projectInfo: defaultProjectInfo,
          verbose: false,
          dryRun: true,
        }

        await addPrettierFeature(context)

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

        await addPrettierFeature(context)

        expect(consola.info).toHaveBeenCalledWith('Would create .prettierrc')
        expect(consola.info).toHaveBeenCalledWith(
          'Would add dev dependencies: @bfra.me/prettier-config, prettier',
        )
      })
    })

    it('should not modify scripts if they already exist', async () => {
      // Create package.json with existing scripts
      writeFileSync(
        path.join(tempDir, 'package.json'),
        JSON.stringify(
          {
            name: 'test-project',
            scripts: {
              format: 'existing-format-script',
              'format:check': 'existing-check-script',
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

      await addPrettierFeature(context)

      const packageJsonContent = await readFile(path.join(tempDir, 'package.json'), 'utf-8')
      const packageJson = JSON.parse(packageJsonContent) as PackageJson

      expect(packageJson.scripts?.format).toBe('existing-format-script')
      expect(packageJson.scripts?.['format:check']).toBe('existing-check-script')
    })

    it('should handle package.json without scripts property', async () => {
      writeFileSync(
        path.join(tempDir, 'package.json'),
        JSON.stringify({name: 'test-project'}, null, 2),
      )

      const context: FeatureAddContext = {
        targetDir: tempDir,
        projectInfo: {...defaultProjectInfo, packageManager: 'npm'},
        verbose: false,
        dryRun: false,
      }

      await addPrettierFeature(context)

      const packageJsonContent = await readFile(path.join(tempDir, 'package.json'), 'utf-8')
      const packageJson = JSON.parse(packageJsonContent) as PackageJson

      expect(packageJson.scripts).toBeDefined()
      expect(packageJson.scripts?.format).toBe('prettier --write .')
    })

    it('should detect various existing config formats', async () => {
      const configFormats = [
        '.prettierrc',
        '.prettierrc.json',
        '.prettierrc.yml',
        '.prettierrc.yaml',
        '.prettierrc.js',
        'prettier.config.js',
        'prettier.config.cjs',
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

        await addPrettierFeature(context)

        expect(consola.warn).toHaveBeenCalledWith(`Existing Prettier config found: ${configFile}`)
      }
    })
  })
})
