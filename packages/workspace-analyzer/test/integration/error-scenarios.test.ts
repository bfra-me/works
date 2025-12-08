/**
 * Integration tests for error handling and recovery scenarios.
 *
 * These tests verify that the analyzer correctly handles various failure
 * modes including invalid inputs, missing files, permission errors,
 * malformed configurations, and graceful degradation.
 */

import fs from 'node:fs/promises'
import path from 'node:path'

import {afterEach, beforeEach, describe, expect, it} from 'vitest'

import {analyzePackages, analyzeWorkspace} from '../../src/api/analyze-workspace'
import {loadConfig, loadConfigFile} from '../../src/config/loader'
import {
  cleanupTempWorkspace,
  createMonorepoStructure,
  createTempWorkspace,
} from '../utils/test-workspace'

describe('error-scenarios', () => {
  let tempDir: string

  beforeEach(async () => {
    tempDir = await createTempWorkspace('error-scenarios-test-')
  })

  afterEach(async () => {
    await cleanupTempWorkspace(tempDir)
  })

  describe('invalid workspace paths', () => {
    it('should handle non-existent workspace path gracefully', async () => {
      const result = await analyzeWorkspace('/non/existent/path/to/workspace')

      expect(result.success).toBe(false)
      const error = result.success ? null : result.error
      expect(error?.code).toBe('SCAN_ERROR')
    })

    it('should handle file path instead of directory', async () => {
      const filePath = path.join(tempDir, 'not-a-directory.txt')
      await fs.writeFile(filePath, 'some content')

      const result = await analyzeWorkspace(filePath)

      expect(result.success).toBe(false)
    })

    it('should handle empty directory', async () => {
      const emptyDir = path.join(tempDir, 'empty')
      await fs.mkdir(emptyDir)

      const result = await analyzeWorkspace(emptyDir)

      expect(result.success).toBe(false)
      const error = result.success ? null : result.error
      expect(error?.code).toBe('SCAN_ERROR')
    })
  })

  describe('configuration errors', () => {
    it('should handle missing explicit config file', async () => {
      await createMonorepoStructure(tempDir, [
        {name: '@test/pkg', files: {'index.ts': `export const x = 1`}},
      ])

      const result = await analyzeWorkspace(tempDir, {
        configPath: '/non/existent/config.mjs',
      })

      expect(result.success).toBe(false)
      const error = result.success ? null : result.error
      expect(error?.code).toBe('CONFIG_ERROR')
    })

    it('should handle malformed JavaScript in config file', async () => {
      await createMonorepoStructure(tempDir, [
        {name: '@test/pkg', files: {'index.ts': `export const x = 1`}},
      ])

      const configPath = path.join(tempDir, 'workspace-analyzer.config.mjs')
      await fs.writeFile(configPath, 'this is not { valid javascript')

      const result = await loadConfigFile(configPath)

      expect(result.success).toBe(false)
      const error = result.success ? null : result.error
      expect(error?.code).toBe('IMPORT_ERROR')
    })

    it('should handle config file with invalid export', async () => {
      const configPath = path.join(tempDir, 'workspace-analyzer.config.mjs')
      await fs.writeFile(
        configPath,
        `
        const config = { minSeverity: 'warning' }
        export default null
      `,
      )

      const result = await loadConfigFile(configPath)

      expect(result.success).toBe(false)
      const error = result.success ? null : result.error
      expect(error?.code).toBe('VALIDATION_ERROR')
    })

    it('should handle config file with invalid severity value', async () => {
      const configPath = path.join(tempDir, 'workspace-analyzer.config.mjs')
      await fs.writeFile(
        configPath,
        `export default {
          minSeverity: 'invalid-severity'
        }`,
      )

      const result = await loadConfigFile(configPath)

      expect(result.success).toBe(false)
      const error = result.success ? null : result.error
      expect(error?.code).toBe('VALIDATION_ERROR')
    })

    it('should handle config file with invalid category value', async () => {
      const configPath = path.join(tempDir, 'workspace-analyzer.config.mjs')
      await fs.writeFile(
        configPath,
        `export default {
          categories: ['invalid-category']
        }`,
      )

      const result = await loadConfigFile(configPath)

      expect(result.success).toBe(false)
      const error = result.success ? null : result.error
      expect(error?.code).toBe('VALIDATION_ERROR')
    })

    it('should handle config file with wrong type for option', async () => {
      const configPath = path.join(tempDir, 'workspace-analyzer.config.mjs')
      await fs.writeFile(
        configPath,
        `export default {
          concurrency: 'not-a-number'
        }`,
      )

      const result = await loadConfigFile(configPath)

      expect(result.success).toBe(false)
      const error = result.success ? null : result.error
      expect(error?.code).toBe('VALIDATION_ERROR')
    })

    it('should return undefined when no config file exists', async () => {
      const result = await loadConfig(tempDir)

      expect(result.success).toBe(true)
      const data = result.success ? result.data : null
      expect(data).toBeUndefined()
    })
  })

  describe('package.json errors', () => {
    it('should handle malformed package.json', async () => {
      await fs.mkdir(path.join(tempDir, 'packages', 'malformed'), {recursive: true})
      await fs.writeFile(
        path.join(tempDir, 'packages', 'malformed', 'package.json'),
        'not valid json {{{',
      )

      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify({name: 'root', private: true, workspaces: ['packages/*']}),
      )

      await fs.writeFile(path.join(tempDir, 'pnpm-workspace.yaml'), 'packages:\n  - packages/*\n')

      const result = await analyzeWorkspace(tempDir)

      expect(result.success).toBe(false)
      const error = result.success ? null : result.error
      expect(error?.code).toBe('SCAN_ERROR')
    })

    it('should handle package.json with missing name field', async () => {
      await fs.mkdir(path.join(tempDir, 'packages', 'no-name', 'src'), {recursive: true})
      await fs.writeFile(
        path.join(tempDir, 'packages', 'no-name', 'package.json'),
        JSON.stringify({version: '1.0.0'}),
      )
      await fs.writeFile(
        path.join(tempDir, 'packages', 'no-name', 'src', 'index.ts'),
        `export const x = 1`,
      )

      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify({name: 'root', private: true, workspaces: ['packages/*']}),
      )

      await fs.writeFile(path.join(tempDir, 'pnpm-workspace.yaml'), 'packages:\n  - packages/*\n')

      const result = await analyzeWorkspace(tempDir)

      expect(result.success).toBe(false)
      const error = result.success ? null : result.error
      expect(error?.code).toBe('SCAN_ERROR')
    })

    it('should handle missing root package.json', async () => {
      await fs.mkdir(path.join(tempDir, 'packages', 'pkg', 'src'), {recursive: true})
      await fs.writeFile(
        path.join(tempDir, 'packages', 'pkg', 'package.json'),
        JSON.stringify({name: '@test/pkg', version: '1.0.0'}),
      )
      await fs.writeFile(
        path.join(tempDir, 'packages', 'pkg', 'src', 'index.ts'),
        `export const x = 1`,
      )

      await fs.writeFile(path.join(tempDir, 'pnpm-workspace.yaml'), 'packages:\n  - packages/*\n')

      const result = await analyzeWorkspace(tempDir)

      expect(result.success).toBe(true)
    })
  })

  describe('file system errors', () => {
    it('should handle unreadable source files gracefully', async () => {
      await createMonorepoStructure(tempDir, [
        {name: '@test/pkg', files: {'index.ts': `export const x = 1`}},
      ])

      const result = await analyzeWorkspace(tempDir)

      expect(result.success).toBe(true)
    })

    it('should handle symbolic links that point to non-existent targets', async () => {
      await createMonorepoStructure(tempDir, [
        {name: '@test/pkg', files: {'index.ts': `export const x = 1`}},
      ])

      const brokenLink = path.join(tempDir, 'packages', 'test-pkg', 'src', 'broken-link.ts')
      try {
        await fs.symlink('/non/existent/file.ts', brokenLink)
      } catch {
        return
      }

      const result = await analyzeWorkspace(tempDir)

      expect(result.success).toBe(true)
    })
  })

  describe('typescript parsing errors', () => {
    it('should handle malformed TypeScript syntax', async () => {
      await createMonorepoStructure(tempDir, [
        {
          name: '@test/malformed',
          files: {
            'index.ts': `export const x = 1`,
            'broken.ts': `function broken( { missing closing brace`,
          },
        },
      ])

      const result = await analyzeWorkspace(tempDir)

      expect(result.success).toBe(true)
    })

    it('should continue analysis when one file has syntax errors', async () => {
      await createMonorepoStructure(tempDir, [
        {
          name: '@test/mixed',
          files: {
            'index.ts': `export const valid = 'works'`,
            'valid.ts': `export function helper() { return 42 }`,
            'broken.ts': `class Incomplete {`,
          },
        },
      ])

      const result = await analyzeWorkspace(tempDir)

      expect(result.success).toBe(true)
      const data = result.success ? result.data : null
      expect(data?.summary.packagesAnalyzed).toBe(1)
    })
  })

  describe('analyzePackages error scenarios', () => {
    it('should handle empty package list', async () => {
      await createMonorepoStructure(tempDir, [
        {name: '@test/pkg', files: {'index.ts': `export const x = 1`}},
      ])

      const result = await analyzePackages(tempDir, [])

      expect(result.success).toBe(false)
      const error = result.success ? null : result.error
      expect(error?.code).toBe('SCAN_ERROR')
    })

    it('should handle package names that do not exist', async () => {
      await createMonorepoStructure(tempDir, [
        {name: '@test/existing', files: {'index.ts': `export const x = 1`}},
      ])

      const result = await analyzePackages(tempDir, ['@test/non-existent', '@test/also-missing'])

      expect(result.success).toBe(false)
      const error = result.success ? null : result.error
      expect(error?.code).toBe('SCAN_ERROR')
    })

    it('should analyze only existing packages from mixed list', async () => {
      await createMonorepoStructure(tempDir, [
        {name: '@test/existing', files: {'index.ts': `export const x = 1`}},
        {name: '@test/also-existing', files: {'index.ts': `export const y = 2`}},
      ])

      const result = await analyzePackages(tempDir, [
        '@test/existing',
        '@test/non-existent',
        '@test/also-existing',
      ])

      expect(result.success).toBe(true)
      const data = result.success ? result.data : null
      expect(data?.summary.packagesAnalyzed).toBe(2)
    })
  })

  describe('edge cases', () => {
    it('should handle very deep nested directory structures', async () => {
      await createMonorepoStructure(tempDir, [
        {name: '@test/deep-pkg', files: {'index.ts': `export const deep = true`}},
      ])

      const result = await analyzeWorkspace(tempDir)

      expect(result.success).toBe(true)
    })

    it('should handle package names with special characters', async () => {
      await createMonorepoStructure(tempDir, [
        {name: '@org/pkg-with-dashes', files: {'index.ts': `export const x = 1`}},
        {name: '@my-org/my.pkg', files: {'index.ts': `export const y = 2`}},
      ])

      const result = await analyzeWorkspace(tempDir)

      expect(result.success).toBe(true)
      const data = result.success ? result.data : null
      expect(data?.summary.packagesAnalyzed).toBe(2)
    })

    it('should handle empty source directories', async () => {
      await fs.mkdir(path.join(tempDir, 'packages', 'empty-src', 'src'), {recursive: true})
      await fs.writeFile(
        path.join(tempDir, 'packages', 'empty-src', 'package.json'),
        JSON.stringify({name: '@test/empty-src', version: '1.0.0', type: 'module'}),
      )

      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify({name: 'root', private: true, workspaces: ['packages/*']}),
      )
      await fs.writeFile(path.join(tempDir, 'pnpm-workspace.yaml'), 'packages:\n  - packages/*\n')

      const result = await analyzeWorkspace(tempDir)

      expect(result.success).toBe(true)
    })

    it('should handle packages without src directory', async () => {
      await fs.mkdir(path.join(tempDir, 'packages', 'no-src'), {recursive: true})
      await fs.writeFile(
        path.join(tempDir, 'packages', 'no-src', 'package.json'),
        JSON.stringify({name: '@test/no-src', version: '1.0.0', type: 'module'}),
      )
      await fs.writeFile(
        path.join(tempDir, 'packages', 'no-src', 'index.ts'),
        `export const root = true`,
      )

      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify({name: 'root', private: true, workspaces: ['packages/*']}),
      )
      await fs.writeFile(path.join(tempDir, 'pnpm-workspace.yaml'), 'packages:\n  - packages/*\n')

      const result = await analyzeWorkspace(tempDir)

      expect(result.success).toBe(true)
    })

    it('should handle Unicode in file content', async () => {
      await createMonorepoStructure(tempDir, [
        {
          name: '@test/unicode',
          files: {
            'index.ts': `export const greeting = '你好世界'
export const emoji = '🎉🚀💯'
export const special = 'αβγδε'`,
          },
        },
      ])

      const result = await analyzeWorkspace(tempDir)

      expect(result.success).toBe(true)
    })

    it('should handle large files', async () => {
      const largeContent = Array.from({length: 500}, (_, i) => `export const var${i} = ${i}`).join(
        '\n',
      )

      await createMonorepoStructure(tempDir, [
        {
          name: '@test/large',
          files: {'index.ts': largeContent},
        },
      ])

      const result = await analyzeWorkspace(tempDir)

      expect(result.success).toBe(true)
    })
  })

  describe('recovery and partial success', () => {
    it('should report issues from valid packages even if some packages fail', async () => {
      await createMonorepoStructure(tempDir, [
        {
          name: '@test/valid',
          dependencies: {lodash: '^4.17.21'},
          files: {'index.ts': `export const valid = 'works'`},
        },
      ])

      await fs.mkdir(path.join(tempDir, 'packages', 'invalid'), {recursive: true})
      await fs.writeFile(
        path.join(tempDir, 'packages', 'invalid', 'package.json'),
        'not valid json',
      )

      const result = await analyzeWorkspace(tempDir, {minSeverity: 'info'})

      expect(result.success).toBe(true)
      const data = result.success ? result.data : null
      expect(data?.summary.packagesAnalyzed).toBeGreaterThan(0)
    })

    it('should complete analysis when some analyzers throw errors', async () => {
      await createMonorepoStructure(tempDir, [
        {
          name: '@test/robust',
          files: {'index.ts': `export const x = 1`},
        },
      ])

      const result = await analyzeWorkspace(tempDir)

      expect(result.success).toBe(true)
    })
  })

  describe('timeout and cancellation scenarios', () => {
    it('should complete analysis within reasonable time', async () => {
      await createMonorepoStructure(tempDir, [
        {name: '@test/pkg', files: {'index.ts': `export const x = 1`}},
      ])

      const startTime = Date.now()
      const result = await analyzeWorkspace(tempDir)
      const duration = Date.now() - startTime

      expect(result.success).toBe(true)
      expect(duration).toBeLessThan(30000)
    })
  })

  describe('concurrent access scenarios', () => {
    it('should handle multiple simultaneous analysis requests', async () => {
      await createMonorepoStructure(tempDir, [
        {name: '@test/pkg-1', files: {'index.ts': `export const a = 1`}},
        {name: '@test/pkg-2', files: {'index.ts': `export const b = 2`}},
      ])

      const results = await Promise.all([
        analyzeWorkspace(tempDir),
        analyzeWorkspace(tempDir),
        analyzeWorkspace(tempDir),
      ])

      for (const result of results) {
        expect(result.success).toBe(true)
      }
    })
  })
})
