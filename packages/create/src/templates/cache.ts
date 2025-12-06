/**
 * Template caching system using functional memoization patterns
 * Part of Phase 2: Template System Refactoring
 *
 * This module provides a functional caching system for templates
 * using memoization patterns from @bfra.me/es/functional.
 */

import type {Result} from '@bfra.me/es/result'
import type {TemplateMetadata, TemplateSource} from '../types.js'
import {existsSync} from 'node:fs'
import {cp, mkdir, readFile, rm, writeFile} from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import {memoize, type MemoizeOptions} from '@bfra.me/es/functional'
import {err, ok} from '@bfra.me/es/result'
import {createTemplateError, TemplateErrorCode} from '../utils/errors.js'
import {createLogger} from '../utils/logger.js'

/**
 * Cache entry metadata stored alongside cached templates
 */
export interface CacheEntryMeta {
  /** Timestamp when the entry was cached */
  timestamp: number
  /** TTL in seconds */
  ttl: number
  /** Original source information */
  source: TemplateSource
  /** Template metadata if available */
  metadata?: TemplateMetadata
}

/**
 * Cache configuration options
 */
export interface TemplateCacheConfig {
  /** Enable caching */
  enabled: boolean
  /** Cache directory */
  dir: string
  /** Cache TTL in seconds (default: 1 hour) */
  ttl: number
  /** Maximum cache size in bytes (0 = unlimited) */
  maxSize: number
  /** Enable cache statistics */
  enableStats: boolean
}

/**
 * Cache statistics
 */
export interface CacheStats {
  /** Number of cache hits */
  hits: number
  /** Number of cache misses */
  misses: number
  /** Total entries in cache */
  entries: number
  /** Total size in bytes */
  size: number
  /** Cache hit ratio (0-1) */
  hitRatio: number
}

/**
 * Cache entry with metadata
 */
export interface CacheEntry {
  /** Path to cached template */
  path: string
  /** Cache entry metadata */
  meta: CacheEntryMeta
  /** Whether entry is still valid */
  valid: boolean
}

/**
 * Template cache interface
 */
export interface TemplateCache {
  /** Get a template from cache */
  get: (source: TemplateSource) => Promise<CacheEntry | null>
  /** Store a template in cache */
  set: (
    source: TemplateSource,
    templatePath: string,
    metadata?: TemplateMetadata,
  ) => Promise<Result<string>>
  /** Check if a template is in cache */
  has: (source: TemplateSource) => Promise<boolean>
  /** Remove a template from cache */
  remove: (source: TemplateSource) => Promise<Result<void>>
  /** Clear entire cache */
  clear: () => Promise<Result<void>>
  /** Get cache statistics */
  getStats: () => Promise<CacheStats>
  /** Get cache configuration */
  getConfig: () => Readonly<TemplateCacheConfig>
  /** Update cache configuration */
  updateConfig: (config: Partial<TemplateCacheConfig>) => void
  /** Cleanup expired entries */
  cleanup: () => Promise<Result<number>>
}

/**
 * Default cache configuration
 */
export const DEFAULT_CACHE_CONFIG: TemplateCacheConfig = {
  enabled: true,
  dir: path.join(
    process.env.XDG_CACHE_HOME ?? path.join(process.env.HOME ?? process.cwd(), '.cache'),
    'bfra-me-create',
  ),
  ttl: 3600,
  maxSize: 0,
  enableStats: true,
}

/**
 * Generate cache key from template source
 */
function getCacheKey(source: TemplateSource): string {
  const parts = [source.type, source.location]
  if (source.ref !== undefined) parts.push(source.ref)
  if (source.subdir !== undefined) parts.push(source.subdir)

  return parts.join('-').replaceAll(/[^\w-]/g, '_')
}

/**
 * Check if cache entry is expired
 */
function isExpired(meta: CacheEntryMeta): boolean {
  const now = Date.now()
  const age = now - meta.timestamp
  return age > meta.ttl * 1000
}

/**
 * Creates a template cache with memoization support.
 *
 * This functional factory provides caching for template sources using
 * memoization patterns from @bfra.me/es/functional. The cache stores
 * templates on disk with metadata for expiration tracking.
 *
 * @param config - Cache configuration options
 * @returns A template cache instance
 *
 * @example
 * ```typescript
 * const cache = createTemplateCache({
 *   ttl: 7200, // 2 hours
 *   enableStats: true,
 * })
 *
 * // Store template in cache
 * await cache.set(source, './template-path')
 *
 * // Get from cache
 * const entry = await cache.get(source)
 * if (entry?.valid) {
 *   console.log('Cache hit:', entry.path)
 * }
 *
 * // Get statistics
 * const stats = await cache.getStats()
 * console.log(`Hit ratio: ${stats.hitRatio * 100}%`)
 * ```
 */
export function createTemplateCache(config: Partial<TemplateCacheConfig> = {}): TemplateCache {
  const logger = createLogger({tag: 'cache'})

  let currentConfig: TemplateCacheConfig = {
    ...DEFAULT_CACHE_CONFIG,
    ...config,
  }

  let stats: CacheStats = {
    hits: 0,
    misses: 0,
    entries: 0,
    size: 0,
    hitRatio: 0,
  }

  /**
   * Get path to cache entry directory
   */
  function getCachePath(source: TemplateSource): string {
    return path.join(currentConfig.dir, getCacheKey(source))
  }

  /**
   * Get path to cache entry metadata file
   */
  function getMetaPath(source: TemplateSource): string {
    return path.join(getCachePath(source), '.cache-meta.json')
  }

  /**
   * Update statistics
   */
  function updateStats(hit: boolean): void {
    if (!currentConfig.enableStats) return

    if (hit) {
      stats.hits++
    } else {
      stats.misses++
    }

    const total = stats.hits + stats.misses
    stats.hitRatio = total > 0 ? stats.hits / total : 0
  }

  /**
   * Get a template from cache
   */
  async function get(source: TemplateSource): Promise<CacheEntry | null> {
    if (!currentConfig.enabled) {
      updateStats(false)
      return null
    }

    const cachePath = getCachePath(source)
    const metaPath = getMetaPath(source)

    if (!existsSync(cachePath) || !existsSync(metaPath)) {
      updateStats(false)
      return null
    }

    try {
      const metaContent = await readFile(metaPath, 'utf-8')
      const meta = JSON.parse(metaContent) as CacheEntryMeta

      const valid = !isExpired(meta)

      if (valid) {
        updateStats(true)
        logger.debug(`Cache hit for ${source.location}`)
      } else {
        updateStats(false)
        logger.debug(`Cache expired for ${source.location}`)
      }

      return {
        path: cachePath,
        meta,
        valid,
      }
    } catch (error) {
      logger.warn('Failed to read cache entry:', error)
      updateStats(false)
      return null
    }
  }

  /**
   * Store a template in cache
   */
  async function set(
    source: TemplateSource,
    templatePath: string,
    metadata?: TemplateMetadata,
  ): Promise<Result<string>> {
    if (!currentConfig.enabled) {
      return ok(templatePath)
    }

    const cachePath = getCachePath(source)

    try {
      await mkdir(currentConfig.dir, {recursive: true})

      await cp(templatePath, cachePath, {recursive: true, force: true})

      const meta: CacheEntryMeta = {
        timestamp: Date.now(),
        ttl: currentConfig.ttl,
        source,
        metadata,
      }

      const metaPath = getMetaPath(source)
      await writeFile(metaPath, JSON.stringify(meta, null, 2))

      logger.debug(`Cached template: ${source.location}`)

      return ok(cachePath)
    } catch (error) {
      logger.warn('Failed to cache template:', error)
      return err(
        createTemplateError(
          `Failed to cache template: ${error instanceof Error ? error.message : String(error)}`,
          TemplateErrorCode.TEMPLATE_CACHE_ERROR,
          {source, templatePath},
        ),
      )
    }
  }

  /**
   * Check if a template is in cache
   */
  async function has(source: TemplateSource): Promise<boolean> {
    const entry = await get(source)
    return entry !== null && entry.valid
  }

  /**
   * Remove a template from cache
   */
  async function remove(source: TemplateSource): Promise<Result<void>> {
    const cachePath = getCachePath(source)

    if (!existsSync(cachePath)) {
      return ok(undefined)
    }

    try {
      await rm(cachePath, {recursive: true, force: true})
      logger.debug(`Removed cache entry: ${source.location}`)
      return ok(undefined)
    } catch (error) {
      return err(
        createTemplateError(
          `Failed to remove cache entry: ${error instanceof Error ? error.message : String(error)}`,
          TemplateErrorCode.TEMPLATE_CACHE_ERROR,
          {source},
        ),
      )
    }
  }

  /**
   * Clear entire cache
   */
  async function clear(): Promise<Result<void>> {
    if (!existsSync(currentConfig.dir)) {
      return ok(undefined)
    }

    try {
      await rm(currentConfig.dir, {recursive: true, force: true})
      logger.info('Template cache cleared')

      stats = {
        hits: 0,
        misses: 0,
        entries: 0,
        size: 0,
        hitRatio: 0,
      }

      return ok(undefined)
    } catch (error) {
      return err(
        createTemplateError(
          `Failed to clear cache: ${error instanceof Error ? error.message : String(error)}`,
          TemplateErrorCode.TEMPLATE_CACHE_ERROR,
        ),
      )
    }
  }

  /**
   * Get cache statistics
   */
  async function getStats(): Promise<CacheStats> {
    if (!currentConfig.enabled || !existsSync(currentConfig.dir)) {
      return {...stats, entries: 0, size: 0}
    }

    try {
      const {readdir, stat} = await import('node:fs/promises')
      const entries = await readdir(currentConfig.dir)

      let totalSize = 0
      for (const entry of entries) {
        const entryPath = path.join(currentConfig.dir, entry)
        try {
          const entryStats = await stat(entryPath)
          totalSize += entryStats.size
        } catch {
          // Ignore individual stat errors
        }
      }

      stats.entries = entries.length
      stats.size = totalSize

      return {...stats}
    } catch {
      return {...stats, entries: 0, size: 0}
    }
  }

  /**
   * Get cache configuration
   */
  function getConfig(): Readonly<TemplateCacheConfig> {
    return {...currentConfig}
  }

  /**
   * Update cache configuration
   */
  function updateConfig(newConfig: Partial<TemplateCacheConfig>): void {
    currentConfig = {...currentConfig, ...newConfig}
  }

  /**
   * Cleanup expired entries
   */
  async function cleanup(): Promise<Result<number>> {
    if (!currentConfig.enabled || !existsSync(currentConfig.dir)) {
      return ok(0)
    }

    try {
      const {readdir} = await import('node:fs/promises')
      const entries = await readdir(currentConfig.dir)
      let removed = 0

      for (const entry of entries) {
        const entryPath = path.join(currentConfig.dir, entry)
        const metaPath = path.join(entryPath, '.cache-meta.json')

        if (!existsSync(metaPath)) continue

        try {
          const metaContent = await readFile(metaPath, 'utf-8')
          const meta = JSON.parse(metaContent) as CacheEntryMeta

          if (isExpired(meta)) {
            await rm(entryPath, {recursive: true, force: true})
            removed++
          }
        } catch {
          // Ignore individual entry errors
        }
      }

      logger.info(`Cleaned up ${removed} expired cache entries`)
      return ok(removed)
    } catch (error) {
      return err(
        createTemplateError(
          `Failed to cleanup cache: ${error instanceof Error ? error.message : String(error)}`,
          TemplateErrorCode.TEMPLATE_CACHE_ERROR,
        ),
      )
    }
  }

  return {
    get,
    set,
    has,
    remove,
    clear,
    getStats,
    getConfig,
    updateConfig,
    cleanup,
  }
}

/**
 * Creates a memoized function for template operations.
 *
 * This utility function wraps any async template operation with
 * memoization using @bfra.me/es/functional patterns.
 *
 * @param fn - The function to memoize
 * @param keyResolver - Function to generate cache key from arguments
 * @param options - Memoization options
 * @returns A memoized version of the function
 *
 * @example
 * ```typescript
 * const memoizedFetch = createMemoizedTemplateOperation(
 *   async (source: TemplateSource) => fetchTemplate(source),
 *   (source) => `${source.type}-${source.location}`,
 *   {maxAge: 60000} // 1 minute
 * )
 *
 * const result = await memoizedFetch(source)
 * ```
 */
export function createMemoizedTemplateOperation<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>,
  keyResolver: (args: TArgs) => string,
  options?: Omit<MemoizeOptions, 'keyResolver'>,
): (...args: TArgs) => Promise<TReturn> {
  const memoizedFn = memoize(fn, {
    keyResolver: (args: unknown[]) => keyResolver(args as TArgs),
    ...options,
  })

  return memoizedFn
}

/**
 * Default template cache instance
 */
export const templateCache = createTemplateCache()
