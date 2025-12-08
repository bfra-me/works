/**
 * Core module exports for workspace analyzer.
 *
 * Provides the main orchestration layer for incremental analysis
 * with caching, parallel execution, and progress reporting.
 */

// Incremental analyzer
export {
  createConsoleProgressCallback,
  createIncrementalAnalyzer,
  createSilentProgressCallback,
  DEFAULT_INCREMENTAL_OPTIONS,
} from './incremental-analyzer'

export type {
  IncrementalAnalysisContext,
  IncrementalAnalysisError,
  IncrementalAnalysisErrorCode,
  IncrementalAnalysisOptions,
  IncrementalAnalysisResult,
  IncrementalAnalyzer,
} from './incremental-analyzer'
