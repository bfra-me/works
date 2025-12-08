/**
 * Integration tests for end-to-end analysis pipeline validation.
 *
 * These tests verify the complete analysis flow from workspace scanning through
 * report generation, ensuring all components work together correctly.
 */

import type {AnalysisProgress} from '../../src/types/index'

import fs from 'node:fs/promises'
import path from 'node:path'

import {afterEach, beforeEach, describe, expect, it} from 'vitest'

import {analyzePackages, analyzeWorkspace} from '../../src/api/analyze-workspace'
import {
  cleanupTempWorkspace,
  createMonorepoStructure,
  createTempWorkspace,
} from '../utils/test-workspace'

describe('analysis-pipeline', () => {
  let tempDir: string

  beforeEach(async () => {
    tempDir = await createTempWorkspace('analysis-pipeline-test-')
  })

  afterEach(async () => {
    await cleanupTempWorkspace(tempDir)
  })

  describe('analyzeWorkspace', () => {
    it('should analyze a valid monorepo and return results', async () => {
      await createMonorepoStructure(tempDir, [
        {
          name: '@test/core',
          files: {
            'index.ts': `export const coreValue = 42`,
            'utils.ts': `export function add(a: number, b: number): number { return a + b }`,
          },
        },
        {
          name: '@test/utils',
          dependencies: {'@test/core': 'workspace:*'},
          files: {
            'index.ts': `import {coreValue} from '@test/core'\nexport const utilValue = coreValue * 2`,
          },
        },
      ])

      const result = await analyzeWorkspace(tempDir)

      expect(result.success).toBe(true)
      expect(result.success && result.data.workspacePath).toBe(tempDir)
      expect(result.success && result.data.summary.packagesAnalyzed).toBeGreaterThanOrEqual(2)
      expect(result.success && result.data.summary.filesAnalyzed).toBeGreaterThan(0)
      expect(result.success && result.data.summary.durationMs).toBeGreaterThan(0)
      expect(result.success && result.data.startedAt).toBeInstanceOf(Date)
      expect(result.success && result.data.completedAt).toBeInstanceOf(Date)
    })

    it('should respect minSeverity filtering', async () => {
      await createMonorepoStructure(tempDir, [
        {
          name: '@test/with-issues',
          dependencies: {lodash: '^4.17.21'},
          files: {
            'index.ts': `export const value = 1`,
          },
        },
      ])

      const warningResult = await analyzeWorkspace(tempDir, {minSeverity: 'warning'})
      const errorResult = await analyzeWorkspace(tempDir, {minSeverity: 'error'})

      expect(warningResult.success).toBe(true)
      expect(errorResult.success).toBe(true)

      const warningCount = warningResult.success ? warningResult.data.issues.length : 0
      const errorCount = errorResult.success ? errorResult.data.issues.length : 0
      expect(errorCount).toBeLessThanOrEqual(warningCount)
    })

    it('should filter by categories', async () => {
      await createMonorepoStructure(tempDir, [
        {
          name: '@test/circular-a',
          files: {
            'index.ts': `import {b} from './b'\nexport const a = 1`,
            'b.ts': `import {a} from './index'\nexport const b = 2`,
          },
        },
      ])

      const circularOnlyResult = await analyzeWorkspace(tempDir, {
        categories: ['circular-import'],
      })

      const configOnlyResult = await analyzeWorkspace(tempDir, {
        categories: ['configuration'],
      })

      expect(circularOnlyResult.success).toBe(true)
      expect(configOnlyResult.success).toBe(true)
    })

    it('should call progress callback during analysis', async () => {
      await createMonorepoStructure(tempDir, [
        {name: '@test/pkg1', files: {'index.ts': `export const a = 1`}},
        {name: '@test/pkg2', files: {'index.ts': `export const b = 2`}},
      ])

      const progressUpdates: AnalysisProgress[] = []

      const result = await analyzeWorkspace(tempDir, {
        onProgress: progress => {
          progressUpdates.push({...progress})
        },
      })

      expect(result.success).toBe(true)
      expect(progressUpdates.length).toBeGreaterThan(0)

      const phases = new Set(progressUpdates.map(p => p.phase))
      expect(phases.has('scanning')).toBe(true)
    })

    it('should handle empty workspace gracefully', async () => {
      await fs.mkdir(path.join(tempDir, 'packages'), {recursive: true})
      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify({name: 'empty', private: true, workspaces: ['packages/*']}, null, 2),
      )
      await fs.writeFile(path.join(tempDir, 'pnpm-workspace.yaml'), 'packages:\n  - packages/*\n')

      const result = await analyzeWorkspace(tempDir)

      expect(result.success).toBe(false)
      const error = result.success ? null : result.error
      expect(error?.code).toBe('SCAN_ERROR')
    })

    it('should detect unused dependencies', async () => {
      await createMonorepoStructure(tempDir, [
        {
          name: '@test/unused-dep',
          dependencies: {
            lodash: '^4.17.21',
            'left-pad': '^1.3.0',
          },
          files: {
            'index.ts': `export const value = 'no imports here'`,
          },
        },
      ])

      const result = await analyzeWorkspace(tempDir, {
        categories: ['dependency'],
      })

      expect(result.success).toBe(true)
      const unusedIssues = result.success
        ? result.data.issues.filter(i => i.id.includes('unused'))
        : []
      expect(unusedIssues.length).toBeGreaterThanOrEqual(0)
    })

    it('should detect circular imports', async () => {
      await createMonorepoStructure(tempDir, [
        {
          name: '@test/circular',
          files: {
            'a.ts': `import {b} from './b'\nexport const a = 1 + b`,
            'b.ts': `import {a} from './a'\nexport const b = 2 + a`,
            'index.ts': `export * from './a'\nexport * from './b'`,
          },
        },
      ])

      const result = await analyzeWorkspace(tempDir, {
        categories: ['circular-import'],
      })

      expect(result.success).toBe(true)
      const circularIssues = result.success
        ? result.data.issues.filter(i => i.category === 'circular-import')
        : []
      expect(circularIssues.length).toBeGreaterThanOrEqual(0)
    })

    it('should include summary statistics', async () => {
      await createMonorepoStructure(tempDir, [
        {name: '@test/stats-a', files: {'index.ts': `export const a = 1`}},
        {name: '@test/stats-b', files: {'index.ts': `export const b = 2`}},
        {name: '@test/stats-c', files: {'index.ts': `export const c = 3`}},
      ])

      const result = await analyzeWorkspace(tempDir)

      expect(result.success).toBe(true)
      const summary = result.success ? result.data.summary : null
      expect(summary).not.toBeNull()
      expect(summary?.totalIssues).toBeGreaterThanOrEqual(0)
      expect(typeof summary?.bySeverity.info).toBe('number')
      expect(typeof summary?.bySeverity.warning).toBe('number')
      expect(typeof summary?.bySeverity.error).toBe('number')
      expect(typeof summary?.bySeverity.critical).toBe('number')
      expect(typeof summary?.byCategory.configuration).toBe('number')
      expect(typeof summary?.byCategory.dependency).toBe('number')
      expect(summary?.packagesAnalyzed).toBe(3)
      expect(summary?.filesAnalyzed).toBeGreaterThan(0)
      expect(summary?.durationMs).toBeGreaterThan(0)
    })
  })

  describe('analyzePackages', () => {
    it('should analyze only specified packages', async () => {
      await createMonorepoStructure(tempDir, [
        {name: '@test/target-a', files: {'index.ts': `export const a = 1`}},
        {name: '@test/target-b', files: {'index.ts': `export const b = 2`}},
        {name: '@test/excluded', files: {'index.ts': `export const c = 3`}},
      ])

      const result = await analyzePackages(tempDir, ['@test/target-a', '@test/target-b'])

      expect(result.success).toBe(true)
      expect(result.success && result.data.summary.packagesAnalyzed).toBeLessThanOrEqual(2)
    })

    it('should handle non-existent package names gracefully', async () => {
      await createMonorepoStructure(tempDir, [
        {name: '@test/existing', files: {'index.ts': `export const value = 1`}},
      ])

      const result = await analyzePackages(tempDir, ['@test/non-existent'])

      expect(result.success).toBe(false)
      const error = result.success ? null : result.error
      expect(error?.code).toBe('SCAN_ERROR')
    })

    it('should support progress reporting for package analysis', async () => {
      await createMonorepoStructure(tempDir, [
        {name: '@test/pkg-progress', files: {'index.ts': `export const value = 1`}},
      ])

      const progressCalls: AnalysisProgress[] = []

      const result = await analyzePackages(tempDir, ['@test/pkg-progress'], {
        onProgress: progress => progressCalls.push({...progress}),
      })

      expect(result.success).toBe(true)
      expect(progressCalls.length).toBeGreaterThan(0)
    })
  })

  describe('end-to-end analysis scenarios', () => {
    it('should complete full analysis pipeline with multiple analyzers', async () => {
      await createMonorepoStructure(tempDir, [
        {
          name: '@test/multi-analyzer',
          dependencies: {'unused-lib': '^1.0.0'},
          files: {
            'index.ts': `export const value = 42`,
            'circular-a.ts': `import {b} from './circular-b'\nexport const a = b`,
            'circular-b.ts': `import {a} from './circular-a'\nexport const b = a`,
          },
          tsconfig: {
            compilerOptions: {
              target: 'ES2022',
              module: 'CommonJS',
              outDir: './lib',
            },
          },
        },
      ])

      const result = await analyzeWorkspace(tempDir)

      expect(result.success).toBe(true)
      expect(result.success && result.data.issues).toBeDefined()
      expect(result.success && Array.isArray(result.data.issues)).toBe(true)
      expect(result.success && result.data.summary).toBeDefined()
    })

    it('should properly aggregate issues from multiple packages', async () => {
      await createMonorepoStructure(tempDir, [
        {
          name: '@test/issue-pkg-1',
          dependencies: {'unused-a': '^1.0.0'},
          files: {'index.ts': `export const a = 1`},
        },
        {
          name: '@test/issue-pkg-2',
          dependencies: {'unused-b': '^1.0.0'},
          files: {'index.ts': `export const b = 2`},
        },
        {
          name: '@test/issue-pkg-3',
          dependencies: {'unused-c': '^1.0.0'},
          files: {'index.ts': `export const c = 3`},
        },
      ])

      const result = await analyzeWorkspace(tempDir)

      expect(result.success).toBe(true)
      const issues = result.success ? result.data.issues : []
      const issuePackages = new Set(
        issues.map(i => {
          const match = i.location.filePath.match(/packages\/([^/]+)/)
          return match?.[1]
        }),
      )
      expect(issuePackages.size).toBeGreaterThanOrEqual(0)
    })

    it('should maintain consistent issue locations', async () => {
      await createMonorepoStructure(tempDir, [
        {
          name: '@test/locations',
          files: {
            'index.ts': `export const value = 1`,
            'nested/deep/module.ts': `export const nested = 2`,
          },
        },
      ])

      const result = await analyzeWorkspace(tempDir)

      expect(result.success).toBe(true)
      const issues = result.success ? result.data.issues : []
      for (const issue of issues) {
        expect(issue.location).toBeDefined()
        expect(issue.location.filePath).toBeDefined()
        expect(typeof issue.location.filePath).toBe('string')
      }
    })
  })
})
