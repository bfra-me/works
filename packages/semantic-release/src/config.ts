/**
 * Configuration factory functions and utilities for semantic-release.
 *
 * This module provides both the enhanced configuration API and backward-compatible
 * defineConfig function for semantic-release configurations with comprehensive
 * TypeScript support, runtime validation, and environment-specific optimizations.
 *
 * @example
 * ```typescript
 * // Basic configuration
 * import { defineConfig } from '@bfra.me/semantic-release'
 *
 * export default defineConfig({
 *   branches: ['main'],
 *   plugins: ['@semantic-release/commit-analyzer', '@semantic-release/npm']
 * })
 * ```
 *
 * @example
 * ```typescript
 * // Advanced configuration with environment detection
 * import { defineConfig } from '@bfra.me/semantic-release'
 *
 * export default defineConfig({
 *   branches: ['main', { name: 'beta', prerelease: true }],
 *   plugins: [
 *     '@semantic-release/commit-analyzer',
 *     ['@semantic-release/npm', { npmPublish: true }],
 *     '@semantic-release/github'
 *   ]
 * }, {
 *   environment: 'production',
 *   validate: true
 * })
 * ```
 */

import type {GlobalConfig} from './types/core.js'
import {defineConfig as _defineConfig, type DefineConfigOptions} from './config/index.js'

/**
 * Define semantic-release global configuration with enhanced validation and features.
 *
 * This is the main configuration factory function that provides comprehensive
 * TypeScript support, runtime validation, environment-specific transformations,
 * and improved developer experience for semantic-release configurations.
 *
 * **Features:**
 * - Full TypeScript type safety with IntelliSense support
 * - Runtime validation with detailed error messages and suggestions
 * - Environment-specific configuration transformations
 * - Automatic plugin configuration detection and optimization
 * - Comprehensive error handling with actionable feedback
 *
 * @param config - Semantic-release configuration object with full type safety
 * @param options - Configuration options for validation and environment processing
 * @returns Enhanced and validated semantic-release configuration
 *
 * @throws {ValidationError} When configuration validation fails with detailed error information
 *
 * @example
 * ```typescript
 * // Basic npm package configuration
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
 *
 * @example
 * ```typescript
 * // Monorepo package configuration
 * export default defineConfig({
 *   tagFormat: '${name}@${version}',
 *   branches: ['main'],
 *   plugins: [
 *     ['@semantic-release/commit-analyzer', {
 *       preset: 'conventionalcommits'
 *     }],
 *     ['@semantic-release/npm', {
 *       npmPublish: true,
 *       tarballDir: 'dist'
 *     }]
 *   ]
 * })
 * ```
 *
 * @example
 * ```typescript
 * // Development environment with validation disabled
 * export default defineConfig({
 *   branches: ['main'],
 *   plugins: ['@semantic-release/commit-analyzer']
 * }, {
 *   environment: 'development',
 *   validate: false // Skip validation for dynamic configs
 * })
 * ```
 *
 * @example
 * ```typescript
 * // Complex configuration with custom plugins
 * export default defineConfig({
 *   branches: [
 *     'main',
 *     { name: 'next', prerelease: true },
 *     { name: 'maintenance', range: '1.x.x' }
 *   ],
 *   plugins: [
 *     '@semantic-release/commit-analyzer',
 *     '@semantic-release/release-notes-generator',
 *     ['@semantic-release/changelog', {
 *       changelogFile: 'CHANGELOG.md',
 *       changelogTitle: '# Release Notes'
 *     }],
 *     ['@semantic-release/npm', {
 *       npmPublish: true
 *     }],
 *     ['@semantic-release/github', {
 *       assets: [
 *         { path: 'dist/*.tgz', label: 'Distribution' },
 *         { path: 'coverage/', label: 'Coverage Report' }
 *       ]
 *     }],
 *     ['@semantic-release/git', {
 *       assets: ['CHANGELOG.md', 'package.json'],
 *       message: 'chore(release): ${nextRelease.version} [skip ci]'
 *     }]
 *   ]
 * })
 * ```
 *
 * @see {@link DefineConfigOptions} for available configuration options
 * @see {@link https://semantic-release.gitbook.io/semantic-release/usage/configuration} for semantic-release configuration documentation
 */
export function defineConfig<T extends GlobalConfig>(config: T, options?: DefineConfigOptions): T {
  return _defineConfig(config, options)
}

/**
 * Legacy defineConfig function for backward compatibility.
 *
 * This maintains the exact same API as the original function while adding
 * validation under the hood. Recommended for migration scenarios where
 * minimal changes are required.
 *
 * **Migration Note:** Consider using the main `defineConfig` function with
 * explicit options for better control over validation and environment handling.
 *
 * @param config - Semantic-release configuration object
 * @returns Validated semantic-release configuration
 *
 * @deprecated Consider using `defineConfig(config, { validate: true })` instead
 *
 * @example
 * ```typescript
 * // Legacy usage (still supported)
 * export default defineConfigLegacy({
 *   branches: ['main'],
 *   plugins: ['@semantic-release/npm']
 * })
 * ```
 *
 * @example
 * ```typescript
 * // Recommended migration approach
 * export default defineConfig({
 *   branches: ['main'],
 *   plugins: ['@semantic-release/npm']
 * }, {
 *   validate: true // Explicit validation control
 * })
 * ```
 */
export function defineConfigLegacy<T extends GlobalConfig>(config: T): T {
  return _defineConfig(config, {validate: true})
}

// Export types for enhanced functionality
export type {DefineConfigOptions} from './config/index.js'
