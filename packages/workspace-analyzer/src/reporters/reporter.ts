/**
 * Report generator interface and base types for workspace analysis output.
 *
 * Defines the contract for reporters that format analysis results into
 * various output formats (JSON, Markdown, console, etc.).
 */

import type {AnalysisResult, Issue, IssueCategory, Severity} from '../types/index'

/**
 * Supported output formats for analysis reports.
 */
export type ReportFormat = 'json' | 'markdown' | 'console'

/**
 * Options for configuring report generation.
 */
export interface ReportOptions {
  /** Minimum severity level to include in the report */
  readonly minSeverity?: Severity
  /** Categories of issues to include (empty means all) */
  readonly categories?: readonly IssueCategory[]
  /** Whether to include file location details (line/column numbers) */
  readonly includeLocation?: boolean
  /** Whether to include fix suggestions */
  readonly includeSuggestions?: boolean
  /** Whether to group issues by file, category, or severity */
  readonly groupBy?: 'file' | 'category' | 'severity' | 'none'
  /** Whether to include summary statistics */
  readonly includeSummary?: boolean
  /** Output file path (if writing to file) */
  readonly outputPath?: string
  /** Whether to use colors in output (for console reporter) */
  readonly colors?: boolean
  /** Maximum number of issues to display per group */
  readonly maxIssuesPerGroup?: number
  /** Whether to include metadata in output */
  readonly includeMetadata?: boolean
}

/**
 * Grouped issues organized by a specific key.
 */
export interface GroupedIssues {
  /** The grouping key (file path, category name, or severity level) */
  readonly key: string
  /** Human-readable label for the group */
  readonly label: string
  /** Issues in this group */
  readonly issues: readonly Issue[]
  /** Number of issues in this group */
  readonly count: number
}

/**
 * Summary statistics for report output.
 */
export interface ReportSummary {
  /** Total number of issues */
  readonly totalIssues: number
  /** Issues by severity */
  readonly bySeverity: Readonly<Record<Severity, number>>
  /** Issues by category */
  readonly byCategory: Readonly<Record<IssueCategory, number>>
  /** Number of packages analyzed */
  readonly packagesAnalyzed: number
  /** Number of files analyzed */
  readonly filesAnalyzed: number
  /** Duration in milliseconds */
  readonly durationMs: number
  /** Number of files with issues */
  readonly filesWithIssues: number
  /** Highest severity level found */
  readonly highestSeverity: Severity | null
}

/**
 * Reporter interface that all report generators must implement.
 *
 * @example
 * ```ts
 * const jsonReporter = createJsonReporter()
 * const report = jsonReporter.generate(analysisResult)
 * await fs.writeFile('report.json', report)
 * ```
 */
export interface Reporter {
  /** Unique identifier for this reporter */
  readonly id: ReportFormat
  /** Human-readable name for this reporter */
  readonly name: string
  /** Generate a report string from analysis results */
  readonly generate: (result: AnalysisResult, options?: ReportOptions) => string
  /** Stream report output to a writable stream (for large reports) */
  readonly stream?: (
    result: AnalysisResult,
    write: (chunk: string) => void,
    options?: ReportOptions,
  ) => void
}

/**
 * Factory function type for creating reporter instances.
 */
export type ReporterFactory = (options?: ReportOptions) => Reporter

/**
 * Default report options.
 */
export const DEFAULT_REPORT_OPTIONS: Required<
  Omit<ReportOptions, 'outputPath' | 'categories' | 'minSeverity'>
> = {
  includeLocation: true,
  includeSuggestions: true,
  groupBy: 'file',
  includeSummary: true,
  colors: true,
  maxIssuesPerGroup: 50,
  includeMetadata: false,
}

/**
 * Severity display configuration for consistent formatting.
 */
export const SEVERITY_CONFIG: Readonly<
  Record<
    Severity,
    {
      label: string
      emoji: string
      color: string
      priority: number
    }
  >
> = {
  critical: {label: 'Critical', emoji: '🚨', color: 'red', priority: 4},
  error: {label: 'Error', emoji: '❌', color: 'red', priority: 3},
  warning: {label: 'Warning', emoji: '⚠️', color: 'yellow', priority: 2},
  info: {label: 'Info', emoji: 'ℹ️', color: 'blue', priority: 1},
}

/**
 * Category display configuration for consistent formatting.
 */
export const CATEGORY_CONFIG: Readonly<
  Record<
    IssueCategory,
    {
      label: string
      emoji: string
      description: string
    }
  >
> = {
  configuration: {
    label: 'Configuration',
    emoji: '⚙️',
    description: 'Package and project configuration issues',
  },
  dependency: {
    label: 'Dependency',
    emoji: '📦',
    description: 'Package dependency issues',
  },
  architecture: {
    label: 'Architecture',
    emoji: '🏗️',
    description: 'Architectural pattern violations',
  },
  performance: {
    label: 'Performance',
    emoji: '🚀',
    description: 'Performance optimization opportunities',
  },
  'circular-import': {
    label: 'Circular Import',
    emoji: '🔄',
    description: 'Circular import chains',
  },
  'unused-export': {
    label: 'Unused Export',
    emoji: '📤',
    description: 'Exported but unused code',
  },
  'type-safety': {
    label: 'Type Safety',
    emoji: '🔒',
    description: 'Type system issues',
  },
}

/**
 * Filter issues based on report options.
 */
export function filterIssuesForReport(
  issues: readonly Issue[],
  options: ReportOptions,
): readonly Issue[] {
  const severityOrder: Record<Severity, number> = {
    info: 0,
    warning: 1,
    error: 2,
    critical: 3,
  }

  return issues.filter(issue => {
    if (
      options.minSeverity !== undefined &&
      severityOrder[issue.severity] < severityOrder[options.minSeverity]
    ) {
      return false
    }

    if (
      options.categories !== undefined &&
      options.categories.length > 0 &&
      !options.categories.includes(issue.category)
    ) {
      return false
    }

    return true
  })
}

/**
 * Group issues by the specified key.
 */
export function groupIssues(
  issues: readonly Issue[],
  groupBy: ReportOptions['groupBy'],
): readonly GroupedIssues[] {
  if (groupBy === 'none' || groupBy === undefined) {
    return [{key: 'all', label: 'All Issues', issues, count: issues.length}]
  }

  const groups = new Map<string, Issue[]>()

  for (const issue of issues) {
    let key: string
    switch (groupBy) {
      case 'file':
        key = issue.location.filePath
        break
      case 'category':
        key = issue.category
        break
      case 'severity':
        key = issue.severity
        break
    }

    const existing = groups.get(key) ?? []
    existing.push(issue)
    groups.set(key, existing)
  }

  const result: GroupedIssues[] = []
  for (const [key, groupIssues] of groups) {
    let label: string
    switch (groupBy) {
      case 'file':
        label = key
        break
      case 'category':
        label = CATEGORY_CONFIG[key as IssueCategory]?.label ?? key
        break
      case 'severity':
        label = SEVERITY_CONFIG[key as Severity]?.label ?? key
        break
    }

    result.push({key, label, issues: groupIssues, count: groupIssues.length})
  }

  if (groupBy === 'severity') {
    result.sort((a, b) => {
      const priorityA = SEVERITY_CONFIG[a.key as Severity]?.priority ?? 0
      const priorityB = SEVERITY_CONFIG[b.key as Severity]?.priority ?? 0
      return priorityB - priorityA
    })
  } else if (groupBy === 'category') {
    result.sort((a, b) => a.label.localeCompare(b.label))
  } else {
    result.sort((a, b) => b.count - a.count)
  }

  return result
}

/**
 * Calculate summary statistics from analysis results.
 */
export function calculateSummary(result: AnalysisResult): ReportSummary {
  const bySeverity: Record<Severity, number> = {
    info: 0,
    warning: 0,
    error: 0,
    critical: 0,
  }

  const byCategory: Record<IssueCategory, number> = {
    configuration: 0,
    dependency: 0,
    architecture: 0,
    performance: 0,
    'circular-import': 0,
    'unused-export': 0,
    'type-safety': 0,
  }

  const filesWithIssues = new Set<string>()
  let highestSeverity: Severity | null = null
  const severityOrder: Record<Severity, number> = {
    info: 0,
    warning: 1,
    error: 2,
    critical: 3,
  }

  for (const issue of result.issues) {
    bySeverity[issue.severity]++
    byCategory[issue.category]++
    filesWithIssues.add(issue.location.filePath)

    if (
      highestSeverity === null ||
      severityOrder[issue.severity] > severityOrder[highestSeverity]
    ) {
      highestSeverity = issue.severity
    }
  }

  return {
    totalIssues: result.summary.totalIssues,
    bySeverity,
    byCategory,
    packagesAnalyzed: result.summary.packagesAnalyzed,
    filesAnalyzed: result.summary.filesAnalyzed,
    durationMs: result.summary.durationMs,
    filesWithIssues: filesWithIssues.size,
    highestSeverity,
  }
}

/**
 * Format a file location for display.
 */
export function formatLocation(
  location: Issue['location'],
  options?: {includeColumn?: boolean},
): string {
  let result = location.filePath

  if (location.line !== undefined) {
    result += `:${location.line}`
    if (options?.includeColumn && location.column !== undefined) {
      result += `:${location.column}`
    }
  }

  return result
}

/**
 * Format duration for human-readable display.
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`
  }
  if (ms < 60000) {
    return `${(ms / 1000).toFixed(2)}s`
  }
  const minutes = Math.floor(ms / 60000)
  const seconds = ((ms % 60000) / 1000).toFixed(0)
  return `${minutes}m ${seconds}s`
}

/**
 * Truncate text to a maximum length with ellipsis.
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text
  }
  return `${text.slice(0, maxLength - 3)}...`
}

/**
 * Get relative path from workspace root.
 */
export function getRelativePath(filePath: string, workspacePath: string): string {
  if (filePath.startsWith(workspacePath)) {
    const relative = filePath.slice(workspacePath.length)
    return relative.startsWith('/') ? relative.slice(1) : relative
  }
  return filePath
}
