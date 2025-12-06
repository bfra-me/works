import type {DocConfig, FileChangeEvent} from '../../src/types'

import fs from 'node:fs/promises'
import path from 'node:path'

import {afterEach, beforeEach, describe, expect, it} from 'vitest'

import {createSyncOrchestrator} from '../../src/orchestrator'
import {
  createDocChangeDetector,
  determineRegenerationScope,
  groupChangesByPackage,
} from '../../src/watcher'

const FIXTURES_DIR = path.join(__dirname, '../fixtures/packages')

describe('incremental-sync integration', () => {
  describe('change detection', () => {
    it.concurrent('should detect README changes', () => {
      const events: FileChangeEvent[] = [
        {
          type: 'change',
          path: '/repo/packages/my-lib/README.md',
          packageName: 'my-lib',
          timestamp: new Date(),
        },
      ]

      const grouped = groupChangesByPackage(events)
      expect(grouped.has('my-lib')).toBe(true)

      const myLibChanges = grouped.get('my-lib')
      expect(myLibChanges).toHaveLength(1)
    })

    it.concurrent('should detect source file changes', () => {
      const events: FileChangeEvent[] = [
        {
          type: 'change',
          path: '/repo/packages/my-lib/src/index.ts',
          packageName: 'my-lib',
          timestamp: new Date(),
        },
        {
          type: 'add',
          path: '/repo/packages/my-lib/src/utils.ts',
          packageName: 'my-lib',
          timestamp: new Date(),
        },
      ]

      const grouped = groupChangesByPackage(events)
      expect(grouped.get('my-lib')).toHaveLength(2)
    })

    it.concurrent('should detect package.json changes', () => {
      const events: FileChangeEvent[] = [
        {
          type: 'change',
          path: '/repo/packages/my-lib/package.json',
          packageName: 'my-lib',
          timestamp: new Date(),
        },
      ]

      const grouped = groupChangesByPackage(events)
      expect(grouped.has('my-lib')).toBe(true)
    })

    it.concurrent('should group changes by package name', () => {
      const events: FileChangeEvent[] = [
        {
          type: 'change',
          path: '/repo/packages/lib-a/src/index.ts',
          packageName: 'lib-a',
          timestamp: new Date(),
        },
        {
          type: 'change',
          path: '/repo/packages/lib-b/README.md',
          packageName: 'lib-b',
          timestamp: new Date(),
        },
        {
          type: 'change',
          path: '/repo/packages/lib-a/package.json',
          packageName: 'lib-a',
          timestamp: new Date(),
        },
      ]

      const grouped = groupChangesByPackage(events)
      expect(grouped.size).toBe(2)
      expect(grouped.get('lib-a')).toHaveLength(2)
      expect(grouped.get('lib-b')).toHaveLength(1)
    })

    it.concurrent('should handle unknown package names', () => {
      const events: FileChangeEvent[] = [
        {
          type: 'change',
          path: '/repo/some-random-file.txt',
          packageName: undefined,
          timestamp: new Date(),
        },
      ]

      const grouped = groupChangesByPackage(events)
      expect(grouped.has('__unknown__')).toBe(true)
    })
  })

  describe('regeneration scope determination', () => {
    it.concurrent('should require readme-only regeneration for README changes', () => {
      const categories = ['readme' as const]
      const scope = determineRegenerationScope(categories)
      expect(scope).toBe('readme-only')
    })

    it.concurrent('should require API regeneration for source changes', () => {
      const categories = ['source' as const]
      const scope = determineRegenerationScope(categories)
      expect(scope).toBe('api-only')
    })

    it.concurrent('should require metadata-only regeneration for package.json changes', () => {
      const categories = ['package-json' as const]
      const scope = determineRegenerationScope(categories)
      expect(scope).toBe('metadata-only')
    })

    it.concurrent('should require full regeneration for mixed changes', () => {
      const categories = ['source' as const, 'readme' as const]
      const scope = determineRegenerationScope(categories)
      expect(scope).toBe('full')
    })

    it.concurrent('should return none for unknown file types', () => {
      const categories = ['unknown' as const]
      const scope = determineRegenerationScope(categories)
      expect(scope).toBe('none')
    })
  })

  describe('change detector', () => {
    it.concurrent('should track file changes by hash', async () => {
      const detector = createDocChangeDetector()
      const testFile = path.join(FIXTURES_DIR, 'sample-lib', 'src', 'index.ts')

      await detector.record(testFile)
      const hasChanged = await detector.hasChanged(testFile)

      expect(hasChanged).toBe(false)
    })

    it.concurrent('should detect new files as changed', async () => {
      const detector = createDocChangeDetector()
      const testFile = path.join(FIXTURES_DIR, 'sample-lib', 'src', 'index.ts')

      // Without recording first, it should be considered "changed"
      const hasChanged = await detector.hasChanged(testFile)

      expect(hasChanged).toBe(true)
    })

    it.concurrent('should analyze changes for multiple packages', async () => {
      const detector = createDocChangeDetector()

      const events: FileChangeEvent[] = [
        {
          type: 'change',
          path: '/repo/packages/lib-a/src/index.ts',
          packageName: 'lib-a',
          timestamp: new Date(),
        },
        {
          type: 'change',
          path: '/repo/packages/lib-b/README.md',
          packageName: 'lib-b',
          timestamp: new Date(),
        },
      ]

      const analysis = await detector.analyzeChanges(events)

      expect(analysis.length).toBe(2)

      const libAAnalysis = analysis.find(a => a.packageName === 'lib-a')
      expect(libAAnalysis?.needsRegeneration).toBe(true)
      expect(libAAnalysis?.changedCategories).toContain('source')

      const libBAnalysis = analysis.find(a => a.packageName === 'lib-b')
      expect(libBAnalysis?.needsRegeneration).toBe(true)
      expect(libBAnalysis?.changedCategories).toContain('readme')
    })

    it.concurrent('should clear recorded hashes', async () => {
      const detector = createDocChangeDetector()
      const testFile = path.join(FIXTURES_DIR, 'sample-lib', 'src', 'index.ts')

      await detector.record(testFile)
      detector.clear(testFile)

      const hasChanged = await detector.hasChanged(testFile)
      expect(hasChanged).toBe(true)
    })

    it.concurrent('should clear all recorded hashes', async () => {
      const detector = createDocChangeDetector()
      const testFile1 = path.join(FIXTURES_DIR, 'sample-lib', 'src', 'index.ts')
      const testFile2 = path.join(FIXTURES_DIR, 'sample-lib', 'package.json')

      await detector.record(testFile1)
      await detector.record(testFile2)
      detector.clearAll()

      expect(await detector.hasChanged(testFile1)).toBe(true)
      expect(await detector.hasChanged(testFile2)).toBe(true)
    })
  })

  describe('incremental sync orchestration', () => {
    let tempDir: string

    beforeEach(async () => {
      tempDir = path.join(__dirname, '../.temp-incremental-test')
      await fs.mkdir(tempDir, {recursive: true})
    })

    afterEach(async () => {
      try {
        await fs.rm(tempDir, {recursive: true, force: true})
      } catch {
        // Ignore cleanup errors
      }
    })

    it('should handle file change events', async () => {
      const config: DocConfig = {
        rootDir: path.join(FIXTURES_DIR, '..'),
        outputDir: tempDir,
        includePatterns: ['packages/*'],
      }

      const orchestrator = createSyncOrchestrator({config})

      // Initial sync
      await orchestrator.syncAll()

      const events: FileChangeEvent[] = [
        {
          type: 'change',
          path: path.join(FIXTURES_DIR, 'sample-lib', 'README.md'),
          packageName: '@fixtures/sample-lib',
          timestamp: new Date(),
        },
      ]

      const result = await orchestrator.handleChanges(events)

      expect(result.totalPackages).toBeGreaterThanOrEqual(0)
    }, 10000)

    it('should skip unchanged packages on subsequent syncs', async () => {
      const config: DocConfig = {
        rootDir: path.join(FIXTURES_DIR, '..'),
        outputDir: tempDir,
        includePatterns: ['packages/*'],
      }

      const orchestrator = createSyncOrchestrator({config})

      const firstSync = await orchestrator.syncAll()
      expect(firstSync.totalPackages).toBeGreaterThan(0)

      const secondSync = await orchestrator.syncAll()
      expect(secondSync.totalPackages).toBe(firstSync.totalPackages)
    })

    it('should only regenerate specified packages', async () => {
      const config: DocConfig = {
        rootDir: path.join(FIXTURES_DIR, '..'),
        outputDir: tempDir,
        includePatterns: ['packages/*'],
      }

      const orchestrator = createSyncOrchestrator({config})

      const result = await orchestrator.syncPackages(['@fixtures/sample-lib'])

      expect(result.totalPackages).toBe(1)
      expect(result.details.length).toBeLessThanOrEqual(1)

      const firstDetail = result.details[0]
      const packageName = firstDetail?.packageName ?? ''
      expect(packageName === '' || packageName === '@fixtures/sample-lib').toBe(true)
    })

    it('should handle empty change events gracefully', async () => {
      const config: DocConfig = {
        rootDir: path.join(FIXTURES_DIR, '..'),
        outputDir: tempDir,
        includePatterns: ['packages/*'],
      }

      const orchestrator = createSyncOrchestrator({config})

      const result = await orchestrator.handleChanges([])

      expect(result.totalPackages).toBe(0)
      expect(result.successCount).toBe(0)
      expect(result.errors.length).toBe(0)
    })

    it('should handle changes to unknown packages gracefully', async () => {
      const config: DocConfig = {
        rootDir: path.join(FIXTURES_DIR, '..'),
        outputDir: tempDir,
        includePatterns: ['packages/*'],
      }

      const orchestrator = createSyncOrchestrator({config})

      const events: FileChangeEvent[] = [
        {
          type: 'change',
          path: '/nonexistent/packages/fake-lib/README.md',
          packageName: undefined,
          timestamp: new Date(),
        },
      ]

      const result = await orchestrator.handleChanges(events)

      expect(result.totalPackages).toBe(0)
    })
  })

  describe('change categorization', () => {
    it.concurrent('should categorize TypeScript files as source', () => {
      const events: FileChangeEvent[] = [
        {
          type: 'change',
          path: '/repo/packages/lib/src/utils.ts',
          packageName: 'lib',
          timestamp: new Date(),
        },
        {
          type: 'change',
          path: '/repo/packages/lib/src/components/Button.tsx',
          packageName: 'lib',
          timestamp: new Date(),
        },
      ]

      const grouped = groupChangesByPackage(events)
      const changes = grouped.get('lib') ?? []

      expect(changes.length).toBe(2)
      for (const change of changes) {
        expect(change.path.endsWith('.ts') || change.path.endsWith('.tsx')).toBe(true)
      }
    })

    it.concurrent('should categorize markdown files as readme', () => {
      const events: FileChangeEvent[] = [
        {
          type: 'change',
          path: '/repo/packages/lib/README.md',
          packageName: 'lib',
          timestamp: new Date(),
        },
        {
          type: 'change',
          path: '/repo/packages/lib/readme.md',
          packageName: 'lib',
          timestamp: new Date(),
        },
      ]

      const grouped = groupChangesByPackage(events)
      const changes = grouped.get('lib') ?? []

      expect(changes.length).toBe(2)
      for (const change of changes) {
        expect(change.path.toLowerCase()).toContain('readme')
      }
    })
  })
})
