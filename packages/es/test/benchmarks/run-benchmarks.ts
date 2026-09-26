#!/usr/bin/env node
/**
 * Benchmark regression detection script for CI.
 *
 * This script runs the Vitest benchmarks, collects results, and compares
 * them against a stored baseline to detect performance regressions.
 *
 * Usage:
 *   pnpm bench:ci                        # Run benchmarks and compare against the default baseline
 *   pnpm bench:ci --update               # Also write results as the default baseline
 *   pnpm bench:ci --baseline <path>       # Compare against a baseline at a custom path
 *   pnpm bench:ci --write-baseline <path> # Write results as a baseline at a custom path
 *   pnpm bench:ci --report-only          # Compare and report, but always exit 0
 *
 * A missing baseline is never treated as an error: the script reports that
 * there is nothing to compare against and continues (still writing a new
 * baseline when `--update`/`--write-baseline` is given).
 *
 * Exit codes:
 *   0 - No baseline to compare, all benchmarks passed the regression
 *       threshold, or `--report-only`/`--update`/`--write-baseline` was given
 *   1 - One or more benchmarks exceeded the regression threshold
 */

import type {JsonTestResults} from 'vitest/node'
import type {BaselineBenchmark, BaselineComparisonSummary} from './baselines'
import {execSync} from 'node:child_process'
import {appendFile, mkdtemp, readFile, rm} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {dirname, join} from 'node:path'
import process from 'node:process'
import {fileURLToPath} from 'node:url'
import {
  compareBaseline,
  createBaseline,
  DEFAULT_BASELINE_PATH,
  formatComparisonSummary,
  loadBaseline,
  saveBaseline,
} from './baselines'

const currentDir = dirname(fileURLToPath(import.meta.url))
const packageRoot = join(currentDir, '..', '..')

/**
 * Nanoseconds per millisecond conversion factor.
 *
 * Vitest 5's benchmark fixture reports `latency` statistics (from tinybench)
 * in milliseconds -- see `throughput.mean` being derived as `1000 / latency.mean`
 * in tinybench's own docs -- unlike the `mean`-in-seconds shape the removed
 * `TaskResult.benchmark` used in Vitest 4.
 */
const NS_PER_MS = 1_000_000

/**
 * Threshold for performance regression detection (percentage).
 * Benchmarks that are slower by more than this percentage will fail.
 */
const REGRESSION_THRESHOLD = 10

interface CliArgs {
  help: boolean
  reportOnly: boolean
  baselinePath: string
  writeBaselinePath: string | null
}

/** Read the value following a flag, e.g. `--baseline <path>`. */
function readFlagValue(args: string[], flag: string): string | undefined {
  const index = args.indexOf(flag)
  if (index === -1) {
    return undefined
  }
  const value = args[index + 1]
  if (value == null) {
    throw new Error(`Missing value for ${flag}`)
  }
  return value
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2)
  const help = args.includes('--help') || args.includes('-h')
  const reportOnly = args.includes('--report-only')
  const update = args.includes('--update') || args.includes('-u')

  const baselinePath = readFlagValue(args, '--baseline') ?? DEFAULT_BASELINE_PATH
  const explicitWriteBaselinePath = readFlagValue(args, '--write-baseline')
  const writeBaselinePath = explicitWriteBaselinePath ?? (update ? DEFAULT_BASELINE_PATH : null)

  return {help, reportOnly, baselinePath, writeBaselinePath}
}

function showHelp(): void {
  log(`
Benchmark Regression Detection Script

Usage:
  pnpm bench:ci                          Run benchmarks and compare against the default baseline
  pnpm bench:ci --update                 Also write results as the default baseline
  pnpm bench:ci --baseline <path>        Compare against a baseline at <path>
  pnpm bench:ci --write-baseline <path>  Write results as a baseline at <path>
  pnpm bench:ci --report-only            Compare and report, but always exit 0
  pnpm bench:ci --help                   Show this help message

Options:
  --baseline <path>        Path to read the baseline from (default: ${DEFAULT_BASELINE_PATH})
  --write-baseline <path>  Write current results as a baseline to <path>
  -u, --update             Alias for --write-baseline ${DEFAULT_BASELINE_PATH}
  --report-only            Report regressions but always exit 0
  -h, --help               Show this help message

A missing baseline is never an error: the script reports that there is
nothing to compare and continues.

Exit Codes:
  0  Nothing to compare, all benchmarks passed the regression threshold
     (≤${REGRESSION_THRESHOLD}%), or --report-only was given
  1  One or more benchmarks exceeded the regression threshold

Environment:
  REGRESSION_THRESHOLD  Override the default threshold (default: ${REGRESSION_THRESHOLD})
  GITHUB_STEP_SUMMARY   When set, a Markdown summary is appended to this file
`)
}

function getGitSha(): string {
  try {
    return execSync('git rev-parse HEAD', {encoding: 'utf-8'}).trim()
  } catch {
    return 'unknown'
  }
}

async function getPackageVersion(): Promise<string> {
  try {
    const pkgPath = join(currentDir, '..', '..', 'package.json')
    const content = await readFile(pkgPath, 'utf-8')
    const pkg = JSON.parse(content) as {version?: string}
    return pkg.version ?? '0.0.0'
  } catch {
    return '0.0.0'
  }
}

async function runBenchmarks(): Promise<BaselineBenchmark[]> {
  const reportDir = await mkdtemp(join(tmpdir(), 'bfra-me-es-bench-'))
  const reportPath = join(reportDir, 'benchmarks.json')

  try {
    // Running `vitest bench --reporter=json --outputFile=<path>` is the
    // documented way to capture benchmark results programmatically under
    // Vitest 5 (see the "Benchmarking API Rewrite" section of the migration
    // guide) -- the CLI's `bench` subcommand is what correctly scopes the run
    // to only the benchmark project, which the public `startVitest()` API
    // has no supported way to do on its own (the internal `benchmarkOnly`
    // CLI flag it relies on is not part of `CliOptions`).
    execSync(`vitest bench --reporter=json --outputFile=${JSON.stringify(reportPath)}`, {
      cwd: packageRoot,
      stdio: 'inherit',
    })

    const raw = await readFile(reportPath, 'utf-8')
    const report = JSON.parse(raw) as JsonTestResults

    const benchmarks: BaselineBenchmark[] = []

    // Each assertion result (one per `it()`/`test()` that used the `bench`
    // fixture) carries a `benchmarks` array: one entry per `bench()`
    // registration, each with one `tasks` entry per run/comparison branch.
    for (const testResult of report.testResults) {
      for (const assertion of testResult.assertionResults) {
        for (const registration of assertion.benchmarks) {
          for (const result of registration.tasks) {
            benchmarks.push({
              name: registration.name,
              metrics: {
                avgTimeNs: result.latency.mean * NS_PER_MS,
                opsPerSec: result.throughput.mean,
                stdDevNs: result.latency.sd * NS_PER_MS,
                iterations: result.latency.samplesCount,
              },
            })
          }
        }
      }
    }

    return benchmarks
  } catch (error) {
    console.error('Error running benchmarks:', error)
    throw error
  } finally {
    await rm(reportDir, {recursive: true, force: true})
  }
}

function log(message: string): void {
  // eslint-disable-next-line no-console
  console.log(message)
}

/** Append a Markdown section to `GITHUB_STEP_SUMMARY`, when it's set. */
async function appendStepSummary(markdown: string): Promise<void> {
  const summaryPath = process.env.GITHUB_STEP_SUMMARY
  if (summaryPath == null || summaryPath === '') {
    return
  }
  await appendFile(summaryPath, `${markdown}\n`, 'utf-8')
}

function formatMissingBaselineSummary(baselinePath: string): string {
  return [
    '## Benchmark Results',
    '',
    `No baseline found at \`${baselinePath}\`; nothing to compare.`,
  ].join('\n')
}

function formatComparisonRow(result: BaselineComparisonSummary['results'][number]): string {
  const baselineNs = result.baseline?.avgTimeNs.toFixed(2) ?? 'n/a'
  const diff = result.differencePercent
  const diffLabel = diff == null ? 'n/a' : `${diff >= 0 ? '+' : ''}${diff.toFixed(2)}%`
  return `| ${result.name} | ${baselineNs} | ${result.current.avgTimeNs.toFixed(2)} | ${diffLabel} |`
}

function formatStepSummaryMarkdown(
  summary: BaselineComparisonSummary,
  thresholdPercent: number,
): string {
  const lines: string[] = [
    '## Benchmark Results',
    '',
    `- Total: ${summary.total}`,
    `- Passed: ${summary.passed}`,
    `- Failed: ${summary.failed}`,
    `- New (no baseline): ${summary.newBenchmarks}`,
    `- Removed (in baseline but not current): ${summary.removedBenchmarks}`,
    `- Overall: ${summary.overallPassed ? '✓ passed' : '✗ failed'} (threshold: ≤${thresholdPercent}%)`,
  ]

  const regressions = summary.results.filter(
    result => !result.isNew && result.differencePercent != null && !result.passed,
  )
  const improvements = summary.results.filter(
    result =>
      !result.isNew &&
      result.differencePercent != null &&
      result.differencePercent <= -thresholdPercent,
  )

  if (regressions.length > 0) {
    lines.push(
      '',
      '### Regressions',
      '',
      '| Benchmark | Baseline (ns/op) | Current (ns/op) | Change |',
      '| --- | --- | --- | --- |',
    )
    for (const result of regressions) {
      lines.push(formatComparisonRow(result))
    }
  }

  if (improvements.length > 0) {
    lines.push(
      '',
      '### Improvements',
      '',
      '| Benchmark | Baseline (ns/op) | Current (ns/op) | Change |',
      '| --- | --- | --- | --- |',
    )
    for (const result of improvements) {
      lines.push(formatComparisonRow(result))
    }
  }

  return lines.join('\n')
}

/** Print `::warning::` annotations for regressions, for `--report-only` runs. */
function printRegressionAnnotations(summary: BaselineComparisonSummary): void {
  for (const result of summary.results) {
    if (result.isNew || result.passed || result.differencePercent == null) {
      continue
    }
    log(
      `::warning::Benchmark regression: "${result.name}" is ${result.differencePercent.toFixed(2)}% slower than baseline (threshold: ≤${result.thresholdPercent}%)`,
    )
  }
}

/** Main entry point */
async function main(): Promise<void> {
  const args = parseArgs()

  if (args.help) {
    showHelp()
    process.exit(0)
  }

  const envThreshold = process.env.REGRESSION_THRESHOLD
  const threshold = envThreshold == null ? REGRESSION_THRESHOLD : Number(envThreshold)

  log('Running benchmarks...\n')

  const benchmarks = await runBenchmarks()

  if (benchmarks.length === 0) {
    log('ERROR: No benchmark results found.')
    log('This indicates either:')
    log('  1. No benchmark files match pattern: test/benchmarks/**/*.bench.ts')
    log('  2. Benchmarks failed to execute')
    log('  3. The `vitest bench` JSON report contained no benchmark entries')
    log('\nCannot proceed with regression detection without results.')
    process.exit(1)
  }

  const baseline = await loadBaseline(args.baselinePath)
  let summary: BaselineComparisonSummary | null = null

  if (baseline == null) {
    log(`No baseline found at ${args.baselinePath}; nothing to compare.`)
    await appendStepSummary(formatMissingBaselineSummary(args.baselinePath))
  } else {
    summary = compareBaseline(baseline, benchmarks, {thresholdPercent: threshold})
    log(formatComparisonSummary(summary))
    await appendStepSummary(formatStepSummaryMarkdown(summary, threshold))
    if (args.reportOnly) {
      printRegressionAnnotations(summary)
    }
  }

  if (args.writeBaselinePath != null) {
    const commitSha = getGitSha()
    const packageVersion = await getPackageVersion()
    const newBaseline = createBaseline(benchmarks, commitSha, packageVersion)

    await saveBaseline(newBaseline, args.writeBaselinePath)
    log(`✓ Baseline written with ${benchmarks.length} benchmarks`)
    log(`  Commit: ${commitSha.slice(0, 8)}`)
    log(`  File: ${args.writeBaselinePath}`)
  }

  if (args.reportOnly || args.writeBaselinePath != null) {
    process.exit(0)
  }

  process.exit(summary == null || summary.overallPassed ? 0 : 1)
}

main().catch(error => {
  console.error('Benchmark regression detection failed:', error)
  process.exit(1)
})
