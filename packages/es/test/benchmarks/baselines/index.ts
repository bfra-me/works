/**
 * Benchmark baselines module.
 *
 * Provides types and utilities for storing, loading, and comparing
 * benchmark baselines for performance regression detection.
 *
 * @module baselines
 */

export {
  compareBaseline,
  createBaseline,
  createBenchmarkEntry,
  DEFAULT_BASELINE_PATH,
  formatComparisonSummary,
  loadBaseline,
  saveBaseline,
} from './compare'
export type {
  BaselineBenchmark,
  BaselineComparisonConfig,
  BaselineComparisonResult,
  BaselineComparisonSummary,
  BaselineMetadata,
  BenchmarkBaseline,
  BenchmarkMetrics,
} from './types'

export {DEFAULT_COMPARISON_CONFIG} from './types'
