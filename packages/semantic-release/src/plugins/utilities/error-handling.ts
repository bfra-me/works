/**
 * Error handling utilities for plugin development.
 *
 * Utilities for creating and handling semantic-release specific errors.
 */

/**
 * Base class for semantic-release plugin errors.
 * Extends the standard Error class with additional semantic-release context.
 */
export class SemanticReleaseError extends Error {
  /**
   * Error code for categorization.
   */
  readonly code?: string

  /**
   * Additional details about the error.
   */
  readonly details?: Record<string, unknown>

  constructor(message: string, code?: string, details?: Record<string, unknown>) {
    super(message)
    this.name = 'SemanticReleaseError'
    this.code = code
    this.details = details

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, SemanticReleaseError)
    }
  }
}

/**
 * Error for plugin configuration issues.
 */
export class PluginConfigError extends SemanticReleaseError {
  constructor(message: string, pluginName?: string, details?: Record<string, unknown>) {
    super(message, 'PLUGIN_CONFIG_ERROR', {
      ...details,
      plugin: pluginName,
    })
    this.name = 'PluginConfigError'
  }
}

/**
 * Error for environment/prerequisite issues.
 */
export class EnvironmentError extends SemanticReleaseError {
  constructor(message: string, code?: string, details?: Record<string, unknown>) {
    super(message, code ?? 'ENVIRONMENT_ERROR', details)
    this.name = 'EnvironmentError'
  }
}

/**
 * Error for authentication/authorization issues.
 */
export class AuthenticationError extends SemanticReleaseError {
  constructor(message: string, service?: string, details?: Record<string, unknown>) {
    super(message, 'AUTHENTICATION_ERROR', {
      ...details,
      service,
    })
    this.name = 'AuthenticationError'
  }
}

/**
 * Error for network/API issues.
 */
export class NetworkError extends SemanticReleaseError {
  constructor(message: string, statusCode?: number, details?: Record<string, unknown>) {
    super(message, 'NETWORK_ERROR', {
      ...details,
      statusCode,
    })
    this.name = 'NetworkError'
  }
}

/**
 * Creates a configuration error with standardized messaging.
 *
 * @param property - Configuration property that is invalid
 * @param pluginName - Name of the plugin
 * @param reason - Reason why the configuration is invalid
 * @returns Configured PluginConfigError
 *
 * @example
 * ```typescript
 * throw createConfigError('token', 'my-plugin', 'Token is required but was not provided')
 * ```
 */
export function createConfigError(
  property: string,
  pluginName: string,
  reason: string,
): PluginConfigError {
  return new PluginConfigError(
    `Invalid configuration for property "${property}" in plugin "${pluginName}": ${reason}`,
    pluginName,
    {property},
  )
}

/**
 * Creates an environment error with standardized messaging.
 *
 * @param requirement - Environment requirement that is missing
 * @param solution - Suggested solution
 * @returns Configured EnvironmentError
 *
 * @example
 * ```typescript
 * throw createEnvironmentError('GITHUB_TOKEN environment variable', 'Set GITHUB_TOKEN in your CI environment')
 * ```
 */
export function createEnvironmentError(requirement: string, solution: string): EnvironmentError {
  return new EnvironmentError(
    `Missing environment requirement: ${requirement}. ${solution}`,
    'MISSING_ENVIRONMENT',
    {requirement, solution},
  )
}

/**
 * Creates an authentication error with standardized messaging.
 *
 * @param service - Service that failed authentication
 * @param hint - Hint for resolving the authentication issue
 * @returns Configured AuthenticationError
 *
 * @example
 * ```typescript
 * throw createAuthenticationError('GitHub API', 'Check that your GITHUB_TOKEN has the correct permissions')
 * ```
 */
export function createAuthenticationError(service: string, hint: string): AuthenticationError {
  return new AuthenticationError(`Authentication failed for ${service}. ${hint}`, service, {hint})
}

/**
 * Creates a network error with standardized messaging.
 *
 * @param operation - Operation that failed
 * @param statusCode - HTTP status code (if applicable)
 * @param suggestion - Suggestion for resolving the issue
 * @returns Configured NetworkError
 *
 * @example
 * ```typescript
 * throw createNetworkError('GitHub release creation', 404, 'Check that the repository exists and is accessible')
 * ```
 */
export function createNetworkError(
  operation: string,
  statusCode?: number,
  suggestion?: string,
): NetworkError {
  const statusText = statusCode != null && statusCode > 0 ? ` (HTTP ${statusCode})` : ''
  const suggestionText = suggestion != null && suggestion.length > 0 ? ` ${suggestion}` : ''

  return new NetworkError(
    `Network error during ${operation}${statusText}.${suggestionText}`,
    statusCode,
    {operation, suggestion},
  )
}

/**
 * Wraps an unknown error to ensure it's a proper Error instance.
 *
 * @param error - Unknown error value
 * @param context - Additional context about where the error occurred
 * @returns Properly typed Error instance
 *
 * @example
 * ```typescript
 * try {
 *   await someAsyncOperation()
 * } catch (error) {
 *   throw wrapError(error, 'Failed to perform async operation')
 * }
 * ```
 */
export function wrapError(error: unknown, context?: string): Error {
  if (error instanceof Error) {
    return context != null && context.length > 0 ? new Error(`${context}: ${error.message}`) : error
  }

  const message =
    context != null && context.length > 0
      ? `${context}: ${String(error)}`
      : `Unknown error: ${String(error)}`

  return new Error(message)
}

/**
 * Type guard to check if an error is a semantic-release error.
 *
 * @param error - Error to check
 * @returns True if the error is a SemanticReleaseError
 */
export function isSemanticReleaseError(error: unknown): error is SemanticReleaseError {
  return error instanceof SemanticReleaseError
}

/**
 * Type guard to check if an error is a plugin configuration error.
 *
 * @param error - Error to check
 * @returns True if the error is a PluginConfigError
 */
export function isPluginConfigError(error: unknown): error is PluginConfigError {
  return error instanceof PluginConfigError
}

/**
 * Type guard to check if an error is an environment error.
 *
 * @param error - Error to check
 * @returns True if the error is an EnvironmentError
 */
export function isEnvironmentError(error: unknown): error is EnvironmentError {
  return error instanceof EnvironmentError
}

/**
 * Type guard to check if an error is an authentication error.
 *
 * @param error - Error to check
 * @returns True if the error is an AuthenticationError
 */
export function isAuthenticationError(error: unknown): error is AuthenticationError {
  return error instanceof AuthenticationError
}

/**
 * Type guard to check if an error is a network error.
 *
 * @param error - Error to check
 * @returns True if the error is a NetworkError
 */
export function isNetworkError(error: unknown): error is NetworkError {
  return error instanceof NetworkError
}
