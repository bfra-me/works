/**
 * Incremental analyzer orchestrator for workspace analysis.
 *
 * Provides efficient incremental analysis by leveraging file change detection,
 * cache management, and parallel execution for large codebase performance.
 */

import type {
  Analyzer,
  AnalyzerError,
  AnalysisContext as BaseAnalysisContext,
} from '../analyzers/analyzer'
import type {AnalysisCache, CacheValidationResult} from '../cache/cache-schema'
import type {WorkspacePackage} from '../scanner/workspace-scanner'
import type {AnalysisProgress, Issue, Severity} from '../types/index'
import type {Result} from '../types/result'
import process from 'node:process'
import {pLimit} from '@bfra.me/es/async'
import {consola} from 'consola'
import {collectConfigFileStates, createCacheManager, initializeCache} from '../cache/cache-manager'
import {createWorkspaceHasher} from '../cache/file-hasher'
import {err, ok} from '../types/result'

/**
 * Options for incremental analysis.
 */
export interface IncrementalAnalysisOptions {
  /** Workspace root path */
  readonly workspacePath: string
  /** Current analyzer version (for cache invalidation) */
  readonly analyzerVersion: string
  /** Whether to use caching (default: true) */
  readonly useCache?: boolean
  /** Maximum number of concurrent file analyses (default: 4) */
  readonly concurrency?: number
  /** Maximum cache age in milliseconds (default: 7 days) */
  readonly maxCacheAge?: number
  /** Minimum severity to report (default: 'info') */
  readonly minSeverity?: Severity
  /** Progress callback for reporting */
  readonly onProgress?: (progress: AnalysisProgress) => void
  /** Cache directory (default: .workspace-analyzer-cache) */
  readonly cacheDir?: string
  /** Hash algorithm for file content (default: sha256) */
  readonly hashAlgorithm?: 'sha256' | 'md5'
}

/**
 * Error codes for incremental analysis.
 */
export type IncrementalAnalysisErrorCode =
  | 'SCAN_FAILED'
  | 'ANALYSIS_FAILED'
  | 'CACHE_ERROR'
  | 'ANALYZER_ERROR'
  | 'TIMEOUT'

/**
 * Error for incremental analysis operations.
 */
export interface IncrementalAnalysisError {
  readonly code: IncrementalAnalysisErrorCode
  readonly message: string
  readonly cause?: Error
}

/**
 * Result of incremental analysis.
 */
export interface IncrementalAnalysisResult {
  /** All issues found */
  readonly issues: readonly Issue[]
  /** Number of files analyzed (not from cache) */
  readonly filesAnalyzed: number
  /** Number of files loaded from cache */
  readonly filesFromCache: number
  /** Number of packages analyzed */
  readonly packagesAnalyzed: number
  /** Analysis duration in milliseconds */
  readonly durationMs: number
  /** Whether cache was used */
  readonly cacheUsed: boolean
  /** Cache statistics after analysis */
  readonly cacheStats?: {
    readonly hitRate: number
    readonly hitCount: number
    readonly missCount: number
  }
}

/**
 * Extended analysis context with incremental analysis metadata.
 */
export interface IncrementalAnalysisContext {
  /** Workspace root path */
  readonly workspacePath: string
  /** All source files in the workspace */
  readonly files: readonly string[]
  /** Package paths (relative to workspace root) */
  readonly packagePaths: readonly string[]
  /** Configuration hash for cache invalidation */
  readonly configHash: string
  /** Current cache state (if available) */
  readonly cache?: AnalysisCache
  /** Files that need fresh analysis */
  readonly filesToAnalyze: readonly string[]
  /** Files that can use cached results */
  readonly cachedFiles: readonly string[]
  /** Progress reporter */
  readonly reportProgress: (current: string, processed: number, total?: number) => void
}

/**
 * Incremental analyzer orchestrator.
 */
export interface IncrementalAnalyzer {
  /** Run incremental analysis on the workspace */
  readonly analyze: (
    files: readonly string[],
    packages: readonly WorkspacePackage[],
    analyzers: readonly Analyzer[],
  ) => Promise<Result<IncrementalAnalysisResult, IncrementalAnalysisError>>
  /** Invalidate cache for specific files */
  readonly invalidateFiles: (paths: readonly string[]) => Promise<void>
  /** Clear the entire cache */
  readonly clearCache: () => Promise<Result<void, IncrementalAnalysisError>>
  /** Get current cache statistics */
  readonly getCacheStats: () => Promise<
    Result<{cachedFiles: number; cachedPackages: number; ageMs: number}, IncrementalAnalysisError>
  >
}

/**
 * Default options for incremental analysis.
 */
export const DEFAULT_INCREMENTAL_OPTIONS = {
  useCache: true,
  concurrency: 4,
  maxCacheAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  minSeverity: 'info' as Severity,
  cacheDir: '.workspace-analyzer-cache',
  hashAlgorithm: 'sha256' as const,
} as const

/**
 * Creates an incremental analyzer orchestrator.
 *
 * @param options - Incremental analysis configuration
 * @returns An IncrementalAnalyzer instance
 *
 * @example
 * ```ts
 * const analyzer = createIncrementalAnalyzer({
 *   workspacePath: '/path/to/workspace',
 *   analyzerVersion: '1.0.0',
 *   onProgress: (progress) => {
 *     console.error(`${progress.phase}: ${progress.processed}/${progress.total}`)
 *   },
 * })
 *
 * const result = await analyzer.analyze(files, packages, analyzers)
 * if (result.success) {
 *   console.error(`Found ${result.data.issues.length} issues`)
 * }
 * ```
 */
export function createIncrementalAnalyzer(
  options: IncrementalAnalysisOptions,
): IncrementalAnalyzer {
  const {
    workspacePath,
    analyzerVersion,
    useCache = DEFAULT_INCREMENTAL_OPTIONS.useCache,
    concurrency = DEFAULT_INCREMENTAL_OPTIONS.concurrency,
    maxCacheAge = DEFAULT_INCREMENTAL_OPTIONS.maxCacheAge,
    minSeverity = DEFAULT_INCREMENTAL_OPTIONS.minSeverity,
    onProgress,
    cacheDir = DEFAULT_INCREMENTAL_OPTIONS.cacheDir,
    hashAlgorithm = DEFAULT_INCREMENTAL_OPTIONS.hashAlgorithm,
  } = options

  const hasher = createWorkspaceHasher({algorithm: hashAlgorithm})
  const cacheManager = createCacheManager({
    workspacePath,
    analyzerVersion,
    cacheDir,
    maxAge: maxCacheAge,
    hashAlgorithm,
  })

  const limit = pLimit(concurrency)

  function reportProgress(
    phase: AnalysisProgress['phase'],
    current: string,
    processed: number,
    total?: number,
  ): void {
    onProgress?.({phase, current, processed, total})
  }

  async function computeConfigHash(packagePaths: readonly string[]): Promise<string> {
    try {
      const configFiles = await collectConfigFileStates(workspacePath, packagePaths)
      const hashes = configFiles.map(f => f.contentHash)
      return hasher.hashContent(hashes.join(':'))
    } catch {
      return hasher.hashContent(Date.now().toString())
    }
  }

  return {
    async analyze(
      files: readonly string[],
      packages: readonly WorkspacePackage[],
      analyzers: readonly Analyzer[],
    ): Promise<Result<IncrementalAnalysisResult, IncrementalAnalysisError>> {
      const startTime = Date.now()
      let cache: AnalysisCache | undefined
      let validation: CacheValidationResult | undefined
      let cacheUsed = false
      let hitCount = 0
      let missCount = 0

      const packagePaths = packages.map(p => p.packagePath)
      reportProgress('scanning', workspacePath, 0, files.length)

      const configHash = await computeConfigHash(packagePaths)

      // Load and validate cache
      if (useCache) {
        const cacheResult = await cacheManager.load()
        if (cacheResult.success && cacheManager.quickValidate(cacheResult.data, configHash)) {
          cache = cacheResult.data
          validation = await cacheManager.validate(cache, files as string[])
          cacheUsed = true
        }
      }

      // Determine files needing analysis
      const filesToAnalyze: string[] = []
      const cachedFiles: string[] = []

      if (validation?.isValid && cache != null) {
        for (const file of files) {
          if (file in cache.files) {
            cachedFiles.push(file)
            hitCount++
          } else {
            filesToAnalyze.push(file)
            missCount++
          }
        }
      } else {
        filesToAnalyze.push(...files)
        missCount = files.length

        if (useCache) {
          cache = initializeCache(workspacePath, configHash, analyzerVersion)
          const configFiles = await collectConfigFileStates(workspacePath, packagePaths)
          cache = {...cache, configFiles}
        }
      }

      reportProgress('parsing', '', 0, filesToAnalyze.length)

      // Collect cached issues
      const allIssues: Issue[] = []
      if (cache != null) {
        for (const file of cachedFiles) {
          const cached = cache.files[file]
          if (cached != null) {
            allIssues.push(...cached.issues)
          }
        }
        allIssues.push(...cache.workspaceIssues)
      }

      // Build analysis context for analyzers
      const analyzerContext: BaseAnalysisContext = {
        workspacePath,
        packages,
        config: {
          minSeverity,
          include: [],
          exclude: [],
        },
        reportProgress: (message: string) => {
          reportProgress('analyzing', message, 0)
        },
      }

      // Run analyzers with parallel execution
      reportProgress('analyzing', '', 0, analyzers.length)

      const analyzerResults = await Promise.all(
        analyzers.map(async (analyzer, index) =>
          limit(async () => {
            const analyzerId = analyzer.metadata.id
            reportProgress('analyzing', analyzerId, index + 1, analyzers.length)
            try {
              const result = await analyzer.analyze(analyzerContext)
              return result
            } catch (error) {
              const analyzerError: AnalyzerError = {
                code: 'ANALYZER_ERROR',
                message: `Analyzer ${analyzerId} failed: ${(error as Error).message}`,
              }
              return {success: false as const, error: analyzerError}
            }
          }),
        ),
      )

      // Collect results
      for (const result of analyzerResults) {
        if (!result.success) {
          consola.warn(`Analyzer error: ${result.error.message}`)
          continue
        }
        allIssues.push(...result.data)
      }

      // Filter by severity
      const severityOrder: Severity[] = ['info', 'warning', 'error', 'critical']
      const minSeverityIndex = severityOrder.indexOf(minSeverity)
      const filteredIssues = allIssues.filter(
        issue => severityOrder.indexOf(issue.severity) >= minSeverityIndex,
      )

      // Update cache
      if (useCache && cache != null) {
        const issuesByFile = new Map<string, Issue[]>()
        for (const issue of filteredIssues) {
          const existing = issuesByFile.get(issue.location.filePath) ?? []
          existing.push(issue)
          issuesByFile.set(issue.location.filePath, existing)
        }

        let updatedCache = cache
        for (const file of filesToAnalyze) {
          const fileIssues = issuesByFile.get(file) ?? []
          const updateResult = await cacheManager.updateFile(
            updatedCache,
            file,
            fileIssues,
            analyzers.map(a => a.metadata.id),
          )
          if (updateResult.success) {
            updatedCache = updateResult.data
          }
        }

        reportProgress('reporting', 'Saving cache', 0)
        await cacheManager.save(updatedCache)
      }

      reportProgress('reporting', '', files.length, files.length)

      const durationMs = Date.now() - startTime

      return ok({
        issues: filteredIssues,
        filesAnalyzed: filesToAnalyze.length,
        filesFromCache: cachedFiles.length,
        packagesAnalyzed: packagePaths.length,
        durationMs,
        cacheUsed,
        cacheStats: cacheUsed
          ? {
              hitRate: hitCount + missCount > 0 ? hitCount / (hitCount + missCount) : 0,
              hitCount,
              missCount,
            }
          : undefined,
      })
    },

    async invalidateFiles(paths: readonly string[]): Promise<void> {
      const cacheResult = await cacheManager.load()
      if (!cacheResult.success) return

      const cache = cacheResult.data
      const updatedFiles = {...cache.files}
      for (const path of paths) {
        delete updatedFiles[path]
      }

      await cacheManager.save({
        ...cache,
        files: updatedFiles,
      })
    },

    async clearCache(): Promise<Result<void, IncrementalAnalysisError>> {
      const result = await cacheManager.clear()
      if (!result.success) {
        return err({
          code: 'CACHE_ERROR',
          message: result.error.message,
        })
      }
      return ok(undefined)
    },

    async getCacheStats(): Promise<
      Result<{cachedFiles: number; cachedPackages: number; ageMs: number}, IncrementalAnalysisError>
    > {
      const cacheResult = await cacheManager.load()
      if (!cacheResult.success) {
        if (cacheResult.error.code === 'CACHE_NOT_FOUND') {
          return ok({cachedFiles: 0, cachedPackages: 0, ageMs: 0})
        }
        return err({
          code: 'CACHE_ERROR',
          message: cacheResult.error.message,
        })
      }

      const stats = cacheManager.getStatistics(cacheResult.data)
      return ok({
        cachedFiles: stats.cachedFiles,
        cachedPackages: stats.cachedPackages,
        ageMs: stats.ageMs,
      })
    },
  }
}

/**
 * Creates a progress callback that logs to stderr.
 */
export function createConsoleProgressCallback(): (progress: AnalysisProgress) => void {
  let lastPhase: AnalysisProgress['phase'] | undefined

  return (progress: AnalysisProgress) => {
    if (progress.phase !== lastPhase) {
      lastPhase = progress.phase
      const phaseNames = {
        scanning: 'Scanning workspace',
        parsing: 'Parsing source files',
        analyzing: 'Running analyzers',
        reporting: 'Generating report',
      }
      console.error(`\n${phaseNames[progress.phase]}...`)
    }

    if (progress.total != null && progress.total > 0) {
      const percent = Math.round((progress.processed / progress.total) * 100)
      process.stderr.write(`\r  ${progress.processed}/${progress.total} (${percent}%)`)
    }
  }
}

/**
 * Creates a no-op progress callback.
 */
export function createSilentProgressCallback(): (progress: AnalysisProgress) => void {
  return () => {
    // Silent operation
  }
}
