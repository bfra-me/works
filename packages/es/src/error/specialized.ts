import type {ErrorContext} from './base'
import {BaseError} from './base'

interface BaseSpecializedOptions {
  cause?: unknown
  context?: ErrorContext
}

function buildBaseOptions(
  code: string,
  options?: BaseSpecializedOptions,
): {code: string; cause?: unknown; context?: ErrorContext} {
  const baseOptions: {code: string; cause?: unknown; context?: ErrorContext} = {code}
  if (options?.cause !== undefined) {
    baseOptions.cause = options.cause
  }
  if (options?.context !== undefined) {
    baseOptions.context = options.context
  }
  return baseOptions
}

/**
 * Error thrown when validation fails.
 */
export class ValidationError extends BaseError {
  readonly field: string | undefined

  constructor(message: string, options?: BaseSpecializedOptions & {field?: string}) {
    super(message, buildBaseOptions('VALIDATION_ERROR', options))
    this.name = 'ValidationError'
    this.field = options?.field
  }
}

/**
 * Error thrown when a resource is not found.
 */
export class NotFoundError extends BaseError {
  readonly resource: string | undefined

  constructor(message: string, options?: BaseSpecializedOptions & {resource?: string}) {
    super(message, buildBaseOptions('NOT_FOUND', options))
    this.name = 'NotFoundError'
    this.resource = options?.resource
  }
}

/**
 * Error thrown when permission is denied.
 */
export class PermissionError extends BaseError {
  readonly requiredPermission: string | undefined

  constructor(message: string, options?: BaseSpecializedOptions & {requiredPermission?: string}) {
    super(message, buildBaseOptions('PERMISSION_DENIED', options))
    this.name = 'PermissionError'
    this.requiredPermission = options?.requiredPermission
  }
}

/**
 * Error thrown when an operation times out.
 */
export class TimeoutError extends BaseError {
  readonly timeoutMs: number

  constructor(ms: number, options?: BaseSpecializedOptions & {message?: string}) {
    const message = options?.message ?? `Operation timed out after ${ms}ms`
    super(message, buildBaseOptions('TIMEOUT', options))
    this.name = 'TimeoutError'
    this.timeoutMs = ms
  }
}
