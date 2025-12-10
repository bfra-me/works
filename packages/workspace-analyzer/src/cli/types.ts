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

/**
 * Output format for visualization.
 */
export type VisualizeFormat = 'html' | 'json' | 'mermaid' | 'both'

/**
 * Options for the visualize command.
 */
export interface VisualizeOptions extends GlobalOptions {
  /** Output path for the generated file (default: ./workspace-graph.html) */
  readonly output?: string
  /** Output format: html, json, or both */
  readonly format?: VisualizeFormat
  /** Disable auto-opening the generated file in browser */
  readonly noOpen?: boolean
  /** Title for the visualization */
  readonly title?: string
  /** Maximum number of nodes to include (for performance) */
  readonly maxNodes?: number
  /** Include type-only imports in the graph */
  readonly includeTypeImports?: boolean
  /** Enable interactive mode for options selection */
  readonly interactive?: boolean
}

/**
 * Options for interactive visualization prompts.
 */
export interface VisualizePromptResult {
  /** Selected output path */
  readonly outputPath: string
  /** Selected format */
  readonly format: VisualizeFormat
  /** Whether to auto-open */
  readonly autoOpen: boolean
  /** Visualization title */
  readonly title: string
  /** Maximum nodes */
  readonly maxNodes: number
  /** Include type imports */
  readonly includeTypeImports: boolean
}
