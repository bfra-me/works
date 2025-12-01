/**
 * Logging utilities package for synthetic monorepo.
 * Demonstrates Result-based logging with different transports.
 */

import type {Result} from '@bfra.me/es/result'
import {ok} from '@bfra.me/es/result'

/** Log level */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

/** Log entry */
export interface LogEntry {
  level: LogLevel
  message: string
  timestamp: Date
  context?: Record<string, unknown>
}

/** Logger error */
export interface LoggerError {
  code: 'TRANSPORT_ERROR' | 'FORMAT_ERROR'
  message: string
  transport?: string
}

/** Log transport interface */
export interface LogTransport {
  name: string
  write: (entry: LogEntry) => Promise<Result<void, LoggerError>>
}

/** Creates a console transport */
export function createConsoleTransport(): LogTransport {
  return {
    name: 'console',
    async write(entry): Promise<Result<void, LoggerError>> {
      const formatted = formatEntry(entry)
      const method = entry.level === 'error' ? 'error' : entry.level === 'warn' ? 'warn' : 'log'
      console[method](formatted)
      return ok(undefined)
    },
  }
}

/** Creates a memory transport for testing */
export function createMemoryTransport(): LogTransport & {getEntries: () => LogEntry[]} {
  const entries: LogEntry[] = []

  return {
    name: 'memory',
    async write(entry): Promise<Result<void, LoggerError>> {
      entries.push(entry)
      return ok(undefined)
    },
    getEntries(): LogEntry[] {
      return [...entries]
    },
  }
}

/** Formats a log entry */
function formatEntry(entry: LogEntry): string {
  const timestamp = entry.timestamp.toISOString()
  const level = entry.level.toUpperCase().padEnd(5)
  let message = `[${timestamp}] ${level} ${entry.message}`

  if (entry.context) {
    message += ` ${JSON.stringify(entry.context)}`
  }

  return message
}

/** Creates a logger instance */
export function createLogger(transports: LogTransport[] = [createConsoleTransport()]) {
  function log(level: LogLevel, message: string, context?: Record<string, unknown>) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
    }
    if (context) {
      entry.context = context
    }

    return Promise.all(transports.map(t => t.write(entry)))
  }

  return {
    debug: (message: string, context?: Record<string, unknown>) => log('debug', message, context),
    info: (message: string, context?: Record<string, unknown>) => log('info', message, context),
    warn: (message: string, context?: Record<string, unknown>) => log('warn', message, context),
    error: (message: string, context?: Record<string, unknown>) => log('error', message, context),
  }
}

/** Creates a child logger with additional context */
export function createChildLogger(
  parent: ReturnType<typeof createLogger>,
  baseContext: Record<string, unknown>,
) {
  return {
    debug: (message: string, context?: Record<string, unknown>) =>
      parent.debug(message, {...baseContext, ...context}),
    info: (message: string, context?: Record<string, unknown>) =>
      parent.info(message, {...baseContext, ...context}),
    warn: (message: string, context?: Record<string, unknown>) =>
      parent.warn(message, {...baseContext, ...context}),
    error: (message: string, context?: Record<string, unknown>) =>
      parent.error(message, {...baseContext, ...context}),
  }
}
