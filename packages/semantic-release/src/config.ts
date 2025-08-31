/**
 * Configuration factory functions and utilities.
 *
 * This module provides both the enhanced configuration API and backward-compatible
 * defineConfig function for semantic-release configurations.
 */

import type {GlobalConfig} from './types/core.js'
import {defineConfig as _defineConfig, type DefineConfigOptions} from './config/index.js'

/**
 * Define semantic-release global config with enhanced validation and features.
 *
 * This is the enhanced version that provides validation, environment-specific
 * transformations, and improved developer experience.
 *
 * @param config - Semantic Release configuration
 * @param options - Configuration options for validation and processing
 * @returns Enhanced and validated configuration
 */
export function defineConfig<T extends GlobalConfig>(config: T, options?: DefineConfigOptions): T {
  return _defineConfig(config, options)
}

/**
 * Legacy defineConfig function for backward compatibility.
 *
 * This maintains the exact same API as the original function while adding
 * validation under the hood.
 *
 * @param config - Semantic Release configuration
 * @returns Semantic Release configuration
 */
export function defineConfigLegacy<T extends GlobalConfig>(config: T): T {
  return _defineConfig(config, {validate: true})
}

// Export types for enhanced functionality
export type {DefineConfigOptions} from './config/index.js'
