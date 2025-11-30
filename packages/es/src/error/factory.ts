import type {ErrorContext} from './base'
import {BaseError} from './base'

/**
 * Options for creating an error.
 */
interface CreateErrorOptions {
  readonly code?: string
  readonly cause?: unknown
  readonly context?: ErrorContext
}

/**
 * Creates a new BaseError with the given message and options.
 *
 * @param message - The error message
 * @param options - Optional error configuration
 * @returns A new BaseError instance
 */
export function createError(message: string, options?: CreateErrorOptions): BaseError {
  return new BaseError(message, options)
}

/**
 * Formats an unknown error value to a string.
 *
 * @param error - The error to format
 * @returns A formatted error string
 */
export function formatError(error: unknown): string {
  if (error instanceof BaseError) {
    const parts = [`[${error.code}] ${error.message}`]
    if (error.context !== undefined) {
      parts.push(`Context: ${JSON.stringify(error.context)}`)
    }
    if (error.cause !== undefined) {
      parts.push(`Cause: ${formatError(error.cause)}`)
    }
    return parts.join('\n')
  }

  if (error instanceof Error) {
    return error.message
  }

  return String(error)
}

/**
 * Wraps a function execution with error context, adding context to any thrown errors.
 *
 * @param fn - The function to wrap
 * @param context - The context to add to any errors
 * @returns The result of the function
 * @throws The original error wrapped with context
 */
export function withErrorContext<T>(fn: () => T, context: ErrorContext): T {
  try {
    return fn()
  } catch (error) {
    if (error instanceof BaseError) {
      throw new BaseError(error.message, {
        code: error.code,
        cause: error.cause,
        context: {...error.context, ...context},
      })
    }

    if (error instanceof Error) {
      throw new BaseError(error.message, {
        cause: error,
        context,
      })
    }

    throw new BaseError(String(error), {context})
  }
}
