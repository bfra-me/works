/**
 * Type definitions for benchmark baselines.
 *
 * Baselines provide reference performance metrics for detecting regressions.
 * They are stored as JSON files and compared against current benchmark results.
 */

/**
 * Metadata about when and where the baseline was generated
 */
export interface BaselineMetadata {
  /** ISO 8601 timestamp when baseline was generated */
  generatedAt: string
  /** Git commit SHA at time of baseline generation */
  commitSha: string
  /** Node.js version used to generate baseline */
  nodeVersion: string
  /** Platform information (os, arch) */
  platform: {
    os: string
    arch: string
  }
  /** Package version at time of baseline generation */
  packageVersion: string
}

/**
 * Performance metrics for a single benchmark
 */
export interface BenchmarkMetrics {
  /** Average time per operation in nanoseconds */
  avgTimeNs: number
  /** Operations per second */
  opsPerSec: number
  /** Standard deviation in nanoseconds */
  stdDevNs: number
  /** Number of iterations used to calculate metrics */
  iterations: number
}

/**
 * A single benchmark entry in the baseline
 */
export interface BaselineBenchmark {
  /** Full name of the benchmark (suite > group > benchmark) */
  name: string
  /** Performance metrics */
  metrics: BenchmarkMetrics
  /** Tags for categorization */
  tags?: string[]
}

/**
 * Complete baseline file structure
 */
export interface BenchmarkBaseline {
  /** Baseline file format version for future compatibility */
  version: 1
  /** Metadata about the baseline */
  metadata: BaselineMetadata
  /** All benchmark entries */
  benchmarks: BaselineBenchmark[]
}

/**
 * Result of comparing current benchmarks against baseline
 */
export interface BaselineComparisonResult {
  /** Name of the benchmark */
  name: string
  /** Baseline metrics (if available) */
  baseline: BenchmarkMetrics | null
  /** Current metrics */
  current: BenchmarkMetrics
  /** Percentage difference (positive = slower, negative = faster) */
  differencePercent: number | null
  /** Whether this benchmark passes the regression threshold */
  passed: boolean
  /** Threshold that was used for comparison */
  thresholdPercent: number
  /** Whether this is a new benchmark without baseline */
  isNew: boolean
}

/**
 * Summary of baseline comparison
 */
export interface BaselineComparisonSummary {
  /** Total number of benchmarks compared */
  total: number
  /** Number of benchmarks that passed */
  passed: number
  /** Number of benchmarks that failed (regressed) */
  failed: number
  /** Number of new benchmarks without baseline */
  newBenchmarks: number
  /** Number of baselines that no longer have corresponding benchmarks */
  removedBenchmarks: number
  /** Overall pass/fail status */
  overallPassed: boolean
  /** Individual comparison results */
  results: BaselineComparisonResult[]
}

/**
 * Configuration for baseline comparison
 */
export interface BaselineComparisonConfig {
  /** Maximum allowed performance degradation percentage (default: 10) */
  thresholdPercent?: number
  /** Whether to fail on new benchmarks without baseline (default: false) */
  failOnNew?: boolean
  /** Whether to fail on removed benchmarks (default: false) */
  failOnRemoved?: boolean
  /** Benchmark name patterns to exclude from comparison */
  excludePatterns?: string[]
}

/**
 * Default comparison configuration
 */
export const DEFAULT_COMPARISON_CONFIG: Required<BaselineComparisonConfig> = {
  thresholdPercent: 10,
  failOnNew: false,
  failOnRemoved: false,
  excludePatterns: [],
}
