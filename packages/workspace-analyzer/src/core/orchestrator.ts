/**
 * Analysis orchestrator for workspace analysis.
 *
 * Adapts the doc-sync sync-orchestrator pattern for workspace analysis,
 * coordinating scanner, analyzers, and reporters into a unified pipeline.
 */

import type {Analyzer, AnalyzerError} from '../analyzers/analyzer'
import type {MergedConfig} from '../config/merger'
import type {WorkspacePackage} from '../scanner/workspace-scanner'
import type {
  AnalysisProgress,
  AnalysisResult,
  AnalysisSummary,
  Issue,
  Severity,
} from '../types/index'
import type {Result} from '../types/result'

import path from 'node:path'

import {pLimit} from '@bfra.me/es/async'
import {consola} from 'consola'

import {createDefaultRegistry} from '../analyzers/index'
import {getAnalyzerOptions} from '../config/merger'
import {createWorkspaceScanner} from '../scanner/workspace-scanner'
import {err, ok} from '../types/result'

/**
 * Extended analysis context shared between analyzers.
 * Contains all information needed to perform analysis operations.
 */
export interface AnalysisContext {
  /** Root path of the workspace being analyzed */
  readonly workspacePath: string
  /** All packages discovered in the workspace */
  readonly packages: readonly WorkspacePackage[]
  /** All source files in the workspace */
  readonly sourceFiles: readonly string[]
  /** Merged configuration */
  readonly config: MergedConfig
  /** Configuration hash for caching */
  readonly configHash: string
  /** Report progress during analysis */
  readonly reportProgress: (message: string) => void
}

/**
 * Error codes for orchestration operations.
 */
export type OrchestratorErrorCode =
  | 'SCAN_FAILED'
  | 'ANALYSIS_FAILED'
  | 'INVALID_CONFIG'
  | 'NO_PACKAGES'

/**
 * Error that occurred during orchestration.
 */
export interface OrchestratorError {
  readonly code: OrchestratorErrorCode
  readonly message: string
  readonly cause?: unknown
}

/**
 * Options for the analysis orchestrator.
 */
export interface OrchestratorOptions {
  /** Merged configuration */
  readonly config: MergedConfig
  /** Progress callback */
  readonly onProgress?: (progress: AnalysisProgress) => void
  /** Verbose logging */
  readonly verbose?: boolean
}

/**
 * Analysis orchestrator interface.
 */
export interface AnalysisOrchestrator {
  /** Run full analysis on the workspace */
  readonly analyzeAll: () => Promise<Result<AnalysisResult, OrchestratorError>>
  /** Run analysis on specific packages */
  readonly analyzePackages: (
    packageNames: readonly string[],
  ) => Promise<Result<AnalysisResult, OrchestratorError>>
  /** Get the current analysis context */
  readonly getContext: () => Promise<Result<AnalysisContext, OrchestratorError>>
}

/**
 * Severity ordering for filtering.
 */
const SEVERITY_ORDER: Record<Severity, number> = {
  info: 0,
  warning: 1,
  error: 2,
  critical: 3,
}

/**
 * Computes a simple hash from configuration for cache invalidation.
 */
function computeConfigHash(config: MergedConfig): string {
  const configStr = JSON.stringify({
    include: config.include,
    exclude: config.exclude,
    categories: config.categories,
    rules: config.rules,
    analyzers: config.analyzers,
    architecture: config.architecture,
  })

  let hash = 0
  for (let i = 0; i < configStr.length; i++) {
    const char = configStr.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(16)
}

/**
 * Creates an analysis summary from issues.
 */
function createSummary(
  issues: readonly Issue[],
  packagesAnalyzed: number,
  filesAnalyzed: number,
  durationMs: number,
): AnalysisSummary {
  const bySeverity: Record<Severity, number> = {
    info: 0,
    warning: 0,
    error: 0,
    critical: 0,
  }

  const byCategory: Record<string, number> = {
    configuration: 0,
    dependency: 0,
    architecture: 0,
    performance: 0,
    'circular-import': 0,
    'unused-export': 0,
    'type-safety': 0,
  }

  for (const issue of issues) {
    bySeverity[issue.severity]++
    byCategory[issue.category] = (byCategory[issue.category] ?? 0) + 1
  }

  return {
    totalIssues: issues.length,
    bySeverity,
    byCategory: byCategory as AnalysisSummary['byCategory'],
    packagesAnalyzed,
    filesAnalyzed,
    durationMs,
  }
}

/**
 * Filters issues by minimum severity threshold.
 */
function filterBySeverity(issues: readonly Issue[], minSeverity: Severity): readonly Issue[] {
  const minLevel = SEVERITY_ORDER[minSeverity]
  return issues.filter(issue => SEVERITY_ORDER[issue.severity] >= minLevel)
}

/**
 * Creates an analysis orchestrator for coordinating workspace analysis.
 *
 * @example
 * ```ts
 * const orchestrator = createOrchestrator({
 *   config: mergedConfig,
 *   onProgress: (progress) => console.log(progress.phase),
 * })
 *
 * const result = await orchestrator.analyzeAll()
 * if (result.success) {
 *   console.log(`Found ${result.data.summary.totalIssues} issues`)
 * }
 * ```
 */
export function createOrchestrator(options: OrchestratorOptions): AnalysisOrchestrator {
  const {config, onProgress, verbose = false} = options

  const scanner = createWorkspaceScanner({
    rootDir: config.packagePatterns[0]?.includes('/') ? '.' : '.',
    includePatterns: config.packagePatterns,
    excludePackages: [],
    sourceExtensions: ['.ts', '.tsx', '.js', '.jsx', '.mts', '.cts'],
    excludeDirs: ['node_modules', 'dist', 'lib', 'build', '__tests__', '__mocks__'],
  })

  const registry = createDefaultRegistry()
  const limit = pLimit(config.concurrency)

  function log(message: string): void {
    if (verbose) {
      consola.info(message)
    }
  }

  function reportProgress(
    phase: AnalysisProgress['phase'],
    current: string,
    processed: number,
    total?: number,
  ): void {
    onProgress?.({phase, current, processed, total})
  }

  async function buildContext(
    workspacePath: string,
  ): Promise<Result<AnalysisContext, OrchestratorError>> {
    log('Scanning workspace...')
    reportProgress('scanning', workspacePath, 0)

    const scanResult = await scanner.scan()

    if (scanResult.errors.length > 0) {
      const errorMessages = scanResult.errors.map(e => e.message).join('; ')
      consola.warn(`Scan completed with ${scanResult.errors.length} errors: ${errorMessages}`)
    }

    if (scanResult.packages.length === 0) {
      return err({
        code: 'NO_PACKAGES',
        message: 'No packages found in workspace',
      })
    }

    log(`Found ${scanResult.packages.length} packages`)
    reportProgress(
      'scanning',
      workspacePath,
      scanResult.packages.length,
      scanResult.packages.length,
    )

    const allSourceFiles = scanResult.packages.flatMap(pkg => [...pkg.sourceFiles])

    const configHash = computeConfigHash(config)

    const context: AnalysisContext = {
      workspacePath: scanResult.workspacePath,
      packages: scanResult.packages,
      sourceFiles: allSourceFiles,
      config,
      configHash,
      reportProgress: log,
    }

    return ok(context)
  }

  async function runAnalyzers(
    context: AnalysisContext,
    packages: readonly WorkspacePackage[],
  ): Promise<readonly Issue[]> {
    const allIssues: Issue[] = []
    const enabledAnalyzers: Analyzer[] = []

    // Filter to enabled analyzers based on config
    for (const analyzer of registry.getEnabled()) {
      const analyzerOpts = getAnalyzerOptions(config, analyzer.metadata.id)
      if (analyzerOpts.enabled) {
        enabledAnalyzers.push(analyzer)
      }
    }

    log(`Running ${enabledAnalyzers.length} analyzers...`)
    reportProgress('analyzing', '', 0, enabledAnalyzers.length)

    // Run analyzers in parallel with concurrency limit
    const results = await Promise.all(
      enabledAnalyzers.map(async (analyzer, index) =>
        limit(async (): Promise<Result<readonly Issue[], AnalyzerError>> => {
          const analyzerId = analyzer.metadata.id
          reportProgress('analyzing', analyzerId, index + 1, enabledAnalyzers.length)
          log(`Running analyzer: ${analyzerId}`)

          try {
            const analyzerContext = {
              workspacePath: context.workspacePath,
              packages,
              config: {
                minSeverity: context.config.minSeverity,
                categories: context.config.categories,
                include: context.config.include,
                exclude: context.config.exclude,
                rules: context.config.rules,
              },
              reportProgress: context.reportProgress,
            }

            const result = await analyzer.analyze(analyzerContext)
            return result
          } catch (error) {
            consola.warn(`Analyzer ${analyzerId} failed: ${(error as Error).message}`)
            return err({
              code: 'ANALYZER_ERROR',
              message: `Analyzer ${analyzerId} failed: ${(error as Error).message}`,
            })
          }
        }),
      ),
    )

    // Collect all issues
    for (const result of results) {
      if (result.success) {
        allIssues.push(...result.data)
      }
    }

    // Filter by minimum severity
    const filteredIssues = filterBySeverity(allIssues, config.minSeverity)

    log(`Found ${filteredIssues.length} issues after filtering`)

    return filteredIssues
  }

  return {
    async analyzeAll(): Promise<Result<AnalysisResult, OrchestratorError>> {
      const startTime = Date.now()
      const workspacePath = path.resolve('.')

      const contextResult = await buildContext(workspacePath)
      if (!contextResult.success) {
        return contextResult
      }

      const context = contextResult.data
      const issues = await runAnalyzers(context, context.packages)

      const durationMs = Date.now() - startTime
      reportProgress('reporting', '', context.packages.length, context.packages.length)

      const summary = createSummary(
        issues,
        context.packages.length,
        context.sourceFiles.length,
        durationMs,
      )

      log(`Analysis complete in ${durationMs}ms`)

      return ok({
        issues,
        summary,
        workspacePath: context.workspacePath,
        startedAt: new Date(startTime),
        completedAt: new Date(),
      })
    },

    async analyzePackages(
      packageNames: readonly string[],
    ): Promise<Result<AnalysisResult, OrchestratorError>> {
      const startTime = Date.now()
      const workspacePath = path.resolve('.')

      const contextResult = await buildContext(workspacePath)
      if (!contextResult.success) {
        return contextResult
      }

      const context = contextResult.data

      // Filter to requested packages
      const targetPackages = context.packages.filter(pkg => packageNames.includes(pkg.name))

      if (targetPackages.length === 0) {
        return err({
          code: 'NO_PACKAGES',
          message: `No packages found matching: ${packageNames.join(', ')}`,
        })
      }

      log(
        `Analyzing ${targetPackages.length} packages: ${targetPackages.map(p => p.name).join(', ')}`,
      )

      const issues = await runAnalyzers(context, targetPackages)

      const durationMs = Date.now() - startTime
      reportProgress('reporting', '', targetPackages.length, targetPackages.length)

      const filesAnalyzed = targetPackages.reduce((sum, pkg) => sum + pkg.sourceFiles.length, 0)

      const summary = createSummary(issues, targetPackages.length, filesAnalyzed, durationMs)

      return ok({
        issues,
        summary,
        workspacePath: context.workspacePath,
        startedAt: new Date(startTime),
        completedAt: new Date(),
      })
    },

    async getContext(): Promise<Result<AnalysisContext, OrchestratorError>> {
      const workspacePath = path.resolve('.')
      return buildContext(workspacePath)
    },
  }
}
