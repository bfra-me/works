/**
 * Configuration validation utilities using Zod schemas.
 *
 * This module provides comprehensive runtime validation for semantic-release
 * configurations, ensuring type safety and providing detailed error messages
 * with actionable suggestions for fixing configuration issues.
 *
 * **Key Features:**
 * - Runtime validation using Zod schemas
 * - Detailed error messages with path information
 * - Plugin-specific configuration validation
 * - Comprehensive configuration validation for complete setups
 * - Helpful suggestions for common configuration mistakes
 *
 * @example
 * ```typescript
 * import { validateConfig, validateCompleteConfig } from '@bfra.me/semantic-release/validation'
 *
 * // Validate basic configuration
 * const result = validateConfig({
 *   branches: ['main'],
 *   plugins: ['@semantic-release/npm']
 * })
 *
 * if (!result.success) {
 *   console.error('Validation failed:', result.error.getFormattedErrors())
 * }
 * ```
 */

import {z} from 'zod'
import {globalConfigSchema} from './schemas/core.js'
import {
  changelogConfigSchema,
  commitAnalyzerConfigSchema,
  gitConfigSchema,
  githubConfigSchema,
  npmConfigSchema,
  releaseNotesGeneratorConfigSchema,
} from './schemas/plugins.js'

/**
 * Custom validation error class with detailed error information and formatting.
 *
 * Extends the standard Error class to provide additional context about
 * validation failures, including the original Zod error, path information,
 * and formatted error messages for display.
 *
 * @example
 * ```typescript
 * try {
 *   validateConfig(invalidConfig)
 * } catch (error) {
 *   if (error instanceof ValidationError) {
 *     console.error('Validation failed at:', error.path)
 *     console.error('Errors:', error.getFormattedErrors())
 *   }
 * }
 * ```
 */
export class ValidationError extends Error {
  /**
   * The original Zod validation error with detailed issue information.
   */
  readonly zodError: z.ZodError

  /**
   * Optional path identifier for the validation context (e.g., 'global', 'plugin:npm').
   */
  readonly path?: string

  /**
   * Create a new ValidationError instance.
   *
   * @param message - Human-readable error message
   * @param zodError - The original Zod validation error
   * @param path - Optional path identifier for context
   */
  constructor(message: string, zodError: z.ZodError, path?: string) {
    super(message)
    this.name = 'ValidationError'
    this.zodError = zodError
    this.path = path
  }

  /**
   * Get formatted error messages for display to users.
   *
   * Transforms Zod validation issues into human-readable error messages
   * with path information, making it easier to identify and fix configuration problems.
   *
   * @returns Array of formatted error message strings
   *
   * @example
   * ```typescript
   * const errors = validationError.getFormattedErrors()
   * // ['branches: Expected array, got string', 'plugins.0: Expected string or array, got object']
   * ```
   */
  getFormattedErrors(): string[] {
    return this.zodError.issues.map(issue => {
      const path = issue.path.length > 0 ? issue.path.join('.') : 'root'
      return `${path}: ${issue.message}`
    })
  }
}

/**
 * Plugin configuration schema registry for known semantic-release plugins.
 *
 * Maps plugin names to their corresponding Zod validation schemas,
 * enabling plugin-specific configuration validation.
 */
const pluginSchemas = {
  '@semantic-release/commit-analyzer': commitAnalyzerConfigSchema,
  '@semantic-release/release-notes-generator': releaseNotesGeneratorConfigSchema,
  '@semantic-release/changelog': changelogConfigSchema,
  '@semantic-release/npm': npmConfigSchema,
  '@semantic-release/github': githubConfigSchema,
  '@semantic-release/git': gitConfigSchema,
} as const

/**
 * Validate a global semantic-release configuration against the schema.
 *
 * Performs comprehensive validation of the configuration object structure,
 * checking types, required fields, and value constraints according to
 * the semantic-release configuration specification.
 *
 * @param config - The configuration object to validate
 * @returns Success result with validated data or failure result with error details
 *
 * @example
 * ```typescript
 * // Valid configuration
 * const result = validateConfig({
 *   branches: ['main'],
 *   plugins: ['@semantic-release/npm', '@semantic-release/github']
 * })
 *
 * if (result.success) {
 *   console.log('Configuration is valid:', result.data)
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Invalid configuration
 * const result = validateConfig({
 *   branches: 'main', // Should be array
 *   plugins: '@semantic-release/npm' // Should be array
 * })
 *
 * if (!result.success) {
 *   console.error('Validation errors:')
 *   result.error.getFormattedErrors().forEach(error => {
 *     console.error(`- ${error}`)
 *   })
 * }
 * ```
 */
export function validateConfig(config: unknown):
  | {
      success: true
      data: z.infer<typeof globalConfigSchema>
    }
  | {
      success: false
      error: ValidationError
    } {
  try {
    const result = globalConfigSchema.parse(config)
    return {success: true, data: result}
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: new ValidationError('Invalid semantic-release configuration', error, 'global'),
      }
    }
    throw error
  }
}

/**
 * Validate a plugin configuration by plugin name.
 *
 * Validates plugin-specific configuration options against known schemas.
 * For unknown plugins, validation passes through to allow third-party
 * plugin configurations that aren't part of the core plugin set.
 *
 * @param pluginName - The name of the semantic-release plugin
 * @param config - The plugin configuration object to validate
 * @returns Success result with validated data or failure result with error details
 *
 * @example
 * ```typescript
 * // Validate npm plugin configuration
 * const result = validatePluginConfig('@semantic-release/npm', {
 *   npmPublish: true,
 *   tarballDir: 'dist'
 * })
 *
 * if (result.success) {
 *   console.log('npm plugin config is valid')
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Invalid npm plugin configuration
 * const result = validatePluginConfig('@semantic-release/npm', {
 *   npmPublish: 'yes' // Should be boolean
 * })
 *
 * if (!result.success) {
 *   console.error('npm plugin config errors:', result.error.getFormattedErrors())
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Unknown plugin (validation passes through)
 * const result = validatePluginConfig('@custom/plugin', {
 *   customOption: 'value'
 * })
 * // result.success === true (unknown plugins are allowed)
 * ```
 */
export function validatePluginConfig(
  pluginName: string,
  config: unknown,
):
  | {
      success: true
      data: unknown
    }
  | {
      success: false
      error: ValidationError
    } {
  const schema = pluginSchemas[pluginName as keyof typeof pluginSchemas]

  if (schema === undefined) {
    // For unknown plugins, we can't validate the configuration
    // but we don't want to fail validation either
    return {success: true, data: config}
  }

  try {
    const result = schema.parse(config)
    return {success: true, data: result}
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: new ValidationError(
          `Invalid configuration for plugin ${pluginName}`,
          error,
          pluginName,
        ),
      }
    }
    throw error
  }
}

/**
 * Validate a complete semantic-release configuration including plugins.
 */
export function validateCompleteConfig(config: unknown):
  | {
      success: true
      data: z.infer<typeof globalConfigSchema>
    }
  | {
      success: false
      errors: ValidationError[]
    } {
  const errors: ValidationError[] = []

  // Validate global config
  const globalResult = validateConfig(config)
  if (!globalResult.success) {
    errors.push(globalResult.error)
    return {success: false, errors}
  }

  // Validate plugin configurations
  if (globalResult.data.plugins) {
    for (const [index, plugin] of globalResult.data.plugins.entries()) {
      if (Array.isArray(plugin) && plugin.length === 2) {
        const [pluginName, pluginConfig] = plugin
        const pluginResult = validatePluginConfig(pluginName, pluginConfig)
        if (!pluginResult.success) {
          // Add context about which plugin in the array failed
          const contextualError = new ValidationError(
            `Plugin at index ${index}: ${pluginResult.error.message}`,
            pluginResult.error.zodError,
            `plugins.${index}`,
          )
          errors.push(contextualError)
        }
      }
    }
  }

  if (errors.length > 0) {
    return {success: false, errors}
  }

  return {success: true, data: globalResult.data}
}
