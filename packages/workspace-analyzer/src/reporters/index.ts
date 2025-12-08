/**
 * Reporter exports for workspace analysis output.
 *
 * Provides a unified API for generating analysis reports in various formats:
 * - JSON: Machine-readable output for CI/CD integration
 * - Markdown: Human-readable reports for documentation and review
 * - Console: Terminal output with colors for interactive feedback
 */

// Console reporter exports
export type {ConsoleReporterOptions} from './console-reporter'
export {createConsoleReporter} from './console-reporter'

// JSON reporter exports
export type {
  JsonReport,
  JsonReporterOptions,
  JsonReportGroup,
  JsonReportIssue,
  JsonReportLocation,
  JsonReportMetadata,
} from './json-reporter'
export {createJsonReporter} from './json-reporter'

// Markdown reporter exports
export type {MarkdownReporterOptions} from './markdown-reporter'
export {createMarkdownReporter} from './markdown-reporter'

// Core reporter types and utilities
export type {
  GroupedIssues,
  Reporter,
  ReporterFactory,
  ReportFormat,
  ReportOptions,
  ReportSummary,
} from './reporter'
export {
  calculateSummary,
  CATEGORY_CONFIG,
  DEFAULT_REPORT_OPTIONS,
  filterIssuesForReport,
  formatDuration,
  formatLocation,
  getRelativePath,
  groupIssues,
  SEVERITY_CONFIG,
  truncateText,
} from './reporter'
