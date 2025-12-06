/**
 * Logging and telemetry factory for @bfra.me/create
 * Part of Phase 1: Foundation & Type System Enhancement
 *
 * Wraps consola to provide consistent error formatting and progress tracking.
 * Centralizes logging to ensure uniform UX across all CLI operations.
 */

import type {ConsolaInstance} from 'consola'
import {consola} from 'consola'
import {formatError, getUserFriendlyMessage, isBaseError} from './errors.js'

/**
 * Logger options for creating customized loggers
 */
export interface LoggerOptions {
  /** Logger tag to prepend to all messages */
  tag?: string
  /** Minimum log level (0=silent, 1=fatal, 2=error, 3=warn, 4=info, 5=debug, 6=trace) */
  level?: number
  /** Enable verbose logging */
  verbose?: boolean
}

/**
 * Progress tracking context
 */
export interface ProgressContext {
  /** Total number of steps */
  total: number
  /** Current step number */
  current: number
  /** Operation name */
  operation: string
  /** Start time for duration tracking */
  startTime: number
}

/**
 * Creates a scoped logger with consistent formatting
 */
export function createLogger(options: LoggerOptions = {}): ConsolaInstance {
  const {tag, level, verbose = false} = options

  const logger = consola.create({
    level: level ?? (verbose ? 5 : 4),
  })

  if (tag !== undefined) {
    return logger.withTag(tag)
  }

  return logger
}

/**
 * Logs an error with user-friendly formatting
 */
export function logError(error: unknown, options?: {verbose?: boolean}): void {
  const {verbose = false} = options ?? {}

  if (isBaseError(error)) {
    consola.error(getUserFriendlyMessage(error))

    // Verbose mode shows technical details for debugging
    if (verbose) {
      consola.box({
        title: `Error Details [${error.code}]`,
        message: formatError(error),
        style: {
          borderColor: 'red',
          borderStyle: 'rounded',
        },
      })
    }
  } else if (error instanceof Error) {
    consola.error(error.message)

    if (verbose && error.stack !== undefined) {
      consola.debug(error.stack)
    }
  } else {
    consola.error(String(error))
  }
}

/**
 * Logs a warning message
 */
export function logWarning(message: string): void {
  consola.warn(message)
}

/**
 * Logs an info message
 */
export function logInfo(message: string): void {
  consola.info(message)
}

/**
 * Logs a success message
 */
export function logSuccess(message: string): void {
  consola.success(message)
}

/**
 * Logs a debug message when verbose mode is enabled.
 * Gates debug output to prevent noise during normal CLI operation.
 */
export function logDebug(message: string, options?: {verbose?: boolean}): void {
  const {verbose = false} = options ?? {}

  if (verbose) {
    consola.debug(message)
  }
}

/**
 * Creates a progress reporter for multi-step operations
 */
export function createProgressReporter(total: number, operation: string) {
  const context: ProgressContext = {
    total,
    current: 0,
    operation,
    startTime: Date.now(),
  }

  return {
    start(message: string): void {
      context.current++
      const percentage = Math.round((context.current / context.total) * 100)
      consola.start(`[${context.current}/${context.total}] ${message} (${percentage}%)`)
    },

    complete(message?: string): void {
      const percentage = Math.round((context.current / context.total) * 100)
      const elapsed = this.formatDuration(Date.now() - context.startTime)

      if (message !== undefined && message.trim().length > 0) {
        consola.success(`✅ ${message} (${percentage}% - ${elapsed})`)
      } else {
        consola.success(`✅ Step ${context.current} completed (${percentage}%)`)
      }
    },

    fail(error: unknown): void {
      const percentage = Math.round((context.current / context.total) * 100)

      if (isBaseError(error)) {
        consola.error(`❌ ${getUserFriendlyMessage(error)} (${percentage}%)`)
      } else if (error instanceof Error) {
        consola.error(`❌ ${error.message} (${percentage}%)`)
      } else {
        consola.error(`❌ ${String(error)} (${percentage}%)`)
      }
    },

    finish(): void {
      const elapsed = this.formatDuration(Date.now() - context.startTime)
      consola.success(`🎉 ${context.operation} completed! Total time: ${elapsed}`)
    },

    formatDuration(ms: number): string {
      if (ms < 1000) {
        return `${ms}ms`
      }

      const seconds = Math.round(ms / 1000)
      if (seconds < 60) {
        return `${seconds}s`
      }

      const minutes = Math.floor(seconds / 60)
      const remainingSeconds = seconds % 60
      return `${minutes}m ${remainingSeconds}s`
    },
  }
}

/**
 * Displays a formatted box with information
 */
export function displayInfoBox(title: string, message: string): void {
  consola.box({
    title,
    message,
    style: {
      borderColor: 'blue',
      borderStyle: 'rounded',
    },
  })
}

/**
 * Displays a formatted box with success information
 */
export function displaySuccessBox(title: string, message: string): void {
  consola.box({
    title,
    message,
    style: {
      borderColor: 'green',
      borderStyle: 'rounded',
    },
  })
}

/**
 * Displays a formatted box with warning information
 */
export function displayWarningBox(title: string, message: string): void {
  consola.box({
    title,
    message,
    style: {
      borderColor: 'yellow',
      borderStyle: 'rounded',
    },
  })
}

/**
 * Logs validation errors with formatting
 */
export function logValidationErrors(errors: string[]): void {
  consola.error('Validation failed:')
  for (const error of errors) {
    consola.error(`  • ${error}`)
  }
}

/**
 * Logs validation warnings with formatting
 */
export function logValidationWarnings(warnings: string[]): void {
  consola.warn('Validation warnings:')
  for (const warning of warnings) {
    consola.warn(`  ⚠ ${warning}`)
  }
}

/**
 * Creates a spinner for long-running operations
 */
export function createSpinner(message: string) {
  return {
    start(): void {
      consola.start(message)
    },

    update(newMessage: string): void {
      consola.start(newMessage)
    },

    success(successMessage?: string): void {
      consola.success(successMessage ?? message)
    },

    fail(errorMessage?: string): void {
      consola.error(errorMessage ?? `Failed: ${message}`)
    },
  }
}

/**
 * Re-export consola for direct usage when needed
 */
export {consola}
export type {ConsolaInstance}
