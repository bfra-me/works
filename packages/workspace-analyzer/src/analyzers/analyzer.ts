/**
 * Core analyzer interface and types for workspace analysis.
 *
 * Defines the plugin architecture contract that all analyzers must implement,
 * enabling extensible and composable analysis pipelines.
 */

import type {WorkspacePackage} from '../scanner/workspace-scanner'
import type {Issue, IssueCategory, Severity} from '../types/index'
import type {Result} from '../types/result'

/**
 * Context provided to analyzers during analysis runs.
 * Contains all information needed to perform analysis without side effects.
 */
export interface AnalysisContext {
  /** Root path of the workspace being analyzed */
  readonly workspacePath: string
  /** All packages discovered in the workspace */
  readonly packages: readonly WorkspacePackage[]
  /** Analyzer-specific configuration options */
  readonly config: AnalyzerOptions
  /** Report progress during long-running analysis */
  readonly reportProgress?: (message: string) => void
}

/**
 * Options for configuring analyzer behavior.
 */
export interface AnalyzerOptions {
  /** Glob patterns for files to include */
  readonly include?: readonly string[]
  /** Glob patterns for files to exclude */
  readonly exclude?: readonly string[]
  /** Minimum severity level to report */
  readonly minSeverity?: Severity
  /** Categories to analyze (empty means all) */
  readonly categories?: readonly IssueCategory[]
  /** Analyzer-specific rule configurations */
  readonly rules?: Readonly<Record<string, unknown>>
}

/**
 * Error that can occur during analysis.
 */
export interface AnalyzerError {
  /** Error code for programmatic handling */
  readonly code: string
  /** Human-readable error message */
  readonly message: string
  /** Additional context about the error */
  readonly context?: Readonly<Record<string, unknown>>
}

/**
 * Metadata describing an analyzer implementation.
 */
export interface AnalyzerMetadata {
  /** Unique identifier for this analyzer */
  readonly id: string
  /** Human-readable name */
  readonly name: string
  /** Description of what this analyzer checks */
  readonly description: string
  /** Categories of issues this analyzer can detect */
  readonly categories: readonly IssueCategory[]
  /** Default severity for issues from this analyzer */
  readonly defaultSeverity: Severity
}

/**
 * Core interface that all analyzers must implement.
 *
 * @example
 * ```ts
 * const myAnalyzer: Analyzer = {
 *   metadata: {
 *     id: 'my-analyzer',
 *     name: 'My Custom Analyzer',
 *     description: 'Checks for custom patterns',
 *     categories: ['architecture'],
 *     defaultSeverity: 'warning',
 *   },
 *   async analyze(context) {
 *     const issues: Issue[] = []
 *     // Perform analysis...
 *     return ok(issues)
 *   },
 * }
 * ```
 */
export interface Analyzer {
  /** Metadata describing this analyzer */
  readonly metadata: AnalyzerMetadata
  /**
   * Perform analysis and return discovered issues.
   *
   * @param context - Analysis context with workspace information
   * @returns Result containing issues found or an error
   */
  readonly analyze: (context: AnalysisContext) => Promise<Result<readonly Issue[], AnalyzerError>>
}

/**
 * Factory function signature for creating analyzers.
 */
export type AnalyzerFactory = (options?: AnalyzerOptions) => Analyzer

/**
 * Configuration for a single analyzer in the registry.
 */
export interface AnalyzerRegistration {
  /** The analyzer instance or factory */
  readonly analyzer: Analyzer | AnalyzerFactory
  /** Whether this analyzer is enabled by default */
  readonly enabled: boolean
  /** Priority for execution order (lower runs first) */
  readonly priority: number
}

/**
 * Creates an issue with consistent defaults.
 *
 * @example
 * ```ts
 * const issue = createIssue({
 *   id: 'missing-types',
 *   title: 'Missing types field',
 *   description: 'package.json should declare a types entry point',
 *   severity: 'warning',
 *   category: 'configuration',
 *   location: {filePath: '/path/to/package.json'},
 * })
 * ```
 */
export function createIssue(
  params: Omit<Issue, 'relatedLocations' | 'suggestion' | 'metadata'> & {
    relatedLocations?: Issue['relatedLocations']
    suggestion?: Issue['suggestion']
    metadata?: Issue['metadata']
  },
): Issue {
  return {
    id: params.id,
    title: params.title,
    description: params.description,
    severity: params.severity,
    category: params.category,
    location: params.location,
    relatedLocations: params.relatedLocations,
    suggestion: params.suggestion,
    metadata: params.metadata,
  }
}

/**
 * Helper to check if an analyzer should skip a category based on configuration.
 */
export function shouldAnalyzeCategory(
  category: IssueCategory,
  options: AnalyzerOptions | undefined,
): boolean {
  const categories = options?.categories
  if (categories === undefined || categories.length === 0) {
    return true
  }
  return categories.includes(category)
}

/**
 * Helper to check if an issue meets minimum severity threshold.
 */
export function meetsMinSeverity(severity: Severity, minSeverity: Severity | undefined): boolean {
  if (minSeverity === undefined) {
    return true
  }

  const severityOrder: Record<Severity, number> = {
    info: 0,
    warning: 1,
    error: 2,
    critical: 3,
  }

  return severityOrder[severity] >= severityOrder[minSeverity]
}

/**
 * Filters issues based on configuration options.
 */
export function filterIssues(issues: readonly Issue[], options: AnalyzerOptions): readonly Issue[] {
  return issues.filter(issue => {
    if (!meetsMinSeverity(issue.severity, options.minSeverity)) {
      return false
    }
    if (!shouldAnalyzeCategory(issue.category, options)) {
      return false
    }
    return true
  })
}
