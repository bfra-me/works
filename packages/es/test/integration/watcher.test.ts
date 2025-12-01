/**
 * Integration tests for file watcher with real file system.
 * Validates TEST-031: File watcher integration with real file system operations
 */

import type {WatcherEvent} from '../../src/watcher/types'

import {mkdir, rm, writeFile} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {join} from 'node:path'

import {afterEach, beforeEach, describe, expect, it} from 'vitest'

import {createChangeDetector} from '../../src/watcher/change-detector'
import {createDebouncer} from '../../src/watcher/debouncer'
import {createFileWatcher} from '../../src/watcher/file-watcher'
import {createFileHasher} from '../../src/watcher/hasher'

describe('@bfra.me/es/watcher - file system integration', () => {
  let testDir: string

  beforeEach(async () => {
    testDir = join(tmpdir(), `es-watcher-test-${Date.now()}-${Math.random().toString(36).slice(2)}`)
    await mkdir(testDir, {recursive: true})
  })

  afterEach(async () => {
    await rm(testDir, {recursive: true, force: true})
  })

  describe('file hasher', () => {
    it('should compute consistent hashes for same content', async () => {
      const hasher = createFileHasher('sha256')
      const testFile = join(testDir, 'test.txt')

      await writeFile(testFile, 'Hello, World!')

      const hash1 = await hasher.hash(testFile)
      const hash2 = await hasher.hash(testFile)

      expect(hash1).toBe(hash2)
      expect(hash1).toHaveLength(64)
    })

    it('should compute different hashes for different content', async () => {
      const hasher = createFileHasher('sha256')
      const file1 = join(testDir, 'file1.txt')
      const file2 = join(testDir, 'file2.txt')

      await writeFile(file1, 'Content A')
      await writeFile(file2, 'Content B')

      const hash1 = await hasher.hash(file1)
      const hash2 = await hasher.hash(file2)

      expect(hash1).not.toBe(hash2)
    })

    it('should compute hash from content directly', () => {
      const hasher = createFileHasher('sha256')

      const hash1 = hasher.hashContent('test content')
      const hash2 = hasher.hashContent('test content')
      const hash3 = hasher.hashContent('different content')

      expect(hash1).toBe(hash2)
      expect(hash1).not.toBe(hash3)
    })

    it('should work with md5 algorithm', async () => {
      const hasher = createFileHasher('md5')
      const testFile = join(testDir, 'test.txt')

      await writeFile(testFile, 'Hello, World!')

      const hash = await hasher.hash(testFile)

      expect(hash).toHaveLength(32)
    })

    it('should hash binary content correctly', () => {
      const hasher = createFileHasher('sha256')

      const binaryData = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f])
      const hash = hasher.hashContent(binaryData)

      expect(hash).toHaveLength(64)
      expect(hash).toBe(hasher.hashContent(binaryData))
    })
  })

  describe('change detector', () => {
    it('should detect file changes', async () => {
      const detector = createChangeDetector()
      const testFile = join(testDir, 'changing.txt')

      await writeFile(testFile, 'initial content')
      await detector.record(testFile)

      const unchangedResult = await detector.hasChanged(testFile)
      expect(unchangedResult).toBe(false)

      await writeFile(testFile, 'modified content')

      const changedResult = await detector.hasChanged(testFile)
      expect(changedResult).toBe(true)
    })

    it('should report change for unrecorded files', async () => {
      const detector = createChangeDetector()
      const testFile = join(testDir, 'new.txt')

      await writeFile(testFile, 'content')

      const result = await detector.hasChanged(testFile)
      expect(result).toBe(true)
    })

    it('should clear recorded state for single file', async () => {
      const detector = createChangeDetector()
      const testFile = join(testDir, 'clear-test.txt')

      await writeFile(testFile, 'content')
      await detector.record(testFile)

      const beforeClear = await detector.hasChanged(testFile)
      expect(beforeClear).toBe(false)

      detector.clear(testFile)

      const afterClear = await detector.hasChanged(testFile)
      expect(afterClear).toBe(true)
    })

    it('should clear all recorded state', async () => {
      const detector = createChangeDetector()
      const file1 = join(testDir, 'file1.txt')
      const file2 = join(testDir, 'file2.txt')

      await writeFile(file1, 'content1')
      await writeFile(file2, 'content2')
      await detector.record(file1)
      await detector.record(file2)

      expect(await detector.hasChanged(file1)).toBe(false)
      expect(await detector.hasChanged(file2)).toBe(false)

      detector.clearAll()

      expect(await detector.hasChanged(file1)).toBe(true)
      expect(await detector.hasChanged(file2)).toBe(true)
    })

    it('should work with md5 algorithm', async () => {
      const detector = createChangeDetector({algorithm: 'md5'})
      const testFile = join(testDir, 'md5-test.txt')

      await writeFile(testFile, 'test content')
      await detector.record(testFile)

      expect(await detector.hasChanged(testFile)).toBe(false)

      await writeFile(testFile, 'changed content')

      expect(await detector.hasChanged(testFile)).toBe(true)
    })
  })

  describe('debouncer', () => {
    it('should batch rapid events', async () => {
      const batches: string[][] = []
      const debouncer = createDebouncer<string>(items => {
        batches.push([...items])
      }, 50)

      debouncer.add('a')
      debouncer.add('b')
      debouncer.add('c')

      await new Promise(resolve => setTimeout(resolve, 100))

      expect(batches).toHaveLength(1)
      expect(batches[0]).toEqual(['a', 'b', 'c'])
    })

    it('should separate distinct batches', async () => {
      const batches: number[][] = []
      const debouncer = createDebouncer<number>(items => {
        batches.push([...items])
      }, 30)

      debouncer.add(1)
      debouncer.add(2)

      await new Promise(resolve => setTimeout(resolve, 60))

      debouncer.add(3)
      debouncer.add(4)

      await new Promise(resolve => setTimeout(resolve, 60))

      expect(batches).toHaveLength(2)
      expect(batches[0]).toEqual([1, 2])
      expect(batches[1]).toEqual([3, 4])
    })

    it('should flush pending items on demand', () => {
      const batches: string[][] = []
      const debouncer = createDebouncer<string>(items => {
        batches.push([...items])
      }, 1000)

      debouncer.add('x')
      debouncer.add('y')
      debouncer.flush()

      expect(batches).toHaveLength(1)
      expect(batches[0]).toEqual(['x', 'y'])
    })

    it('should cancel pending flush', async () => {
      const batches: string[][] = []
      const debouncer = createDebouncer<string>(items => {
        batches.push([...items])
      }, 50)

      debouncer.add('a')
      debouncer.cancel()

      await new Promise(resolve => setTimeout(resolve, 100))

      expect(batches).toHaveLength(0)
    })
  })

  describe('file watcher', () => {
    it('should start and close successfully when chokidar is available', async () => {
      const watcher = createFileWatcher(testDir)

      await watcher.start()
      await watcher.close()

      // Verify watcher has expected interface after start/close cycle
      expect(watcher).toHaveProperty('start')
      expect(watcher).toHaveProperty('close')
    })

    it('should create watcher with various options', () => {
      const watcher1 = createFileWatcher(testDir)
      expect(watcher1).toHaveProperty('start')
      expect(watcher1).toHaveProperty('close')
      expect(watcher1).toHaveProperty('on')
      expect(watcher1).toHaveProperty('off')

      const watcher2 = createFileWatcher([testDir], {
        debounceMs: 200,
        ignored: ['node_modules'],
        usePolling: true,
        pollingInterval: 500,
      })
      expect(watcher2).toHaveProperty('start')
    })

    it('should support event handler registration and removal', () => {
      const watcher = createFileWatcher(testDir)
      const events: WatcherEvent[] = []

      const handler = (event: WatcherEvent): void => {
        events.push(event)
      }

      watcher.on('change', handler)
      watcher.off('change', handler)

      expect(events).toHaveLength(0)
    })
  })

  describe('integration with real file operations', () => {
    it('should track multiple file changes across directories', async () => {
      const detector = createChangeDetector()
      const subDir = join(testDir, 'subdir')
      await mkdir(subDir, {recursive: true})

      const rootFile = join(testDir, 'root.txt')
      const nestedFile = join(subDir, 'nested.txt')
      const anotherFile = join(testDir, 'another.txt')

      await writeFile(rootFile, `content for ${rootFile}`)
      await writeFile(nestedFile, `content for ${nestedFile}`)
      await writeFile(anotherFile, `content for ${anotherFile}`)

      await detector.record(rootFile)
      await detector.record(nestedFile)
      await detector.record(anotherFile)

      expect(await detector.hasChanged(rootFile)).toBe(false)
      expect(await detector.hasChanged(nestedFile)).toBe(false)
      expect(await detector.hasChanged(anotherFile)).toBe(false)

      await writeFile(nestedFile, 'modified nested content')

      expect(await detector.hasChanged(rootFile)).toBe(false)
      expect(await detector.hasChanged(nestedFile)).toBe(true)
      expect(await detector.hasChanged(anotherFile)).toBe(false)
    })

    it('should handle empty files correctly', async () => {
      const detector = createChangeDetector()
      const emptyFile = join(testDir, 'empty.txt')

      await writeFile(emptyFile, '')
      await detector.record(emptyFile)

      expect(await detector.hasChanged(emptyFile)).toBe(false)

      await writeFile(emptyFile, 'now has content')

      expect(await detector.hasChanged(emptyFile)).toBe(true)
    })

    it('should handle large files', async () => {
      const detector = createChangeDetector()
      const largeFile = join(testDir, 'large.txt')

      const largeContent = 'x'.repeat(1024 * 1024)
      await writeFile(largeFile, largeContent)
      await detector.record(largeFile)

      expect(await detector.hasChanged(largeFile)).toBe(false)

      const modifiedContent = `${largeContent}y`
      await writeFile(largeFile, modifiedContent)

      expect(await detector.hasChanged(largeFile)).toBe(true)
    })

    it('should handle special characters in file paths', async () => {
      const detector = createChangeDetector()
      const specialFile = join(testDir, 'file with spaces & chars.txt')

      await writeFile(specialFile, 'content')
      await detector.record(specialFile)

      expect(await detector.hasChanged(specialFile)).toBe(false)
    })

    it('should handle unicode content', async () => {
      const hasher = createFileHasher('sha256')
      const unicodeFile = join(testDir, 'unicode.txt')

      await writeFile(unicodeFile, '你好世界 🌍 مرحبا')

      const hash = await hasher.hash(unicodeFile)

      expect(hash).toHaveLength(64)
      expect(await hasher.hash(unicodeFile)).toBe(hash)
    })
  })

  describe('debouncer with async handlers', () => {
    it('should handle async batch processors', async () => {
      const results: string[] = []

      const asyncHandler = async (items: string[]): Promise<void> => {
        await new Promise(resolve => setTimeout(resolve, 10))
        results.push(items.join(','))
      }

      const debouncer = createDebouncer<string>(items => {
        asyncHandler(items).catch(() => {})
      }, 30)

      debouncer.add('1')
      debouncer.add('2')

      await new Promise(resolve => setTimeout(resolve, 100))

      expect(results).toEqual(['1,2'])
    })
  })
})
