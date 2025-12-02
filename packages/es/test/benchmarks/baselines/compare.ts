/**
 * Baseline comparison utilities for benchmark regression detection.
 *
 * Provides functions to load, save, and compare benchmark baselines
 * to detect performance regressions in CI.
 */

import type {
  BaselineBenchmark,
  BaselineComparisonConfig,
  BaselineComparisonResult,
  BaselineComparisonSummary,
  BenchmarkBaseline,
  BenchmarkMetrics,
} from './types'

import {mkdir, readFile, writeFile} from 'node:fs/promises'
import {dirname, join} from 'node:path'
import process from 'node:process'
import {fileURLToPath} from 'node:url'

import {DEFAULT_COMPARISON_CONFIG} from './types'

const currentDir = dirname(fileURLToPath(import.meta.url))

/**
 * Path to the default baseline file
 */
export const DEFAULT_BASELINE_PATH = join(currentDir, 'baseline.json')

/**
 * Load a baseline from a JSON file
 *
 * @param path - Path to the baseline file
 * @returns The loaded baseline or null if file doesn't exist
 */
export async function loadBaseline(
  path: string = DEFAULT_BASELINE_PATH,
): Promise<BenchmarkBaseline | null> {
  try {
    const content = await readFile(path, 'utf-8')
    return JSON.parse(content) as BenchmarkBaseline
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null
    }
    throw error
  }
}

/**
 * Save a baseline to a JSON file
 *
 * @param baseline - The baseline to save
 * @param path - Path to save the baseline file
 */
export async function saveBaseline(
  baseline: BenchmarkBaseline,
  path: string = DEFAULT_BASELINE_PATH,
): Promise<void> {
  await mkdir(dirname(path), {recursive: true})
  await writeFile(path, `${JSON.stringify(baseline, null, 2)}\n`, 'utf-8')
}

/**
 * Create a new baseline from benchmark results
 *
 * @param benchmarks - Array of benchmark entries
 * @param commitSha - Git commit SHA
 * @param packageVersion - Package version
 * @returns A new baseline object
 */
export function createBaseline(
  benchmarks: BaselineBenchmark[],
  commitSha: string,
  packageVersion: string,
): BenchmarkBaseline {
  return {
    version: 1,
    metadata: {
      generatedAt: new Date().toISOString(),
      commitSha,
      nodeVersion: process.version,
      platform: {
        os: process.platform,
        arch: process.arch,
      },
      packageVersion,
    },
    benchmarks,
  }
}

/**
 * Compare current benchmark results against a baseline
 *
 * @param baseline - The baseline to compare against
 * @param current - Current benchmark results
 * @param config - Comparison configuration
 * @returns Comparison summary with pass/fail status
 */
export function compareBaseline(
  baseline: BenchmarkBaseline | null,
  current: BaselineBenchmark[],
  config: BaselineComparisonConfig = {},
): BaselineComparisonSummary {
  const opts = {...DEFAULT_COMPARISON_CONFIG, ...config}

  // Create lookup map for baseline benchmarks
  const baselineMap = new Map<string, BenchmarkMetrics>()
  if (baseline != null) {
    for (const bench of baseline.benchmarks) {
      baselineMap.set(bench.name, bench.metrics)
    }
  }

  // Create lookup set for current benchmark names
  const currentNames = new Set(current.map(b => b.name))

  // Compare each current benchmark against baseline
  const results: BaselineComparisonResult[] = []

  for (const bench of current) {
    // Skip excluded patterns
    if (opts.excludePatterns.some(pattern => bench.name.includes(pattern))) {
      continue
    }

    const baselineMetrics = baselineMap.get(bench.name)
    const isNew = baselineMetrics == null

    let differencePercent: number | null = null
    let passed = true

    if (!isNew && baselineMetrics != null) {
      // Calculate percentage difference (positive = slower)
      differencePercent =
        ((bench.metrics.avgTimeNs - baselineMetrics.avgTimeNs) / baselineMetrics.avgTimeNs) * 100

      // Check if regression exceeds threshold
      passed = differencePercent <= opts.thresholdPercent
    } else if (isNew && opts.failOnNew) {
      passed = false
    }

    results.push({
      name: bench.name,
      baseline: baselineMetrics ?? null,
      current: bench.metrics,
      differencePercent,
      passed,
      thresholdPercent: opts.thresholdPercent,
      isNew,
    })
  }

  // Check for removed benchmarks
  const removedNames: string[] = []
  if (baseline != null) {
    for (const bench of baseline.benchmarks) {
      if (!currentNames.has(bench.name)) {
        removedNames.push(bench.name)
      }
    }
  }

  // Calculate summary
  const passed = results.filter(r => r.passed).length
  const failed = results.filter(r => !r.passed).length
  const newBenchmarks = results.filter(r => r.isNew).length
  const removedBenchmarks = removedNames.length

  // Determine overall pass/fail
  let overallPassed = failed === 0
  if (opts.failOnRemoved && removedBenchmarks > 0) {
    overallPassed = false
  }

  return {
    total: results.length,
    passed,
    failed,
    newBenchmarks,
    removedBenchmarks,
    overallPassed,
    results,
  }
}

/**
 * Format a comparison summary as a human-readable string
 *
 * @param summary - The comparison summary to format
 * @returns Formatted string for console output
 */
export function formatComparisonSummary(summary: BaselineComparisonSummary): string {
  const lines: string[] = []

  lines.push('='.repeat(60))
  lines.push('BENCHMARK REGRESSION REPORT')
  lines.push('='.repeat(60))
  lines.push('')

  // Summary stats
  lines.push(`Total benchmarks: ${summary.total}`)
  lines.push(`Passed: ${summary.passed}`)
  lines.push(`Failed: ${summary.failed}`)
  if (summary.newBenchmarks > 0) {
    lines.push(`New (no baseline): ${summary.newBenchmarks}`)
  }
  if (summary.removedBenchmarks > 0) {
    lines.push(`Removed (in baseline but not current): ${summary.removedBenchmarks}`)
  }
  lines.push('')

  // Individual results
  if (summary.results.length > 0) {
    lines.push('-'.repeat(60))
    lines.push('DETAILS')
    lines.push('-'.repeat(60))

    for (const result of summary.results) {
      const status = result.passed ? '✓' : '✗'
      const statusLabel = result.isNew ? 'NEW' : result.passed ? 'PASS' : 'FAIL'

      lines.push('')
      lines.push(`${status} ${result.name}`)

      if (result.isNew) {
        lines.push(`  Status: ${statusLabel} (no baseline for comparison)`)
        lines.push(
          `  Current: ${result.current.avgTimeNs.toFixed(2)} ns/op (${formatOpsPerSec(result.current.opsPerSec)} ops/sec)`,
        )
      } else if (result.baseline != null) {
        const diff = result.differencePercent ?? 0
        const sign = diff >= 0 ? '+' : ''
        lines.push(`  Status: ${statusLabel} (threshold: ≤${result.thresholdPercent}%)`)
        lines.push(`  Baseline: ${result.baseline.avgTimeNs.toFixed(2)} ns/op`)
        lines.push(`  Current:  ${result.current.avgTimeNs.toFixed(2)} ns/op`)
        lines.push(`  Change:   ${sign}${diff.toFixed(2)}%`)
      }
    }
  }

  lines.push('')
  lines.push('='.repeat(60))
  lines.push(`OVERALL: ${summary.overallPassed ? '✓ PASSED' : '✗ FAILED'}`)
  lines.push('='.repeat(60))

  return lines.join('\n')
}

/**
 * Format operations per second with appropriate units
 */
function formatOpsPerSec(opsPerSec: number): string {
  if (opsPerSec >= 1_000_000_000) {
    return `${(opsPerSec / 1_000_000_000).toFixed(2)}B`
  }
  if (opsPerSec >= 1_000_000) {
    return `${(opsPerSec / 1_000_000).toFixed(2)}M`
  }
  if (opsPerSec >= 1_000) {
    return `${(opsPerSec / 1_000).toFixed(2)}K`
  }
  return opsPerSec.toFixed(2)
}

/**
 * Create a baseline benchmark entry from measurement data
 *
 * @param name - Benchmark name
 * @param metrics - Performance metrics
 * @param tags - Optional tags for categorization
 * @returns Baseline benchmark entry
 */
export function createBenchmarkEntry(
  name: string,
  metrics: BenchmarkMetrics,
  tags?: string[],
): BaselineBenchmark {
  return {
    name,
    metrics,
    ...(tags != null && tags.length > 0 ? {tags} : {}),
  }
}
