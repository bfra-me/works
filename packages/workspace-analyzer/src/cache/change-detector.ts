/**
 * Change detector for incremental analysis.
 *
 * Re-exports from @bfra.me/es/watcher with workspace-analyzer-specific utilities.
 */

import type {ChangeDetector, ChangeDetectorOptions} from '@bfra.me/es/watcher'
import type {CachedFileState, CacheValidationResult} from './cache-schema'
import {createChangeDetector} from '@bfra.me/es/watcher'

import {createWorkspaceHasher} from './file-hasher'

// Re-export the core change detector
export {createChangeDetector}
export type {ChangeDetector, ChangeDetectorOptions}

/**
 * Options for creating an analysis change detector.
 */
export interface AnalysisChangeDetectorOptions extends ChangeDetectorOptions {
  /** Configuration file patterns to monitor for invalidation */
  readonly configFilePatterns?: readonly string[]
}

/**
 * Extended change detector for workspace analysis.
 */
export interface AnalysisChangeDetector extends ChangeDetector {
  /** Validate cache against current file states */
  readonly validateCache: (
    cachedFiles: readonly CachedFileState[],
    currentFiles: readonly string[],
  ) => Promise<CacheValidationResult>
  /** Get all recorded file paths */
  readonly getRecordedPaths: () => readonly string[]
  /** Check if configuration files have changed */
  readonly hasConfigChanged: (configFiles: readonly CachedFileState[]) => Promise<boolean>
}

/**
 * Creates an extended change detector for workspace analysis.
 *
 * @param options - Change detector configuration options
 * @returns An AnalysisChangeDetector instance
 *
 * @example
 * ```ts
 * const detector = createAnalysisChangeDetector()
 *
 * // Record initial file state
 * await detector.record('src/index.ts')
 *
 * // Later, validate cache
 * const validation = await detector.validateCache(
 *   cachedFileStates,
 *   currentFilePaths
 * )
 *
 * if (!validation.isValid) {
 *   console.log('Cache invalid:', validation.invalidationReason)
 * }
 * ```
 */
export function createAnalysisChangeDetector(
  options: AnalysisChangeDetectorOptions = {},
): AnalysisChangeDetector {
  const baseDetector = createChangeDetector(options)
  const hasher = createWorkspaceHasher({algorithm: options.algorithm})
  const recordedPaths = new Set<string>()

  return {
    async hasChanged(path: string): Promise<boolean> {
      return baseDetector.hasChanged(path)
    },

    async record(path: string): Promise<void> {
      recordedPaths.add(path)
      return baseDetector.record(path)
    },

    clear(path: string): void {
      recordedPaths.delete(path)
      baseDetector.clear(path)
    },

    clearAll(): void {
      recordedPaths.clear()
      baseDetector.clearAll()
    },

    getRecordedPaths(): readonly string[] {
      return Array.from(recordedPaths)
    },

    async validateCache(
      cachedFiles: readonly CachedFileState[],
      currentFiles: readonly string[],
    ): Promise<CacheValidationResult> {
      const cachedPaths = new Set(cachedFiles.map(f => f.path))
      const currentPaths = new Set(currentFiles)

      const changedFiles: string[] = []
      const newFiles: string[] = []
      const deletedFiles: string[] = []

      // Check for new files
      for (const path of currentPaths) {
        if (!cachedPaths.has(path)) {
          newFiles.push(path)
        }
      }

      // Check for deleted and changed files
      for (const cached of cachedFiles) {
        if (!currentPaths.has(cached.path)) {
          deletedFiles.push(cached.path)
          continue
        }

        // Check if file content has changed
        try {
          const currentHash = await hasher.hash(cached.path)
          if (currentHash !== cached.contentHash) {
            changedFiles.push(cached.path)
          }
        } catch {
          // File might have been deleted or inaccessible
          deletedFiles.push(cached.path)
        }
      }

      const hasChanges = changedFiles.length > 0 || newFiles.length > 0 || deletedFiles.length > 0

      let invalidationReason: string | undefined
      if (hasChanges) {
        const reasons: string[] = []
        if (changedFiles.length > 0) reasons.push(`${changedFiles.length} files changed`)
        if (newFiles.length > 0) reasons.push(`${newFiles.length} new files`)
        if (deletedFiles.length > 0) reasons.push(`${deletedFiles.length} files deleted`)
        invalidationReason = reasons.join(', ')
      }

      return {
        isValid: !hasChanges,
        changedFiles,
        newFiles,
        deletedFiles,
        invalidatedPackages: [], // Computed by cache manager based on file paths
        changedConfigFiles: [],
        invalidationReason,
      }
    },

    async hasConfigChanged(configFiles: readonly CachedFileState[]): Promise<boolean> {
      for (const config of configFiles) {
        try {
          const currentHash = await hasher.hash(config.path)
          if (currentHash !== config.contentHash) {
            return true
          }
        } catch {
          // Config file was deleted or inaccessible = changed
          return true
        }
      }
      return false
    },
  }
}
