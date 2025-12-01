/**
 * Benchmark harness providing utilities for running performance benchmarks,
 * measuring execution times, and validating performance against thresholds.
 *
 * @module benchmark-harness
 */

/**
 * Result of a single benchmark measurement
 */
export interface BenchmarkMeasurement {
  /** Name of the benchmark */
  name: string
  /** Total iterations run */
  iterations: number
  /** Total time in milliseconds */
  totalTimeMs: number
  /** Average time per operation in nanoseconds */
  avgTimeNs: number
  /** Operations per second */
  opsPerSec: number
  /** Minimum time per operation in nanoseconds */
  minNs: number
  /** Maximum time per operation in nanoseconds */
  maxNs: number
  /** Standard deviation in nanoseconds */
  stdDevNs: number
}

/**
 * Result of a comparison benchmark
 */
export interface ComparisonResult {
  /** Name of the baseline benchmark */
  baselineName: string
  /** Name of the comparison benchmark */
  comparisonName: string
  /** Baseline measurement */
  baseline: BenchmarkMeasurement
  /** Comparison measurement */
  comparison: BenchmarkMeasurement
  /** Performance difference as a percentage (negative = faster, positive = slower) */
  differencePercent: number
  /** Whether the comparison meets the threshold requirement */
  meetsThreshold: boolean
  /** The threshold that was checked against */
  thresholdPercent: number
}

/**
 * Options for running a benchmark
 */
export interface BenchmarkOptions {
  /** Number of warmup iterations to run before measuring */
  warmupIterations?: number
  /** Minimum number of iterations to run */
  minIterations?: number
  /** Target duration in milliseconds for benchmarking */
  targetDurationMs?: number
  /** Whether to run garbage collection before benchmarking (if available) */
  forceGC?: boolean
}

const DEFAULT_OPTIONS: Required<BenchmarkOptions> = {
  warmupIterations: 100,
  minIterations: 1000,
  targetDurationMs: 500,
  forceGC: false,
}

/**
 * High-resolution timer using performance.now()
 */
function getHighResTime(): number {
  return performance.now()
}

/**
 * Attempt to trigger garbage collection if available.
 * This is a best-effort function that may not work in all environments.
 */
function tryForceGC(): void {
  if (typeof globalThis.gc === 'function') {
    globalThis.gc()
  }
}

/**
 * Calculate statistics from an array of timing samples
 */
function calculateStatistics(samples: number[]): {
  mean: number
  min: number
  max: number
  stdDev: number
} {
  const n = samples.length
  if (n === 0) {
    return {mean: 0, min: 0, max: 0, stdDev: 0}
  }

  const mean = samples.reduce((sum, v) => sum + v, 0) / n
  const min = Math.min(...samples)
  const max = Math.max(...samples)

  const variance = samples.reduce((sum, v) => sum + (v - mean) ** 2, 0) / n
  const stdDev = Math.sqrt(variance)

  return {mean, min, max, stdDev}
}

/**
 * Run a synchronous function multiple times and measure its performance.
 *
 * @param name - Name of the benchmark
 * @param fn - Function to benchmark
 * @param options - Benchmark options
 * @returns Benchmark measurement results
 */
export function measure<T>(
  name: string,
  fn: () => T,
  options: BenchmarkOptions = {},
): BenchmarkMeasurement {
  const opts = {...DEFAULT_OPTIONS, ...options}

  // Force GC before warmup if requested
  if (opts.forceGC) {
    tryForceGC()
  }

  // Warmup phase
  for (let i = 0; i < opts.warmupIterations; i++) {
    fn()
  }

  // Force GC before measurement if requested
  if (opts.forceGC) {
    tryForceGC()
  }

  // Measurement phase
  const samples: number[] = []
  let totalIterations = 0
  const startTime = getHighResTime()
  const targetEndTime = startTime + opts.targetDurationMs

  while (getHighResTime() < targetEndTime || totalIterations < opts.minIterations) {
    const iterStart = getHighResTime()
    fn()
    const iterEnd = getHighResTime()
    samples.push((iterEnd - iterStart) * 1_000_000) // Convert ms to ns
    totalIterations++

    // Safety limit to prevent infinite loops
    if (totalIterations > 10_000_000) break
  }

  const totalTimeMs = getHighResTime() - startTime
  const stats = calculateStatistics(samples)

  return {
    name,
    iterations: totalIterations,
    totalTimeMs,
    avgTimeNs: stats.mean,
    opsPerSec: 1_000_000_000 / stats.mean,
    minNs: stats.min,
    maxNs: stats.max,
    stdDevNs: stats.stdDev,
  }
}

/**
 * Run an async function multiple times and measure its performance.
 *
 * @param name - Name of the benchmark
 * @param fn - Async function to benchmark
 * @param options - Benchmark options
 * @returns Benchmark measurement results
 */
export async function measureAsync<T>(
  name: string,
  fn: () => Promise<T>,
  options: BenchmarkOptions = {},
): Promise<BenchmarkMeasurement> {
  const opts = {...DEFAULT_OPTIONS, ...options}

  // Force GC before warmup if requested
  if (opts.forceGC) {
    tryForceGC()
  }

  // Warmup phase
  for (let i = 0; i < opts.warmupIterations; i++) {
    await fn()
  }

  // Force GC before measurement if requested
  if (opts.forceGC) {
    tryForceGC()
  }

  // Measurement phase
  const samples: number[] = []
  let totalIterations = 0
  const startTime = getHighResTime()
  const targetEndTime = startTime + opts.targetDurationMs

  while (getHighResTime() < targetEndTime || totalIterations < opts.minIterations) {
    const iterStart = getHighResTime()
    await fn()
    const iterEnd = getHighResTime()
    samples.push((iterEnd - iterStart) * 1_000_000) // Convert ms to ns
    totalIterations++

    // Safety limit to prevent infinite loops
    if (totalIterations > 1_000_000) break
  }

  const totalTimeMs = getHighResTime() - startTime
  const stats = calculateStatistics(samples)

  return {
    name,
    iterations: totalIterations,
    totalTimeMs,
    avgTimeNs: stats.mean,
    opsPerSec: 1_000_000_000 / stats.mean,
    minNs: stats.min,
    maxNs: stats.max,
    stdDevNs: stats.stdDev,
  }
}

/**
 * Compare two benchmark measurements against a performance threshold.
 *
 * @param baseline - The baseline benchmark measurement
 * @param comparison - The comparison benchmark measurement
 * @param thresholdPercent - Maximum allowed performance degradation percentage (default: 5%)
 * @returns Comparison result with pass/fail status
 *
 * @example
 * ```ts
 * const baseline = measure('hand-written', handWrittenFn)
 * const comparison = measure('pipe', pipeFn)
 * const result = compareBenchmarks(baseline, comparison, 5)
 * // result.meetsThreshold === true if pipe is within 5% of hand-written
 * ```
 */
export function compareBenchmarks(
  baseline: BenchmarkMeasurement,
  comparison: BenchmarkMeasurement,
  thresholdPercent = 5,
): ComparisonResult {
  // Calculate the percentage difference (positive = slower, negative = faster)
  const differencePercent = ((comparison.avgTimeNs - baseline.avgTimeNs) / baseline.avgTimeNs) * 100

  // Comparison meets threshold if it's not slower by more than the threshold
  const meetsThreshold = differencePercent <= thresholdPercent

  return {
    baselineName: baseline.name,
    comparisonName: comparison.name,
    baseline,
    comparison,
    differencePercent,
    meetsThreshold,
    thresholdPercent,
  }
}

/**
 * Format a benchmark measurement as a human-readable string.
 *
 * @param measurement - The measurement to format
 * @returns Formatted string
 */
export function formatMeasurement(measurement: BenchmarkMeasurement): string {
  const avgNs = measurement.avgTimeNs.toFixed(2)
  const opsPerSec = measurement.opsPerSec.toLocaleString(undefined, {maximumFractionDigits: 0})
  const stdDevNs = measurement.stdDevNs.toFixed(2)

  return `${measurement.name}: ${avgNs} ns/op (${opsPerSec} ops/sec) ±${stdDevNs} ns [${measurement.iterations} iterations]`
}

/**
 * Format a comparison result as a human-readable string.
 *
 * @param result - The comparison result to format
 * @returns Formatted string
 */
export function formatComparison(result: ComparisonResult): string {
  const sign = result.differencePercent >= 0 ? '+' : ''
  const status = result.meetsThreshold ? '✓ PASS' : '✗ FAIL'
  const diffStr = `${sign}${result.differencePercent.toFixed(2)}%`

  return [
    `Comparison: ${result.comparisonName} vs ${result.baselineName}`,
    `  Baseline:   ${result.baseline.avgTimeNs.toFixed(2)} ns/op`,
    `  Comparison: ${result.comparison.avgTimeNs.toFixed(2)} ns/op`,
    `  Difference: ${diffStr} (threshold: ≤${result.thresholdPercent}%)`,
    `  Status:     ${status}`,
  ].join('\n')
}

/**
 * Assert that a benchmark meets a maximum time threshold.
 *
 * @param measurement - The benchmark measurement
 * @param maxTimeNs - Maximum allowed time in nanoseconds
 * @returns Whether the benchmark meets the threshold
 */
export function assertMaxTime(measurement: BenchmarkMeasurement, maxTimeNs: number): boolean {
  return measurement.avgTimeNs <= maxTimeNs
}

/**
 * Assert that a benchmark meets a minimum operations per second threshold.
 *
 * @param measurement - The benchmark measurement
 * @param minOpsPerSec - Minimum required operations per second
 * @returns Whether the benchmark meets the threshold
 */
export function assertMinOps(measurement: BenchmarkMeasurement, minOpsPerSec: number): boolean {
  return measurement.opsPerSec >= minOpsPerSec
}

/**
 * Create a suite of related benchmarks.
 *
 * @param name - Name of the benchmark suite
 * @returns Suite object with methods to add and run benchmarks
 */
export function createBenchmarkSuite(name: string) {
  const benchmarks: {name: string; fn: () => unknown; options: BenchmarkOptions | undefined}[] = []

  return {
    /** Name of the suite */
    name,

    /**
     * Add a benchmark to the suite
     */
    add(benchName: string, fn: () => unknown, options?: BenchmarkOptions) {
      benchmarks.push({name: benchName, fn, options})
      return this
    },

    /**
     * Run all benchmarks in the suite
     */
    run(suiteOptions?: BenchmarkOptions): BenchmarkMeasurement[] {
      return benchmarks.map(b => measure(b.name, b.fn, {...suiteOptions, ...b.options}))
    },

    /**
     * Run all benchmarks and compare each to the first (baseline)
     */
    runWithComparison(thresholdPercent = 5, suiteOptions?: BenchmarkOptions): ComparisonResult[] {
      const results = this.run(suiteOptions)
      if (results.length < 2) return []

      const baseline = results[0]
      if (!baseline) return []
      return results
        .slice(1)
        .map(comparison => compareBenchmarks(baseline, comparison, thresholdPercent))
    },
  }
}

/**
 * Utility to run a function N times in a tight loop.
 * Useful for microbenchmarks where you want to control iteration count.
 *
 * @param fn - Function to run
 * @param iterations - Number of iterations
 * @returns Total time in nanoseconds
 */
export function runIterations<T>(fn: () => T, iterations: number): number {
  const start = getHighResTime()
  for (let i = 0; i < iterations; i++) {
    fn()
  }
  const end = getHighResTime()
  return (end - start) * 1_000_000 // Convert ms to ns
}

/**
 * Create a function that prevents JIT optimization from eliminating code.
 * Use this to ensure benchmark functions aren't optimized away.
 */
export function preventOptimization<T>(value: T): T {
  // Using a volatile-like pattern to prevent dead code elimination
  if (typeof value === 'object' && value !== null && Math.random() > 2) {
    // This branch is never taken but the JIT can't prove it
    // eslint-disable-next-line no-console
    console.log(value)
  }
  return value
}
