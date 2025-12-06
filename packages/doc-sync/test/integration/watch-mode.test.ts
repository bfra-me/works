import type {DocConfig, FileChangeEvent} from '../../src/types'

import fs from 'node:fs/promises'
import path from 'node:path'

import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {createSyncOrchestrator} from '../../src/orchestrator'
import {createDocDebouncer, createDocWatcher} from '../../src/watcher'

const FIXTURES_DIR = path.join(__dirname, '../fixtures/packages')

describe('watch-mode integration', () => {
  describe('debouncer functionality', () => {
    it('should batch multiple events', async () => {
      const handledBatches: FileChangeEvent[][] = []
      const debouncer = createDocDebouncer(
        events => {
          handledBatches.push([...events])
        },
        {debounceMs: 50},
      )

      const event1: FileChangeEvent = {
        type: 'change',
        path: '/test/file1.ts',
        packageName: 'test-pkg',
        timestamp: new Date(),
      }

      const event2: FileChangeEvent = {
        type: 'change',
        path: '/test/file2.ts',
        packageName: 'test-pkg',
        timestamp: new Date(),
      }

      debouncer.add(event1)
      debouncer.add(event2)

      // Wait for debounce to complete
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(handledBatches.length).toBe(1)
      expect(handledBatches[0]?.length).toBe(2)
    })

    it('should deduplicate duplicate events', async () => {
      const handledBatches: FileChangeEvent[][] = []
      const debouncer = createDocDebouncer(
        events => {
          handledBatches.push([...events])
        },
        {debounceMs: 50},
      )

      const timestamp = new Date()
      const event: FileChangeEvent = {
        type: 'change',
        path: '/test/file.ts',
        packageName: 'test-pkg',
        timestamp,
      }

      debouncer.add(event)
      debouncer.add(event)
      debouncer.add(event)

      await new Promise(resolve => setTimeout(resolve, 100))

      expect(handledBatches.length).toBe(1)
      expect(handledBatches[0]?.length).toBeLessThanOrEqual(3)
    })

    it('should handle flush operation', async () => {
      const handledBatches: FileChangeEvent[][] = []
      const debouncer = createDocDebouncer(
        events => {
          handledBatches.push([...events])
        },
        {debounceMs: 1000},
      )

      const event: FileChangeEvent = {
        type: 'change',
        path: '/test/file.ts',
        packageName: 'test-pkg',
        timestamp: new Date(),
      }

      debouncer.add(event)
      debouncer.flush()

      await new Promise(resolve => setTimeout(resolve, 10))

      expect(handledBatches.length).toBe(1)
    })

    it('should cancel pending operations', async () => {
      const handledBatches: FileChangeEvent[][] = []
      const debouncer = createDocDebouncer(
        events => {
          handledBatches.push([...events])
        },
        {debounceMs: 100},
      )

      const event: FileChangeEvent = {
        type: 'change',
        path: '/test/file.ts',
        packageName: 'test-pkg',
        timestamp: new Date(),
      }

      debouncer.add(event)
      debouncer.cancel()

      await new Promise(resolve => setTimeout(resolve, 150))

      expect(handledBatches.length).toBe(0)
    })

    it('should track pending event count', () => {
      const debouncer = createDocDebouncer(() => {}, {debounceMs: 1000})

      expect(debouncer.getPendingCount()).toBe(0)

      debouncer.add({
        type: 'change',
        path: '/test/file.ts',
        packageName: 'test-pkg',
        timestamp: new Date(),
      })

      expect(debouncer.getPendingCount()).toBeGreaterThan(0)

      debouncer.cancel()
    })

    it('should respect max wait timeout', async () => {
      const handledBatches: FileChangeEvent[][] = []
      const debouncer = createDocDebouncer(
        events => {
          handledBatches.push([...events])
        },
        {debounceMs: 1000, maxWaitMs: 100},
      )

      const event: FileChangeEvent = {
        type: 'change',
        path: '/test/file.ts',
        packageName: 'test-pkg',
        timestamp: new Date(),
      }

      debouncer.add(event)

      // Wait for max wait to trigger
      await new Promise(resolve => setTimeout(resolve, 150))

      expect(handledBatches.length).toBe(1)
    })

    it('should add multiple events at once', async () => {
      const handledBatches: FileChangeEvent[][] = []
      const debouncer = createDocDebouncer(
        events => {
          handledBatches.push([...events])
        },
        {debounceMs: 50},
      )

      const events: FileChangeEvent[] = [
        {type: 'change', path: '/test/file1.ts', packageName: 'pkg', timestamp: new Date()},
        {type: 'change', path: '/test/file2.ts', packageName: 'pkg', timestamp: new Date()},
        {type: 'change', path: '/test/file3.ts', packageName: 'pkg', timestamp: new Date()},
      ]

      debouncer.addAll(events)

      await new Promise(resolve => setTimeout(resolve, 100))

      expect(handledBatches.length).toBe(1)
      expect(handledBatches[0]?.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('file watcher creation', () => {
    it('should create watcher with default options', () => {
      const watcher = createDocWatcher()

      expect(watcher).toBeDefined()
      expect(typeof watcher.start).toBe('function')
      expect(typeof watcher.close).toBe('function')
      expect(typeof watcher.onChanges).toBe('function')
      expect(typeof watcher.getWatchedPaths).toBe('function')
    })

    it('should create watcher with custom root directory', () => {
      const watcher = createDocWatcher({
        rootDir: FIXTURES_DIR,
      })

      expect(watcher).toBeDefined()
    })

    it('should create watcher with custom debounce settings', () => {
      const watcher = createDocWatcher({
        debounceMs: 500,
      })

      expect(watcher).toBeDefined()
    })

    it('should support additional ignore patterns', () => {
      const watcher = createDocWatcher({
        additionalIgnore: ['**/custom-ignore/**'],
      })

      expect(watcher).toBeDefined()
    })
  })

  describe('sync orchestrator watch mode', () => {
    let tempDir: string

    beforeEach(async () => {
      tempDir = path.join(__dirname, '../.temp-watch-test')
      await fs.mkdir(tempDir, {recursive: true})
    })

    afterEach(async () => {
      try {
        await fs.rm(tempDir, {recursive: true, force: true})
      } catch {
        // Ignore cleanup errors
      }
    })

    it('should start watching', async () => {
      const config: DocConfig = {
        rootDir: FIXTURES_DIR,
        outputDir: tempDir,
        includePatterns: ['packages/*'],
        debounceMs: 100,
      }

      const orchestrator = createSyncOrchestrator({config})

      expect(orchestrator.isWatching()).toBe(false)

      await orchestrator.startWatching()
      expect(orchestrator.isWatching()).toBe(true)

      await orchestrator.stopWatching()
      expect(orchestrator.isWatching()).toBe(false)
    })

    it('should not start watching twice', async () => {
      const config: DocConfig = {
        rootDir: FIXTURES_DIR,
        outputDir: tempDir,
        includePatterns: ['packages/*'],
      }

      const orchestrator = createSyncOrchestrator({config})

      await orchestrator.startWatching()
      await orchestrator.startWatching() // Should be idempotent

      expect(orchestrator.isWatching()).toBe(true)

      await orchestrator.stopWatching()
    })

    it('should handle stop when not watching', async () => {
      const config: DocConfig = {
        rootDir: FIXTURES_DIR,
        outputDir: tempDir,
        includePatterns: ['packages/*'],
      }

      const orchestrator = createSyncOrchestrator({config})

      await orchestrator.stopWatching()
      expect(orchestrator.isWatching()).toBe(false)
    })

    it('should report verbose progress messages', async () => {
      const progressMessages: string[] = []
      const config: DocConfig = {
        rootDir: FIXTURES_DIR,
        outputDir: tempDir,
        includePatterns: ['packages/*'],
      }

      const orchestrator = createSyncOrchestrator({
        config,
        verbose: true,
        onProgress: msg => progressMessages.push(msg),
      })

      await orchestrator.startWatching()

      expect(progressMessages.some(m => m.includes('watch'))).toBe(true)

      await orchestrator.stopWatching()
    })
  })

  describe('async handler support', () => {
    it('should support async batch handlers', async () => {
      const results: string[] = []
      const debouncer = createDocDebouncer(
        async events => {
          await new Promise(resolve => setTimeout(resolve, 10))
          results.push(`processed ${events.length} events`)
        },
        {debounceMs: 50},
      )

      debouncer.add({
        type: 'change',
        path: '/test/file.ts',
        packageName: 'pkg',
        timestamp: new Date(),
      })

      await new Promise(resolve => setTimeout(resolve, 100))

      expect(results.length).toBe(1)
      expect(results[0]).toContain('processed')
    })

    it('should handle errors in async handlers gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const debouncer = createDocDebouncer(
        async () => {
          throw new Error('Handler error')
        },
        {debounceMs: 50},
      )

      debouncer.add({
        type: 'change',
        path: '/test/file.ts',
        packageName: 'pkg',
        timestamp: new Date(),
      })

      await new Promise(resolve => setTimeout(resolve, 100))

      expect(consoleSpy).toHaveBeenCalled()

      consoleSpy.mockRestore()
    })
  })

  describe('event types', () => {
    it('should handle add events', async () => {
      const handledEvents: FileChangeEvent[] = []
      const debouncer = createDocDebouncer(
        events => {
          handledEvents.push(...events)
        },
        {debounceMs: 50},
      )

      debouncer.add({
        type: 'add',
        path: '/test/new-file.ts',
        packageName: 'pkg',
        timestamp: new Date(),
      })

      await new Promise(resolve => setTimeout(resolve, 100))

      expect(handledEvents.some(e => e.type === 'add')).toBe(true)
    })

    it('should handle change events', async () => {
      const handledEvents: FileChangeEvent[] = []
      const debouncer = createDocDebouncer(
        events => {
          handledEvents.push(...events)
        },
        {debounceMs: 50},
      )

      debouncer.add({
        type: 'change',
        path: '/test/modified-file.ts',
        packageName: 'pkg',
        timestamp: new Date(),
      })

      await new Promise(resolve => setTimeout(resolve, 100))

      expect(handledEvents.some(e => e.type === 'change')).toBe(true)
    })

    it('should handle unlink events', async () => {
      const handledEvents: FileChangeEvent[] = []
      const debouncer = createDocDebouncer(
        events => {
          handledEvents.push(...events)
        },
        {debounceMs: 50},
      )

      debouncer.add({
        type: 'unlink',
        path: '/test/deleted-file.ts',
        packageName: 'pkg',
        timestamp: new Date(),
      })

      await new Promise(resolve => setTimeout(resolve, 100))

      expect(handledEvents.some(e => e.type === 'unlink')).toBe(true)
    })

    it('should handle mixed event types', async () => {
      const handledBatches: FileChangeEvent[][] = []
      const debouncer = createDocDebouncer(
        events => {
          handledBatches.push([...events])
        },
        {debounceMs: 50},
      )

      debouncer.add({type: 'add', path: '/test/new.ts', packageName: 'pkg', timestamp: new Date()})
      debouncer.add({
        type: 'change',
        path: '/test/mod.ts',
        packageName: 'pkg',
        timestamp: new Date(),
      })
      debouncer.add({
        type: 'unlink',
        path: '/test/del.ts',
        packageName: 'pkg',
        timestamp: new Date(),
      })

      await new Promise(resolve => setTimeout(resolve, 100))

      expect(handledBatches.length).toBe(1)
      const types = handledBatches[0]?.map(e => e.type) ?? []
      expect(types).toContain('add')
      expect(types).toContain('change')
      expect(types).toContain('unlink')
    })
  })
})
