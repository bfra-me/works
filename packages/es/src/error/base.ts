/**
 * Additional context for an error.
 */
export interface ErrorContext {
  readonly [key: string]: unknown
}

/**
 * Base error class with code, cause, and context support.
 */
export class BaseError extends Error {
  readonly code: string
  readonly context: ErrorContext | undefined

  constructor(message: string, options?: {code?: string; cause?: unknown; context?: ErrorContext}) {
    super(message, {cause: options?.cause})
    this.name = 'BaseError'
    this.code = options?.code ?? 'UNKNOWN_ERROR'
    this.context = options?.context
  }
}
