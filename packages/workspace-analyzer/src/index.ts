/**
 * @bfra.me/workspace-analyzer - Comprehensive monorepo static analysis
 *
 * This package provides workspace analysis through deep AST parsing and static analysis,
 * detecting configuration inconsistencies, unused dependencies, circular imports,
 * architectural violations, and performance optimization opportunities.
 *
 * @example
 * ```ts
 * import {analyzeWorkspace} from '@bfra.me/workspace-analyzer'
 *
 * const result = await analyzeWorkspace('./my-monorepo', {
 *   categories: ['dependency', 'circular-import'],
 *   minSeverity: 'warning',
 * })
 *
 * if (result.success) {
 *   console.log(`Found ${result.data.summary.totalIssues} issues`)
 * }
 * ```
 */

// Core types
export type {
  AnalysisError,
  AnalysisProgress,
  AnalysisResult,
  AnalysisResultType,
  AnalysisSummary,
  AnalyzerConfig,
  AnalyzeWorkspaceOptions,
  Issue,
  IssueCategory,
  IssueLocation,
  Severity,
} from './types/index'

// Result type utilities
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
} from './types/index'
export type {Err, Ok, Result} from './types/index'

// Placeholder for main API entry point (will be implemented in Phase 9)
// export {analyzeWorkspace} from './api/analyze-workspace'
