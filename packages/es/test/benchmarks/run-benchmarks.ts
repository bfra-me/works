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

import type {Task} from '@vitest/runner'
import {execSync} from 'node:child_process'
import {readFile} from 'node:fs/promises'
import {dirname, join} from 'node:path'
import process from 'node:process'
import {fileURLToPath} from 'node:url'
import {startVitest} from 'vitest/node'
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

function parseArgs(): {update: boolean; help: boolean} {
  const args = process.argv.slice(2)
  return {
    update: args.includes('--update') || args.includes('-u'),
    help: args.includes('--help') || args.includes('-h'),
  }
}

function showHelp(): void {
  log(`
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

// Helper to build full task name from task hierarchy
function buildTaskName(task: Task): string {
  const parts: string[] = []
  let current: Task | undefined = task

  while (current != null) {
    if (current.name !== '') {
      parts.unshift(current.name)
    }
    current = current.suite
  }

  return parts.join(' > ')
}

async function runBenchmarks(): Promise<BaselineBenchmark[]> {
  try {
    const vitest = await startVitest('benchmark', [], {
      run: true,
      watch: false,
    })

    if (vitest == null) {
      throw new Error('Failed to initialize Vitest')
    }

    // Run the benchmarks and wait for completion
    await vitest.start()

    const benchmarks: BaselineBenchmark[] = []

    // Extract benchmark results from state idMap
    for (const task of vitest.state.idMap.values()) {
      if (task.type === 'test' && task.result?.benchmark != null) {
        const {benchmark: result} = task.result
        benchmarks.push({
          name: buildTaskName(task),
          metrics: {
            avgTimeNs: result.mean * NS_PER_SECOND,
            opsPerSec: result.hz,
            stdDevNs: Math.sqrt(result.variance) * NS_PER_SECOND,
            iterations: result.sampleCount,
          },
        })
      }
    }

    await vitest.close()
    return benchmarks
  } catch (error) {
    console.error('Error running benchmarks:', error)
    throw error
  }
}

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

  const benchmarks = await runBenchmarks()

  if (benchmarks.length === 0) {
    log('ERROR: No benchmark results found.')
    log('This indicates either:')
    log('  1. No benchmark files match pattern: test/benchmarks/**/*.bench.ts')
    log('  2. Benchmarks failed to execute')
    log('  3. Vitest initialization failed')

    if (process.env.DEBUG_BENCHMARKS === 'true') {
      log('\nRunning benchmarks in simple mode (DEBUG_BENCHMARKS=true)...')
      try {
        execSync('vitest bench', {
          cwd: join(currentDir, '..', '..'),
          stdio: 'inherit',
        })
      } catch (error) {
        log(`Simple mode also failed: ${String(error)}`)
      }
    } else {
      log('\nSet DEBUG_BENCHMARKS=true to see raw benchmark output.')
    }

    log('\nCannot proceed with regression detection without results.')
    process.exit(1)
  }

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
