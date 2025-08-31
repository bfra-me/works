/**
 * Factory functions for JavaScript configuration files.
 *
 * This module provides factory functions specifically designed for use in
 * JavaScript configuration files (release.config.js, release.config.mjs)
 * with full TypeScript support and IntelliSense.
 *
 * @example
 * ```javascript
 * // release.config.mjs
 * import {createConfig} from '@bfra.me/semantic-release/factories'
 *
 * export default createConfig({
 *   branches: ['main'],
 *   plugins: [
 *     '@semantic-release/commit-analyzer',
 *     '@semantic-release/release-notes-generator'
 *   ]
 * })
 * ```
 */

import type {GlobalConfig} from '../types/core.js'
import {defineConfig, type DefineConfigOptions} from './define-config.js'

/**
 * Configuration factory options for JavaScript config files.
 *
 * These options are specifically designed for JavaScript configuration files
 * where you want to create a semantic-release configuration with enhanced features.
 */
export interface CreateConfigOptions extends DefineConfigOptions {
  /**
   * The configuration name for debugging and logging.
   */
  name?: string

  /**
   * Description of this configuration for documentation.
   */
  description?: string

  /**
   * Whether to freeze the configuration object to prevent modifications.
   * @default false
   */
  freeze?: boolean
}

/**
 * Create a semantic-release configuration for JavaScript config files.
 *
 * This function is specifically designed for use in JavaScript configuration files
 * like release.config.mjs where you need full TypeScript support and IntelliSense.
 *
 * @param config - The semantic-release configuration object
 * @param options - Creation options for enhanced functionality
 * @returns The configured semantic-release configuration
 *
 * @example
 * ```javascript
 * // release.config.mjs
 * import {createConfig} from '@bfra.me/semantic-release/factories'
 *
 * export default createConfig({
 *   branches: ['main', 'develop'],
 *   plugins: [
 *     '@semantic-release/commit-analyzer',
 *     '@semantic-release/release-notes-generator',
 *     '@semantic-release/npm',
 *     '@semantic-release/github'
 *   ]
 * })
 * ```
 *
 * @example
 * ```javascript
 * // release.config.mjs with environment-specific settings
 * import {createConfig} from '@bfra.me/semantic-release/factories'
 *
 * export default createConfig({
 *   branches: ['main'],
 *   plugins: ['@semantic-release/commit-analyzer']
 * }, {
 *   name: 'my-project-release',
 *   environment: process.env.NODE_ENV === 'development' ? 'development' : 'production',
 *   validate: true
 * })
 * ```
 *
 * @example
 * ```javascript
 * // release.config.mjs with frozen configuration
 * import {createConfig} from '@bfra.me/semantic-release/factories'
 *
 * export default createConfig({
 *   branches: ['main'],
 *   plugins: ['@semantic-release/commit-analyzer']
 * }, {
 *   freeze: true,
 *   description: 'Production release configuration'
 * })
 * ```
 */
export function createConfig<T extends GlobalConfig>(
  config: T,
  options: CreateConfigOptions = {},
): T {
  const {name, description, freeze = false, ...defineOptions} = options

  // Create the enhanced configuration
  const enhancedConfig = defineConfig(config, defineOptions)

  // Add metadata if provided
  if ((name != null && name.length > 0) || (description != null && description.length > 0)) {
    // Store metadata in a non-enumerable property to avoid interfering with semantic-release
    Object.defineProperty(enhancedConfig, '__metadata', {
      value: {name, description},
      enumerable: false,
      writable: false,
      configurable: false,
    })
  }

  // Freeze the configuration if requested
  if (freeze) {
    return Object.freeze(enhancedConfig)
  }

  return enhancedConfig
}

/**
 * Create a minimal semantic-release configuration for simple use cases.
 *
 * This is a simplified factory function that applies sensible defaults
 * for common semantic-release scenarios.
 *
 * @param options - Minimal configuration options
 * @returns A complete semantic-release configuration with defaults
 *
 * @example
 * ```javascript
 * // release.config.mjs - minimal setup
 * import {createMinimalConfig} from '@bfra.me/semantic-release/factories'
 *
 * export default createMinimalConfig({
 *   branches: ['main']
 * })
 * ```
 */
// Default tag format for semantic-release
// Note: This is not a template string, it's the literal string that semantic-release uses
// eslint-disable-next-line no-template-curly-in-string
const DEFAULT_TAG_FORMAT = 'v${version}'

export function createMinimalConfig(
  options: {
    /**
     * Branches to release from.
     * @default ['main']
     */
    branches?: GlobalConfig['branches']

    /**
     * Repository URL if not auto-detected.
     */
    repositoryUrl?: string

    /**
     * Custom tag format.
     * @default 'v${version}'
     */
    tagFormat?: string

    /**
     * Enable dry-run mode.
     * @default false
     */
    dryRun?: boolean
  } = {},
): GlobalConfig {
  const {
    branches = ['main'],
    repositoryUrl,
    tagFormat = DEFAULT_TAG_FORMAT,
    dryRun = false,
  } = options

  const config: GlobalConfig = {
    branches,
    tagFormat,
    dryRun,
    plugins: [
      '@semantic-release/commit-analyzer',
      '@semantic-release/release-notes-generator',
      '@semantic-release/npm',
      '@semantic-release/github',
    ],
  }

  if (repositoryUrl != null && repositoryUrl.length > 0) {
    config.repositoryUrl = repositoryUrl
  }

  return createConfig(config, {
    name: 'minimal-config',
    description: 'Minimal semantic-release configuration with sensible defaults',
    validate: true,
  })
}

/**
 * Create a development-friendly semantic-release configuration.
 *
 * This factory creates a configuration optimized for development workflow
 * with dry-run enabled and enhanced logging.
 *
 * @param baseConfig - Base configuration to enhance for development
 * @param options - Development-specific options
 * @param options.debug - Enable debug logging (default: true)
 * @param options.forceDryRun - Force dry-run mode (default: true)
 * @returns Development-optimized configuration
 *
 * @example
 * ```javascript
 * // release.config.dev.mjs
 * import {createDevConfig} from '@bfra.me/semantic-release/factories'
 *
 * export default createDevConfig({
 *   branches: ['develop'],
 *   plugins: ['@semantic-release/commit-analyzer']
 * })
 * ```
 */
export function createDevConfig<T extends GlobalConfig>(
  baseConfig: T,
  options: {
    /**
     * Enable debug logging.
     * @default true
     */
    debug?: boolean

    /**
     * Force dry-run mode.
     * @default true
     */
    forceDryRun?: boolean
  } = {},
): T {
  const {debug = true, forceDryRun = true} = options

  const devConfig = {
    ...baseConfig,
    // Force dry-run in development
    dryRun: forceDryRun || baseConfig.dryRun,
    // Disable CI checks for development
    ci: false,
  }

  // Add debug configuration if requested
  if (debug && devConfig.plugins) {
    // Add debug plugin if not already present
    const hasDebug = devConfig.plugins.some(plugin =>
      typeof plugin === 'string'
        ? plugin.includes('debug')
        : Array.isArray(plugin) && plugin[0].includes('debug'),
    )

    if (!hasDebug) {
      devConfig.plugins = [
        ...devConfig.plugins,
        [
          '@semantic-release/exec',
          {
            verifyReleaseCmd: 'echo "Debug: Verifying release..."',
            publishCmd: 'echo "Debug: Publishing release..."',
          },
        ],
      ]
    }
  }

  return createConfig(devConfig as T, {
    name: 'development-config',
    description: 'Development-optimized semantic-release configuration',
    environment: 'development',
    validate: true,
  })
}
