/**
 * @bfra.me/es/error - Error factory utilities with standardized error codes
 */

export {BaseError} from './base'
export type {ErrorContext} from './base'
export {createError, formatError, withErrorContext} from './factory'
export {NotFoundError, PermissionError, ValidationError} from './specialized'
