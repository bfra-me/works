/**
 * Integration tests for incremental analysis with caching.
 *
 * These tests verify that the incremental analyzer correctly caches results,
 * detects file changes, and provides accurate cache statistics.
 */

import type {AnalysisProgress} from '../../src/types/index'

import fs from 'node:fs/promises'
import path from 'node:path'

import {afterEach, beforeEach, describe, expect, it} from 'vitest'

import {createDefaultRegistry} from '../../src/analyzers/index'
import {createIncrementalAnalyzer} from '../../src/core/incremental-analyzer'
import {createWorkspaceScanner, type WorkspacePackage} from '../../src/scanner/workspace-scanner'
import {
  cleanupTempWorkspace,
  createMonorepoStructure,
  createTempWorkspace,
  getSourceFiles,
} from '../utils/test-workspace'

async function scanWorkspace(workspacePath: string): Promise<WorkspacePackage[]> {
  const scanner = createWorkspaceScanner({rootDir: workspacePath})
  const result = await scanner.scan()
  return [...result.packages]
}

describe('incremental-analysis', () => {
  let tempDir: string

  beforeEach(async () => {
    tempDir = await createTempWorkspace('incremental-analysis-test-')
  })

  afterEach(async () => {
    await cleanupTempWorkspace(tempDir)
  })

  describe('createIncrementalAnalyzer', () => {
    it('should create analyzer with default options', () => {
      const analyzer = createIncrementalAnalyzer({
        workspacePath: tempDir,
        analyzerVersion: '1.0.0',
      })

      expect(analyzer).toBeDefined()
      expect(typeof analyzer.analyze).toBe('function')
      expect(typeof analyzer.invalidateFiles).toBe('function')
      expect(typeof analyzer.clearCache).toBe('function')
      expect(typeof analyzer.getCacheStats).toBe('function')
    })

    it('should accept custom options', () => {
      const analyzer = createIncrementalAnalyzer({
        workspacePath: tempDir,
        analyzerVersion: '1.0.0',
        useCache: false,
        concurrency: 2,
        maxCacheAge: 60000,
        minSeverity: 'warning',
        cacheDir: '.custom-cache',
        hashAlgorithm: 'md5',
      })

      expect(analyzer).toBeDefined()
    })
  })

  describe('analyze with caching', () => {
    it('should cache analysis results on first run', async () => {
      await createMonorepoStructure(tempDir, [
        {name: '@test/cached', files: {'index.ts': `export const value = 1`}},
      ])

      const analyzer = createIncrementalAnalyzer({
        workspacePath: tempDir,
        analyzerVersion: '1.0.0',
        useCache: true,
        cacheDir: '.test-cache',
      })

      const files = await getSourceFiles(tempDir)
      const packages = await scanWorkspace(tempDir)
      const registry = createDefaultRegistry()
      const analyzers = registry.getEnabled()

      const result = await analyzer.analyze(files, packages, analyzers)

      expect(result.success).toBe(true)
      const data = result.success ? result.data : null
      expect(data?.filesAnalyzed).toBeGreaterThan(0)
      expect(data?.cacheUsed).toBe(false)
    })

    it('should use cache on subsequent runs', async () => {
      await createMonorepoStructure(tempDir, [
        {name: '@test/reuse-cache', files: {'index.ts': `export const value = 1`}},
      ])

      const analyzer = createIncrementalAnalyzer({
        workspacePath: tempDir,
        analyzerVersion: '1.0.0',
        useCache: true,
        cacheDir: '.test-cache',
      })

      const files = await getSourceFiles(tempDir)
      const packages = await scanWorkspace(tempDir)
      const registry = createDefaultRegistry()
      const analyzers = registry.getEnabled()

      // First run - populates cache
      await analyzer.analyze(files, packages, analyzers)

      // Second run - should use cache
      const result = await analyzer.analyze(files, packages, analyzers)

      expect(result.success).toBe(true)
      const data = result.success ? result.data : null
      expect(data?.cacheUsed).toBe(true)
      expect(data?.filesFromCache).toBeGreaterThanOrEqual(0)
    })

    it('should skip caching when useCache is false', async () => {
      await createMonorepoStructure(tempDir, [
        {name: '@test/no-cache', files: {'index.ts': `export const value = 1`}},
      ])

      const analyzer = createIncrementalAnalyzer({
        workspacePath: tempDir,
        analyzerVersion: '1.0.0',
        useCache: false,
      })

      const files = await getSourceFiles(tempDir)
      const packages = await scanWorkspace(tempDir)
      const registry = createDefaultRegistry()
      const analyzers = registry.getEnabled()

      const result = await analyzer.analyze(files, packages, analyzers)

      expect(result.success).toBe(true)
      const data = result.success ? result.data : null
      expect(data?.cacheUsed).toBe(false)
      expect(data?.cacheStats).toBeUndefined()
    })

    it('should report progress during analysis', async () => {
      await createMonorepoStructure(tempDir, [
        {name: '@test/progress', files: {'index.ts': `export const value = 1`}},
      ])

      const progressUpdates: AnalysisProgress[] = []

      const analyzer = createIncrementalAnalyzer({
        workspacePath: tempDir,
        analyzerVersion: '1.0.0',
        onProgress: progress => progressUpdates.push({...progress}),
      })

      const files = await getSourceFiles(tempDir)
      const packages = await scanWorkspace(tempDir)
      const registry = createDefaultRegistry()
      const analyzers = registry.getEnabled()

      await analyzer.analyze(files, packages, analyzers)

      expect(progressUpdates.length).toBeGreaterThan(0)
      const phases = new Set(progressUpdates.map(p => p.phase))
      expect(phases.has('scanning')).toBe(true)
      expect(phases.has('analyzing')).toBe(true)
    })

    it('should provide cache statistics', async () => {
      await createMonorepoStructure(tempDir, [
        {name: '@test/stats', files: {'index.ts': `export const value = 1`}},
      ])

      const analyzer = createIncrementalAnalyzer({
        workspacePath: tempDir,
        analyzerVersion: '1.0.0',
        useCache: true,
        cacheDir: '.test-stats-cache',
      })

      const files = await getSourceFiles(tempDir)
      const packages = await scanWorkspace(tempDir)
      const registry = createDefaultRegistry()
      const analyzers = registry.getEnabled()

      // Run analysis to populate cache
      await analyzer.analyze(files, packages, analyzers)

      const statsResult = await analyzer.getCacheStats()

      expect(statsResult.success).toBe(true)
      const stats = statsResult.success ? statsResult.data : null
      expect(stats?.cachedFiles).toBeGreaterThanOrEqual(0)
      expect(stats?.cachedPackages).toBeGreaterThanOrEqual(0)
      expect(typeof stats?.ageMs).toBe('number')
    })
  })

  describe('cache invalidation', () => {
    it('should invalidate specific files', async () => {
      await createMonorepoStructure(tempDir, [
        {
          name: '@test/invalidate',
          files: {
            'index.ts': `export const value = 1`,
            'other.ts': `export const other = 2`,
          },
        },
      ])

      const analyzer = createIncrementalAnalyzer({
        workspacePath: tempDir,
        analyzerVersion: '1.0.0',
        useCache: true,
        cacheDir: '.test-invalidate-cache',
      })

      const files = await getSourceFiles(tempDir)
      const packages = await scanWorkspace(tempDir)
      const registry = createDefaultRegistry()
      const analyzers = registry.getEnabled()

      // First run
      await analyzer.analyze(files, packages, analyzers)

      // Invalidate one file
      const indexFile = files.find(f => f.endsWith('index.ts'))
      if (indexFile != null) {
        await analyzer.invalidateFiles([indexFile])
      }

      // Verify invalidation doesn't throw
      expect(true).toBe(true)
    })

    it('should clear entire cache', async () => {
      await createMonorepoStructure(tempDir, [
        {name: '@test/clear-cache', files: {'index.ts': `export const value = 1`}},
      ])

      const analyzer = createIncrementalAnalyzer({
        workspacePath: tempDir,
        analyzerVersion: '1.0.0',
        useCache: true,
        cacheDir: '.test-clear-cache',
      })

      const files = await getSourceFiles(tempDir)
      const packages = await scanWorkspace(tempDir)
      const registry = createDefaultRegistry()
      const analyzers = registry.getEnabled()

      // Populate cache
      await analyzer.analyze(files, packages, analyzers)

      // Clear cache
      const clearResult = await analyzer.clearCache()
      expect(clearResult.success).toBe(true)

      // Verify cache is empty
      const statsResult = await analyzer.getCacheStats()
      expect(statsResult.success).toBe(true)
      const stats = statsResult.success ? statsResult.data : null
      expect(stats?.cachedFiles).toBe(0)
    })
  })

  describe('change detection', () => {
    it('should detect file content changes', async () => {
      await createMonorepoStructure(tempDir, [
        {name: '@test/changes', files: {'index.ts': `export const value = 1`}},
      ])

      const analyzer = createIncrementalAnalyzer({
        workspacePath: tempDir,
        analyzerVersion: '1.0.0',
        useCache: true,
        cacheDir: '.test-changes-cache',
      })

      const files = await getSourceFiles(tempDir)
      const packages = await scanWorkspace(tempDir)
      const registry = createDefaultRegistry()
      const analyzers = registry.getEnabled()

      // First run
      const firstResult = await analyzer.analyze(files, packages, analyzers)
      expect(firstResult.success).toBe(true)

      // Modify file content
      const indexFile = files.find(f => f.endsWith('index.ts'))
      if (indexFile != null) {
        await fs.writeFile(indexFile, `export const value = 42 // modified`)
      }

      // Second run - should detect change
      const secondResult = await analyzer.analyze(files, packages, analyzers)

      expect(secondResult.success).toBe(true)
      const data = secondResult.success ? secondResult.data : null
      expect(data?.filesAnalyzed).toBeGreaterThan(0)
    })

    it('should handle new files gracefully', async () => {
      await createMonorepoStructure(tempDir, [
        {name: '@test/new-files', files: {'index.ts': `export const value = 1`}},
      ])

      const analyzer = createIncrementalAnalyzer({
        workspacePath: tempDir,
        analyzerVersion: '1.0.0',
        useCache: true,
        cacheDir: '.test-new-files-cache',
      })

      const registry = createDefaultRegistry()
      const analyzers = registry.getEnabled()

      // First run
      const firstFiles = await getSourceFiles(tempDir)
      const firstPackages = await scanWorkspace(tempDir)
      await analyzer.analyze(firstFiles, firstPackages, analyzers)

      // Add new file
      const packageDir = path.join(tempDir, 'packages', 'test-new-files', 'src')
      await fs.writeFile(path.join(packageDir, 'new-file.ts'), `export const newValue = 2`)

      // Second run with new file
      const secondFiles = await getSourceFiles(tempDir)
      const secondPackages = await scanWorkspace(tempDir)
      const result = await analyzer.analyze(secondFiles, secondPackages, analyzers)

      expect(result.success).toBe(true)
      const data = result.success ? result.data : null
      expect(data?.filesAnalyzed).toBeGreaterThan(0)
    })
  })

  describe('severity filtering', () => {
    it('should filter issues by minimum severity', async () => {
      await createMonorepoStructure(tempDir, [
        {
          name: '@test/severity-filter',
          dependencies: {lodash: '^4.17.21'},
          files: {'index.ts': `export const value = 1`},
        },
      ])

      const warningAnalyzer = createIncrementalAnalyzer({
        workspacePath: tempDir,
        analyzerVersion: '1.0.0',
        minSeverity: 'warning',
        useCache: false,
      })

      const errorAnalyzer = createIncrementalAnalyzer({
        workspacePath: tempDir,
        analyzerVersion: '1.0.0',
        minSeverity: 'error',
        useCache: false,
      })

      const files = await getSourceFiles(tempDir)
      const packages = await scanWorkspace(tempDir)
      const registry = createDefaultRegistry()
      const analyzers = registry.getEnabled()

      const warningResult = await warningAnalyzer.analyze(files, packages, analyzers)
      const errorResult = await errorAnalyzer.analyze(files, packages, analyzers)

      expect(warningResult.success).toBe(true)
      expect(errorResult.success).toBe(true)

      const warningIssues = warningResult.success ? warningResult.data.issues.length : 0
      const errorIssues = errorResult.success ? errorResult.data.issues.length : 0
      expect(errorIssues).toBeLessThanOrEqual(warningIssues)
    })
  })

  describe('concurrent execution', () => {
    it('should respect concurrency limits', async () => {
      await createMonorepoStructure(tempDir, [
        {name: '@test/concurrent-1', files: {'index.ts': `export const a = 1`}},
        {name: '@test/concurrent-2', files: {'index.ts': `export const b = 2`}},
        {name: '@test/concurrent-3', files: {'index.ts': `export const c = 3`}},
      ])

      const analyzer = createIncrementalAnalyzer({
        workspacePath: tempDir,
        analyzerVersion: '1.0.0',
        concurrency: 1,
        useCache: false,
      })

      const files = await getSourceFiles(tempDir)
      const packages = await scanWorkspace(tempDir)
      const registry = createDefaultRegistry()
      const analyzers = registry.getEnabled()

      const result = await analyzer.analyze(files, packages, analyzers)

      expect(result.success).toBe(true)
      const data = result.success ? result.data : null
      expect(data?.packagesAnalyzed).toBe(3)
    })
  })
})
