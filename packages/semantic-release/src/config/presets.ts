/**
 * Preset factory functions for common semantic-release workflows.
 *
 * This module provides pre-configured semantic-release setups for common
 * scenarios like npm packages, GitHub releases, and monorepo workflows.
 *
 * @example
 * ```typescript
 * import {npmPreset} from '@bfra.me/semantic-release/presets'
 *
 * export default npmPreset({
 *   branches: ['main']
 * })
 * ```
 */

import type {GlobalConfig} from '../types/core.js'
import type {DefineConfigOptions} from './define-config.js'
import {createConfigBuilder} from './builder.js'

/**
 * Base preset options that can be applied to any preset.
 */
export interface BasePresetOptions {
  /**
   * Branches configuration.
   * @default ['main']
   */
  branches?: GlobalConfig['branches']

  /**
   * Repository URL if not auto-detected.
   */
  repositoryUrl?: string

  /**
   * Enable dry-run mode.
   * @default false
   */
  dryRun?: boolean

  /**
   * Additional configuration options.
   */
  defineOptions?: DefineConfigOptions
}

/**
 * Create an npm package release preset.
 *
 * This preset is optimized for standard npm package releases with changelog
 * generation, npm publishing, GitHub releases, and git commits.
 *
 * @param options - Configuration options for the npm preset
 * @returns A complete semantic-release configuration for npm packages
 *
 * @example
 * ```typescript
 * // Basic npm package
 * export default npmPreset({
 *   branches: ['main']
 * })
 * ```
 */
export function npmPreset(options: BasePresetOptions = {}): GlobalConfig {
  const {branches = ['main'], repositoryUrl, dryRun = false, defineOptions = {}} = options

  const builder = createConfigBuilder().branches(branches).dryRun(dryRun)

  if (repositoryUrl != null && repositoryUrl.length > 0) {
    builder.repositoryUrl(repositoryUrl)
  }

  // Configure plugins for npm workflow
  builder
    .plugins()
    .commitAnalyzer()
    .releaseNotesGenerator()
    .changelog()
    .npm()
    .github()
    .git({
      assets: ['CHANGELOG.md', 'package.json'],
      // Note: This is not a template string, it's the literal string that semantic-release uses
      // eslint-disable-next-line no-template-curly-in-string
      message: 'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}',
    })

  return builder.build(defineOptions)
}

/**
 * Create a GitHub-only release preset.
 *
 * This preset is optimized for projects that only need GitHub releases
 * without npm publishing or changelog files.
 *
 * @param options - Configuration options for the GitHub preset
 * @returns A complete semantic-release configuration for GitHub releases
 *
 * @example
 * ```typescript
 * // Basic GitHub releases
 * export default githubPreset({
 *   branches: ['main']
 * })
 * ```
 */
export function githubPreset(options: BasePresetOptions = {}): GlobalConfig {
  const {branches = ['main'], repositoryUrl, dryRun = false, defineOptions = {}} = options

  const builder = createConfigBuilder().branches(branches).dryRun(dryRun)

  if (repositoryUrl != null && repositoryUrl.length > 0) {
    builder.repositoryUrl(repositoryUrl)
  }

  // Configure plugins for GitHub-only workflow
  builder.plugins().commitAnalyzer().releaseNotesGenerator().github()

  return builder.build(defineOptions)
}

/**
 * Create a monorepo package release preset.
 *
 * This preset is optimized for packages within a monorepo, supporting
 * workspace-specific tagging and conditional publishing.
 *
 * @param options - Configuration options for the monorepo preset
 * @returns A complete semantic-release configuration for monorepo packages
 *
 * @example
 * ```typescript
 * // Basic monorepo package
 * export default monorepoPreset({
 *   branches: ['main']
 * })
 * ```
 */
export function monorepoPreset(
  options: BasePresetOptions & {
    /**
     * Package root directory for monorepo packages.
     */
    pkgRoot?: string

    /**
     * Package name for release tagging.
     */
    packageName?: string
  } = {},
): GlobalConfig {
  const {
    branches = ['main'],
    repositoryUrl,
    dryRun = false,
    defineOptions = {},
    pkgRoot,
    packageName,
  } = options

  const builder = createConfigBuilder().branches(branches).dryRun(dryRun)

  if (repositoryUrl != null && repositoryUrl.length > 0) {
    builder.repositoryUrl(repositoryUrl)
  }

  // Configure tag format for monorepo if package name is provided
  if (packageName != null && packageName.length > 0) {
    builder.tagFormat(`${packageName}@\${version}`)
  }

  // Configure plugins for monorepo workflow
  const pluginBuilder = builder.plugins().commitAnalyzer().releaseNotesGenerator()

  if (pkgRoot != null && pkgRoot.length > 0) {
    pluginBuilder.npm({pkgRoot})
  } else {
    pluginBuilder.npm()
  }

  pluginBuilder.github()

  return builder.build(defineOptions)
}

/**
 * Create a development/testing preset.
 *
 * This preset is optimized for development and testing with dry-run enabled
 * and enhanced debugging capabilities.
 *
 * @param options - Base configuration to enhance for development
 * @returns A development-optimized semantic-release configuration
 *
 * @example
 * ```typescript
 * // Development preset
 * export default developmentPreset({
 *   branches: ['develop', 'feature/*']
 * })
 * ```
 */
export function developmentPreset(options: BasePresetOptions = {}): GlobalConfig {
  const {branches = ['develop'], repositoryUrl, defineOptions = {}} = options

  const builder = createConfigBuilder()
    .branches(branches)
    .dryRun(true) // Always dry-run in development
    .ci(false) // Disable CI checks
    .debug(true) // Enable debug mode

  if (repositoryUrl != null && repositoryUrl.length > 0) {
    builder.repositoryUrl(repositoryUrl)
  }

  // Minimal plugin set for development
  builder.plugins().commitAnalyzer().releaseNotesGenerator()

  return builder.build({
    ...defineOptions,
    environment: 'development',
    validate: true,
  })
}

/**
 * Available preset types for easy reference.
 */
export const presets = {
  npm: npmPreset,
  github: githubPreset,
  monorepo: monorepoPreset,
  development: developmentPreset,
} as const

/**
 * Get a preset by name with type safety.
 *
 * @param name - Preset name
 * @returns The preset function
 *
 * @example
 * ```typescript
 * const preset = getPreset('npm')
 * export default preset({ branches: ['main'] })
 * ```
 */
export function getPreset<T extends keyof typeof presets>(name: T): (typeof presets)[T] {
  return presets[name]
}
