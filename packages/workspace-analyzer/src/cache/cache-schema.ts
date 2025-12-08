/**
 * Cache schema types for workspace analyzer incremental analysis.
 *
 * These types define the structure for storing and retrieving analysis results
 * to enable efficient incremental analysis on large codebases.
 */

import type {Issue} from '../types/index'

/**
 * Schema version for cache format migration.
 * Increment when making breaking changes to cache structure.
 */
export const CACHE_SCHEMA_VERSION = 1

/**
 * Metadata about a cached file's state at analysis time.
 */
export interface CachedFileState {
  /** Absolute file path */
  readonly path: string
  /** Content hash (SHA-256) at time of analysis */
  readonly contentHash: string
  /** File modification timestamp (ISO 8601) */
  readonly modifiedAt: string
  /** File size in bytes */
  readonly size: number
}

/**
 * Metadata about a cached analysis run.
 */
export interface CacheMetadata {
  /** Cache schema version for migration support */
  readonly version: number
  /** Workspace root path that was analyzed */
  readonly workspacePath: string
  /** Timestamp when the cache was created (ISO 8601) */
  readonly createdAt: string
  /** Timestamp when the cache was last updated (ISO 8601) */
  readonly updatedAt: string
  /** Hash of the analyzer configuration */
  readonly configHash: string
  /** Workspace analyzer package version */
  readonly analyzerVersion: string
}

/**
 * A cached analysis result for a single file.
 */
export interface CachedFileAnalysis {
  /** File state at time of analysis */
  readonly fileState: CachedFileState
  /** Issues found in this file */
  readonly issues: readonly Issue[]
  /** Analyzer IDs that processed this file */
  readonly analyzersRun: readonly string[]
  /** Analysis timestamp (ISO 8601) */
  readonly analyzedAt: string
}

/**
 * A cached package-level analysis result.
 */
export interface CachedPackageAnalysis {
  /** Package name */
  readonly packageName: string
  /** Package path relative to workspace root */
  readonly packagePath: string
  /** Hash of package.json content */
  readonly packageJsonHash: string
  /** Issues found at the package level */
  readonly issues: readonly Issue[]
  /** Analyzer IDs that processed this package */
  readonly analyzersRun: readonly string[]
  /** Analysis timestamp (ISO 8601) */
  readonly analyzedAt: string
}

/**
 * Complete analysis cache for a workspace.
 */
export interface AnalysisCache {
  /** Cache metadata */
  readonly metadata: CacheMetadata
  /** Per-file analysis results indexed by file path */
  readonly files: Readonly<Record<string, CachedFileAnalysis>>
  /** Per-package analysis results indexed by package name */
  readonly packages: Readonly<Record<string, CachedPackageAnalysis>>
  /** Workspace-level issues not tied to specific files */
  readonly workspaceIssues: readonly Issue[]
  /** Configuration files state for invalidation detection */
  readonly configFiles: readonly CachedFileState[]
}

/**
 * Result of cache validation check.
 */
export interface CacheValidationResult {
  /** Whether the cache is valid and can be used */
  readonly isValid: boolean
  /** Files that have changed since last analysis */
  readonly changedFiles: readonly string[]
  /** Files that are new since last analysis */
  readonly newFiles: readonly string[]
  /** Files that were deleted since last analysis */
  readonly deletedFiles: readonly string[]
  /** Packages that need re-analysis */
  readonly invalidatedPackages: readonly string[]
  /** Configuration files that changed (triggers full invalidation) */
  readonly changedConfigFiles: readonly string[]
  /** Reason for invalidation if not valid */
  readonly invalidationReason?: string
}

/**
 * Options for cache operations.
 */
export interface CacheOptions {
  /** Directory path for cache storage (default: .workspace-analyzer-cache) */
  readonly cacheDir?: string
  /** Maximum cache age in milliseconds (default: 7 days) */
  readonly maxAge?: number
  /** Whether to compress cache files (default: true) */
  readonly compress?: boolean
  /** Hash algorithm for file content (default: sha256) */
  readonly hashAlgorithm?: 'sha256' | 'md5'
}

/**
 * Statistics about cache usage.
 */
export interface CacheStatistics {
  /** Number of cached files */
  readonly cachedFiles: number
  /** Number of cached packages */
  readonly cachedPackages: number
  /** Total cache size in bytes */
  readonly totalSizeBytes: number
  /** Cache age in milliseconds */
  readonly ageMs: number
  /** Number of cache hits during last analysis */
  readonly hitCount: number
  /** Number of cache misses during last analysis */
  readonly missCount: number
  /** Cache hit rate (0-1) */
  readonly hitRate: number
}

/**
 * Configuration file patterns for cache invalidation.
 * Changes to these files trigger re-analysis of affected areas.
 */
export const CONFIG_FILE_PATTERNS: readonly string[] = [
  'package.json',
  'tsconfig.json',
  'tsconfig.*.json',
  'eslint.config.ts',
  'eslint.config.js',
  'eslint.config.mjs',
  '.eslintrc.*',
  'tsup.config.ts',
  'tsup.config.js',
  'vitest.config.ts',
  'vitest.config.js',
  'workspace-analyzer.config.ts',
  'workspace-analyzer.config.js',
]

/**
 * Default cache options.
 */
export const DEFAULT_CACHE_OPTIONS: Required<CacheOptions> = {
  cacheDir: '.workspace-analyzer-cache',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  compress: true,
  hashAlgorithm: 'sha256',
} as const

/**
 * Creates an empty analysis cache with default metadata.
 */
export function createEmptyCache(
  workspacePath: string,
  configHash: string,
  analyzerVersion: string,
): AnalysisCache {
  const now = new Date().toISOString()
  return {
    metadata: {
      version: CACHE_SCHEMA_VERSION,
      workspacePath,
      createdAt: now,
      updatedAt: now,
      configHash,
      analyzerVersion,
    },
    files: {},
    packages: {},
    workspaceIssues: [],
    configFiles: [],
  }
}

/**
 * Creates a cache entry for a file analysis result.
 */
export function createFileAnalysisEntry(
  path: string,
  contentHash: string,
  modifiedAt: Date,
  size: number,
  issues: readonly Issue[],
  analyzersRun: readonly string[],
): CachedFileAnalysis {
  return {
    fileState: {
      path,
      contentHash,
      modifiedAt: modifiedAt.toISOString(),
      size,
    },
    issues,
    analyzersRun,
    analyzedAt: new Date().toISOString(),
  }
}

/**
 * Creates a cache entry for a package analysis result.
 */
export function createPackageAnalysisEntry(
  packageName: string,
  packagePath: string,
  packageJsonHash: string,
  issues: readonly Issue[],
  analyzersRun: readonly string[],
): CachedPackageAnalysis {
  return {
    packageName,
    packagePath,
    packageJsonHash,
    issues,
    analyzersRun,
    analyzedAt: new Date().toISOString(),
  }
}
