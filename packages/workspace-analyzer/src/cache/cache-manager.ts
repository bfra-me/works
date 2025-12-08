/**
 * Cache manager for workspace analysis results.
 *
 * Provides file-based storage for analysis caches with incremental updates,
 * compression support, and automatic invalidation.
 */

import type {Issue} from '../types/index'
import type {Result} from '../types/result'
import type {
  AnalysisCache,
  CachedFileState,
  CacheOptions,
  CacheStatistics,
  CacheValidationResult,
} from './cache-schema'
import {Buffer} from 'node:buffer'
import {mkdir, readFile, rm, stat, writeFile} from 'node:fs/promises'
import {join} from 'node:path'
import {promisify} from 'node:util'
import {gunzip, gzip} from 'node:zlib'
import {err, ok} from '../types/result'
import {
  CACHE_SCHEMA_VERSION,
  CONFIG_FILE_PATTERNS,
  createEmptyCache,
  createFileAnalysisEntry,
  createPackageAnalysisEntry,
  DEFAULT_CACHE_OPTIONS,
} from './cache-schema'
import {createAnalysisChangeDetector} from './change-detector'
import {createWorkspaceHasher} from './file-hasher'

const gzipAsync = promisify(gzip)
const gunzipAsync = promisify(gunzip)

/**
 * Cache file name.
 */
const CACHE_FILE_NAME = 'analysis-cache.json'
const COMPRESSED_CACHE_FILE_NAME = 'analysis-cache.json.gz'

/**
 * Error codes for cache operations.
 */
export type CacheErrorCode =
  | 'CACHE_NOT_FOUND'
  | 'CACHE_CORRUPTED'
  | 'CACHE_EXPIRED'
  | 'CACHE_VERSION_MISMATCH'
  | 'CACHE_WRITE_FAILED'
  | 'CACHE_READ_FAILED'
  | 'CACHE_INVALID'

/**
 * Error for cache operations.
 */
export interface CacheError {
  readonly code: CacheErrorCode
  readonly message: string
  readonly cause?: Error
}

/**
 * Cache manager for workspace analysis.
 */
export interface CacheManager {
  /** Load cache from disk */
  readonly load: () => Promise<Result<AnalysisCache, CacheError>>
  /** Save cache to disk */
  readonly save: (cache: AnalysisCache) => Promise<Result<void, CacheError>>
  /** Validate cache against current workspace state */
  readonly validate: (
    cache: AnalysisCache,
    currentFiles: readonly string[],
  ) => Promise<CacheValidationResult>
  /** Update cache with new file analysis */
  readonly updateFile: (
    cache: AnalysisCache,
    path: string,
    issues: readonly Issue[],
    analyzersRun: readonly string[],
  ) => Promise<Result<AnalysisCache, CacheError>>
  /** Update cache with new package analysis */
  readonly updatePackage: (
    cache: AnalysisCache,
    packageName: string,
    packagePath: string,
    issues: readonly Issue[],
    analyzersRun: readonly string[],
  ) => Promise<Result<AnalysisCache, CacheError>>
  /** Clear all cache files */
  readonly clear: () => Promise<Result<void, CacheError>>
  /** Get cache statistics */
  readonly getStatistics: (cache: AnalysisCache) => CacheStatistics
  /** Check if cache is valid without full validation */
  readonly quickValidate: (cache: AnalysisCache, configHash: string) => boolean
}

/**
 * Options for creating a cache manager.
 */
export interface CacheManagerOptions extends CacheOptions {
  /** Workspace root path */
  readonly workspacePath: string
  /** Current analyzer version */
  readonly analyzerVersion: string
}

/**
 * Creates a cache manager for workspace analysis.
 *
 * @param options - Cache manager configuration
 * @returns A CacheManager instance
 *
 * @example
 * ```ts
 * const manager = createCacheManager({
 *   workspacePath: '/path/to/workspace',
 *   analyzerVersion: '1.0.0',
 * })
 *
 * const result = await manager.load()
 * if (isOk(result)) {
 *   const validation = await manager.validate(result.data, currentFiles)
 *   if (!validation.isValid) {
 *     // Re-analyze changed files
 *   }
 * }
 * ```
 */
export function createCacheManager(options: CacheManagerOptions): CacheManager {
  const {
    workspacePath,
    analyzerVersion,
    cacheDir = DEFAULT_CACHE_OPTIONS.cacheDir,
    maxAge = DEFAULT_CACHE_OPTIONS.maxAge,
    compress = DEFAULT_CACHE_OPTIONS.compress,
    hashAlgorithm = DEFAULT_CACHE_OPTIONS.hashAlgorithm,
  } = options

  const cachePath = join(workspacePath, cacheDir)
  const cacheFile = join(cachePath, compress ? COMPRESSED_CACHE_FILE_NAME : CACHE_FILE_NAME)
  const hasher = createWorkspaceHasher({algorithm: hashAlgorithm})
  const changeDetector = createAnalysisChangeDetector({algorithm: hashAlgorithm})

  async function ensureCacheDir(): Promise<void> {
    await mkdir(cachePath, {recursive: true})
  }

  async function readCacheFile(): Promise<Result<string, CacheError>> {
    try {
      const content = await readFile(cacheFile)
      if (compress) {
        const decompressed = await gunzipAsync(content)
        return ok(decompressed.toString('utf-8'))
      }
      return ok(content.toString('utf-8'))
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return err({code: 'CACHE_NOT_FOUND', message: 'Cache file not found'})
      }
      return err({
        code: 'CACHE_READ_FAILED',
        message: `Failed to read cache file: ${(error as Error).message}`,
        cause: error as Error,
      })
    }
  }

  async function writeCacheFile(content: string): Promise<Result<void, CacheError>> {
    try {
      await ensureCacheDir()
      const buffer = Buffer.from(content, 'utf-8')
      const data = compress ? await gzipAsync(buffer) : buffer
      await writeFile(cacheFile, data)
      return ok(undefined)
    } catch (error) {
      return err({
        code: 'CACHE_WRITE_FAILED',
        message: `Failed to write cache file: ${(error as Error).message}`,
        cause: error as Error,
      })
    }
  }

  async function getFileState(path: string): Promise<CachedFileState> {
    const stats = await stat(path)
    const contentHash = await hasher.hash(path)
    return {
      path,
      contentHash,
      modifiedAt: stats.mtime.toISOString(),
      size: stats.size,
    }
  }

  return {
    async load(): Promise<Result<AnalysisCache, CacheError>> {
      const readResult = await readCacheFile()
      if (readResult.success === false) {
        return readResult
      }

      try {
        const cache = JSON.parse(readResult.data) as AnalysisCache
        const cacheVersion = cache.metadata.version

        // Version check
        if (cacheVersion !== CACHE_SCHEMA_VERSION) {
          return err({
            code: 'CACHE_VERSION_MISMATCH',
            message: `Cache version ${String(cacheVersion)} does not match current version ${String(CACHE_SCHEMA_VERSION)}`,
          })
        }

        // Age check
        const cacheAge = Date.now() - new Date(cache.metadata.createdAt).getTime()
        if (cacheAge > maxAge) {
          return err({
            code: 'CACHE_EXPIRED',
            message: `Cache is ${Math.round(cacheAge / 1000 / 60 / 60 / 24)} days old (max: ${Math.round(maxAge / 1000 / 60 / 60 / 24)} days)`,
          })
        }

        return ok(cache)
      } catch (error) {
        return err({
          code: 'CACHE_CORRUPTED',
          message: `Failed to parse cache file: ${(error as Error).message}`,
          cause: error as Error,
        })
      }
    },

    async save(cache: AnalysisCache): Promise<Result<void, CacheError>> {
      const updatedCache: AnalysisCache = {
        ...cache,
        metadata: {
          ...cache.metadata,
          updatedAt: new Date().toISOString(),
        },
      }
      const content = JSON.stringify(updatedCache, null, compress ? 0 : 2)
      return writeCacheFile(content)
    },

    async validate(
      cache: AnalysisCache,
      currentFiles: readonly string[],
    ): Promise<CacheValidationResult> {
      // Check for config file changes first (full invalidation)
      const configChanged = await changeDetector.hasConfigChanged(cache.configFiles)
      if (configChanged) {
        return {
          isValid: false,
          changedFiles: [],
          newFiles: [],
          deletedFiles: [],
          invalidatedPackages: [],
          changedConfigFiles: cache.configFiles.map(f => f.path),
          invalidationReason: 'Configuration files changed',
        }
      }

      // Validate individual files
      const cachedFileStates = Object.values(cache.files).map(f => f.fileState)
      const validation = await changeDetector.validateCache(cachedFileStates, currentFiles)

      // Determine which packages are affected by changed files
      const affectedPackages = new Set<string>()
      const allChangedPaths = [
        ...validation.changedFiles,
        ...validation.newFiles,
        ...validation.deletedFiles,
      ]

      for (const changedPath of allChangedPaths) {
        // Find package containing this file
        for (const [pkgName, pkg] of Object.entries(cache.packages)) {
          const pkgFullPath = join(workspacePath, pkg.packagePath)
          if (changedPath.startsWith(pkgFullPath)) {
            affectedPackages.add(pkgName)
            break
          }
        }
      }

      return {
        ...validation,
        invalidatedPackages: Array.from(affectedPackages),
      }
    },

    async updateFile(
      cache: AnalysisCache,
      path: string,
      issues: readonly Issue[],
      analyzersRun: readonly string[],
    ): Promise<Result<AnalysisCache, CacheError>> {
      try {
        const fileState = await getFileState(path)
        const entry = createFileAnalysisEntry(
          path,
          fileState.contentHash,
          new Date(fileState.modifiedAt),
          fileState.size,
          issues,
          analyzersRun,
        )

        return ok({
          ...cache,
          files: {
            ...cache.files,
            [path]: entry,
          },
          metadata: {
            ...cache.metadata,
            updatedAt: new Date().toISOString(),
          },
        })
      } catch (error) {
        return err({
          code: 'CACHE_WRITE_FAILED',
          message: `Failed to update cache for file ${path}: ${(error as Error).message}`,
          cause: error as Error,
        })
      }
    },

    async updatePackage(
      cache: AnalysisCache,
      packageName: string,
      packagePath: string,
      issues: readonly Issue[],
      analyzersRun: readonly string[],
    ): Promise<Result<AnalysisCache, CacheError>> {
      try {
        const packageJsonPath = join(workspacePath, packagePath, 'package.json')
        const packageJsonHash = await hasher.hash(packageJsonPath)
        const entry = createPackageAnalysisEntry(
          packageName,
          packagePath,
          packageJsonHash,
          issues,
          analyzersRun,
        )

        return ok({
          ...cache,
          packages: {
            ...cache.packages,
            [packageName]: entry,
          },
          metadata: {
            ...cache.metadata,
            updatedAt: new Date().toISOString(),
          },
        })
      } catch (error) {
        return err({
          code: 'CACHE_WRITE_FAILED',
          message: `Failed to update cache for package ${packageName}: ${(error as Error).message}`,
          cause: error as Error,
        })
      }
    },

    async clear(): Promise<Result<void, CacheError>> {
      try {
        await rm(cachePath, {recursive: true, force: true})
        return ok(undefined)
      } catch (error) {
        return err({
          code: 'CACHE_WRITE_FAILED',
          message: `Failed to clear cache: ${(error as Error).message}`,
          cause: error as Error,
        })
      }
    },

    getStatistics(cache: AnalysisCache): CacheStatistics {
      const cachedFiles = Object.keys(cache.files).length
      const cachedPackages = Object.keys(cache.packages).length
      const ageMs = Date.now() - new Date(cache.metadata.createdAt).getTime()

      // Calculate total cache size (approximate)
      const fileIssueCount = Object.values(cache.files).reduce((sum, f) => sum + f.issues.length, 0)
      const packageIssueCount = Object.values(cache.packages).reduce(
        (sum, p) => sum + p.issues.length,
        0,
      )
      const totalSizeBytes = (fileIssueCount + packageIssueCount) * 200 + cachedFiles * 100

      return {
        cachedFiles,
        cachedPackages,
        totalSizeBytes,
        ageMs,
        hitCount: 0, // Updated during analysis
        missCount: 0, // Updated during analysis
        hitRate: 0, // Calculated: hitCount / (hitCount + missCount)
      }
    },

    quickValidate(cache: AnalysisCache, configHash: string): boolean {
      // Quick checks without file system access
      if (cache.metadata.version !== CACHE_SCHEMA_VERSION) return false
      if (cache.metadata.workspacePath !== workspacePath) return false
      if (cache.metadata.analyzerVersion !== analyzerVersion) return false
      if (cache.metadata.configHash !== configHash) return false

      const cacheAge = Date.now() - new Date(cache.metadata.createdAt).getTime()
      if (cacheAge > maxAge) return false

      return true
    },
  }
}

/**
 * Creates an empty cache for a workspace.
 *
 * @param workspacePath - Workspace root path
 * @param configHash - Hash of the current configuration
 * @param analyzerVersion - Current analyzer version
 * @returns A new empty AnalysisCache
 */
export function initializeCache(
  workspacePath: string,
  configHash: string,
  analyzerVersion: string,
): AnalysisCache {
  return createEmptyCache(workspacePath, configHash, analyzerVersion)
}

/**
 * Collects configuration file states for cache invalidation tracking.
 *
 * @param workspacePath - Workspace root path
 * @param packagePaths - Package directory paths (relative to workspace)
 * @returns Array of configuration file states
 */
export async function collectConfigFileStates(
  workspacePath: string,
  packagePaths: readonly string[],
): Promise<CachedFileState[]> {
  const hasher = createWorkspaceHasher()
  const configFiles: CachedFileState[] = []

  // Collect workspace-level config files
  for (const pattern of CONFIG_FILE_PATTERNS) {
    // Simple pattern matching (no glob wildcards for now)
    if (!pattern.includes('*')) {
      const configPath = join(workspacePath, pattern)
      try {
        const stats = await stat(configPath)
        const contentHash = await hasher.hash(configPath)
        configFiles.push({
          path: configPath,
          contentHash,
          modifiedAt: stats.mtime.toISOString(),
          size: stats.size,
        })
      } catch {
        // Config file doesn't exist, skip
      }
    }
  }

  // Collect package-level config files
  for (const pkgPath of packagePaths) {
    const fullPkgPath = join(workspacePath, pkgPath)
    for (const pattern of CONFIG_FILE_PATTERNS) {
      if (!pattern.includes('*')) {
        const configPath = join(fullPkgPath, pattern)
        try {
          const stats = await stat(configPath)
          const contentHash = await hasher.hash(configPath)
          configFiles.push({
            path: configPath,
            contentHash,
            modifiedAt: stats.mtime.toISOString(),
            size: stats.size,
          })
        } catch {
          // Config file doesn't exist, skip
        }
      }
    }
  }

  return configFiles
}
