/**
 * Enhanced configuration factory with validation and type inference.
 *
 * This module provides a comprehensive API for creating type-safe semantic-release
 * configurations with runtime validation, developer-friendly factory functions,
 * and support for complex configuration scenarios.
 *
 * @example
 * ```typescript
 * import {defineConfig} from '@bfra.me/semantic-release'
 *
 * // Basic usage with validation
 * export default defineConfig({
 *   branches: ['main'],
 *   plugins: [
 *     '@semantic-release/commit-analyzer',
 *     '@semantic-release/release-notes-generator',
 *     '@semantic-release/npm',
 *     '@semantic-release/github'
 *   ]
 * })
 * ```
 */

import type {GlobalConfig} from '../types/core.js'
import {validateCompleteConfig, ValidationError} from '../validation/validator.js'
import {applyEnvironmentTransformations, detectEnvironment} from './environment.js'

/**
 * Generate helpful suggestions based on validation errors.
 */
function generateValidationSuggestions(errors: ValidationError[]): string {
  const suggestions: string[] = []

  for (const error of errors) {
    for (const issue of error.zodError.issues) {
      const path = issue.path.join('.') || 'root'

      // Provide specific suggestions based on common error patterns
      if (issue.code === 'invalid_type') {
        if (path === 'branches' && issue.received === 'string') {
          suggestions.push('• `branches` should be an array. Try: branches: ["main"]')
        } else if (path.includes('plugins')) {
          suggestions.push(
            '• Plugin configurations should be either strings or [name, config] tuples',
          )
        } else {
          suggestions.push(`• ${path}: Expected ${issue.expected}, got ${issue.received}`)
        }
      } else if (
        issue.code === 'invalid_string' &&
        'validation' in issue &&
        issue.validation === 'url'
      ) {
        suggestions.push(
          '• `repositoryUrl` must be a valid URL. Example: "https://github.com/owner/repo.git"',
        )
      } else if (issue.code === 'too_small' && 'minimum' in issue) {
        if (issue.type === 'string') {
          suggestions.push(`• ${path}: Cannot be empty`)
        } else if (issue.type === 'array') {
          suggestions.push(`• ${path}: Must contain at least ${issue.minimum} item(s)`)
        } else {
          suggestions.push(`• ${path}: ${issue.message}`)
        }
      } else if (issue.code === 'invalid_union') {
        if (path.includes('branches')) {
          suggestions.push('• Branch specifications must be strings or objects with name property')
        } else if (path.includes('plugins')) {
          suggestions.push('• Plugins must be strings (plugin names) or [name, config] tuples')
        } else {
          suggestions.push(`• ${path}: ${issue.message}`)
        }
      } else if (issue.code === 'unrecognized_keys') {
        suggestions.push(
          `• ${path}: Unrecognized configuration options. Check the semantic-release documentation.`,
        )
      } else {
        // Generic fallback for all other error codes
        suggestions.push(`• ${path}: ${issue.message}`)
      }
    }
  }

  // Add general suggestions
  if (suggestions.length > 0) {
    suggestions.push(
      '',
      '📖 For more help: https://semantic-release.gitbook.io/semantic-release/usage/configuration',
    )
  }

  return suggestions.join('\n')
}

/**
 * Options for the defineConfig function.
 */
export interface DefineConfigOptions {
  /**
   * Whether to validate the configuration at creation time.
   * @default true
   */
  validate?: boolean

  /**
   * Environment context for configuration transformations.
   *
   * When specified, applies environment-specific optimizations and defaults:
   * - `development`: Enables dry-run mode, debug logging, and development branches
   * - `test`: Enables CI mode, dry-run, and test-specific settings
   * - `staging`: Allows real releases with staging tags and debug logging
   * - `production`: Production optimizations with minimal logging
   *
   * If not specified, environment is auto-detected from NODE_ENV, CI variables, and other indicators.
   *
   * @default 'production' (if auto-detection fails)
   */
  environment?: 'development' | 'staging' | 'production' | 'test'
}

/**
 * Enhanced defineConfig function with validation and type inference.
 *
 * Creates a type-safe semantic-release configuration with runtime validation
 * and enhanced developer experience. Supports environment-specific transformations.
 *
 * @param config - The semantic-release configuration object
 * @param options - Configuration options for validation and processing
 * @returns The validated and potentially transformed configuration
 *
 * @throws {ValidationError} When validation fails and validate option is true
 *
 * @example
 * ```typescript
 * // Basic usage
 * const config = defineConfig({
 *   branches: ['main', 'develop'],
 *   plugins: ['@semantic-release/commit-analyzer']
 * })
 * ```
 *
 * @example
 * ```typescript
 * // Environment-specific configuration with auto-detection
 * const config = defineConfig({
 *   branches: ['main'],
 *   plugins: ['@semantic-release/commit-analyzer', '@semantic-release/github']
 * })
 * // Automatically detects environment from NODE_ENV and applies appropriate settings
 * ```
 *
 * @example
 * ```typescript
 * // Explicit environment configuration
 * const config = defineConfig({
 *   branches: ['main'],
 *   plugins: ['@semantic-release/commit-analyzer']
 * }, {
 *   environment: 'development' // Forces development mode (dry-run, debug logging)
 * })
 * ```
 *
 * @example
 * ```typescript
 *   plugins: ['@semantic-release/commit-analyzer']
 * }, {
 *   environment: 'development',
 *   validate: true
 * })
 * ```
 *
 * @example
 * ```typescript
 * // Disable validation for dynamic configs
 * const config = defineConfig(dynamicConfig, {
 *   validate: false
 * })
 * ```
 */
export function defineConfig<T extends GlobalConfig>(
  config: T,
  options: DefineConfigOptions = {},
): T {
  const {validate: shouldValidate = true, environment = 'production'} = options

  // Validation phase - now with proper implementation
  if (shouldValidate) {
    const validationResult = validateCompleteConfig(config)

    if (!validationResult.success) {
      // Create comprehensive error message with suggestions
      const errorMessages = validationResult.errors
        .map(error => {
          const formattedErrors = error.getFormattedErrors()
          return formattedErrors.join(', ')
        })
        .join('; ')

      const suggestions = generateValidationSuggestions(validationResult.errors)
      const fullMessage = `Configuration validation failed: ${errorMessages}${suggestions ? `\n\nSuggestions:\n${suggestions}` : ''}`

      // Use the first error's Zod error, or create a minimal one if none available
      const firstError = validationResult.errors[0]
      if (firstError) {
        throw new ValidationError(fullMessage, firstError.zodError, 'defineConfig')
      } else {
        // This should never happen, but provide a fallback
        throw new Error(fullMessage)
      }
    }
  }

  // Apply comprehensive environment-specific transformations
  const envContext = detectEnvironment(environment)
  const processedConfig = applyEnvironmentTransformations(
    config,
    envContext.environment,
    envContext,
  )

  return processedConfig as T
}
