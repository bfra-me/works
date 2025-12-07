/**
 * JSON reporter for machine-readable analysis output.
 *
 * Generates structured JSON reports suitable for CI/CD integration,
 * programmatic processing, and data analysis tools.
 */

import type {AnalysisResult, Issue} from '../types/index'
import type {Reporter, ReportOptions, ReportSummary} from './reporter'

import {
  calculateSummary,
  DEFAULT_REPORT_OPTIONS,
  filterIssuesForReport,
  getRelativePath,
  groupIssues,
} from './reporter'

/**
 * JSON report structure for serialization.
 */
export interface JsonReport {
  /** Schema version for compatibility checking */
  readonly $schema?: string
  /** Report metadata */
  readonly metadata: JsonReportMetadata
  /** Summary statistics */
  readonly summary: ReportSummary
  /** All issues (filtered based on options) */
  readonly issues: readonly JsonReportIssue[]
  /** Issues grouped by the specified key */
  readonly groupedIssues?: readonly JsonReportGroup[]
}

/**
 * Report metadata for provenance tracking.
 */
export interface JsonReportMetadata {
  /** Report generation timestamp (ISO 8601) */
  readonly generatedAt: string
  /** Analysis start timestamp (ISO 8601) */
  readonly analysisStartedAt: string
  /** Analysis completion timestamp (ISO 8601) */
  readonly analysisCompletedAt: string
  /** Workspace path that was analyzed */
  readonly workspacePath: string
  /** Report options used for generation */
  readonly reportOptions: Partial<ReportOptions>
  /** Analyzer version (if available) */
  readonly version?: string
}

/**
 * Issue representation in JSON report.
 */
export interface JsonReportIssue {
  /** Issue identifier */
  readonly id: string
  /** Issue title */
  readonly title: string
  /** Issue description */
  readonly description: string
  /** Severity level */
  readonly severity: Issue['severity']
  /** Issue category */
  readonly category: Issue['category']
  /** File location */
  readonly location: JsonReportLocation
  /** Related locations (for multi-file issues like circular imports) */
  readonly relatedLocations?: readonly JsonReportLocation[]
  /** Suggested fix */
  readonly suggestion?: string
  /** Additional metadata */
  readonly metadata?: Readonly<Record<string, unknown>>
}

/**
 * Location representation in JSON report.
 */
export interface JsonReportLocation {
  /** File path (relative to workspace root) */
  readonly file: string
  /** Absolute file path */
  readonly absolutePath: string
  /** Line number (1-indexed) */
  readonly line?: number
  /** Column number (1-indexed) */
  readonly column?: number
  /** End line number (1-indexed) */
  readonly endLine?: number
  /** End column number (1-indexed) */
  readonly endColumn?: number
}

/**
 * Grouped issues in JSON report.
 */
export interface JsonReportGroup {
  /** Group key */
  readonly key: string
  /** Group label */
  readonly label: string
  /** Number of issues in group */
  readonly count: number
  /** Issues in this group */
  readonly issues: readonly JsonReportIssue[]
}

/**
 * Options specific to JSON reporter.
 */
export interface JsonReporterOptions extends ReportOptions {
  /** Whether to pretty-print JSON output */
  readonly prettyPrint?: boolean
  /** Indentation size for pretty-printing (default: 2) */
  readonly indentation?: number
  /** Whether to include grouped issues section */
  readonly includeGroupedIssues?: boolean
  /** JSON schema URL for validation */
  readonly schemaUrl?: string
}

/**
 * Create a JSON reporter instance.
 *
 * @example
 * ```ts
 * const reporter = createJsonReporter({prettyPrint: true})
 * const json = reporter.generate(analysisResult)
 * await fs.writeFile('report.json', json)
 * ```
 */
export function createJsonReporter(defaultOptions?: JsonReporterOptions): Reporter {
  return {
    id: 'json',
    name: 'JSON Reporter',
    generate(result: AnalysisResult, options?: ReportOptions): string {
      const mergedOptions: JsonReporterOptions = {
        ...DEFAULT_REPORT_OPTIONS,
        ...defaultOptions,
        ...options,
      }

      const report = generateJsonReport(result, mergedOptions)
      const prettyPrint = mergedOptions.prettyPrint ?? true
      const indentation = mergedOptions.indentation ?? 2

      return prettyPrint ? JSON.stringify(report, null, indentation) : JSON.stringify(report)
    },
    stream(result: AnalysisResult, write: (chunk: string) => void, options?: ReportOptions): void {
      const output = this.generate(result, options)
      write(output)
    },
  }
}

/**
 * Generate the complete JSON report structure.
 */
function generateJsonReport(result: AnalysisResult, options: JsonReporterOptions): JsonReport {
  const filteredIssues = filterIssuesForReport(result.issues, options)
  const summary = calculateSummary({...result, issues: filteredIssues})

  const baseReport: JsonReport = {
    metadata: generateMetadata(result, options),
    summary,
    issues: filteredIssues.map(issue => formatIssueForJson(issue, result.workspacePath, options)),
  }

  const report: JsonReport =
    options.schemaUrl === undefined ? baseReport : {$schema: options.schemaUrl, ...baseReport}

  if (options.includeGroupedIssues ?? options.groupBy !== 'none') {
    const grouped = groupIssues(filteredIssues, options.groupBy)
    return {
      ...report,
      groupedIssues: grouped.map(group => ({
        key: group.key,
        label: group.label,
        count: group.count,
        issues: group.issues.map(issue => formatIssueForJson(issue, result.workspacePath, options)),
      })),
    }
  }

  return report
}

/**
 * Generate report metadata.
 */
function generateMetadata(
  result: AnalysisResult,
  options: JsonReporterOptions,
): JsonReportMetadata {
  const {schemaUrl, prettyPrint, indentation, includeGroupedIssues, ...reportOptions} = options

  return {
    generatedAt: new Date().toISOString(),
    analysisStartedAt: result.startedAt.toISOString(),
    analysisCompletedAt: result.completedAt.toISOString(),
    workspacePath: result.workspacePath,
    reportOptions,
  }
}

/**
 * Format a single issue for JSON output.
 *
 * Accumulates optional properties (relatedLocations, suggestion, metadata)
 * based on issue data and report options.
 */
function formatIssueForJson(
  issue: Issue,
  workspacePath: string,
  options: JsonReporterOptions,
): JsonReportIssue {
  let jsonIssue: JsonReportIssue = {
    id: issue.id,
    title: issue.title,
    description: issue.description,
    severity: issue.severity,
    category: issue.category,
    location: formatLocationForJson(issue.location, workspacePath, options),
  }

  if (issue.relatedLocations !== undefined && issue.relatedLocations.length > 0) {
    jsonIssue = {
      ...jsonIssue,
      relatedLocations: issue.relatedLocations.map(loc =>
        formatLocationForJson(loc, workspacePath, options),
      ),
    }
  }

  if (options.includeSuggestions === true && issue.suggestion !== undefined) {
    jsonIssue = {...jsonIssue, suggestion: issue.suggestion}
  }

  if (options.includeMetadata === true && issue.metadata !== undefined) {
    jsonIssue = {...jsonIssue, metadata: issue.metadata}
  }

  return jsonIssue
}

/**
 * Format a location for JSON output.
 */
function formatLocationForJson(
  location: Issue['location'],
  workspacePath: string,
  options: JsonReporterOptions,
): JsonReportLocation {
  const baseLocation: JsonReportLocation = {
    file: getRelativePath(location.filePath, workspacePath),
    absolutePath: location.filePath,
  }

  if (!options.includeLocation) {
    return baseLocation
  }

  const result: JsonReportLocation = {
    ...baseLocation,
    ...(location.line === undefined ? {} : {line: location.line}),
    ...(location.column === undefined ? {} : {column: location.column}),
    ...(location.endLine === undefined ? {} : {endLine: location.endLine}),
    ...(location.endColumn === undefined ? {} : {endColumn: location.endColumn}),
  }

  return result
}
