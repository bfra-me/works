/**
 * Tests for File System Utilities
 * Part of Phase 5: Comprehensive Testing Implementation (TASK-038)
 *
 * Tests file system operations including creation, copying, removal, and path utilities.
 */

import {existsSync, rmSync} from 'node:fs'
import {mkdir, rm, writeFile} from 'node:fs/promises'
import path from 'node:path'
import {afterEach, beforeEach, describe, expect, it} from 'vitest'
import {
  copy,
  createFile,
  createTempDir,
  ensureDir,
  exists,
  findFiles,
  getRelativePath,
  getSize,
  getStats,
  isDirectory,
  isEmpty,
  isFile,
  joinPaths,
  move,
  readDir,
  remove,
  resolvePath,
} from '../../src/utils/file-system.js'

describe('File System Utilities', () => {
  let testDir: string

  beforeEach(async () => {
    testDir = path.join(process.cwd(), '.tmp', `fs-test-${Date.now()}`)
    await mkdir(testDir, {recursive: true})
  })

  afterEach(async () => {
    if (existsSync(testDir)) {
      rmSync(testDir, {recursive: true, force: true})
    }
  })

  describe('exists', () => {
    it('returns true for existing path', async () => {
      const filePath = path.join(testDir, 'test.txt')
      await writeFile(filePath, 'test content')

      expect(exists(filePath)).toBe(true)
    })

    it('returns false for non-existing path', () => {
      expect(exists(path.join(testDir, 'nonexistent.txt'))).toBe(false)
    })

    it('returns true for existing directory', () => {
      expect(exists(testDir)).toBe(true)
    })
  })

  describe('ensureDir', () => {
    it('creates directory if not exists', async () => {
      const newDir = path.join(testDir, 'new-dir')

      await ensureDir(newDir)

      expect(existsSync(newDir)).toBe(true)
    })

    it('creates nested directories', async () => {
      const nestedDir = path.join(testDir, 'a', 'b', 'c')

      await ensureDir(nestedDir)

      expect(existsSync(nestedDir)).toBe(true)
    })

    it('does not fail if directory already exists', async () => {
      await ensureDir(testDir)

      expect(existsSync(testDir)).toBe(true)
    })
  })

  describe('copy', () => {
    it('copies file to new location', async () => {
      const source = path.join(testDir, 'source.txt')
      const target = path.join(testDir, 'target.txt')
      await writeFile(source, 'content')

      await copy(source, target)

      expect(existsSync(target)).toBe(true)
    })

    it('copies directory recursively', async () => {
      const sourceDir = path.join(testDir, 'source-dir')
      await mkdir(sourceDir)
      await writeFile(path.join(sourceDir, 'file.txt'), 'content')

      const targetDir = path.join(testDir, 'target-dir')

      await copy(sourceDir, targetDir)

      expect(existsSync(path.join(targetDir, 'file.txt'))).toBe(true)
    })

    it('respects overwrite false option', async () => {
      const source = path.join(testDir, 'source.txt')
      const target = path.join(testDir, 'target.txt')
      await writeFile(source, 'new content')
      await writeFile(target, 'original content')

      await copy(source, target, {overwrite: false})

      // Original content should be preserved
      const fs = await import('node:fs/promises')
      const content = await fs.readFile(target, 'utf-8')
      expect(content).toBe('original content')
    })

    it('respects filter function', async () => {
      const source = path.join(testDir, 'source.txt')
      const target = path.join(testDir, 'target.txt')
      await writeFile(source, 'content')

      // Filter that rejects everything
      await copy(source, target, {filter: () => false})

      expect(existsSync(target)).toBe(false)
    })

    it('creates target directory if not exists', async () => {
      const source = path.join(testDir, 'source.txt')
      const target = path.join(testDir, 'new-dir', 'target.txt')
      await writeFile(source, 'content')

      await copy(source, target)

      expect(existsSync(target)).toBe(true)
    })
  })

  describe('remove', () => {
    it('removes file', async () => {
      const filePath = path.join(testDir, 'to-remove.txt')
      await writeFile(filePath, 'content')

      await remove(filePath)

      expect(existsSync(filePath)).toBe(false)
    })

    it('removes directory recursively', async () => {
      const dirPath = path.join(testDir, 'to-remove-dir')
      await mkdir(dirPath)
      await writeFile(path.join(dirPath, 'file.txt'), 'content')

      await remove(dirPath)

      expect(existsSync(dirPath)).toBe(false)
    })

    it('does nothing for non-existing path', async () => {
      // Should not throw
      await expect(remove(path.join(testDir, 'nonexistent'))).resolves.not.toThrow()
    })
  })

  describe('createTempDir', () => {
    it('creates temp directory with prefix', async () => {
      const tempDir = await createTempDir('test-prefix-')

      try {
        expect(existsSync(tempDir)).toBe(true)
        expect(path.basename(tempDir)).toMatch(/^test-prefix-/)
      } finally {
        await rm(tempDir, {recursive: true, force: true})
      }
    })

    it('creates temp directory with default prefix', async () => {
      const tempDir = await createTempDir()

      try {
        expect(existsSync(tempDir)).toBe(true)
        expect(path.basename(tempDir)).toMatch(/^bfra-me-create-/)
      } finally {
        await rm(tempDir, {recursive: true, force: true})
      }
    })
  })

  describe('readDir', () => {
    it('returns directory contents', async () => {
      await writeFile(path.join(testDir, 'file1.txt'), 'content')
      await writeFile(path.join(testDir, 'file2.txt'), 'content')

      const contents = await readDir(testDir)

      expect(contents).toContain('file1.txt')
      expect(contents).toContain('file2.txt')
    })

    it('returns empty array for non-existing directory', async () => {
      const contents = await readDir(path.join(testDir, 'nonexistent'))

      expect(contents).toEqual([])
    })
  })

  describe('getStats', () => {
    it('returns stats for existing file', async () => {
      const filePath = path.join(testDir, 'test.txt')
      await writeFile(filePath, 'content')

      const stats = await getStats(filePath)

      expect(stats).not.toBeNull()
      expect(stats?.isFile()).toBe(true)
    })

    it('returns stats for existing directory', async () => {
      const stats = await getStats(testDir)

      expect(stats).not.toBeNull()
      expect(stats?.isDirectory()).toBe(true)
    })

    it('returns null for non-existing path', async () => {
      const stats = await getStats(path.join(testDir, 'nonexistent'))

      expect(stats).toBeNull()
    })
  })

  describe('isDirectory', () => {
    it('returns true for directory', () => {
      expect(isDirectory(testDir)).toBe(true)
    })

    it('returns false for file', async () => {
      const filePath = path.join(testDir, 'test.txt')
      await writeFile(filePath, 'content')

      expect(isDirectory(filePath)).toBe(false)
    })

    it('returns false for non-existing path', () => {
      expect(isDirectory(path.join(testDir, 'nonexistent'))).toBe(false)
    })
  })

  describe('isFile', () => {
    it('returns true for file', async () => {
      const filePath = path.join(testDir, 'test.txt')
      await writeFile(filePath, 'content')

      expect(isFile(filePath)).toBe(true)
    })

    it('returns false for directory', () => {
      expect(isFile(testDir)).toBe(false)
    })

    it('returns false for non-existing path', () => {
      expect(isFile(path.join(testDir, 'nonexistent'))).toBe(false)
    })
  })

  describe('findFiles', () => {
    it('finds files matching pattern', async () => {
      await writeFile(path.join(testDir, 'file1.txt'), 'content')
      await writeFile(path.join(testDir, 'file2.txt'), 'content')
      await writeFile(path.join(testDir, 'other.json'), 'content')

      const files = await findFiles('*.txt', {cwd: testDir})

      expect(files).toContain('file1.txt')
      expect(files).toContain('file2.txt')
      expect(files).not.toContain('other.json')
    })

    it('respects ignore patterns', async () => {
      const nodeModules = path.join(testDir, 'node_modules')
      await mkdir(nodeModules)
      await writeFile(path.join(nodeModules, 'file.txt'), 'content')
      await writeFile(path.join(testDir, 'file.txt'), 'content')

      const files = await findFiles('**/*.txt', {
        cwd: testDir,
        ignore: ['node_modules/**'],
      })

      expect(files).toContain('file.txt')
      expect(files).not.toContain('node_modules/file.txt')
    })

    it('returns empty array on error', async () => {
      // Pass invalid pattern that might cause error
      const files = await findFiles('', {cwd: '/nonexistent/path'})

      expect(Array.isArray(files)).toBe(true)
    })
  })

  describe('getSize', () => {
    it('returns file size', async () => {
      const filePath = path.join(testDir, 'test.txt')
      const content = 'hello world'
      await writeFile(filePath, content)

      const size = await getSize(filePath)

      expect(size).toBe(content.length)
    })

    it('returns directory size', async () => {
      const subDir = path.join(testDir, 'sub')
      await mkdir(subDir)
      await writeFile(path.join(subDir, 'file1.txt'), 'hello')
      await writeFile(path.join(subDir, 'file2.txt'), 'world')

      const size = await getSize(subDir)

      expect(size).toBe(10) // 'hello' + 'world'
    })

    it('returns 0 for non-existing path', async () => {
      const size = await getSize(path.join(testDir, 'nonexistent'))

      expect(size).toBe(0)
    })
  })

  describe('createFile', () => {
    it('creates file with content', async () => {
      const filePath = path.join(testDir, 'new-file.txt')

      await createFile(filePath, 'test content')

      expect(existsSync(filePath)).toBe(true)
      const fs = await import('node:fs/promises')
      const content = await fs.readFile(filePath, 'utf-8')
      expect(content).toBe('test content')
    })

    it('creates parent directories if needed', async () => {
      const filePath = path.join(testDir, 'nested', 'dir', 'file.txt')

      await createFile(filePath, 'content')

      expect(existsSync(filePath)).toBe(true)
    })
  })

  describe('isEmpty', () => {
    it('returns true for empty directory', async () => {
      const emptyDir = path.join(testDir, 'empty')
      await mkdir(emptyDir)

      const result = await isEmpty(emptyDir)

      expect(result).toBe(true)
    })

    it('returns false for non-empty directory', async () => {
      await writeFile(path.join(testDir, 'file.txt'), 'content')

      const result = await isEmpty(testDir)

      expect(result).toBe(false)
    })

    it('returns true for non-existing directory', async () => {
      const result = await isEmpty(path.join(testDir, 'nonexistent'))

      expect(result).toBe(true)
    })
  })

  describe('move', () => {
    it('moves file to new location', async () => {
      const source = path.join(testDir, 'source.txt')
      const target = path.join(testDir, 'target.txt')
      await writeFile(source, 'content')

      await move(source, target)

      expect(existsSync(source)).toBe(false)
      expect(existsSync(target)).toBe(true)
    })

    it('moves directory to new location', async () => {
      const sourceDir = path.join(testDir, 'source-dir')
      await mkdir(sourceDir)
      await writeFile(path.join(sourceDir, 'file.txt'), 'content')

      const targetDir = path.join(testDir, 'target-dir')

      await move(sourceDir, targetDir)

      expect(existsSync(sourceDir)).toBe(false)
      expect(existsSync(path.join(targetDir, 'file.txt'))).toBe(true)
    })
  })

  describe('getRelativePath', () => {
    it('calculates relative path between directories', () => {
      const from = '/a/b/c'
      const to = '/a/b/d/e'

      const result = getRelativePath(from, to)

      expect(result).toBe('../d/e')
    })

    it('handles same directory', () => {
      const dir = '/a/b/c'

      const result = getRelativePath(dir, dir)

      expect(result).toBe('')
    })
  })

  describe('resolvePath', () => {
    it('resolves to absolute path', () => {
      const result = resolvePath('test', 'path')

      expect(path.isAbsolute(result)).toBe(true)
      expect(result).toContain('test')
      expect(result).toContain('path')
    })

    it('handles absolute paths', () => {
      const result = resolvePath('/absolute/path')

      expect(result).toBe('/absolute/path')
    })
  })

  describe('joinPaths', () => {
    it('joins path segments', () => {
      const result = joinPaths('a', 'b', 'c')

      expect(result).toBe('a/b/c')
    })

    it('handles leading slashes', () => {
      const result = joinPaths('/a', 'b', 'c')

      expect(result).toBe('/a/b/c')
    })

    it('normalizes path separators', () => {
      const result = joinPaths('a', 'b/c', 'd')

      expect(result).toBe('a/b/c/d')
    })
  })
})
