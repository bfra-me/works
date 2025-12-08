/**
 * UI utilities for CLI using @clack/prompts.
 *
 * Provides a consistent interface for terminal output, progress reporting,
 * and interactive prompts adapted from doc-sync's UI patterns.
 */

import type {AnalyzerSelectionOption, GlobalOptions} from './types'

import * as p from '@clack/prompts'
import {consola} from 'consola'

/**
 * Logger interface for consistent output across CLI commands.
 */
export interface Logger {
  readonly info: (message: string) => void
  readonly success: (message: string) => void
  readonly warn: (message: string) => void
  readonly error: (message: string) => void
  readonly debug: (message: string) => void
}

/**
 * Options for creating a logger.
 */
export interface LoggerOptions {
  readonly verbose?: boolean
  readonly quiet?: boolean
}

/**
 * Creates a logger that respects verbose/quiet options.
 */
export function createLogger(options: LoggerOptions): Logger {
  const {verbose = false, quiet = false} = options

  return {
    info(message: string): void {
      if (!quiet) {
        p.log.info(message)
      }
    },
    success(message: string): void {
      if (!quiet) {
        p.log.success(message)
      }
    },
    warn(message: string): void {
      p.log.warn(message)
    },
    error(message: string): void {
      p.log.error(message)
    },
    debug(message: string): void {
      if (verbose) {
        consola.debug(message)
      }
    },
  }
}

/**
 * Shows intro banner for the CLI.
 */
export function showIntro(title: string): void {
  p.intro(title)
}

/**
 * Shows outro message when CLI completes.
 */
export function showOutro(message: string): void {
  p.outro(message)
}

/**
 * Creates a spinner for long-running operations.
 */
export function createSpinner(): ReturnType<typeof p.spinner> {
  return p.spinner()
}

/**
 * Shows cancellation message when user cancels operation.
 */
export function showCancel(message = 'Operation cancelled.'): void {
  p.cancel(message)
}

/**
 * Checks if a value represents a user cancellation.
 */
export function handleCancel(value: unknown): value is symbol {
  return p.isCancel(value)
}

/**
 * Prompts user to select analyzers to run.
 */
export async function selectAnalyzers(
  availableAnalyzers: readonly AnalyzerSelectionOption[],
): Promise<readonly string[] | symbol> {
  if (availableAnalyzers.length === 0) {
    return []
  }

  const options = availableAnalyzers.map(analyzer => ({
    value: analyzer.value,
    label: analyzer.label,
    hint: analyzer.hint,
  }))

  const selected = await p.multiselect({
    message: 'Select analyzers to run',
    options,
    required: false,
    initialValues: options.map(o => o.value),
  })

  return selected
}

/**
 * Prompts user to confirm an action.
 */
export async function confirmAction(message: string): Promise<boolean | symbol> {
  return p.confirm({message})
}

/**
 * Formats a duration in milliseconds to a human-readable string.
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`
  }
  if (ms < 60000) {
    return `${(ms / 1000).toFixed(1)}s`
  }
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.round((ms % 60000) / 1000)
  return `${minutes}m ${seconds}s`
}

/**
 * Formats a list of items for display.
 */
export function formatList(items: readonly string[], maxDisplay = 3): string {
  if (items.length === 0) {
    return 'none'
  }
  if (items.length === 1) {
    return items[0] ?? 'unknown'
  }
  if (items.length <= maxDisplay) {
    return items.join(', ')
  }
  return `${items.slice(0, maxDisplay).join(', ')} and ${items.length - maxDisplay} more`
}

/**
 * Creates a progress callback suitable for the onProgress option.
 */
export function createProgressCallback(options: GlobalOptions): (message: string) => void {
  const logger = createLogger(options)
  return (message: string) => {
    logger.debug(message)
  }
}

/**
 * Formats issue count with appropriate color indicator.
 */
export function formatIssueCount(
  count: number,
  severity: 'info' | 'warning' | 'error' | 'critical',
): string {
  const severityIndicators = {
    info: 'ℹ️',
    warning: '⚠️',
    error: '❌',
    critical: '🚨',
  }
  return `${severityIndicators[severity]} ${count} ${severity}${count === 1 ? '' : 's'}`
}

/**
 * Formats a severity-based summary for display.
 */
export function formatSeveritySummary(bySeverity: Readonly<Record<string, number>>): string {
  const parts: string[] = []

  const critical = bySeverity.critical ?? 0
  const error = bySeverity.error ?? 0
  const warning = bySeverity.warning ?? 0
  const info = bySeverity.info ?? 0

  if (critical > 0) {
    parts.push(formatIssueCount(critical, 'critical'))
  }
  if (error > 0) {
    parts.push(formatIssueCount(error, 'error'))
  }
  if (warning > 0) {
    parts.push(formatIssueCount(warning, 'warning'))
  }
  if (info > 0) {
    parts.push(formatIssueCount(info, 'info'))
  }

  return parts.length > 0 ? parts.join(', ') : '✅ No issues'
}
