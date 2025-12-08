/**
 * Main public API for workspace analysis.
 *
 * Provides the `analyzeWorkspace()` function as the primary entry point
 * for programmatic workspace analysis.
 */

import type {MergedConfig} from '../config/merger'
import type {AnalysisProgress, AnalysisResult} from '../types/index'
import type {Result} from '../types/result'

import path from 'node:path'

import {loadConfig} from '../config/loader'
import {mergeConfig} from '../config/merger'
import {createOrchestrator, type OrchestratorError} from '../core/orchestrator'
import {err, ok} from '../types/result'

/**
 * Options for the analyzeWorkspace function.
 */
export interface AnalyzeWorkspaceOptions {
  /** Glob patterns for files to include */
  readonly include?: readonly string[]
  /** Glob patterns for files to exclude */
  readonly exclude?: readonly string[]
  /** Minimum severity level to report */
  readonly minSeverity?: 'info' | 'warning' | 'error' | 'critical'
  /** Categories of issues to check (empty means all) */
  readonly categories?: readonly (
    | 'configuration'
    | 'dependency'
    | 'architecture'
    | 'performance'
    | 'circular-import'
    | 'unused-export'
    | 'type-safety'
  )[]
  /** Enable incremental analysis caching */
  readonly cache?: boolean
  /** Custom rules configuration */
  readonly rules?: Record<string, unknown>
  /** Glob patterns for package locations */
  readonly packagePatterns?: readonly string[]
  /** Maximum parallel analysis operations */
  readonly concurrency?: number
  /** Directory for analysis cache files */
  readonly cacheDir?: string
  /** Maximum cache age in milliseconds */
  readonly maxCacheAge?: number
  /** Hash algorithm for file content */
  readonly hashAlgorithm?: 'sha256' | 'md5'
  /** Path to workspace-analyzer.config.ts file */
  readonly configPath?: string
  /** Callback for progress reporting */
  readonly onProgress?: (progress: AnalysisProgress) => void
  /** Per-analyzer configuration */
  readonly analyzers?: Record<
    string,
    {
      enabled?: boolean
      severity?: 'info' | 'warning' | 'error' | 'critical'
      options?: Record<string, unknown>
    }
  >
  /** Architectural analysis rules */
  readonly architecture?: {
    layers?: {
      name: string
      patterns: string[]
      allowedImports: string[]
    }[]
    allowBarrelExports?: boolean | string[]
    enforcePublicApi?: boolean
  }
  /** Enable verbose logging */
  readonly verbose?: boolean
}

/**
 * Error codes for workspace analysis.
 */
export type AnalyzeWorkspaceErrorCode =
  | 'CONFIG_ERROR'
  | 'SCAN_ERROR'
  | 'ANALYSIS_ERROR'
  | 'INVALID_PATH'

/**
 * Error that occurred during workspace analysis.
 */
export interface AnalyzeWorkspaceError {
  readonly code: AnalyzeWorkspaceErrorCode
  readonly message: string
  readonly cause?: unknown
}

/**
 * Converts orchestrator error to analyze workspace error.
 */
function toAnalyzeError(error: OrchestratorError): AnalyzeWorkspaceError {
  const codeMap: Record<string, AnalyzeWorkspaceErrorCode> = {
    SCAN_FAILED: 'SCAN_ERROR',
    NO_PACKAGES: 'SCAN_ERROR',
    ANALYSIS_FAILED: 'ANALYSIS_ERROR',
    INVALID_CONFIG: 'CONFIG_ERROR',
  }

  return {
    code: codeMap[error.code] ?? 'ANALYSIS_ERROR',
    message: error.message,
    cause: error.cause,
  }
}

/**
 * Analyzes a workspace for configuration, dependency, and architectural issues.
 *
 * This is the main entry point for programmatic workspace analysis.
 *
 * @param workspacePath - Path to the workspace root directory
 * @param options - Analysis options
 * @returns Result containing analysis results or an error
 *
 * @example
 * ```ts
 * import {analyzeWorkspace} from '@bfra.me/workspace-analyzer'
 *
 * const result = await analyzeWorkspace('./my-monorepo', {
 *   minSeverity: 'warning',
 *   categories: ['dependency', 'architecture'],
 *   onProgress: (progress) => {
 *     console.log(`${progress.phase}: ${progress.processed}/${progress.total}`)
 *   },
 * })
 *
 * if (result.success) {
 *   console.log(`Found ${result.data.summary.totalIssues} issues`)
 *   for (const issue of result.data.issues) {
 *     console.log(`[${issue.severity}] ${issue.title}`)
 *   }
 * } else {
 *   console.error(`Analysis failed: ${result.error.message}`)
 * }
 * ```
 */
export async function analyzeWorkspace(
  workspacePath: string,
  options: AnalyzeWorkspaceOptions = {},
): Promise<Result<AnalysisResult, AnalyzeWorkspaceError>> {
  const resolvedPath = path.resolve(workspacePath)

  // Load configuration from file if not explicitly provided
  const configResult = await loadConfig(resolvedPath, options.configPath)

  if (!configResult.success) {
    return err({
      code: 'CONFIG_ERROR',
      message: configResult.error.message,
      cause: configResult.error.cause,
    })
  }

  // Merge configuration from all sources
  const mergedConfig: MergedConfig = mergeConfig(
    configResult.data?.config,
    options as Parameters<typeof mergeConfig>[1],
  )

  // Create orchestrator and run analysis
  const orchestrator = createOrchestrator({
    workspacePath: resolvedPath,
    config: mergedConfig,
    onProgress: options.onProgress,
    verbose: options.verbose,
  })

  const result = await orchestrator.analyzeAll()

  if (!result.success) {
    return err(toAnalyzeError(result.error))
  }

  return ok(result.data)
}

/**
 * Analyzes specific packages within a workspace.
 *
 * @param workspacePath - Path to the workspace root directory
 * @param packageNames - Names of packages to analyze
 * @param options - Analysis options
 * @returns Result containing analysis results or an error
 *
 * @example
 * ```ts
 * import {analyzePackages} from '@bfra.me/workspace-analyzer'
 *
 * const result = await analyzePackages('./my-monorepo', ['@myorg/core', '@myorg/utils'])
 *
 * if (result.success) {
 *   console.log(`Analyzed ${result.data.summary.packagesAnalyzed} packages`)
 * }
 * ```
 */
export async function analyzePackages(
  workspacePath: string,
  packageNames: readonly string[],
  options: AnalyzeWorkspaceOptions = {},
): Promise<Result<AnalysisResult, AnalyzeWorkspaceError>> {
  const resolvedPath = path.resolve(workspacePath)

  // Load configuration from file if not explicitly provided
  const configResult = await loadConfig(resolvedPath, options.configPath)

  if (!configResult.success) {
    return err({
      code: 'CONFIG_ERROR',
      message: configResult.error.message,
      cause: configResult.error.cause,
    })
  }

  // Merge configuration from all sources
  const mergedConfig: MergedConfig = mergeConfig(
    configResult.data?.config,
    options as Parameters<typeof mergeConfig>[1],
  )

  // Create orchestrator and run analysis
  const orchestrator = createOrchestrator({
    workspacePath: resolvedPath,
    config: mergedConfig,
    onProgress: options.onProgress,
    verbose: options.verbose,
  })

  const result = await orchestrator.analyzePackages(packageNames)

  if (!result.success) {
    return err(toAnalyzeError(result.error))
  }

  return ok(result.data)
}
