/**
 * Configuration validation utilities using Zod schemas.
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
 * Custom validation error class with detailed error information.
 */
export class ValidationError extends Error {
  readonly zodError: z.ZodError
  readonly path?: string

  constructor(message: string, zodError: z.ZodError, path?: string) {
    super(message)
    this.name = 'ValidationError'
    this.zodError = zodError
    this.path = path
  }

  /**
   * Get formatted error messages for display.
   */
  getFormattedErrors(): string[] {
    return this.zodError.issues.map(issue => {
      const path = issue.path.length > 0 ? issue.path.join('.') : 'root'
      return `${path}: ${issue.message}`
    })
  }
}

/**
 * Plugin configuration schema registry.
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
 * Validate a global semantic-release configuration.
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
