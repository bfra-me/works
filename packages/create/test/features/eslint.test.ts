import type {FeatureAddContext, ProjectInfo} from '../../src/types.js'
import {existsSync, mkdirSync, rmSync, writeFileSync} from 'node:fs'
import {readFile} from 'node:fs/promises'
import path from 'node:path'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {addESLintFeature} from '../../src/features/eslint.js'

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

describe('eslint feature', () => {
  let tempDir: string
  let defaultProjectInfo: ProjectInfo

  beforeEach(() => {
    vi.clearAllMocks()
    tempDir = path.join(process.cwd(), `test-temp-eslint-${Date.now()}`)
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

  describe('generateESLintConfig via addESLintFeature', () => {
    it('generates a TypeScript config without the invalid typeAware boolean', async () => {
      const context: FeatureAddContext = {
        targetDir: tempDir,
        projectInfo: defaultProjectInfo,
        verbose: false,
        dryRun: false,
      }

      await addESLintFeature(context)

      const configPath = path.join(tempDir, 'eslint.config.ts')
      expect(existsSync(configPath)).toBe(true)

      const content = await readFile(configPath, 'utf-8')

      // @bfra.me/eslint-config's `typescript.typeAware` accepts an overrides
      // object, never a boolean. `tsconfigPath` alone already enables
      // type-aware linting, so the generated config must never emit
      // `typeAware: true`.
      expect(content).not.toMatch(/typeAware\s*:\s*true/)
      expect(content).toBe(`import {defineConfig} from '@bfra.me/eslint-config'

export default defineConfig({
  name: 'typescript',
  typescript: {
    tsconfigPath: './tsconfig.json',
  },
  prettier: true,
  vitest: true,
})
`)
    })

    it('generates a React config without the invalid typeAware boolean', async () => {
      const context: FeatureAddContext = {
        targetDir: tempDir,
        projectInfo: {...defaultProjectInfo, type: 'react', framework: 'React'},
        verbose: false,
        dryRun: false,
      }

      await addESLintFeature(context)

      const configPath = path.join(tempDir, 'eslint.config.js')
      const content = await readFile(configPath, 'utf-8')

      expect(content).not.toMatch(/typeAware\s*:\s*true/)
      expect(content).toContain('react: true,')
    })

    it('generates a plain JavaScript config for non-TypeScript projects', async () => {
      const context: FeatureAddContext = {
        targetDir: tempDir,
        projectInfo: {...defaultProjectInfo, type: 'javascript'},
        verbose: false,
        dryRun: false,
      }

      await addESLintFeature(context)

      const configPath = path.join(tempDir, 'eslint.config.js')
      expect(existsSync(configPath)).toBe(true)

      const content = await readFile(configPath, 'utf-8')
      expect(content).not.toContain('typeAware')
      expect(content).toContain("require('@bfra.me/eslint-config')")
    })
  })
})
