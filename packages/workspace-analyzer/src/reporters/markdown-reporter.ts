/**
 * Markdown reporter for human-readable analysis output.
 *
 * Generates well-formatted Markdown reports suitable for GitHub issues,
 * pull request comments, documentation, and team review.
 */

import type {AnalysisResult, Issue, Severity} from '../types/index'
import type {GroupedIssues, Reporter, ReportOptions, ReportSummary} from './reporter'

import {
  calculateSummary,
  CATEGORY_CONFIG,
  DEFAULT_REPORT_OPTIONS,
  filterIssuesForReport,
  formatDuration,
  getRelativePath,
  groupIssues,
  SEVERITY_CONFIG,
} from './reporter'

/**
 * Options specific to Markdown reporter.
 */
export interface MarkdownReporterOptions extends ReportOptions {
  /** Whether to use GitHub-flavored Markdown features (checkboxes, alerts) */
  readonly githubFlavored?: boolean
  /** Title for the report document */
  readonly title?: string
  /** Whether to include table of contents */
  readonly includeTableOfContents?: boolean
  /** Whether to use emoji in headers and status */
  readonly useEmoji?: boolean
  /** Whether to use collapsible sections for issue details */
  readonly collapsibleDetails?: boolean
  /** Maximum issues to show per group before truncating */
  readonly maxIssuesPerGroup?: number
}

/**
 * Create a Markdown reporter instance.
 *
 * @example
 * ```ts
 * const reporter = createMarkdownReporter({githubFlavored: true})
 * const markdown = reporter.generate(analysisResult)
 * await fs.writeFile('report.md', markdown)
 * ```
 */
export function createMarkdownReporter(defaultOptions?: MarkdownReporterOptions): Reporter {
  return {
    id: 'markdown',
    name: 'Markdown Reporter',
    generate(result: AnalysisResult, options?: ReportOptions): string {
      const mergedOptions: MarkdownReporterOptions = {
        ...DEFAULT_REPORT_OPTIONS,
        ...defaultOptions,
        ...options,
      }

      return generateMarkdownReport(result, mergedOptions)
    },
    stream(result: AnalysisResult, write: (chunk: string) => void, options?: ReportOptions): void {
      const output = this.generate(result, options)
      write(output)
    },
  }
}

/**
 * Generate the complete Markdown report.
 */
function generateMarkdownReport(result: AnalysisResult, options: MarkdownReporterOptions): string {
  const lines: string[] = []
  const filteredIssues = filterIssuesForReport(result.issues, options)
  const summary = calculateSummary({...result, issues: filteredIssues})
  const grouped = groupIssues(filteredIssues, options.groupBy)
  const useEmoji = options.useEmoji ?? true

  lines.push(generateTitle(options, summary, useEmoji))
  lines.push('')

  if (options.githubFlavored) {
    lines.push(generateGitHubAlert(summary))
    lines.push('')
  }

  if (options.includeTableOfContents && grouped.length > 1) {
    lines.push(generateTableOfContents(grouped, options))
    lines.push('')
  }

  if (options.includeSummary) {
    lines.push(generateSummarySection(summary, result, options, useEmoji))
    lines.push('')
  }

  lines.push(generateIssuesSection(grouped, result.workspacePath, options, useEmoji))

  return lines.join('\n')
}

/**
 * Generate report title.
 */
function generateTitle(
  options: MarkdownReporterOptions,
  summary: ReportSummary,
  useEmoji: boolean,
): string {
  const title = options.title ?? 'Workspace Analysis Report'
  const statusEmoji = getStatusEmoji(summary.highestSeverity, useEmoji)
  return `# ${statusEmoji} ${title}`
}

/**
 * Generate GitHub alert box based on severity.
 */
function generateGitHubAlert(summary: ReportSummary): string {
  if (summary.totalIssues === 0) {
    return '> [!TIP]\n> No issues found! Your workspace is in great shape.'
  }

  if (summary.highestSeverity === 'critical' || summary.highestSeverity === 'error') {
    return `> [!CAUTION]\n> Found ${summary.totalIssues} issue(s) requiring attention.`
  }

  if (summary.highestSeverity === 'warning') {
    return `> [!WARNING]\n> Found ${summary.totalIssues} issue(s) to review.`
  }

  return `> [!NOTE]\n> Found ${summary.totalIssues} informational issue(s).`
}

/**
 * Generate table of contents.
 */
function generateTableOfContents(
  groups: readonly GroupedIssues[],
  options: MarkdownReporterOptions,
): string {
  const lines: string[] = ['## Table of Contents', '']

  if (options.includeSummary) {
    lines.push('- [Summary](#summary)')
  }

  for (const group of groups) {
    const anchor = group.label.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-')
    lines.push(`- [${group.label}](#${anchor}) (${group.count})`)
  }

  return lines.join('\n')
}

/**
 * Generate summary statistics section.
 */
function generateSummarySection(
  summary: ReportSummary,
  _result: AnalysisResult,
  _options: MarkdownReporterOptions,
  useEmoji: boolean,
): string {
  const lines: string[] = ['## Summary', '']

  lines.push('### Overview', '')
  lines.push(`| Metric | Value |`)
  lines.push(`|--------|-------|`)
  lines.push(`| Total Issues | ${summary.totalIssues} |`)
  lines.push(`| Packages Analyzed | ${summary.packagesAnalyzed} |`)
  lines.push(`| Files Analyzed | ${summary.filesAnalyzed} |`)
  lines.push(`| Files with Issues | ${summary.filesWithIssues} |`)
  lines.push(`| Duration | ${formatDuration(summary.durationMs)} |`)
  lines.push('')

  lines.push('### Issues by Severity', '')
  lines.push(`| Severity | Count |`)
  lines.push(`|----------|-------|`)
  for (const severity of ['critical', 'error', 'warning', 'info'] as const) {
    const count = summary.bySeverity[severity]
    const config = SEVERITY_CONFIG[severity]
    const emoji = useEmoji ? `${config.emoji} ` : ''
    lines.push(`| ${emoji}${config.label} | ${count} |`)
  }
  lines.push('')

  lines.push('### Issues by Category', '')
  lines.push(`| Category | Count |`)
  lines.push(`|----------|-------|`)
  for (const [category, count] of Object.entries(summary.byCategory)) {
    if (count > 0) {
      const config = CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG]
      const emoji = useEmoji ? `${config.emoji} ` : ''
      lines.push(`| ${emoji}${config.label} | ${count} |`)
    }
  }

  return lines.join('\n')
}

/**
 * Generate issues section with grouping.
 */
function generateIssuesSection(
  groups: readonly GroupedIssues[],
  workspacePath: string,
  options: MarkdownReporterOptions,
  useEmoji: boolean,
): string {
  const lines: string[] = ['## Issues', '']

  if (groups.length === 0 || groups.every(g => g.count === 0)) {
    lines.push(useEmoji ? '✅ No issues found!' : 'No issues found!')
    return lines.join('\n')
  }

  for (const group of groups) {
    if (group.count === 0) {
      continue
    }

    lines.push(generateGroupHeader(group, options, useEmoji))
    lines.push('')

    const maxIssues = options.maxIssuesPerGroup ?? 50
    const issuesToShow = group.issues.slice(0, maxIssues)
    const remainingCount = group.count - issuesToShow.length

    for (const issue of issuesToShow) {
      lines.push(formatIssueMarkdown(issue, workspacePath, options, useEmoji))
      lines.push('')
    }

    if (remainingCount > 0) {
      lines.push(`*...and ${remainingCount} more issue(s)*`)
      lines.push('')
    }
  }

  return lines.join('\n')
}

/**
 * Generate group header.
 */
function generateGroupHeader(
  group: GroupedIssues,
  options: MarkdownReporterOptions,
  useEmoji: boolean,
): string {
  let emoji = ''
  if (useEmoji) {
    if (options.groupBy === 'severity') {
      const severityEmoji = SEVERITY_CONFIG[group.key as Severity]?.emoji
      emoji = severityEmoji === undefined ? '' : `${severityEmoji} `
    } else if (options.groupBy === 'category') {
      const categoryEmoji = CATEGORY_CONFIG[group.key as keyof typeof CATEGORY_CONFIG]?.emoji
      emoji = categoryEmoji === undefined ? '' : `${categoryEmoji} `
    } else {
      emoji = '📄 '
    }
  }

  return `### ${emoji}${group.label} (${group.count})`
}

/**
 * Format a single issue as Markdown.
 */
function formatIssueMarkdown(
  issue: Issue,
  workspacePath: string,
  options: MarkdownReporterOptions,
  useEmoji: boolean,
): string {
  const lines: string[] = []
  const severityConfig = SEVERITY_CONFIG[issue.severity]
  const emoji = useEmoji ? `${severityConfig.emoji} ` : ''

  const severityBadge = `\`${severityConfig.label.toUpperCase()}\``
  lines.push(`#### ${emoji}${issue.title}`)
  lines.push('')
  lines.push(
    `**Severity:** ${severityBadge} | **Category:** ${CATEGORY_CONFIG[issue.category].label}`,
  )
  lines.push('')

  if (options.includeLocation) {
    const relativePath = getRelativePath(issue.location.filePath, workspacePath)
    let location = `📍 \`${relativePath}\``
    if (issue.location.line !== undefined) {
      location += `:${issue.location.line}`
      if (issue.location.column !== undefined) {
        location += `:${issue.location.column}`
      }
    }
    lines.push(location)
    lines.push('')
  }

  if (options.collapsibleDetails) {
    lines.push('<details>')
    lines.push('<summary>Details</summary>')
    lines.push('')
  }

  lines.push(issue.description)
  lines.push('')

  if (options.includeSuggestions && issue.suggestion !== undefined) {
    lines.push(`> **💡 Suggestion:** ${issue.suggestion}`)
    lines.push('')
  }

  if (issue.relatedLocations !== undefined && issue.relatedLocations.length > 0) {
    lines.push('**Related locations:**')
    for (const loc of issue.relatedLocations) {
      const relativePath = getRelativePath(loc.filePath, workspacePath)
      let locStr = `- \`${relativePath}\``
      if (loc.line !== undefined) {
        locStr += `:${loc.line}`
      }
      lines.push(locStr)
    }
    lines.push('')
  }

  if (options.collapsibleDetails) {
    lines.push('</details>')
  }

  return lines.join('\n')
}

/**
 * Get status emoji based on severity.
 */
function getStatusEmoji(severity: Severity | null, useEmoji: boolean): string {
  if (!useEmoji) {
    return ''
  }

  if (severity === null) {
    return '✅'
  }

  return SEVERITY_CONFIG[severity].emoji
}
