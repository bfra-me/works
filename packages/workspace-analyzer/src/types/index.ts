/**
 * Core type definitions for workspace analysis.
 *
 * These types define the structure of analysis results, issues, severity levels,
 * and configuration options used throughout the analyzer.
 */

import type {Result} from './result'

/**
 * Severity levels for analysis issues, from informational to critical errors.
 */
export type Severity = 'info' | 'warning' | 'error' | 'critical'

/**
 * Categories of analysis issues for grouping and filtering.
 */
export type IssueCategory =
  | 'configuration'
  | 'dependency'
  | 'architecture'
  | 'performance'
  | 'circular-import'
  | 'unused-export'
  | 'type-safety'

/**
 * Location information for precise issue reporting.
 */
export interface IssueLocation {
  /** Absolute file path where the issue was detected */
  readonly filePath: string
  /** Starting line number (1-indexed) */
  readonly line?: number
  /** Starting column number (1-indexed) */
  readonly column?: number
  /** Ending line number (1-indexed) */
  readonly endLine?: number
  /** Ending column number (1-indexed) */
  readonly endColumn?: number
}

/**
 * Represents a single issue detected during analysis.
 */
export interface Issue {
  /** Unique identifier for the issue type (e.g., 'circular-import', 'unused-dep') */
  readonly id: string
  /** Human-readable title summarizing the issue */
  readonly title: string
  /** Detailed description explaining the problem and potential impact */
  readonly description: string
  /** Severity level determining how critical this issue is */
  readonly severity: Severity
  /** Category for grouping related issues */
  readonly category: IssueCategory
  /** Location where the issue was detected */
  readonly location: IssueLocation
  /** Additional locations related to this issue (e.g., cycle participants) */
  readonly relatedLocations?: readonly IssueLocation[]
  /** Suggested fix or action to resolve the issue */
  readonly suggestion?: string
  /** Additional metadata for machine processing */
  readonly metadata?: Readonly<Record<string, unknown>>
}

/**
 * Summary statistics for an analysis run.
 */
export interface AnalysisSummary {
  /** Total number of issues found */
  readonly totalIssues: number
  /** Issues grouped by severity */
  readonly bySeverity: Readonly<Record<Severity, number>>
  /** Issues grouped by category */
  readonly byCategory: Readonly<Record<IssueCategory, number>>
  /** Number of packages analyzed */
  readonly packagesAnalyzed: number
  /** Number of source files analyzed */
  readonly filesAnalyzed: number
  /** Analysis duration in milliseconds */
  readonly durationMs: number
}

/**
 * Complete result of a workspace analysis run.
 */
export interface AnalysisResult {
  /** All issues detected during analysis */
  readonly issues: readonly Issue[]
  /** Summary statistics */
  readonly summary: AnalysisSummary
  /** Workspace root path that was analyzed */
  readonly workspacePath: string
  /** Timestamp when analysis started */
  readonly startedAt: Date
  /** Timestamp when analysis completed */
  readonly completedAt: Date
}

/**
 * Configuration for controlling analyzer behavior.
 */
export interface AnalyzerConfig {
  /** Glob patterns for files to include in analysis */
  readonly include?: readonly string[]
  /** Glob patterns for files to exclude from analysis */
  readonly exclude?: readonly string[]
  /** Minimum severity level to report */
  readonly minSeverity?: Severity
  /** Categories of issues to check */
  readonly categories?: readonly IssueCategory[]
  /** Whether to enable caching for incremental analysis */
  readonly cache?: boolean
  /** Custom rules configuration */
  readonly rules?: Readonly<Record<string, unknown>>
}

/**
 * Options for the analyzeWorkspace function.
 */
export interface AnalyzeWorkspaceOptions extends AnalyzerConfig {
  /** Path to workspace-analyzer.config.ts file */
  readonly configPath?: string
  /** Callback for progress reporting */
  readonly onProgress?: (progress: AnalysisProgress) => void
}

/**
 * Progress information during analysis.
 */
export interface AnalysisProgress {
  /** Current phase of analysis */
  readonly phase: 'scanning' | 'parsing' | 'analyzing' | 'reporting'
  /** Current item being processed */
  readonly current?: string
  /** Number of items processed so far */
  readonly processed: number
  /** Total number of items to process (if known) */
  readonly total?: number
}

/**
 * Represents an error that occurred during analysis.
 */
export interface AnalysisError {
  /** Error code for programmatic handling */
  readonly code: string
  /** Human-readable error message */
  readonly message: string
  /** Stack trace if available */
  readonly stack?: string
  /** Additional context about the error */
  readonly context?: Readonly<Record<string, unknown>>
}

/**
 * Type alias for analysis operations that may fail.
 */
export type AnalysisResultType<T> = Result<T, AnalysisError>

// Re-export Result types for convenience
export type {Err, Ok, Result} from './result'
export {
  err,
  flatMap,
  fromPromise,
  fromThrowable,
  isErr,
  isOk,
  map,
  mapErr,
  ok,
  unwrap,
  unwrapOr,
} from './result'
