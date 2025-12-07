/**
 * Console reporter for terminal output with colors and formatting.
 *
 * Generates colorful terminal output using consola and @clack/prompts
 * for interactive analysis feedback and CI/CD integration.
 */

import type {AnalysisResult, Issue, Severity} from '../types/index'
import type {GroupedIssues, Reporter, ReportOptions, ReportSummary} from './reporter'

import * as p from '@clack/prompts'
import {consola} from 'consola'

import {
  calculateSummary,
  CATEGORY_CONFIG,
  DEFAULT_REPORT_OPTIONS,
  filterIssuesForReport,
  formatDuration,
  getRelativePath,
  groupIssues,
  SEVERITY_CONFIG,
  truncateText,
} from './reporter'

/**
 * Options specific to console reporter.
 */
export interface ConsoleReporterOptions extends ReportOptions {
  /** Whether to use colors (auto-detected by default) */
  readonly colors?: boolean
  /** Whether to show verbose output with full descriptions */
  readonly verbose?: boolean
  /** Whether to show compact output (one line per issue) */
  readonly compact?: boolean
  /** Maximum width for text wrapping */
  readonly maxWidth?: number
  /** Whether to use @clack/prompts styling */
  readonly useClack?: boolean
}

/**
 * Create a console reporter instance.
 *
 * @example
 * ```ts
 * const reporter = createConsoleReporter({verbose: true})
 * reporter.generate(analysisResult) // Outputs to console
 * ```
 */
export function createConsoleReporter(defaultOptions?: ConsoleReporterOptions): Reporter {
  return {
    id: 'console',
    name: 'Console Reporter',
    generate(result: AnalysisResult, options?: ReportOptions): string {
      const mergedOptions: ConsoleReporterOptions = {
        ...DEFAULT_REPORT_OPTIONS,
        ...defaultOptions,
        ...options,
      }

      const output = generateConsoleOutput(result, mergedOptions)
      printToConsole(output, mergedOptions)
      return output.join('\n')
    },
    stream(result: AnalysisResult, write: (chunk: string) => void, options?: ReportOptions): void {
      const output = this.generate(result, options)
      write(output)
    },
  }
}

/**
 * Generate console output lines.
 */
function generateConsoleOutput(result: AnalysisResult, options: ConsoleReporterOptions): string[] {
  const lines: string[] = []
  const filteredIssues = filterIssuesForReport(result.issues, options)
  const summary = calculateSummary({...result, issues: filteredIssues})
  const grouped = groupIssues(filteredIssues, options.groupBy)

  lines.push(...generateHeader(summary))
  lines.push('')

  if (options.includeSummary) {
    lines.push(...generateSummary(summary))
    lines.push('')
  }

  lines.push(...generateIssuesList(grouped, result.workspacePath, options))

  lines.push('')
  lines.push(...generateFooter(summary, result))

  return lines
}

/**
 * Generate header section.
 */
function generateHeader(summary: ReportSummary): string[] {
  const lines: string[] = []
  const status = getStatusIcon(summary.highestSeverity)
  const statusText =
    summary.totalIssues === 0 ? 'No issues found' : `${summary.totalIssues} issue(s) found`

  lines.push('─'.repeat(60))
  lines.push(`${status} Workspace Analysis Report`)
  lines.push(`   ${statusText}`)
  lines.push('─'.repeat(60))

  return lines
}

/**
 * Generate summary section.
 */
function generateSummary(summary: ReportSummary): string[] {
  const lines: string[] = []

  lines.push('📊 Summary')
  lines.push('')

  const severityCounts: string[] = []
  for (const severity of ['critical', 'error', 'warning', 'info'] as const) {
    const count = summary.bySeverity[severity]
    if (count > 0) {
      const icon = SEVERITY_CONFIG[severity].emoji
      severityCounts.push(`${icon} ${count} ${severity}`)
    }
  }

  if (severityCounts.length > 0) {
    lines.push(`   ${severityCounts.join('  |  ')}`)
  } else {
    lines.push('   ✅ No issues!')
  }

  lines.push('')
  lines.push(
    `   📦 ${summary.packagesAnalyzed} packages  |  📄 ${summary.filesAnalyzed} files  |  ⏱️  ${formatDuration(summary.durationMs)}`,
  )

  return lines
}

/**
 * Generate issues list.
 */
function generateIssuesList(
  groups: readonly GroupedIssues[],
  workspacePath: string,
  options: ConsoleReporterOptions,
): string[] {
  const lines: string[] = []

  if (groups.length === 0 || groups.every(g => g.count === 0)) {
    lines.push('✅ No issues to report!')
    return lines
  }

  for (const group of groups) {
    if (group.count === 0) {
      continue
    }

    lines.push('')
    lines.push(...generateGroupSection(group, workspacePath, options))
  }

  return lines
}

/**
 * Generate a group section.
 */
function generateGroupSection(
  group: GroupedIssues,
  workspacePath: string,
  options: ConsoleReporterOptions,
): string[] {
  const lines: string[] = []

  const groupIcon = getGroupIcon(group.key, options.groupBy)
  lines.push(`${groupIcon} ${group.label} (${group.count})`)
  lines.push('')

  const maxIssues = options.maxIssuesPerGroup ?? 50
  const issuesToShow = group.issues.slice(0, maxIssues)
  const remainingCount = group.count - issuesToShow.length

  for (const issue of issuesToShow) {
    if (options.compact) {
      lines.push(formatCompactIssue(issue, workspacePath))
    } else {
      lines.push(...formatDetailedIssue(issue, workspacePath, options))
    }
  }

  if (remainingCount > 0) {
    lines.push(`   ... and ${remainingCount} more issue(s)`)
  }

  return lines
}

/**
 * Format an issue in compact mode (single line).
 */
function formatCompactIssue(issue: Issue, workspacePath: string): string {
  const icon = SEVERITY_CONFIG[issue.severity].emoji
  const relativePath = getRelativePath(issue.location.filePath, workspacePath)
  const location =
    issue.location.line === undefined ? relativePath : `${relativePath}:${issue.location.line}`
  const title = truncateText(issue.title, 50)

  return `   ${icon} ${location}: ${title}`
}

/**
 * Format an issue in detailed mode.
 */
function formatDetailedIssue(
  issue: Issue,
  workspacePath: string,
  options: ConsoleReporterOptions,
): string[] {
  const lines: string[] = []
  const icon = SEVERITY_CONFIG[issue.severity].emoji
  const severityLabel = SEVERITY_CONFIG[issue.severity].label.toUpperCase()

  lines.push(`   ${icon} [${severityLabel}] ${issue.title}`)

  const relativePath = getRelativePath(issue.location.filePath, workspacePath)
  let location = `      📍 ${relativePath}`
  if (issue.location.line !== undefined) {
    location += `:${issue.location.line}`
    if (issue.location.column !== undefined) {
      location += `:${issue.location.column}`
    }
  }
  lines.push(location)

  if (options.verbose) {
    const maxWidth = options.maxWidth ?? 80
    const wrappedDesc = wrapText(issue.description, maxWidth - 9)
    for (const line of wrappedDesc) {
      lines.push(`         ${line}`)
    }
  }

  if (options.includeSuggestions && issue.suggestion !== undefined) {
    lines.push(`      💡 ${issue.suggestion}`)
  }

  lines.push('')

  return lines
}

/**
 * Generate footer section.
 */
function generateFooter(summary: ReportSummary, result: AnalysisResult): string[] {
  const lines: string[] = []

  lines.push('─'.repeat(60))

  if (summary.totalIssues === 0) {
    lines.push('✅ Your workspace looks great!')
  } else {
    const recommendations: string[] = []
    if (summary.bySeverity.critical > 0 || summary.bySeverity.error > 0) {
      recommendations.push('Fix critical and error issues first')
    }
    if (summary.bySeverity.warning > 0) {
      recommendations.push('Review warnings for potential improvements')
    }

    if (recommendations.length > 0) {
      lines.push('💡 Recommendations:')
      for (const rec of recommendations) {
        lines.push(`   • ${rec}`)
      }
    }
  }

  const duration = formatDuration(result.completedAt.getTime() - result.startedAt.getTime())
  lines.push('')
  lines.push(`Analysis completed in ${duration}`)

  return lines
}

/**
 * Print output to console using appropriate method.
 */
function printToConsole(lines: string[], options: ConsoleReporterOptions): void {
  if (options.useClack) {
    p.log.message(lines.join('\n'))
  } else {
    for (const line of lines) {
      consola.log(line)
    }
  }
}

/**
 * Get status icon based on severity.
 */
function getStatusIcon(severity: Severity | null): string {
  if (severity === null) {
    return '✅'
  }
  return SEVERITY_CONFIG[severity].emoji
}

/**
 * Get group icon based on groupBy option.
 */
function getGroupIcon(key: string, groupBy: ReportOptions['groupBy']): string {
  if (groupBy === 'severity') {
    return SEVERITY_CONFIG[key as Severity]?.emoji ?? '📋'
  }
  if (groupBy === 'category') {
    return CATEGORY_CONFIG[key as keyof typeof CATEGORY_CONFIG]?.emoji ?? '📋'
  }
  return '📄'
}

/**
 * Wrap text to specified width.
 */
function wrapText(text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let currentLine = ''

  for (const word of words) {
    if (currentLine.length + word.length + 1 <= maxWidth) {
      currentLine += (currentLine.length > 0 ? ' ' : '') + word
    } else {
      if (currentLine.length > 0) {
        lines.push(currentLine)
      }
      currentLine = word
    }
  }

  if (currentLine.length > 0) {
    lines.push(currentLine)
  }

  return lines
}
