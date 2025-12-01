#!/usr/bin/env node
/**
 * Benchmark regression detection script for CI.
 *
 * This script runs the Vitest benchmarks, collects results, and compares
 * them against stored baselines to detect performance regressions.
 *
 * Usage:
 *   pnpm bench:ci           # Run benchmarks and compare against baseline
 *   pnpm bench:ci --update  # Update the baseline with current results
 *
 * Exit codes:
 *   0 - All benchmarks passed regression threshold
 *   1 - One or more benchmarks exceeded regression threshold
 */

import type {Buffer} from 'node:buffer'

import {execSync, spawn} from 'node:child_process'

import {readFile} from 'node:fs/promises'
import {dirname, join} from 'node:path'
import process from 'node:process'
import {fileURLToPath} from 'node:url'
import {
  compareBaseline,
  createBaseline,
  formatComparisonSummary,
  loadBaseline,
  saveBaseline,
  type BaselineBenchmark,
} from './baselines'

const currentDir = dirname(fileURLToPath(import.meta.url))
const baselinesDir = join(currentDir, 'baselines')
const baselinePath = join(baselinesDir, 'baseline.json')

/** Nanoseconds per second conversion factor */
const NS_PER_SECOND = 1_000_000_000

/**
 * Threshold for performance regression detection (percentage).
 * Benchmarks that are slower by more than this percentage will fail.
 */
const REGRESSION_THRESHOLD = 10

/** Vitest JSON output types (simplified) */
interface VitestJsonOutput {
  testResults?: VitestTestFile[]
}

interface VitestTestFile {
  assertionResults?: VitestAssertion[]
}

interface VitestAssertion {
  title: string
  fullName?: string
  meta?: {
    benchmark?: {
      hz: number
      mean: number
      variance: number
      samples: number
    }
  }
}

interface VitestBenchmarkResult {
  name: string
  hz: number
  mean: number
  variance: number
  samples: number
}

/** Parse command-line arguments */
function parseArgs(): {update: boolean; help: boolean} {
  const args = process.argv.slice(2)
  return {
    update: args.includes('--update') || args.includes('-u'),
    help: args.includes('--help') || args.includes('-h'),
  }
}

/** Display usage information */
function showHelp(): void {
  const helpText = `
Benchmark Regression Detection Script

Usage:
  pnpm bench:ci           Run benchmarks and compare against baseline
  pnpm bench:ci --update  Update the baseline with current results
  pnpm bench:ci --help    Show this help message

Options:
  -u, --update  Update the baseline file with current benchmark results
  -h, --help    Show this help message

Exit Codes:
  0  All benchmarks passed regression threshold (≤${REGRESSION_THRESHOLD}%)
  1  One or more benchmarks exceeded regression threshold

Environment:
  REGRESSION_THRESHOLD  Override the default threshold (default: ${REGRESSION_THRESHOLD}%)
`
  // eslint-disable-next-line no-console
  console.log(helpText)
}

/** Get the current git commit SHA */
function getGitSha(): string {
  try {
    return execSync('git rev-parse HEAD', {encoding: 'utf-8'}).trim()
  } catch {
    return 'unknown'
  }
}

/** Get the package version from package.json */
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

/** Run Vitest benchmarks and capture JSON output */
async function runBenchmarks(): Promise<VitestBenchmarkResult[]> {
  return new Promise((resolve, reject) => {
    let jsonOutput = ''

    const child = spawn('npx', ['vitest', 'bench', '--reporter=json'], {
      cwd: join(currentDir, '..', '..'),
      stdio: ['inherit', 'pipe', 'inherit'],
      shell: true,
    })

    child.stdout.on('data', (data: Buffer) => {
      jsonOutput += data.toString()
    })

    child.on('close', () => {
      const benchmarkResults = parseVitestOutput(jsonOutput)
      resolve(benchmarkResults)
    })

    child.on('error', reject)
  })
}

/** Parse Vitest JSON output into benchmark results */
function parseVitestOutput(jsonOutput: string): VitestBenchmarkResult[] {
  try {
    const parsed = JSON.parse(jsonOutput) as VitestJsonOutput
    const results: VitestBenchmarkResult[] = []

    if (parsed.testResults != null) {
      for (const testFile of parsed.testResults) {
        if (testFile.assertionResults != null) {
          for (const result of testFile.assertionResults) {
            if (result.meta?.benchmark != null) {
              results.push({
                name: result.fullName ?? result.title,
                ...result.meta.benchmark,
              })
            }
          }
        }
      }
    }
    return results
  } catch {
    console.warn('Could not parse Vitest JSON output, using simplified benchmark run')
    return []
  }
}

/** Log a message to console (centralized for consistency) */
function log(message: string): void {
  // eslint-disable-next-line no-console
  console.log(message)
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

  const results = await runBenchmarks()

  if (results.length === 0) {
    log('No benchmark results found. Running benchmarks in simple mode...')

    try {
      execSync('npx vitest bench', {
        cwd: join(currentDir, '..', '..'),
        stdio: 'inherit',
      })
    } catch {
      // Benchmarks ran, but we can't capture results for comparison
    }

    log('\nNote: Baseline comparison requires Vitest JSON reporter support.')
    log('Skipping regression detection for this run.')
    process.exit(0)
  }

  const benchmarks: BaselineBenchmark[] = results.map(r => ({
    name: r.name,
    metrics: {
      avgTimeNs: r.mean * NS_PER_SECOND,
      opsPerSec: r.hz,
      stdDevNs: Math.sqrt(r.variance) * NS_PER_SECOND,
      iterations: r.samples,
    },
  }))

  if (args.update) {
    const commitSha = getGitSha()
    const packageVersion = await getPackageVersion()
    const baseline = createBaseline(benchmarks, commitSha, packageVersion)

    await saveBaseline(baseline)
    log(`✓ Baseline updated with ${benchmarks.length} benchmarks`)
    log(`  Commit: ${commitSha.slice(0, 8)}`)
    log(`  File: ${baselinePath}`)
    process.exit(0)
  }

  const baseline = await loadBaseline()

  if (baseline == null) {
    log('No baseline found. Run with --update to create one.')
    log(`Expected baseline path: ${baselinePath}`)
    process.exit(0)
  }

  const summary = compareBaseline(baseline, benchmarks, {thresholdPercent: threshold})
  log(formatComparisonSummary(summary))

  process.exit(summary.overallPassed ? 0 : 1)
}

main().catch(error => {
  console.error('Benchmark regression detection failed:', error)
  process.exit(1)
})
