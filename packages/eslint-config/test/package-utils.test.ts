import {existsSync, mkdirSync, rmSync, writeFileSync} from 'node:fs'
import path from 'node:path'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {getPackageInstallCommand, tryInstall} from '../src/package-utils'

const mockSpawnSync = vi.fn()

vi.mock('node:child_process', () => ({
  spawnSync: (...args: unknown[]) =>
    mockSpawnSync(...args) as ReturnType<typeof import('node:child_process').spawnSync>,
}))

describe('package-utils', () => {
  let tempDir: string
  let testProjectDir: string

  beforeEach(() => {
    tempDir = path.join(process.cwd(), '.temp-test-package-utils')
    testProjectDir = path.join(tempDir, 'test-project')
    mkdirSync(testProjectDir, {recursive: true})

    mockSpawnSync.mockReturnValue({
      status: 0,
      error: null,
      output: null,
      pid: 12345,
      stdout: null,
      stderr: null,
      signal: null,
    })
  })

  afterEach(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, {recursive: true, force: true})
    }
    vi.clearAllMocks()
  })

  describe('getPackageInstallCommand', () => {
    it('returns install command for npm project', () => {
      writeFileSync(path.join(testProjectDir, 'package.json'), JSON.stringify({name: 'test'}))
      writeFileSync(path.join(testProjectDir, 'package-lock.json'), '')

      const targetFile = path.join(testProjectDir, 'eslint.config.ts')
      const command = getPackageInstallCommand('eslint-plugin-test', targetFile)

      expect(command).not.toBeNull()
      expect(command).toContain('eslint-plugin-test')
      expect(command).toContain('-D')
    })

    it('returns install command for pnpm project', () => {
      writeFileSync(path.join(testProjectDir, 'package.json'), JSON.stringify({name: 'test'}))
      writeFileSync(path.join(testProjectDir, 'pnpm-lock.yaml'), '')

      const targetFile = path.join(testProjectDir, 'eslint.config.ts')
      const command = getPackageInstallCommand('eslint-plugin-test', targetFile)

      expect(command).not.toBeNull()
      expect(command).toContain('eslint-plugin-test')
      expect(command).toContain('-D')
    })

    it('returns install command for yarn project', () => {
      writeFileSync(path.join(testProjectDir, 'package.json'), JSON.stringify({name: 'test'}))
      writeFileSync(path.join(testProjectDir, 'yarn.lock'), '')

      const targetFile = path.join(testProjectDir, 'eslint.config.ts')
      const command = getPackageInstallCommand('eslint-plugin-test', targetFile)

      expect(command).not.toBeNull()
      expect(command).toContain('eslint-plugin-test')
      expect(command).toContain('-D')
    })

    it('includes workspace flag for pnpm workspace', () => {
      writeFileSync(path.join(testProjectDir, 'package.json'), JSON.stringify({name: 'test'}))
      writeFileSync(path.join(testProjectDir, 'pnpm-lock.yaml'), '')
      writeFileSync(path.join(testProjectDir, 'pnpm-workspace.yaml'), 'packages:\n  - packages/*')

      const targetFile = path.join(testProjectDir, 'eslint.config.ts')
      const command = getPackageInstallCommand('eslint-plugin-test', targetFile)

      expect(command).not.toBeNull()
      expect(command).toContain('-w')
      expect(command).toContain('--prod=false')
    })

    it('respects packageManager field in package.json', () => {
      writeFileSync(
        path.join(testProjectDir, 'package.json'),
        JSON.stringify({
          name: 'test',
          packageManager: 'pnpm@9.0.0',
        }),
      )
      writeFileSync(path.join(testProjectDir, 'package-lock.json'), '')

      const targetFile = path.join(testProjectDir, 'eslint.config.ts')
      const command = getPackageInstallCommand('eslint-plugin-test', targetFile)

      expect(command).not.toBeNull()
      expect(command).toContain('pnpm')
    })

    it('respects devEngines.packageManager field in package.json', () => {
      writeFileSync(
        path.join(testProjectDir, 'package.json'),
        JSON.stringify({
          name: 'test',
          devEngines: {
            packageManager: {
              name: 'yarn',
            },
          },
        }),
      )
      writeFileSync(path.join(testProjectDir, 'package-lock.json'), '')

      const targetFile = path.join(testProjectDir, 'eslint.config.ts')
      const command = getPackageInstallCommand('eslint-plugin-test', targetFile)

      expect(command).not.toBeNull()
      expect(command).toContain('yarn')
    })

    it('handles scoped packages', () => {
      writeFileSync(path.join(testProjectDir, 'package.json'), JSON.stringify({name: 'test'}))
      writeFileSync(path.join(testProjectDir, 'package-lock.json'), '')

      const targetFile = path.join(testProjectDir, 'eslint.config.ts')
      const command = getPackageInstallCommand('@typescript-eslint/parser', targetFile)

      expect(command).not.toBeNull()
      expect(command).toContain('@typescript-eslint/parser')
    })

    it('handles packages with version specifications', () => {
      writeFileSync(path.join(testProjectDir, 'package.json'), JSON.stringify({name: 'test'}))
      writeFileSync(path.join(testProjectDir, 'package-lock.json'), '')

      const targetFile = path.join(testProjectDir, 'eslint.config.ts')
      const command = getPackageInstallCommand('eslint-plugin-test@1.2.3', targetFile)

      expect(command).not.toBeNull()
      expect(command).toContain('eslint-plugin-test')
    })

    it('traverses up directory tree to find package manager', () => {
      const nestedDir = path.join(testProjectDir, 'src', 'configs')
      mkdirSync(nestedDir, {recursive: true})

      writeFileSync(path.join(testProjectDir, 'package.json'), JSON.stringify({name: 'test'}))
      writeFileSync(path.join(testProjectDir, 'pnpm-lock.yaml'), '')

      const targetFile = path.join(nestedDir, 'eslint.config.ts')
      const command = getPackageInstallCommand('eslint-plugin-test', targetFile)

      expect(command).not.toBeNull()
      expect(command).toContain('pnpm')
    })
  })

  describe('tryInstall', () => {
    it('caches installed modules and returns null on subsequent calls', () => {
      writeFileSync(path.join(testProjectDir, 'package.json'), JSON.stringify({name: 'test'}))
      writeFileSync(path.join(testProjectDir, 'package-lock.json'), '')

      const targetFile = path.join(testProjectDir, 'eslint.config.ts')
      const moduleName = 'test-module-unique'

      const firstResult = tryInstall(moduleName, targetFile)
      expect(mockSpawnSync).toHaveBeenCalledTimes(1)
      expect(firstResult).toBe('')

      mockSpawnSync.mockClear()
      const secondResult = tryInstall(moduleName, targetFile)
      expect(mockSpawnSync).not.toHaveBeenCalled()
      expect(secondResult).toBeNull()
    })

    it('does not retry failed installations (caches failures)', () => {
      writeFileSync(path.join(testProjectDir, 'package.json'), JSON.stringify({name: 'test'}))
      writeFileSync(path.join(testProjectDir, 'package-lock.json'), '')

      const targetFile = path.join(testProjectDir, 'eslint.config.ts')
      const moduleName = 'failing-module-unique'

      // Simulate a failing spawn/install (non-zero exit status)
      mockSpawnSync.mockReturnValueOnce({
        status: 1,
        error: null,
        output: null,
        pid: 12345,
        stdout: null,
        stderr: null,
        signal: null,
      })

      // First call should throw due to failed installation
      expect(() => tryInstall(moduleName, targetFile)).toThrow()

      // Clear the mock and call again; module should be cached and no new spawn occurs
      mockSpawnSync.mockClear()
      const secondResult = tryInstall(moduleName, targetFile)
      expect(mockSpawnSync).not.toHaveBeenCalled()
      expect(secondResult).toBeNull()
    })

    it('installs module without version', () => {
      writeFileSync(path.join(testProjectDir, 'package.json'), JSON.stringify({name: 'test'}))
      writeFileSync(path.join(testProjectDir, 'package-lock.json'), '')

      const targetFile = path.join(testProjectDir, 'eslint.config.ts')
      const result = tryInstall('eslint-plugin-test', targetFile)

      expect(result).toBe('')
      expect(mockSpawnSync).toHaveBeenCalledTimes(1)
      expect(mockSpawnSync).toHaveBeenCalledWith(
        'npm',
        expect.arrayContaining(['i', '-D', 'eslint-plugin-test']),
        expect.objectContaining({
          cwd: testProjectDir,
          stdio: 'inherit',
          maxBuffer: Number.POSITIVE_INFINITY,
          windowsHide: true,
        }),
      )
    })

    it('installs module with version', () => {
      writeFileSync(path.join(testProjectDir, 'package.json'), JSON.stringify({name: 'test'}))
      writeFileSync(path.join(testProjectDir, 'package-lock.json'), '')

      const targetFile = path.join(testProjectDir, 'eslint.config.ts')
      const result = tryInstall('eslint-plugin-test@1.2.3', targetFile)

      expect(result).toBe('')
      expect(mockSpawnSync).toHaveBeenCalledTimes(1)
      expect(mockSpawnSync).toHaveBeenCalledWith(
        'npm',
        expect.arrayContaining(['i', '-D', 'eslint-plugin-test@^1.2.3']),
        expect.objectContaining({
          cwd: testProjectDir,
          maxBuffer: Number.POSITIVE_INFINITY,
          windowsHide: true,
        }),
      )
    })

    it('installs scoped package without version', () => {
      writeFileSync(path.join(testProjectDir, 'package.json'), JSON.stringify({name: 'test'}))
      writeFileSync(path.join(testProjectDir, 'pnpm-lock.yaml'), '')

      const targetFile = path.join(testProjectDir, 'eslint.config.ts')
      const result = tryInstall('@typescript-eslint/parser', targetFile)

      expect(result).toBe('')
      expect(mockSpawnSync).toHaveBeenCalledTimes(1)
      expect(mockSpawnSync).toHaveBeenCalledWith(
        'pnpm',
        expect.arrayContaining(['add', '-D', '@typescript-eslint/parser']),
        expect.objectContaining({
          cwd: testProjectDir,
        }),
      )
    })

    it('installs scoped package with version', () => {
      writeFileSync(path.join(testProjectDir, 'package.json'), JSON.stringify({name: 'test'}))
      writeFileSync(path.join(testProjectDir, 'yarn.lock'), '')

      const targetFile = path.join(testProjectDir, 'eslint.config.ts')
      const result = tryInstall('@typescript-eslint/parser@5.0.0', targetFile)

      expect(result).toBe('')
      expect(mockSpawnSync).toHaveBeenCalledTimes(1)
      expect(mockSpawnSync).toHaveBeenCalledWith(
        'yarn',
        expect.arrayContaining(['add', '-D', '@typescript-eslint/parser@^5.0.0']),
        expect.objectContaining({
          cwd: testProjectDir,
        }),
      )
    })

    it('uses pnpm with workspace flags for monorepo', () => {
      writeFileSync(path.join(testProjectDir, 'package.json'), JSON.stringify({name: 'test'}))
      writeFileSync(path.join(testProjectDir, 'pnpm-lock.yaml'), '')
      writeFileSync(path.join(testProjectDir, 'pnpm-workspace.yaml'), 'packages:\n  - packages/*')

      const targetFile = path.join(testProjectDir, 'eslint.config.ts')
      tryInstall('workspace-plugin-unique', targetFile)

      expect(mockSpawnSync).toHaveBeenCalledWith(
        'pnpm',
        expect.arrayContaining(['-w', '--prod=false', 'add', '-D', 'workspace-plugin-unique']),
        expect.objectContaining({
          cwd: testProjectDir,
        }),
      )
    })

    it('uses directory of target file as cwd', () => {
      const subDir = path.join(testProjectDir, 'src', 'configs')
      mkdirSync(subDir, {recursive: true})

      writeFileSync(path.join(testProjectDir, 'package.json'), JSON.stringify({name: 'test'}))
      writeFileSync(path.join(testProjectDir, 'pnpm-lock.yaml'), '')

      const targetFile = path.join(subDir, 'eslint.config.ts')
      tryInstall('test-module', targetFile)

      expect(mockSpawnSync).toHaveBeenCalledWith(
        'pnpm',
        expect.any(Array),
        expect.objectContaining({
          cwd: path.dirname(targetFile),
        }),
      )
    })

    it('returns empty string on successful installation', () => {
      writeFileSync(path.join(testProjectDir, 'package.json'), JSON.stringify({name: 'test'}))
      writeFileSync(path.join(testProjectDir, 'package-lock.json'), '')

      mockSpawnSync.mockReturnValue({
        status: 0,
        error: null,
        output: null,
        pid: 12345,
        stdout: null,
        stderr: null,
        signal: null,
      })

      const targetFile = path.join(testProjectDir, 'eslint.config.ts')
      const result = tryInstall('test-success', targetFile)

      expect(result).toBe('')
    })

    it('throws error when installation fails with non-zero exit code', () => {
      writeFileSync(path.join(testProjectDir, 'package.json'), JSON.stringify({name: 'test'}))
      writeFileSync(path.join(testProjectDir, 'package-lock.json'), '')

      mockSpawnSync.mockReturnValue({
        status: 1,
        error: null,
        output: null,
        pid: 12345,
        stdout: null,
        stderr: null,
        signal: null,
      })

      const targetFile = path.join(testProjectDir, 'eslint.config.ts')

      expect(() => tryInstall('test-fail', targetFile)).toThrow(
        /Package installation failed with status 1/,
      )
    })

    it('throws error when spawn fails with error', () => {
      writeFileSync(path.join(testProjectDir, 'package.json'), JSON.stringify({name: 'test'}))
      writeFileSync(path.join(testProjectDir, 'package-lock.json'), '')

      const spawnError = new Error('ENOENT: command not found')
      mockSpawnSync.mockReturnValue({
        status: 1,
        error: spawnError,
        output: null,
        pid: 12345,
        stdout: null,
        stderr: null,
        signal: null,
      })

      const targetFile = path.join(testProjectDir, 'eslint.config.ts')

      expect(() => tryInstall('test-error', targetFile)).toThrow(/ENOENT: command not found/)
    })

    it('respects packageManager field when installing', () => {
      writeFileSync(
        path.join(testProjectDir, 'package.json'),
        JSON.stringify({
          name: 'test',
          packageManager: 'yarn@3.0.0',
        }),
      )
      writeFileSync(path.join(testProjectDir, 'package-lock.json'), '')

      const targetFile = path.join(testProjectDir, 'eslint.config.ts')
      tryInstall('yarn-manager-unique', targetFile)

      expect(mockSpawnSync).toHaveBeenCalledWith('yarn', expect.any(Array), expect.any(Object))
    })

    it('handles multiple different modules independently', () => {
      writeFileSync(path.join(testProjectDir, 'package.json'), JSON.stringify({name: 'test'}))
      writeFileSync(path.join(testProjectDir, 'package-lock.json'), '')

      const targetFile = path.join(testProjectDir, 'eslint.config.ts')

      tryInstall('module-a', targetFile)
      tryInstall('module-b', targetFile)
      tryInstall('module-c', targetFile)

      expect(mockSpawnSync).toHaveBeenCalledTimes(3)
    })

    it('uses maxBuffer Infinity for large output', () => {
      writeFileSync(path.join(testProjectDir, 'package.json'), JSON.stringify({name: 'test'}))
      writeFileSync(path.join(testProjectDir, 'package-lock.json'), '')

      const targetFile = path.join(testProjectDir, 'eslint.config.ts')
      tryInstall('maxbuffer-unique', targetFile)

      expect(mockSpawnSync).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Array),
        expect.objectContaining({
          maxBuffer: Number.POSITIVE_INFINITY,
        }),
      )
    })

    it('hides window on Windows platform', () => {
      writeFileSync(path.join(testProjectDir, 'package.json'), JSON.stringify({name: 'test'}))
      writeFileSync(path.join(testProjectDir, 'package-lock.json'), '')

      const targetFile = path.join(testProjectDir, 'eslint.config.ts')
      tryInstall('windows-hide-unique', targetFile)

      expect(mockSpawnSync).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Array),
        expect.objectContaining({
          windowsHide: true,
        }),
      )
    })
  })

  describe('integration scenarios', () => {
    it('generates install commands for ESLint plugins and parsers', () => {
      writeFileSync(path.join(testProjectDir, 'package.json'), JSON.stringify({name: 'test'}))
      writeFileSync(path.join(testProjectDir, 'package-lock.json'), '')

      const targetFile = path.join(testProjectDir, 'eslint.config.ts')
      const modules = ['eslint-plugin-react', '@typescript-eslint/parser', 'eslint-plugin-jsx-a11y']

      for (const module of modules) {
        const command = getPackageInstallCommand(module, targetFile)
        expect(command).not.toBeNull()
        expect(command).toContain(module)
      }
    })

    it('generates consistent commands for multiple modules with same package manager', () => {
      writeFileSync(path.join(testProjectDir, 'package.json'), JSON.stringify({name: 'test'}))
      writeFileSync(path.join(testProjectDir, 'pnpm-lock.yaml'), '')

      const targetFile = path.join(testProjectDir, 'eslint.config.ts')
      const modules = ['module-a', 'module-b', 'module-c']

      const commands = modules.map(module => getPackageInstallCommand(module, targetFile))

      expect(commands.every(cmd => cmd != null && cmd.includes('pnpm'))).toBe(true)
      expect(commands.every(cmd => cmd != null && cmd.includes('-D'))).toBe(true)
    })

    it('handles complex workspace setup', () => {
      const workspaceRoot = testProjectDir
      const packageDir = path.join(workspaceRoot, 'packages', 'app')
      mkdirSync(packageDir, {recursive: true})

      writeFileSync(
        path.join(workspaceRoot, 'package.json'),
        JSON.stringify({
          name: 'monorepo',
          packageManager: 'pnpm@9.0.0',
        }),
      )
      writeFileSync(path.join(workspaceRoot, 'pnpm-lock.yaml'), '')
      writeFileSync(path.join(workspaceRoot, 'pnpm-workspace.yaml'), 'packages:\n  - packages/*')
      writeFileSync(path.join(packageDir, 'package.json'), JSON.stringify({name: '@app/core'}))

      const targetFile = path.join(packageDir, 'eslint.config.ts')
      const command = getPackageInstallCommand('eslint-plugin-test', targetFile)

      expect(command).not.toBeNull()
      expect(command).toContain('pnpm')
    })
  })

  describe('edge cases', () => {
    it('handles empty package.json gracefully', () => {
      writeFileSync(path.join(testProjectDir, 'package.json'), '{}')
      writeFileSync(path.join(testProjectDir, 'package-lock.json'), '')

      const targetFile = path.join(testProjectDir, 'eslint.config.ts')
      const command = getPackageInstallCommand('eslint-plugin-test', targetFile)

      expect(command).not.toBeNull()
    })

    it('handles malformed packageManager field', () => {
      writeFileSync(
        path.join(testProjectDir, 'package.json'),
        JSON.stringify({
          name: 'test',
          packageManager: 'invalid-manager@1.0.0',
        }),
      )
      writeFileSync(path.join(testProjectDir, 'package-lock.json'), '')

      const targetFile = path.join(testProjectDir, 'eslint.config.ts')
      const command = getPackageInstallCommand('eslint-plugin-test', targetFile)

      expect(command).not.toBeNull()
    })

    it('handles module names with multiple @ symbols', () => {
      writeFileSync(path.join(testProjectDir, 'package.json'), JSON.stringify({name: 'test'}))
      writeFileSync(path.join(testProjectDir, 'package-lock.json'), '')

      const targetFile = path.join(testProjectDir, 'eslint.config.ts')
      const command = getPackageInstallCommand('@scope/package@1.0.0', targetFile)

      expect(command).not.toBeNull()
      expect(command).toContain('@scope/package')
    })

    it('handles paths with special characters', () => {
      const specialDir = path.join(tempDir, 'test-project-with-dash')
      mkdirSync(specialDir, {recursive: true})

      writeFileSync(path.join(specialDir, 'package.json'), JSON.stringify({name: 'test'}))
      writeFileSync(path.join(specialDir, 'package-lock.json'), '')

      const targetFile = path.join(specialDir, 'eslint.config.ts')
      const command = getPackageInstallCommand('eslint-plugin-test', targetFile)

      expect(command).not.toBeNull()
    })

    it('returns null for root directory without package manager', () => {
      const rootishDir = path.sep
      const targetFile = path.join(rootishDir, 'eslint.config.ts')

      const command = getPackageInstallCommand('eslint-plugin-test', targetFile)

      expect(command).toBeNull()
    })
  })
})
