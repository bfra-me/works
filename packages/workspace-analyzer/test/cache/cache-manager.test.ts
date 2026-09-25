/**
 * Cache manager tests for verifying disk persistence and error handling.
 */

import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import {describe, expect, it} from 'vitest'

import {createCacheManager, initializeCache} from '../../src/cache/cache-manager'

async function createTempWorkspace(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), 'cache-manager-test-'))
}

async function cleanupTempWorkspace(dir: string): Promise<void> {
  await fs.rm(dir, {recursive: true, force: true})
}

describe('cache-manager', () => {
  describe('save/load round trip', () => {
    it('should persist and reload an uncompressed cache', async () => {
      const workspacePath = await createTempWorkspace()
      try {
        const manager = createCacheManager({
          workspacePath,
          analyzerVersion: '1.0.0',
          compress: false,
        })
        const cache = initializeCache(workspacePath, 'config-hash', '1.0.0')

        const saveResult = await manager.save(cache)
        expect(saveResult.success).toBe(true)

        const loadResult = await manager.load()
        expect(loadResult.success).toBe(true)
        expect(loadResult.success && loadResult.data.metadata.workspacePath).toBe(workspacePath)
      } finally {
        await cleanupTempWorkspace(workspacePath)
      }
    })

    it('should persist and reload a compressed cache', async () => {
      const workspacePath = await createTempWorkspace()
      try {
        const manager = createCacheManager({
          workspacePath,
          analyzerVersion: '1.0.0',
          compress: true,
        })
        const cache = initializeCache(workspacePath, 'config-hash', '1.0.0')

        await manager.save(cache)
        const loadResult = await manager.load()

        expect(loadResult.success).toBe(true)
        expect(loadResult.success && loadResult.data.metadata.configHash).toBe('config-hash')
      } finally {
        await cleanupTempWorkspace(workspacePath)
      }
    })
  })

  describe('load error handling', () => {
    it('should return CACHE_NOT_FOUND when no cache file exists', async () => {
      const workspacePath = await createTempWorkspace()
      try {
        const manager = createCacheManager({workspacePath, analyzerVersion: '1.0.0'})

        const result = await manager.load()

        expect(result.success).toBe(false)
        expect(!result.success && result.error.code).toBe('CACHE_NOT_FOUND')
      } finally {
        await cleanupTempWorkspace(workspacePath)
      }
    })

    it('should return CACHE_CORRUPTED with a real error message for invalid JSON', async () => {
      const workspacePath = await createTempWorkspace()
      try {
        const manager = createCacheManager({
          workspacePath,
          analyzerVersion: '1.0.0',
          compress: false,
        })
        await fs.mkdir(path.join(workspacePath, '.workspace-analyzer-cache'), {recursive: true})
        await fs.writeFile(
          path.join(workspacePath, '.workspace-analyzer-cache', 'analysis-cache.json'),
          'not valid json',
        )

        const result = await manager.load()

        expect(result.success).toBe(false)
        expect(!result.success && result.error.code).toBe('CACHE_CORRUPTED')
        // The underlying error message must be a real, non-"undefined" string.
        expect(!result.success && result.error.message).toContain('Failed to parse cache file:')
        expect(!result.success && result.error.message).not.toContain('undefined')
        expect(!result.success && result.error.cause).toBeInstanceOf(Error)
      } finally {
        await cleanupTempWorkspace(workspacePath)
      }
    })

    it('should return CACHE_VERSION_MISMATCH for a stale schema version', async () => {
      const workspacePath = await createTempWorkspace()
      try {
        const manager = createCacheManager({
          workspacePath,
          analyzerVersion: '1.0.0',
          compress: false,
        })
        const cache = initializeCache(workspacePath, 'config-hash', '1.0.0')
        const staleCache = {...cache, metadata: {...cache.metadata, version: 999}}
        await fs.mkdir(path.join(workspacePath, '.workspace-analyzer-cache'), {recursive: true})
        await fs.writeFile(
          path.join(workspacePath, '.workspace-analyzer-cache', 'analysis-cache.json'),
          JSON.stringify(staleCache),
        )

        const result = await manager.load()

        expect(result.success).toBe(false)
        expect(!result.success && result.error.code).toBe('CACHE_VERSION_MISMATCH')
      } finally {
        await cleanupTempWorkspace(workspacePath)
      }
    })

    it('should return CACHE_EXPIRED for a cache older than maxAge', async () => {
      const workspacePath = await createTempWorkspace()
      try {
        const manager = createCacheManager({
          workspacePath,
          analyzerVersion: '1.0.0',
          compress: false,
          maxAge: 1000,
        })
        const cache = initializeCache(workspacePath, 'config-hash', '1.0.0')
        const oldCache = {
          ...cache,
          metadata: {
            ...cache.metadata,
            createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
          },
        }
        await fs.mkdir(path.join(workspacePath, '.workspace-analyzer-cache'), {recursive: true})
        await fs.writeFile(
          path.join(workspacePath, '.workspace-analyzer-cache', 'analysis-cache.json'),
          JSON.stringify(oldCache),
        )

        const result = await manager.load()

        expect(result.success).toBe(false)
        expect(!result.success && result.error.code).toBe('CACHE_EXPIRED')
      } finally {
        await cleanupTempWorkspace(workspacePath)
      }
    })
  })

  describe('updateFile', () => {
    it('should return CACHE_WRITE_FAILED with a real error message for a missing file', async () => {
      const workspacePath = await createTempWorkspace()
      try {
        const manager = createCacheManager({workspacePath, analyzerVersion: '1.0.0'})
        const cache = initializeCache(workspacePath, 'config-hash', '1.0.0')

        const result = await manager.updateFile(
          cache,
          path.join(workspacePath, 'does-not-exist.ts'),
          [],
          [],
        )

        expect(result.success).toBe(false)
        expect(!result.success && result.error.code).toBe('CACHE_WRITE_FAILED')
        expect(!result.success && result.error.message).not.toContain('undefined')
        expect(!result.success && result.error.cause).toBeInstanceOf(Error)
      } finally {
        await cleanupTempWorkspace(workspacePath)
      }
    })

    it('should update the cache for an existing file', async () => {
      const workspacePath = await createTempWorkspace()
      try {
        const filePath = path.join(workspacePath, 'index.ts')
        await fs.writeFile(filePath, 'export const x = 1')

        const manager = createCacheManager({workspacePath, analyzerVersion: '1.0.0'})
        const cache = initializeCache(workspacePath, 'config-hash', '1.0.0')

        const result = await manager.updateFile(cache, filePath, [], ['test-analyzer'])

        expect(result.success).toBe(true)
        expect(result.success && result.data.files[filePath]).toBeDefined()
      } finally {
        await cleanupTempWorkspace(workspacePath)
      }
    })
  })

  describe('clear', () => {
    it('should remove the cache directory', async () => {
      const workspacePath = await createTempWorkspace()
      try {
        const manager = createCacheManager({workspacePath, analyzerVersion: '1.0.0'})
        const cache = initializeCache(workspacePath, 'config-hash', '1.0.0')
        await manager.save(cache)

        const clearResult = await manager.clear()
        expect(clearResult.success).toBe(true)

        const loadResult = await manager.load()
        expect(loadResult.success).toBe(false)
        expect(!loadResult.success && loadResult.error.code).toBe('CACHE_NOT_FOUND')
      } finally {
        await cleanupTempWorkspace(workspacePath)
      }
    })
  })

  describe('quickValidate', () => {
    it('should return false when the config hash does not match', () => {
      const workspacePath = '/tmp/workspace'
      const manager = createCacheManager({workspacePath, analyzerVersion: '1.0.0'})
      const cache = initializeCache(workspacePath, 'config-hash', '1.0.0')

      expect(manager.quickValidate(cache, 'different-hash')).toBe(false)
      expect(manager.quickValidate(cache, 'config-hash')).toBe(true)
    })
  })
})
