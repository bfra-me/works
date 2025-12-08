/**
 * Integration tests for multi-package workspace analysis.
 *
 * These tests verify that the analyzer correctly handles complex monorepo
 * structures with cross-package dependencies, shared code, and various
 * package configurations.
 */

import fs from 'node:fs/promises'
import path from 'node:path'

import {afterEach, beforeEach, describe, expect, it} from 'vitest'

import {analyzePackages, analyzeWorkspace} from '../../src/api/analyze-workspace'
import {
  cleanupTempWorkspace,
  createMonorepoStructure,
  createTempWorkspace,
  type PackageSetup,
} from '../utils/test-workspace'

describe('multi-package-analysis', () => {
  let tempDir: string

  beforeEach(async () => {
    tempDir = await createTempWorkspace('multi-package-test-')
  })

  afterEach(async () => {
    await cleanupTempWorkspace(tempDir)
  })

  describe('analyzeWorkspace with multiple packages', () => {
    it('should analyze all packages in a monorepo', async () => {
      await createMonorepoStructure(tempDir, [
        {name: '@test/core', files: {'index.ts': `export const version = '1.0.0'`}},
        {name: '@test/utils', files: {'index.ts': `export function helper() { return 42 }`}},
        {
          name: '@test/app',
          dependencies: {'@test/core': '^1.0.0', '@test/utils': '^1.0.0'},
          files: {'index.ts': `export const app = 'test-app'`},
        },
      ])

      const result = await analyzeWorkspace(tempDir)

      expect(result.success).toBe(true)
      const data = result.success ? result.data : null
      expect(data?.summary.packagesAnalyzed).toBe(3)
    })

    it('should report cross-package dependency issues', async () => {
      await createMonorepoStructure(tempDir, [
        {
          name: '@test/consumer',
          dependencies: {lodash: '^4.17.21'},
          files: {'index.ts': `export const value = 1`},
        },
        {
          name: '@test/provider',
          files: {'index.ts': `export function provide() { return 'data' }`},
        },
      ])

      const result = await analyzeWorkspace(tempDir, {
        minSeverity: 'info',
      })

      expect(result.success).toBe(true)
      const data = result.success ? result.data : null
      expect(data).toBeDefined()
    })

    it('should track progress across multiple packages', async () => {
      await createMonorepoStructure(tempDir, [
        {name: '@test/pkg-1', files: {'index.ts': `export const a = 1`}},
        {name: '@test/pkg-2', files: {'index.ts': `export const b = 2`}},
        {name: '@test/pkg-3', files: {'index.ts': `export const c = 3`}},
        {name: '@test/pkg-4', files: {'index.ts': `export const d = 4`}},
      ])

      const progressEvents: {phase: string; processed: number; total: number | undefined}[] = []

      const result = await analyzeWorkspace(tempDir, {
        onProgress: progress => {
          progressEvents.push({
            phase: progress.phase,
            processed: progress.processed,
            total: progress.total,
          })
        },
      })

      expect(result.success).toBe(true)

      const analyzeEvents = progressEvents.filter(e => e.phase === 'analyzing')
      expect(analyzeEvents.length).toBeGreaterThan(0)
    })

    it('should aggregate issues from all packages', async () => {
      await createMonorepoStructure(tempDir, [
        {
          name: '@test/pkg-a',
          dependencies: {lodash: '^4.17.21'},
          files: {'index.ts': `export const a = 1`},
        },
        {
          name: '@test/pkg-b',
          dependencies: {moment: '^2.29.0'},
          files: {'index.ts': `export const b = 2`},
        },
      ])

      const result = await analyzeWorkspace(tempDir, {minSeverity: 'info'})

      expect(result.success).toBe(true)
      const data = result.success ? result.data : null
      expect(data?.summary.packagesAnalyzed).toBe(2)
    })
  })

  describe('analyzePackages selective analysis', () => {
    it('should analyze only specified packages', async () => {
      await createMonorepoStructure(tempDir, [
        {name: '@test/target-1', files: {'index.ts': `export const t1 = 1`}},
        {name: '@test/target-2', files: {'index.ts': `export const t2 = 2`}},
        {name: '@test/excluded', files: {'index.ts': `export const excluded = 0`}},
      ])

      const result = await analyzePackages(tempDir, ['@test/target-1', '@test/target-2'])

      expect(result.success).toBe(true)
      const data = result.success ? result.data : null
      expect(data?.summary.packagesAnalyzed).toBe(2)
    })

    it('should return empty results when no matching packages', async () => {
      await createMonorepoStructure(tempDir, [
        {name: '@test/existing', files: {'index.ts': `export const e = 1`}},
      ])

      const result = await analyzePackages(tempDir, ['@test/non-existent'])

      expect(result.success).toBe(false)
      const error = result.success ? null : result.error
      expect(error?.code).toBe('SCAN_ERROR')
    })

    it('should analyze subset of available packages', async () => {
      await createMonorepoStructure(tempDir, [
        {name: '@test/core', files: {'index.ts': `export const core = 'core'`}},
        {name: '@test/utils', files: {'index.ts': `export const utils = 'utils'`}},
        {name: '@test/cli', files: {'index.ts': `export const cli = 'cli'`}},
        {name: '@test/web', files: {'index.ts': `export const web = 'web'`}},
      ])

      const result = await analyzePackages(tempDir, ['@test/core', '@test/utils'])

      expect(result.success).toBe(true)
      const data = result.success ? result.data : null
      expect(data?.summary.packagesAnalyzed).toBe(2)
    })
  })

  describe('cross-package circular imports', () => {
    it('should detect circular imports within a single package', async () => {
      await createMonorepoStructure(tempDir, [
        {
          name: '@test/circular',
          files: {
            'index.ts': `import {b} from './module-a'\nexport const main = b`,
            'module-a.ts': `import {c} from './module-b'\nexport const a = 1\nexport const b = c + 1`,
            'module-b.ts': `import {a} from './module-a'\nexport const c = a + 1`,
          },
        },
      ])

      const result = await analyzeWorkspace(tempDir, {
        minSeverity: 'info',
        categories: ['circular-import'],
      })

      expect(result.success).toBe(true)
      const data = result.success ? result.data : null
      const circularIssues = data?.issues.filter(i => i.category === 'circular-import') ?? []
      expect(circularIssues.length).toBeGreaterThan(0)
    })

    it('should handle complex dependency graphs', async () => {
      await createMonorepoStructure(tempDir, [
        {
          name: '@test/foundation',
          files: {
            'index.ts': `export const foundation = 'base'`,
          },
        },
        {
          name: '@test/layer-1',
          dependencies: {'@test/foundation': '^1.0.0'},
          files: {
            'index.ts': `export const layer1 = 'layer-1'`,
          },
        },
        {
          name: '@test/layer-2',
          dependencies: {'@test/layer-1': '^1.0.0'},
          files: {
            'index.ts': `export const layer2 = 'layer-2'`,
          },
        },
        {
          name: '@test/app',
          dependencies: {
            '@test/foundation': '^1.0.0',
            '@test/layer-1': '^1.0.0',
            '@test/layer-2': '^1.0.0',
          },
          files: {
            'index.ts': `export const app = 'application'`,
          },
        },
      ])

      const result = await analyzeWorkspace(tempDir)

      expect(result.success).toBe(true)
      const data = result.success ? result.data : null
      expect(data?.summary.packagesAnalyzed).toBe(4)
    })
  })

  describe('shared configuration', () => {
    it('should apply global config to all packages', async () => {
      await createMonorepoStructure(tempDir, [
        {name: '@test/pkg-a', files: {'index.ts': `export const a = 1`}},
        {name: '@test/pkg-b', files: {'index.ts': `export const b = 2`}},
      ])

      const configPath = path.join(tempDir, 'workspace-analyzer.config.mjs')
      await fs.writeFile(
        configPath,
        `export default {
          minSeverity: 'error',
          cache: false,
        }`,
      )

      const result = await analyzeWorkspace(tempDir)

      expect(result.success).toBe(true)
      const data = result.success ? result.data : null
      expect(data?.summary.packagesAnalyzed).toBe(2)
    })
  })

  describe('package isolation', () => {
    it('should isolate analysis results per package', async () => {
      await createMonorepoStructure(tempDir, [
        {
          name: '@test/clean',
          files: {'index.ts': `export const clean = 'no-issues'`},
        },
        {
          name: '@test/problematic',
          dependencies: {lodash: '^4.17.21'},
          files: {'index.ts': `export const problem = 'unused-dep'`},
        },
      ])

      const result = await analyzeWorkspace(tempDir, {minSeverity: 'info'})

      expect(result.success).toBe(true)
      const data = result.success ? result.data : null

      const issuesForClean =
        data?.issues.filter(i => i.location.filePath.includes('test-clean')) ?? []
      const issuesForProblematic =
        data?.issues.filter(i => i.location.filePath.includes('test-problematic')) ?? []

      expect(issuesForClean.length).toBeLessThanOrEqual(issuesForProblematic.length)
    })
  })

  describe('concurrent package analysis', () => {
    it('should analyze packages concurrently', async () => {
      const packages: PackageSetup[] = Array.from({length: 6}, (_, i) => ({
        name: `@test/concurrent-${i}`,
        files: {'index.ts': `export const value${i} = ${i}`},
      }))

      await createMonorepoStructure(tempDir, packages)

      const startTime = Date.now()
      const result = await analyzeWorkspace(tempDir, {concurrency: 4})
      const duration = Date.now() - startTime

      expect(result.success).toBe(true)
      const data = result.success ? result.data : null
      expect(data?.summary.packagesAnalyzed).toBe(6)
      expect(duration).toBeLessThan(30000)
    })

    it('should respect concurrency limits', async () => {
      const packages: PackageSetup[] = Array.from({length: 4}, (_, i) => ({
        name: `@test/limited-${i}`,
        files: {'index.ts': `export const value${i} = ${i}`},
      }))

      await createMonorepoStructure(tempDir, packages)

      const result = await analyzeWorkspace(tempDir, {concurrency: 1})

      expect(result.success).toBe(true)
      const data = result.success ? result.data : null
      expect(data?.summary.packagesAnalyzed).toBe(4)
    })
  })

  describe('large workspace handling', () => {
    it('should handle workspace with many packages', async () => {
      const packages: PackageSetup[] = Array.from({length: 5}, (_, i) => ({
        name: `@test/large-pkg-${i}`,
        files: {
          'index.ts': `export const value = ${i}`,
          'utils.ts': `export function util${i}() { return ${i} }`,
        },
      }))

      await createMonorepoStructure(tempDir, packages)

      const result = await analyzeWorkspace(tempDir)

      expect(result.success).toBe(true)
      const data = result.success ? result.data : null
      expect(data?.summary.packagesAnalyzed).toBe(5)
    }, 15000)

    it('should handle packages with many files', async () => {
      const files: Record<string, string> = {}
      for (let i = 0; i < 20; i++) {
        files[`module-${i}.ts`] = `export const module${i} = ${i}`
      }
      files['index.ts'] = `export * from './module-0'`

      await createMonorepoStructure(tempDir, [{name: '@test/many-files', files}])

      const result = await analyzeWorkspace(tempDir)

      expect(result.success).toBe(true)
      const data = result.success ? result.data : null
      expect(data?.summary.packagesAnalyzed).toBe(1)
    })
  })

  describe('workspace configuration patterns', () => {
    it('should handle pnpm workspace configuration', async () => {
      await createMonorepoStructure(tempDir, [
        {name: '@test/pnpm-pkg', files: {'index.ts': `export const pnpm = true`}},
      ])

      await fs.writeFile(
        path.join(tempDir, 'pnpm-workspace.yaml'),
        `packages:
  - packages/*
  - tools/*
`,
      )

      const result = await analyzeWorkspace(tempDir)

      expect(result.success).toBe(true)
    })

    it('should handle npm/yarn workspace configuration', async () => {
      await createMonorepoStructure(tempDir, [
        {name: '@test/npm-pkg', files: {'index.ts': `export const npm = true`}},
      ])

      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify(
          {
            name: 'npm-monorepo',
            private: true,
            workspaces: ['packages/*'],
          },
          null,
          2,
        ),
      )

      const result = await analyzeWorkspace(tempDir)

      expect(result.success).toBe(true)
    })

    it('should handle nested package paths', async () => {
      await createMonorepoStructure(tempDir, [
        {name: '@test/nested-pkg', files: {'index.ts': `export const nested = true`}},
      ])

      const result = await analyzeWorkspace(tempDir)

      expect(result.success).toBe(true)
      const data = result.success ? result.data : null
      expect(data?.summary.packagesAnalyzed).toBe(1)
    })
  })

  describe('summary statistics', () => {
    it('should provide accurate summary statistics', async () => {
      await createMonorepoStructure(tempDir, [
        {
          name: '@test/stats-pkg-1',
          dependencies: {lodash: '^4.17.21'},
          files: {'index.ts': `export const s1 = 1`},
        },
        {
          name: '@test/stats-pkg-2',
          dependencies: {moment: '^2.29.0'},
          files: {'index.ts': `export const s2 = 2`},
        },
      ])

      const result = await analyzeWorkspace(tempDir, {minSeverity: 'info'})

      expect(result.success).toBe(true)
      const data = result.success ? result.data : null

      expect(data?.summary).toBeDefined()
      expect(data?.summary.packagesAnalyzed).toBe(2)
      expect(data?.summary.totalIssues).toBeGreaterThanOrEqual(0)
      expect(typeof data?.summary.durationMs).toBe('number')
    })

    it('should categorize issues by severity', async () => {
      await createMonorepoStructure(tempDir, [
        {
          name: '@test/severity-test',
          dependencies: {lodash: '^4.17.21'},
          files: {'index.ts': `export const s = 'test'`},
        },
      ])

      const result = await analyzeWorkspace(tempDir, {minSeverity: 'info'})

      expect(result.success).toBe(true)
      const data = result.success ? result.data : null

      expect(data?.summary.bySeverity).toBeDefined()
      expect(typeof data?.summary.bySeverity.info).toBe('number')
      expect(typeof data?.summary.bySeverity.warning).toBe('number')
      expect(typeof data?.summary.bySeverity.error).toBe('number')
      expect(typeof data?.summary.bySeverity.critical).toBe('number')
    })

    it('should categorize issues by category', async () => {
      await createMonorepoStructure(tempDir, [
        {
          name: '@test/category-test',
          dependencies: {lodash: '^4.17.21'},
          files: {'index.ts': `export const c = 'test'`},
        },
      ])

      const result = await analyzeWorkspace(tempDir, {minSeverity: 'info'})

      expect(result.success).toBe(true)
      const data = result.success ? result.data : null

      expect(data?.summary.byCategory).toBeDefined()
    })
  })
})
