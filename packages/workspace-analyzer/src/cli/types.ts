/**
 * Type definitions for CLI options and state.
 */

import type {Severity} from '../types/index'

/**
 * Global options available to all CLI commands.
 */
export interface GlobalOptions {
  /** Root directory of the workspace (default: current working directory) */
  readonly root: string
  /** Path to configuration file */
  readonly config?: string
  /** Enable verbose output for debugging */
  readonly verbose?: boolean
  /** Suppress non-error output */
  readonly quiet?: boolean
}

/**
 * Options for the analyze command.
 */
export interface AnalyzeOptions extends GlobalOptions {
  /** Output results as JSON */
  readonly json?: boolean
  /** Output results as Markdown */
  readonly markdown?: boolean
  /** Show what would be analyzed without making changes */
  readonly dryRun?: boolean
  /** Enable interactive mode for analyzer selection */
  readonly interactive?: boolean
  /** Attempt to auto-fix issues where supported */
  readonly fix?: boolean
  /** Minimum severity level to report */
  readonly minSeverity?: Severity
  /** Specific analyzers to run (empty means all) */
  readonly analyzers?: readonly string[]
}

/**
 * Option for analyzer selection in interactive mode.
 */
export interface AnalyzerSelectionOption {
  /** Analyzer ID */
  readonly value: string
  /** Display label */
  readonly label: string
  /** Optional hint text */
  readonly hint?: string
}

/**
 * Status information for individual analyzer results.
 */
export interface AnalyzerStatus {
  /** Analyzer ID */
  readonly analyzerId: string
  /** Whether the analyzer completed successfully */
  readonly success: boolean
  /** Number of issues found */
  readonly issueCount: number
  /** Duration in milliseconds */
  readonly durationMs: number
}
