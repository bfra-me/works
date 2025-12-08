/**
 * Cache module exports for workspace analyzer.
 *
 * Provides caching infrastructure for incremental analysis including
 * file hashing, change detection, and cache management.
 */

// Cache manager
export {collectConfigFileStates, createCacheManager, initializeCache} from './cache-manager'

export type {CacheError, CacheErrorCode, CacheManager, CacheManagerOptions} from './cache-manager'

// Cache schema types and utilities
export {
  CACHE_SCHEMA_VERSION,
  CONFIG_FILE_PATTERNS,
  createEmptyCache,
  createFileAnalysisEntry,
  createPackageAnalysisEntry,
  DEFAULT_CACHE_OPTIONS,
} from './cache-schema'

export type {
  AnalysisCache,
  CachedFileAnalysis,
  CachedFileState,
  CachedPackageAnalysis,
  CacheMetadata,
  CacheOptions,
  CacheStatistics,
  CacheValidationResult,
} from './cache-schema'

// Change detector utilities
export {createAnalysisChangeDetector, createChangeDetector} from './change-detector'

export type {
  AnalysisChangeDetector,
  AnalysisChangeDetectorOptions,
  ChangeDetector,
  ChangeDetectorOptions,
} from './change-detector'

// File hasher utilities
export {createFileHasher, createWorkspaceHasher} from './file-hasher'

export type {FileHasher, WorkspaceFileHasher, WorkspaceHasherOptions} from './file-hasher'
