import type {ErrorContext} from './base'
import {BaseError} from './base'

/**
 * Error thrown when validation fails.
 */
export class ValidationError extends BaseError {
  readonly field: string | undefined

  constructor(
    message: string,
    options?: {field?: string; cause?: unknown; context?: ErrorContext},
  ) {
    const baseOptions: {code: string; cause?: unknown; context?: ErrorContext} = {
      code: 'VALIDATION_ERROR',
    }
    if (options?.cause !== undefined) {
      baseOptions.cause = options.cause
    }
    if (options?.context !== undefined) {
      baseOptions.context = options.context
    }
    super(message, baseOptions)
    this.name = 'ValidationError'
    this.field = options?.field
  }
}

/**
 * Error thrown when a resource is not found.
 */
export class NotFoundError extends BaseError {
  readonly resource: string | undefined

  constructor(
    message: string,
    options?: {resource?: string; cause?: unknown; context?: ErrorContext},
  ) {
    const baseOptions: {code: string; cause?: unknown; context?: ErrorContext} = {
      code: 'NOT_FOUND',
    }
    if (options?.cause !== undefined) {
      baseOptions.cause = options.cause
    }
    if (options?.context !== undefined) {
      baseOptions.context = options.context
    }
    super(message, baseOptions)
    this.name = 'NotFoundError'
    this.resource = options?.resource
  }
}

/**
 * Error thrown when permission is denied.
 */
export class PermissionError extends BaseError {
  readonly requiredPermission: string | undefined

  constructor(
    message: string,
    options?: {requiredPermission?: string; cause?: unknown; context?: ErrorContext},
  ) {
    const baseOptions: {code: string; cause?: unknown; context?: ErrorContext} = {
      code: 'PERMISSION_DENIED',
    }
    if (options?.cause !== undefined) {
      baseOptions.cause = options.cause
    }
    if (options?.context !== undefined) {
      baseOptions.context = options.context
    }
    super(message, baseOptions)
    this.name = 'PermissionError'
    this.requiredPermission = options?.requiredPermission
  }
}
