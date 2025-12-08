/**
 * Unified error handling system for @bfra.me/create
 * Part of Phase 1: Foundation & Type System Enhancement
 *
 * This module establishes consistent error codes and error creation utilities
 * across template, AI, and CLI domains.
 */

import type {ErrorContext} from '@bfra.me/es/error'
import type {AIError, CLIError, ProjectError, TemplateError} from '../types.js'

/**
 * Factory functions for creating typed Result errors (Phase 1 Task 1.3)
 */

import {BaseError, createError, formatError, withErrorContext} from '@bfra.me/es/error'

/**
 * Error codes for template-related errors
 */
export const TemplateErrorCode = {
  TEMPLATE_NOT_FOUND: 'TEMPLATE_NOT_FOUND',
  TEMPLATE_INVALID: 'TEMPLATE_INVALID',
  TEMPLATE_FETCH_FAILED: 'TEMPLATE_FETCH_FAILED',
  TEMPLATE_PARSE_ERROR: 'TEMPLATE_PARSE_ERROR',
  TEMPLATE_RENDER_ERROR: 'TEMPLATE_RENDER_ERROR',
  TEMPLATE_METADATA_INVALID: 'TEMPLATE_METADATA_INVALID',
  TEMPLATE_VARIABLE_MISSING: 'TEMPLATE_VARIABLE_MISSING',
  TEMPLATE_CACHE_ERROR: 'TEMPLATE_CACHE_ERROR',
} as const

/**
 * Error codes for AI-related errors
 */
export const AIErrorCode = {
  AI_PROVIDER_UNAVAILABLE: 'AI_PROVIDER_UNAVAILABLE',
  AI_API_KEY_MISSING: 'AI_API_KEY_MISSING',
  AI_API_KEY_INVALID: 'AI_API_KEY_INVALID',
  AI_REQUEST_FAILED: 'AI_REQUEST_FAILED',
  AI_RESPONSE_INVALID: 'AI_RESPONSE_INVALID',
  AI_RATE_LIMIT: 'AI_RATE_LIMIT',
  AI_TIMEOUT: 'AI_TIMEOUT',
  AI_ANALYSIS_FAILED: 'AI_ANALYSIS_FAILED',
} as const

/**
 * Error codes for CLI-related errors
 */
export const CLIErrorCode = {
  INVALID_INPUT: 'INVALID_INPUT',
  INVALID_PROJECT_NAME: 'INVALID_PROJECT_NAME',
  INVALID_PATH: 'INVALID_PATH',
  PATH_TRAVERSAL_ATTEMPT: 'PATH_TRAVERSAL_ATTEMPT',
  DIRECTORY_EXISTS: 'DIRECTORY_EXISTS',
  DIRECTORY_NOT_EMPTY: 'DIRECTORY_NOT_EMPTY',
  FILE_SYSTEM_ERROR: 'FILE_SYSTEM_ERROR',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  COMMAND_FAILED: 'COMMAND_FAILED',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
} as const

/**
 * Error codes for project detection errors
 */
export const ProjectErrorCode = {
  PROJECT_DETECTION_FAILED: 'PROJECT_DETECTION_FAILED',
  PACKAGE_JSON_NOT_FOUND: 'PACKAGE_JSON_NOT_FOUND',
  PACKAGE_JSON_INVALID: 'PACKAGE_JSON_INVALID',
  PACKAGE_MANAGER_NOT_DETECTED: 'PACKAGE_MANAGER_NOT_DETECTED',
} as const

/**
 * Combined error codes type
 */
export type ErrorCode =
  | (typeof TemplateErrorCode)[keyof typeof TemplateErrorCode]
  | (typeof AIErrorCode)[keyof typeof AIErrorCode]
  | (typeof CLIErrorCode)[keyof typeof CLIErrorCode]
  | (typeof ProjectErrorCode)[keyof typeof ProjectErrorCode]

/**
 * Creates a template-related error
 */
export function createTemplateError(
  message: string,
  code: (typeof TemplateErrorCode)[keyof typeof TemplateErrorCode],
  context?: ErrorContext,
): BaseError {
  return createError(message, {code, context})
}

/**
 * Creates an AI-related error
 */
export function createAIError(
  message: string,
  code: (typeof AIErrorCode)[keyof typeof AIErrorCode],
  context?: ErrorContext,
): BaseError {
  return createError(message, {code, context})
}

/**
 * Creates a CLI-related error
 */
export function createCLIError(
  message: string,
  code: (typeof CLIErrorCode)[keyof typeof CLIErrorCode],
  context?: ErrorContext,
): BaseError {
  return createError(message, {code, context})
}

/**
 * Creates a project detection error
 */
export function createProjectError(
  message: string,
  code: (typeof ProjectErrorCode)[keyof typeof ProjectErrorCode],
  context?: ErrorContext,
): BaseError {
  return createError(message, {code, context})
}

export function isBaseError(error: unknown): error is BaseError {
  return error instanceof BaseError
}

export function hasErrorCode(error: unknown, code: ErrorCode): boolean {
  return isBaseError(error) && error.code === code
}

/**
 * Gets a user-friendly error message from an error
 */
export function getUserFriendlyMessage(error: unknown): string {
  if (isBaseError(error)) {
    switch (error.code) {
      case TemplateErrorCode.TEMPLATE_NOT_FOUND:
        return `Template not found. Please check the template name or path.`
      case TemplateErrorCode.TEMPLATE_INVALID:
        return `Invalid template. The template structure is incorrect.`
      case TemplateErrorCode.TEMPLATE_FETCH_FAILED:
        return `Failed to fetch template. Please check your internet connection.`
      case AIErrorCode.AI_API_KEY_MISSING:
        return `AI API key is missing. Please set OPENAI_API_KEY or ANTHROPIC_API_KEY environment variable.`
      case AIErrorCode.AI_PROVIDER_UNAVAILABLE:
        return `AI provider is currently unavailable. Try again later or disable AI features.`
      case CLIErrorCode.INVALID_PROJECT_NAME:
        return `Invalid project name. ${error.message}`
      case CLIErrorCode.PATH_TRAVERSAL_ATTEMPT:
        return `Invalid path. Path traversal attempts are not allowed.`
      case CLIErrorCode.DIRECTORY_EXISTS:
        return `Directory already exists. Use --force to overwrite or choose a different name.`
      case CLIErrorCode.PERMISSION_DENIED:
        return `Permission denied. You don't have permission to access this location.`
      default:
        return error.message
    }
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'An unknown error occurred.'
}

/**
 * Re-export error utilities from @bfra.me/es/error for convenience
 */
export {BaseError, createError, formatError, withErrorContext}
export type {ErrorContext}

export function templateNotFoundError(message: string, source: string): TemplateError {
  return {code: 'TEMPLATE_NOT_FOUND', message, source}
}

export function templateInvalidError(message: string, reason: string): TemplateError {
  return {code: 'TEMPLATE_INVALID', message, reason}
}

export function templateFetchFailedError(
  message: string,
  source: string,
  cause?: Error,
): TemplateError {
  return {code: 'TEMPLATE_FETCH_FAILED', message, source, cause}
}

export function templateParseError(message: string, file: string): TemplateError {
  return {code: 'TEMPLATE_PARSE_ERROR', message, file}
}

export function templateRenderError(message: string, file: string, cause?: Error): TemplateError {
  return {code: 'TEMPLATE_RENDER_ERROR', message, file, cause}
}

export function templateMetadataInvalidError(message: string, reason: string): TemplateError {
  return {code: 'TEMPLATE_METADATA_INVALID', message, reason}
}

export function templateVariableMissingError(message: string, variable: string): TemplateError {
  return {code: 'TEMPLATE_VARIABLE_MISSING', message, variable}
}

export function templateCacheError(
  message: string,
  operation: string,
  cause?: Error,
): TemplateError {
  return {code: 'TEMPLATE_CACHE_ERROR', message, operation, cause}
}

export function aiProviderUnavailableError(message: string, provider: string): AIError {
  return {code: 'AI_PROVIDER_UNAVAILABLE', message, provider}
}

export function aiApiKeyMissingError(message: string, variable: string): AIError {
  return {code: 'AI_API_KEY_MISSING', message, variable}
}

export function aiApiKeyInvalidError(message: string, provider: string): AIError {
  return {code: 'AI_API_KEY_INVALID', message, provider}
}

export function aiRequestFailedError(message: string, provider: string, cause?: Error): AIError {
  return {code: 'AI_REQUEST_FAILED', message, provider, cause}
}

export function aiResponseInvalidError(message: string, reason: string): AIError {
  return {code: 'AI_RESPONSE_INVALID', message, reason}
}

export function aiRateLimitError(message: string, provider: string, retryAfter?: number): AIError {
  return {code: 'AI_RATE_LIMIT', message, provider, retryAfter}
}

export function aiTimeoutError(message: string, provider: string): AIError {
  return {code: 'AI_TIMEOUT', message, provider}
}

export function aiAnalysisFailedError(message: string, reason: string): AIError {
  return {code: 'AI_ANALYSIS_FAILED', message, reason}
}

export function validationFailedError(message: string, details?: string[]): CLIError {
  return {code: 'VALIDATION_FAILED', message, details}
}

export function invalidProjectNameError(message: string, name: string): CLIError {
  return {code: 'INVALID_PROJECT_NAME', message, name}
}

export function invalidInputError(message: string, field?: string): CLIError {
  return {code: 'INVALID_INPUT', message, field}
}

export function invalidPathError(message: string, path: string): CLIError {
  return {code: 'INVALID_PATH', message, path}
}

export function pathTraversalAttemptError(message: string, path: string): CLIError {
  return {code: 'PATH_TRAVERSAL_ATTEMPT', message, path}
}

export function directoryExistsError(message: string, path: string): CLIError {
  return {code: 'DIRECTORY_EXISTS', message, path}
}

export function directoryNotEmptyError(message: string, path: string): CLIError {
  return {code: 'DIRECTORY_NOT_EMPTY', message, path}
}

export function fileSystemError(message: string, operation: string, cause?: Error): CLIError {
  return {code: 'FILE_SYSTEM_ERROR', message, operation, cause}
}

export function permissionDeniedError(message: string, path: string): CLIError {
  return {code: 'PERMISSION_DENIED', message, path}
}

export function commandFailedError(message: string, command: string, exitCode?: number): CLIError {
  return {code: 'COMMAND_FAILED', message, command, exitCode}
}

export function projectDetectionFailedError(message: string, path: string): ProjectError {
  return {code: 'PROJECT_DETECTION_FAILED', message, path}
}

export function packageJsonNotFoundError(message: string, path: string): ProjectError {
  return {code: 'PACKAGE_JSON_NOT_FOUND', message, path}
}

export function packageJsonInvalidError(
  message: string,
  path: string,
  reason: string,
): ProjectError {
  return {code: 'PACKAGE_JSON_INVALID', message, path, reason}
}

export function packageManagerNotDetectedError(message: string, path: string): ProjectError {
  return {code: 'PACKAGE_MANAGER_NOT_DETECTED', message, path}
}
