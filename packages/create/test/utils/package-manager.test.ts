import {existsSync, mkdirSync, rmSync, writeFileSync} from 'node:fs'
import {readFile} from 'node:fs/promises'
import path from 'node:path'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {
  addDependencies,
  addScripts,
  detectPackageManager,
  installDependencies,
} from '../../src/utils/package-manager.js'

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

describe('package-manager utilities', () => {
  let tempDir: string

  beforeEach(() => {
    vi.clearAllMocks()
    tempDir = path.join(process.cwd(), '.tmp', `test-temp-pm-${Date.now()}`)
    mkdirSync(tempDir, {recursive: true})
    writeFileSync(
      path.join(tempDir, 'package.json'),
      JSON.stringify({name: 'test-project'}, null, 2),
    )
  })

  afterEach(() => {
    try {
      if (existsSync(tempDir)) {
        rmSync(tempDir, {recursive: true, force: true})
      }
    } catch (error) {
      console.warn(`Failed to clean up ${tempDir}:`, error)
    }
  })

  describe('detectPackageManager', () => {
    it('should detect pnpm from lock file', () => {
      writeFileSync(path.join(tempDir, 'pnpm-lock.yaml'), '')
      expect(detectPackageManager(tempDir)).toBe('pnpm')
    })

    it('should detect yarn from lock file', () => {
      writeFileSync(path.join(tempDir, 'yarn.lock'), '')
      expect(detectPackageManager(tempDir)).toBe('yarn')
    })

    it('should detect bun from lock file', () => {
      writeFileSync(path.join(tempDir, 'bun.lockb'), '')
      expect(detectPackageManager(tempDir)).toBe('bun')
    })

    it('should default to npm when no lock file found', () => {
      expect(detectPackageManager(tempDir)).toBe('npm')
    })

    it('should prioritize pnpm over yarn when both exist', () => {
      writeFileSync(path.join(tempDir, 'pnpm-lock.yaml'), '')
      writeFileSync(path.join(tempDir, 'yarn.lock'), '')
      expect(detectPackageManager(tempDir)).toBe('pnpm')
    })
  })

  describe('addDependencies', () => {
    it('should add regular dependencies to package.json', async () => {
      await addDependencies(tempDir, ['lodash', 'axios'], [], undefined, false)

      const content = await readFile(path.join(tempDir, 'package.json'), 'utf-8')
      const pkg = JSON.parse(content) as PackageJson

      expect(pkg.dependencies).toBeDefined()
      expect(pkg.dependencies?.lodash).toBe('latest')
      expect(pkg.dependencies?.axios).toBe('latest')
    })

    it('should add dev dependencies to package.json', async () => {
      await addDependencies(tempDir, [], ['vitest', 'typescript'], undefined, false)

      const content = await readFile(path.join(tempDir, 'package.json'), 'utf-8')
      const pkg = JSON.parse(content) as PackageJson

      expect(pkg.devDependencies).toBeDefined()
      expect(pkg.devDependencies?.vitest).toBe('latest')
      expect(pkg.devDependencies?.typescript).toBe('latest')
    })

    it('should not overwrite existing dependencies', async () => {
      writeFileSync(
        path.join(tempDir, 'package.json'),
        JSON.stringify(
          {
            name: 'test-project',
            dependencies: {lodash: '^4.17.0'},
          },
          null,
          2,
        ),
      )

      await addDependencies(tempDir, ['lodash', 'axios'], [], undefined, false)

      const content = await readFile(path.join(tempDir, 'package.json'), 'utf-8')
      const pkg = JSON.parse(content) as PackageJson

      expect(pkg.dependencies?.lodash).toBe('^4.17.0')
      expect(pkg.dependencies?.axios).toBe('latest')
    })

    it('should throw error when package.json not found', async () => {
      const nonExistentDir = path.join(tempDir, 'nonexistent')
      mkdirSync(nonExistentDir, {recursive: true})

      await expect(
        addDependencies(nonExistentDir, ['lodash'], [], undefined, false),
      ).rejects.toThrow('package.json not found')
    })

    it('should return early when no dependencies provided', async () => {
      const originalContent = await readFile(path.join(tempDir, 'package.json'), 'utf-8')

      await addDependencies(tempDir, [], [], undefined, false)

      const content = await readFile(path.join(tempDir, 'package.json'), 'utf-8')
      expect(content).toBe(originalContent)
    })
  })

  describe('installDependencies', () => {
    it('should call npm install for npm package manager', async () => {
      const {consola} = await import('consola')

      // With verbose=true, it should log messages
      await installDependencies(tempDir, 'npm', true)

      expect(consola.info).toHaveBeenCalledWith('Installing dependencies with npm...')
    })

    it('should handle installation errors gracefully', async () => {
      // Create a directory without a package.json to simulate failure
      const badDir = path.join(tempDir, 'bad')
      mkdirSync(badDir, {recursive: true})

      // The function logs info then potentially warns - just verify it doesn't throw
      await expect(installDependencies(badDir, 'npm', true)).resolves.not.toThrow()
    })
  })

  describe('addScripts', () => {
    it('should add scripts to package.json', async () => {
      await addScripts(tempDir, {build: 'tsc', test: 'vitest'}, false)

      const content = await readFile(path.join(tempDir, 'package.json'), 'utf-8')
      const pkg = JSON.parse(content) as PackageJson

      expect(pkg.scripts).toBeDefined()
      expect(pkg.scripts?.build).toBe('tsc')
      expect(pkg.scripts?.test).toBe('vitest')
    })

    it('should not overwrite existing scripts', async () => {
      writeFileSync(
        path.join(tempDir, 'package.json'),
        JSON.stringify(
          {
            name: 'test-project',
            scripts: {build: 'existing-build'},
          },
          null,
          2,
        ),
      )

      await addScripts(tempDir, {build: 'new-build', test: 'vitest'}, false)

      const content = await readFile(path.join(tempDir, 'package.json'), 'utf-8')
      const pkg = JSON.parse(content) as PackageJson

      expect(pkg.scripts?.build).toBe('existing-build')
      expect(pkg.scripts?.test).toBe('vitest')
    })

    it('should throw error when package.json not found', async () => {
      const nonExistentDir = path.join(tempDir, 'nonexistent')
      mkdirSync(nonExistentDir, {recursive: true})

      await expect(addScripts(nonExistentDir, {build: 'tsc'}, false)).rejects.toThrow(
        'package.json not found',
      )
    })

    it('should log success with verbose mode', async () => {
      const {consola} = await import('consola')

      await addScripts(tempDir, {build: 'tsc'}, true)

      expect(consola.success).toHaveBeenCalledWith('Added scripts to package.json')
    })

    it('should handle package.json without scripts property', async () => {
      await addScripts(tempDir, {build: 'tsc'}, false)

      const content = await readFile(path.join(tempDir, 'package.json'), 'utf-8')
      const pkg = JSON.parse(content) as PackageJson

      expect(pkg.scripts).toBeDefined()
      expect(pkg.scripts?.build).toBe('tsc')
    })

    it('should not modify file when scripts already exist', async () => {
      writeFileSync(
        path.join(tempDir, 'package.json'),
        JSON.stringify(
          {
            name: 'test-project',
            scripts: {build: 'tsc', test: 'vitest'},
          },
          null,
          2,
        ),
      )

      const {consola} = await import('consola')

      await addScripts(tempDir, {build: 'tsc', test: 'vitest'}, true)

      expect(consola.info).toHaveBeenCalledWith('Scripts already exist in package.json')
    })
  })
})
