/**
 * Logger helpers for plugin development.
 *
 * Utilities for consistent logging patterns in semantic-release plugins.
 */

import type {Logger} from '../context.js'

/**
 * Creates a prefixed logger that automatically adds a plugin name prefix.
 *
 * @param logger - Base logger instance from context
 * @param pluginName - Name of the plugin for prefixing
 * @returns Logger with prefixed methods
 *
 * @example
 * ```typescript
 * const log = createPrefixedLogger(context.logger, 'my-plugin')
 * log.info('Starting process') // Logs: [my-plugin] Starting process
 * ```
 */
export function createPrefixedLogger(logger: Logger, pluginName: string) {
  const prefix = `[${pluginName}]`

  return {
    log: (message: string, ...args: unknown[]) => logger.log(`${prefix} ${message}`, ...args),

    warn: (message: string, ...args: unknown[]) => logger.warn(`${prefix} ${message}`, ...args),

    success: (message: string, ...args: unknown[]) =>
      logger.success(`${prefix} ${message}`, ...args),

    error: (message: string, ...args: unknown[]) => logger.error(`${prefix} ${message}`, ...args),

    debug: (message: string, ...args: unknown[]) => logger.debug?.(`${prefix} ${message}`, ...args),

    /**
     * Log an informational message.
     */
    info: (message: string, ...args: unknown[]) => logger.log(`${prefix} ${message}`, ...args),

    /**
     * Log a step in a process.
     */
    step: (step: string, message: string, ...args: unknown[]) =>
      logger.log(`${prefix} [${step}] ${message}`, ...args),

    /**
     * Log the start of an operation.
     */
    start: (operation: string, ...args: unknown[]) =>
      logger.log(`${prefix} Starting ${operation}...`, ...args),

    /**
     * Log the completion of an operation.
     */
    complete: (operation: string, ...args: unknown[]) =>
      logger.success(`${prefix} Completed ${operation}`, ...args),

    /**
     * Log a skip message.
     */
    skip: (reason: string, ...args: unknown[]) =>
      logger.log(`${prefix} Skipping: ${reason}`, ...args),
  }
}

/**
 * Creates a structured logger for common plugin operations.
 *
 * @param logger - Base logger instance from context
 * @param pluginName - Name of the plugin for prefixing
 * @returns Structured logger with operation methods
 *
 * @example
 * ```typescript
 * const log = createStructuredLogger(context.logger, 'my-plugin')
 * log.operation('Publishing', () => {
 *   // operation code
 * })
 * ```
 */
export function createStructuredLogger(logger: Logger, pluginName: string) {
  const prefixed = createPrefixedLogger(logger, pluginName)

  return {
    ...prefixed,

    /**
     * Log and execute an operation with start/complete messages.
     */
    operation: async <T>(name: string, operation: () => Promise<T> | T): Promise<T> => {
      prefixed.start(name)
      try {
        const result = await operation()
        prefixed.complete(name)
        return result
      } catch (error) {
        prefixed.error(`Failed ${name}: ${error instanceof Error ? error.message : String(error)}`)
        throw error
      }
    },

    /**
     * Log configuration being used.
     */
    config: (config: Record<string, unknown>) => {
      prefixed.info('Configuration:')
      for (const [key, value] of Object.entries(config)) {
        // Hide sensitive values
        const displayValue =
          key.toLowerCase().includes('token') ||
          key.toLowerCase().includes('password') ||
          key.toLowerCase().includes('secret')
            ? '[HIDDEN]'
            : String(value)
        prefixed.info(`  ${key}: ${displayValue}`)
      }
    },

    /**
     * Log a list of items.
     */
    list: (title: string, items: readonly string[]) => {
      prefixed.info(`${title}:`)
      for (const item of items) {
        prefixed.info(`  - ${item}`)
      }
    },

    /**
     * Log validation results.
     */
    validation: (checks: {name: string; passed: boolean; message?: string}[]) => {
      prefixed.info('Validation results:')
      for (const check of checks) {
        const status = check.passed ? '✓' : '✗'
        const message =
          check.message != null && check.message.length > 0 ? ` - ${check.message}` : ''
        prefixed.info(`  ${status} ${check.name}${message}`)
      }
    },

    /**
     * Log environment information.
     */
    environment: (env: Record<string, string | undefined>) => {
      prefixed.info('Environment variables:')
      const relevantVars = Object.entries(env).filter(
        ([key]) =>
          key.includes('TOKEN') || key.includes('API') || key.includes('URL') || key.includes('CI'),
      )

      for (const [key, value] of relevantVars) {
        const displayValue =
          key.includes('TOKEN') || key.includes('SECRET')
            ? value != null && value.length > 0
              ? '[SET]'
              : '[NOT SET]'
            : (value ?? '[NOT SET]')
        prefixed.info(`  ${key}: ${displayValue}`)
      }
    },
  }
}

/**
 * Creates a debug logger that only logs when debug mode is enabled.
 *
 * @param logger - Base logger instance from context
 * @param pluginName - Name of the plugin for prefixing
 * @returns Debug logger
 *
 * @example
 * ```typescript
 * const debug = createDebugLogger(context.logger, 'my-plugin')
 * debug.log('Debug info') // Only logs if debug is enabled
 * ```
 */
export function createDebugLogger(logger: Logger, pluginName: string) {
  const prefixed = createPrefixedLogger(logger, pluginName)
  const isDebugEnabled = logger.debug != null

  return {
    log: (message: string, ...args: unknown[]) => {
      if (isDebugEnabled) {
        prefixed.debug?.(message, ...args)
      }
    },

    object: (label: string, obj: unknown) => {
      if (isDebugEnabled) {
        prefixed.debug?.(`${label}: ${JSON.stringify(obj, null, 2)}`)
      }
    },

    timing: (label: string, start: number) => {
      if (isDebugEnabled) {
        const duration = Date.now() - start
        prefixed.debug?.(`${label} took ${duration}ms`)
      }
    },

    enabled: isDebugEnabled,
  }
}

/**
 * Measures and logs execution time for operations.
 *
 * @param logger - Logger instance
 * @param operation - Name of the operation
 * @param fn - Function to execute and measure
 * @returns Result of the function
 *
 * @example
 * ```typescript
 * const result = await measureTime(logger, 'API call', async () => {
 *   return await fetch('/api/data')
 * })
 * ```
 */
export async function measureTime<T>(
  logger: Logger,
  operation: string,
  fn: () => Promise<T> | T,
): Promise<T> {
  const start = Date.now()
  try {
    const result = await fn()
    const duration = Date.now() - start
    logger.log(`${operation} completed in ${duration}ms`)
    return result
  } catch (error) {
    const duration = Date.now() - start
    logger.error(
      `${operation} failed after ${duration}ms: ${error instanceof Error ? error.message : String(error)}`,
    )
    throw error
  }
}

/**
 * Creates a logger that batches messages to avoid spam.
 *
 * @param logger - Base logger instance
 * @param batchSize - Number of messages to batch
 * @param flushInterval - Interval in ms to flush batched messages
 * @returns Batched logger
 */
export function createBatchedLogger(logger: Logger, batchSize = 10, flushInterval = 1000) {
  const batches: {level: string; message: string; args: unknown[]}[] = []
  let flushTimer: NodeJS.Timeout | null = null

  const flush = () => {
    if (batches.length === 0) return

    const grouped = batches.reduce(
      (acc, batch) => {
        if (acc[batch.level] == null) acc[batch.level] = []
        // We know acc[batch.level] exists because we just created it above
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        acc[batch.level]!.push(`${batch.message} ${batch.args.join(' ')}`)
        return acc
      },
      {} as Record<string, string[]>,
    )

    for (const [level, messages] of Object.entries(grouped)) {
      const summary = `Batched ${level} messages (${messages.length}):`
      const logFn = logger[level as keyof Logger] as ((msg: string) => void) | undefined
      logFn?.(summary)
      for (const message of messages) {
        logFn?.(`  ${message}`)
      }
    }

    batches.length = 0
    if (flushTimer != null) {
      clearTimeout(flushTimer)
      flushTimer = null
    }
  }

  const addBatch = (level: string, message: string, args: unknown[]) => {
    batches.push({level, message, args})

    if (batches.length >= batchSize) {
      flush()
    } else if (flushTimer == null) {
      flushTimer = setTimeout(flush, flushInterval)
    }
  }

  return {
    log: (message: string, ...args: unknown[]) => addBatch('log', message, args),
    warn: (message: string, ...args: unknown[]) => addBatch('warn', message, args),
    error: (message: string, ...args: unknown[]) => addBatch('error', message, args),
    success: (message: string, ...args: unknown[]) => addBatch('success', message, args),
    flush,
  }
}
