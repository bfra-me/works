/**
 * Configuration helpers for plugin development.
 *
 * Utilities for validating and working with plugin configuration objects.
 */

import type {PluginConfig} from '../context.js'

/**
 * Validates that a required configuration property exists.
 *
 * @param config - Plugin configuration object
 * @param property - Property name to validate
 * @param pluginName - Name of the plugin for error messages
 * @throws Error if the property is missing or invalid
 *
 * @example
 * ```typescript
 * validateRequiredConfig(pluginConfig, 'token', 'my-plugin')
 * ```
 */
export function validateRequiredConfig(
  config: PluginConfig,
  property: string,
  pluginName: string,
): void {
  if (!(property in config) || config[property] == null) {
    throw new Error(
      `Missing required configuration property "${property}" for plugin "${pluginName}". ` +
        `Please provide this value in your plugin configuration.`,
    )
  }
}

/**
 * Validates that a configuration property is of the expected type.
 *
 * @param config - Plugin configuration object
 * @param property - Property name to validate
 * @param expectedType - Expected type ('string', 'number', 'boolean', 'object', 'function')
 * @param pluginName - Name of the plugin for error messages
 * @throws Error if the property is not of the expected type
 *
 * @example
 * ```typescript
 * validateConfigType(pluginConfig, 'timeout', 'number', 'my-plugin')
 * ```
 */
export function validateConfigType(
  config: PluginConfig,
  property: string,
  expectedType: string,
  pluginName: string,
): void {
  if (property in config && config[property] != null) {
    const actualType = typeof config[property]
    if (actualType !== expectedType) {
      throw new Error(
        `Invalid configuration property "${property}" for plugin "${pluginName}". ` +
          `Expected ${expectedType}, but got ${actualType}.`,
      )
    }
  }
}

/**
 * Gets a configuration value with a default fallback.
 *
 * @param config - Plugin configuration object
 * @param property - Property name to get
 * @param defaultValue - Default value if property is missing
 * @returns The configuration value or default
 *
 * @example
 * ```typescript
 * const timeout = getConfigWithDefault(pluginConfig, 'timeout', 5000)
 * ```
 */
export function getConfigWithDefault<T>(
  config: PluginConfig,
  property: string,
  defaultValue: T,
): T {
  return property in config && config[property] != null ? (config[property] as T) : defaultValue
}

/**
 * Validates that a string configuration property is not empty.
 *
 * @param config - Plugin configuration object
 * @param property - Property name to validate
 * @param pluginName - Name of the plugin for error messages
 * @throws Error if the property is empty
 *
 * @example
 * ```typescript
 * validateNonEmptyString(pluginConfig, 'message', 'my-plugin')
 * ```
 */
export function validateNonEmptyString(
  config: PluginConfig,
  property: string,
  pluginName: string,
): void {
  validateConfigType(config, property, 'string', pluginName)

  if (property in config && typeof config[property] === 'string') {
    const value = String(config[property])
    if (value.trim().length === 0) {
      throw new Error(
        `Configuration property "${property}" for plugin "${pluginName}" cannot be empty.`,
      )
    }
  }
}

/**
 * Validates that an array configuration property is not empty.
 *
 * @param config - Plugin configuration object
 * @param property - Property name to validate
 * @param pluginName - Name of the plugin for error messages
 * @throws Error if the property is not an array or is empty
 *
 * @example
 * ```typescript
 * validateNonEmptyArray(pluginConfig, 'files', 'my-plugin')
 * ```
 */
export function validateNonEmptyArray(
  config: PluginConfig,
  property: string,
  pluginName: string,
): void {
  if (property in config && config[property] != null) {
    const value = config[property]
    if (!Array.isArray(value)) {
      throw new TypeError(
        `Configuration property "${property}" for plugin "${pluginName}" must be an array.`,
      )
    }
    if (value.length === 0) {
      throw new Error(
        `Configuration property "${property}" for plugin "${pluginName}" cannot be empty.`,
      )
    }
  }
}

/**
 * Creates a configuration validator function for a specific plugin.
 *
 * @param pluginName - Name of the plugin
 * @returns Validator function that pre-fills the plugin name
 *
 * @example
 * ```typescript
 * const validate = createConfigValidator('my-plugin')
 * validate.required(config, 'token')
 * validate.type(config, 'timeout', 'number')
 * ```
 */
export function createConfigValidator(pluginName: string) {
  return {
    required: (config: PluginConfig, property: string) =>
      validateRequiredConfig(config, property, pluginName),

    type: (config: PluginConfig, property: string, expectedType: string) =>
      validateConfigType(config, property, expectedType, pluginName),

    nonEmptyString: (config: PluginConfig, property: string) =>
      validateNonEmptyString(config, property, pluginName),

    nonEmptyArray: (config: PluginConfig, property: string) =>
      validateNonEmptyArray(config, property, pluginName),
  }
}
