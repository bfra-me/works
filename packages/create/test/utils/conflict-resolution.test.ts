import type {ConflictInfo, ProjectInfo} from '../../src/types.js'
import {existsSync} from 'node:fs'
import {mkdir, readFile, rm, writeFile} from 'node:fs/promises'
import path from 'node:path'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {detectConflicts, resolveConflicts} from '../../src/utils/conflict-resolution.js'

vi.mock('consola')

describe('detectConflicts', () => {
  let testDir: string

  beforeEach(async () => {
    testDir = path.join(process.cwd(), `test-conflict-detection-${Date.now()}`)
    await mkdir(testDir, {recursive: true})
  })

  afterEach(async () => {
    if (existsSync(testDir)) {
      await rm(testDir, {recursive: true, force: true})
    }
  })

  const mockProjectInfo: ProjectInfo = {
    type: 'typescript',
    packageManager: 'npm',
  }

  describe('ESLint conflicts', () => {
    it('should detect .eslintrc.js conflicts', async () => {
      await writeFile(path.join(testDir, '.eslintrc.js'), 'module.exports = {}')

      const conflicts = await detectConflicts(testDir, 'eslint', mockProjectInfo)

      expect(conflicts).toHaveLength(1)
      expect(conflicts[0]?.type).toBe('file')
      expect(conflicts[0]?.description).toContain('Existing ESLint configuration')
      expect(conflicts[0]?.existing).toContain('.eslintrc.js')
      expect(conflicts[0]?.severity).toBe('medium')
    })

    it('should detect eslint.config.ts conflicts', async () => {
      await writeFile(path.join(testDir, 'eslint.config.ts'), 'export default {}')

      const conflicts = await detectConflicts(testDir, 'eslint', mockProjectInfo)

      expect(conflicts).toHaveLength(1)
      expect(conflicts[0]?.existing).toContain('eslint.config.ts')
    })

    it('should detect multiple ESLint config formats', async () => {
      await writeFile(path.join(testDir, '.eslintrc.json'), '{}')
      await writeFile(path.join(testDir, '.eslintrc.yml'), 'extends: airbnb')

      const conflicts = await detectConflicts(testDir, 'eslint', mockProjectInfo)

      expect(conflicts.length).toBeGreaterThanOrEqual(2)
    })

    it('should not detect conflicts when no ESLint config exists', async () => {
      const conflicts = await detectConflicts(testDir, 'eslint', mockProjectInfo)

      const eslintConflicts = conflicts.filter(c => c.description.includes('ESLint'))
      expect(eslintConflicts).toHaveLength(0)
    })
  })

  describe('Prettier conflicts', () => {
    it('should detect .prettierrc conflicts', async () => {
      await writeFile(path.join(testDir, '.prettierrc'), '{}')

      const conflicts = await detectConflicts(testDir, 'prettier', mockProjectInfo)

      expect(conflicts).toHaveLength(1)
      expect(conflicts[0]?.type).toBe('file')
      expect(conflicts[0]?.description).toContain('Existing Prettier configuration')
      expect(conflicts[0]?.existing).toContain('.prettierrc')
      expect(conflicts[0]?.severity).toBe('low')
    })

    it('should detect prettier.config.js conflicts', async () => {
      await writeFile(path.join(testDir, 'prettier.config.js'), 'module.exports = {}')

      const conflicts = await detectConflicts(testDir, 'prettier', mockProjectInfo)

      expect(conflicts).toHaveLength(1)
      expect(conflicts[0]?.existing).toContain('prettier.config.js')
    })

    it('should detect .prettierrc.json conflicts', async () => {
      await writeFile(path.join(testDir, '.prettierrc.json'), '{"semi": false}')

      const conflicts = await detectConflicts(testDir, 'prettier', mockProjectInfo)

      expect(conflicts).toHaveLength(1)
      expect(conflicts[0]?.existing).toContain('.prettierrc.json')
    })
  })

  describe('TypeScript conflicts', () => {
    it('should detect existing tsconfig.json', async () => {
      await writeFile(
        path.join(testDir, 'tsconfig.json'),
        JSON.stringify({compilerOptions: {strict: true}}),
      )

      const conflicts = await detectConflicts(testDir, 'typescript', mockProjectInfo)

      expect(conflicts).toHaveLength(1)
      expect(conflicts[0]?.type).toBe('configuration')
      expect(conflicts[0]?.description).toContain('Existing TypeScript configuration')
      expect(conflicts[0]?.severity).toBe('low')
    })

    it('should not detect conflict when no tsconfig exists', async () => {
      const conflicts = await detectConflicts(testDir, 'typescript', mockProjectInfo)

      expect(conflicts).toHaveLength(0)
    })
  })

  describe('Vitest conflicts', () => {
    it('should detect vitest.config.ts conflicts', async () => {
      await writeFile(path.join(testDir, 'vitest.config.ts'), 'export default {}')

      const conflicts = await detectConflicts(testDir, 'vitest', mockProjectInfo)

      expect(conflicts).toHaveLength(1)
      expect(conflicts[0]?.type).toBe('file')
      expect(conflicts[0]?.description).toContain('test configuration')
      expect(conflicts[0]?.existing).toContain('vitest.config.ts')
      expect(conflicts[0]?.severity).toBe('medium')
    })

    it('should detect vite.config.js conflicts', async () => {
      await writeFile(path.join(testDir, 'vite.config.js'), 'export default {}')

      const conflicts = await detectConflicts(testDir, 'vitest', mockProjectInfo)

      expect(conflicts).toHaveLength(1)
      expect(conflicts[0]?.existing).toContain('vite.config.js')
    })

    it('should detect Jest configuration as high-severity conflict', async () => {
      await writeFile(path.join(testDir, 'jest.config.js'), 'module.exports = {}')

      const conflicts = await detectConflicts(testDir, 'vitest', mockProjectInfo)

      expect(conflicts).toHaveLength(1)
      expect(conflicts[0]?.type).toBe('configuration')
      expect(conflicts[0]?.description).toContain('Jest configuration may conflict')
      expect(conflicts[0]?.severity).toBe('high')
    })

    it('should detect multiple test framework conflicts', async () => {
      await writeFile(path.join(testDir, 'vitest.config.ts'), 'export default {}')
      await writeFile(path.join(testDir, 'jest.config.json'), '{}')

      const conflicts = await detectConflicts(testDir, 'vitest', mockProjectInfo)

      expect(conflicts.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('dependency conflicts', () => {
    it('should detect Jest dependency conflict with Vitest', async () => {
      const packageJson = {
        name: 'test-project',
        version: '1.0.0',
        devDependencies: {
          jest: '^29.0.0',
        },
      }
      await writeFile(path.join(testDir, 'package.json'), JSON.stringify(packageJson, null, 2))

      const conflicts = await detectConflicts(testDir, 'vitest', mockProjectInfo)

      const depConflict = conflicts.find(c => c.type === 'dependency')
      expect(depConflict).toBeDefined()
      expect(depConflict?.description).toContain('Jest')
      expect(depConflict?.severity).toBe('high')
    })

    it('should handle missing package.json gracefully', async () => {
      const conflicts = await detectConflicts(testDir, 'vitest', mockProjectInfo)

      expect(conflicts).toBeDefined()
    })

    it('should handle malformed package.json gracefully', async () => {
      await writeFile(path.join(testDir, 'package.json'), 'invalid json{')

      const conflicts = await detectConflicts(testDir, 'vitest', mockProjectInfo)

      expect(conflicts).toBeDefined()
    })

    it('should handle package.json without dependencies', async () => {
      const packageJson = {
        name: 'test-project',
        version: '1.0.0',
      }
      await writeFile(path.join(testDir, 'package.json'), JSON.stringify(packageJson))

      const conflicts = await detectConflicts(testDir, 'vitest', mockProjectInfo)

      expect(conflicts).toBeDefined()
    })
  })

  describe('multiple features', () => {
    it('should detect no conflicts for unknown feature', async () => {
      const conflicts = await detectConflicts(testDir, 'unknown-feature', mockProjectInfo)

      expect(conflicts).toHaveLength(0)
    })

    it('should detect combined conflicts from multiple features', async () => {
      await writeFile(path.join(testDir, '.eslintrc.js'), 'module.exports = {}')
      await writeFile(path.join(testDir, '.prettierrc'), '{}')

      const eslintConflicts = await detectConflicts(testDir, 'eslint', mockProjectInfo)
      const prettierConflicts = await detectConflicts(testDir, 'prettier', mockProjectInfo)

      expect(eslintConflicts.length).toBeGreaterThan(0)
      expect(prettierConflicts.length).toBeGreaterThan(0)
    })
  })
})

describe('resolveConflicts', () => {
  let testDir: string

  beforeEach(async () => {
    testDir = path.join(process.cwd(), `test-conflict-resolution-${Date.now()}`)
    await mkdir(testDir, {recursive: true})
  })

  afterEach(async () => {
    if (existsSync(testDir)) {
      await rm(testDir, {recursive: true, force: true})
    }
  })

  describe('merge strategy', () => {
    it('should backup existing file and allow new file creation', async () => {
      const existingFile = path.join(testDir, '.eslintrc.js')
      const existingContent = 'module.exports = {}'
      await writeFile(existingFile, existingContent)

      const conflicts: ConflictInfo[] = [
        {
          type: 'file',
          description: 'Existing ESLint configuration',
          existing: existingFile,
          proposed: path.join(testDir, 'eslint.config.ts'),
          severity: 'medium',
        },
      ]

      await resolveConflicts(conflicts, 'merge', testDir)

      const backupFile = `${existingFile}.backup`
      expect(existsSync(backupFile)).toBe(true)

      const backupContent = await readFile(backupFile, 'utf-8')
      expect(backupContent).toBe(existingContent)
    })

    it('should handle multiple file conflicts', async () => {
      const file1 = path.join(testDir, '.eslintrc.js')
      const file2 = path.join(testDir, '.prettierrc')
      await writeFile(file1, 'content1')
      await writeFile(file2, 'content2')

      const conflicts: ConflictInfo[] = [
        {
          type: 'file',
          description: 'ESLint config',
          existing: file1,
          proposed: path.join(testDir, 'eslint.config.ts'),
          severity: 'medium',
        },
        {
          type: 'file',
          description: 'Prettier config',
          existing: file2,
          proposed: path.join(testDir, '.prettierrc.json'),
          severity: 'low',
        },
      ]

      await resolveConflicts(conflicts, 'merge', testDir)

      expect(existsSync(`${file1}.backup`)).toBe(true)
      expect(existsSync(`${file2}.backup`)).toBe(true)
    })

    it('should handle non-file conflicts gracefully', async () => {
      const conflicts: ConflictInfo[] = [
        {
          type: 'configuration',
          description: 'Configuration conflict',
          existing: path.join(testDir, 'tsconfig.json'),
          severity: 'low',
        },
      ]

      await expect(resolveConflicts(conflicts, 'merge', testDir)).resolves.not.toThrow()
    })

    it('should handle conflicts without proposed path', async () => {
      const existingFile = path.join(testDir, 'config.json')
      await writeFile(existingFile, '{}')

      const conflicts: ConflictInfo[] = [
        {
          type: 'file',
          description: 'Config without proposed',
          existing: existingFile,
          severity: 'medium',
        },
      ]

      await expect(resolveConflicts(conflicts, 'merge', testDir)).resolves.not.toThrow()
    })

    it('should handle backup failure gracefully', async () => {
      const nonExistentFile = path.join(testDir, 'does-not-exist.js')

      const conflicts: ConflictInfo[] = [
        {
          type: 'file',
          description: 'Non-existent file',
          existing: nonExistentFile,
          proposed: path.join(testDir, 'new-file.js'),
          severity: 'medium',
        },
      ]

      await expect(resolveConflicts(conflicts, 'merge', testDir)).resolves.not.toThrow()
    })
  })

  describe('overwrite strategy', () => {
    it('should remove existing file', async () => {
      const existingFile = path.join(testDir, '.eslintrc.js')
      await writeFile(existingFile, 'module.exports = {}')

      const conflicts: ConflictInfo[] = [
        {
          type: 'file',
          description: 'Existing ESLint configuration',
          existing: existingFile,
          proposed: path.join(testDir, 'eslint.config.ts'),
          severity: 'medium',
        },
      ]

      await resolveConflicts(conflicts, 'overwrite', testDir)

      expect(existsSync(existingFile)).toBe(false)
    })

    it('should remove multiple existing files', async () => {
      const file1 = path.join(testDir, 'file1.js')
      const file2 = path.join(testDir, 'file2.js')
      await writeFile(file1, 'content1')
      await writeFile(file2, 'content2')

      const conflicts: ConflictInfo[] = [
        {
          type: 'file',
          description: 'File 1',
          existing: file1,
          severity: 'medium',
        },
        {
          type: 'file',
          description: 'File 2',
          existing: file2,
          severity: 'low',
        },
      ]

      await resolveConflicts(conflicts, 'overwrite', testDir)

      expect(existsSync(file1)).toBe(false)
      expect(existsSync(file2)).toBe(false)
    })

    it('should handle non-file conflicts gracefully', async () => {
      const conflicts: ConflictInfo[] = [
        {
          type: 'configuration',
          description: 'Configuration conflict',
          existing: path.join(testDir, 'tsconfig.json'),
          severity: 'low',
        },
      ]

      await expect(resolveConflicts(conflicts, 'overwrite', testDir)).resolves.not.toThrow()
    })

    it('should handle missing file gracefully', async () => {
      const nonExistentFile = path.join(testDir, 'does-not-exist.js')

      const conflicts: ConflictInfo[] = [
        {
          type: 'file',
          description: 'Non-existent file',
          existing: nonExistentFile,
          severity: 'medium',
        },
      ]

      await expect(resolveConflicts(conflicts, 'overwrite', testDir)).resolves.not.toThrow()
    })
  })

  describe('skip strategy', () => {
    it('should leave existing files unchanged', async () => {
      const existingFile = path.join(testDir, '.eslintrc.js')
      const originalContent = 'module.exports = {}'
      await writeFile(existingFile, originalContent)

      const conflicts: ConflictInfo[] = [
        {
          type: 'file',
          description: 'Existing ESLint configuration',
          existing: existingFile,
          proposed: path.join(testDir, 'eslint.config.ts'),
          severity: 'medium',
        },
      ]

      await resolveConflicts(conflicts, 'skip', testDir)

      expect(existsSync(existingFile)).toBe(true)
      const content = await readFile(existingFile, 'utf-8')
      expect(content).toBe(originalContent)
    })

    it('should handle multiple conflicts without modifying files', async () => {
      const file1 = path.join(testDir, 'file1.js')
      const file2 = path.join(testDir, 'file2.js')
      await writeFile(file1, 'content1')
      await writeFile(file2, 'content2')

      const conflicts: ConflictInfo[] = [
        {
          type: 'file',
          description: 'File 1',
          existing: file1,
          severity: 'medium',
        },
        {
          type: 'file',
          description: 'File 2',
          existing: file2,
          severity: 'low',
        },
      ]

      await resolveConflicts(conflicts, 'skip', testDir)

      expect(existsSync(file1)).toBe(true)
      expect(existsSync(file2)).toBe(true)
    })
  })

  describe('error handling', () => {
    it('should throw error for unknown strategy', async () => {
      const conflicts: ConflictInfo[] = [
        {
          type: 'file',
          description: 'Test conflict',
          existing: path.join(testDir, 'file.js'),
          severity: 'medium',
        },
      ]

      await expect(resolveConflicts(conflicts, 'unknown-strategy', testDir)).rejects.toThrow(
        'Unknown conflict resolution strategy: unknown-strategy',
      )
    })

    it('should handle empty conflicts array', async () => {
      await expect(resolveConflicts([], 'merge', testDir)).resolves.not.toThrow()
      await expect(resolveConflicts([], 'overwrite', testDir)).resolves.not.toThrow()
      await expect(resolveConflicts([], 'skip', testDir)).resolves.not.toThrow()
    })
  })

  describe('edge cases', () => {
    it('should handle conflicts with special characters in paths', async () => {
      const specialDir = path.join(testDir, 'special [dir]')
      await mkdir(specialDir, {recursive: true})
      const specialFile = path.join(specialDir, 'file (1).js')
      await writeFile(specialFile, 'content')

      const conflicts: ConflictInfo[] = [
        {
          type: 'file',
          description: 'Special characters',
          existing: specialFile,
          severity: 'medium',
        },
      ]

      await expect(resolveConflicts(conflicts, 'overwrite', testDir)).resolves.not.toThrow()
      expect(existsSync(specialFile)).toBe(false)
    })

    it('should handle deeply nested paths', async () => {
      const deepDir = path.join(testDir, 'a', 'b', 'c', 'd')
      await mkdir(deepDir, {recursive: true})
      const deepFile = path.join(deepDir, 'deep.js')
      await writeFile(deepFile, 'content')

      const conflicts: ConflictInfo[] = [
        {
          type: 'file',
          description: 'Deep file',
          existing: deepFile,
          proposed: path.join(deepDir, 'new-deep.js'),
          severity: 'medium',
        },
      ]

      await resolveConflicts(conflicts, 'merge', testDir)

      expect(existsSync(`${deepFile}.backup`)).toBe(true)
    })

    it('should handle very long file paths', async () => {
      const longName = `${'a'.repeat(200)}.js`
      const longFile = path.join(testDir, longName)
      await writeFile(longFile, 'content')

      const conflicts: ConflictInfo[] = [
        {
          type: 'file',
          description: 'Long filename',
          existing: longFile,
          severity: 'medium',
        },
      ]

      await expect(resolveConflicts(conflicts, 'overwrite', testDir)).resolves.not.toThrow()
    })
  })
})
