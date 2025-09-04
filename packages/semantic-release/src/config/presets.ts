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
 * workspace-specific tagging, conditional publishing, and integration
 * with changesets workflow for coordinated releases.
 *
 * @param options - Configuration options for the monorepo preset
 * @returns A complete semantic-release configuration for monorepo packages
 *
 * @example
 * ```typescript
 * // Basic monorepo package
 * export default monorepoPreset({
 *   branches: ['main'],
 *   packageName: '@org/package-name'
 * })
 *
 * // With changesets integration
 * export default monorepoPreset({
 *   branches: ['main'],
 *   packageName: '@org/package-name',
 *   changesetsIntegration: true,
 *   pkgRoot: 'packages/my-package'
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

    /**
     * Enable integration with changesets workflow.
     * When enabled, optimizes for coordinated releases in monorepos.
     * @default false
     */
    changesetsIntegration?: boolean

    /**
     * Whether to only publish if there are actual changes.
     * Useful with changesets to avoid empty releases.
     * @default true when changesetsIntegration is enabled
     */
    publishOnlyIfChanged?: boolean

    /**
     * Custom release notes template for monorepo context.
     */
    releaseNotesTemplate?: string
  } = {},
): GlobalConfig {
  const {
    branches = ['main'],
    repositoryUrl,
    dryRun = false,
    defineOptions = {},
    pkgRoot,
    packageName,
    changesetsIntegration = false,
    publishOnlyIfChanged = changesetsIntegration,
    releaseNotesTemplate,
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
  const pluginBuilder = builder.plugins()

  // Use conventional commits with monorepo-specific rules
  pluginBuilder.commitAnalyzer({
    preset: 'conventionalcommits',
    releaseRules: [
      {type: 'docs', scope: 'README', release: 'patch'},
      {type: 'refactor', release: 'patch'},
      {scope: 'no-release', release: false},
      // Changesets integration: respect changeset files
      ...(changesetsIntegration
        ? [
            {type: 'chore', scope: 'changeset', release: false as const},
            {type: 'docs', scope: 'changeset', release: false as const},
          ]
        : []),
    ],
  })

  // Configure release notes with monorepo context
  pluginBuilder.releaseNotesGenerator({
    preset: 'conventionalcommits',
    ...(releaseNotesTemplate != null && releaseNotesTemplate.length > 0
      ? {
          writerOpts: {
            mainTemplate: releaseNotesTemplate,
          },
        }
      : {}),
    // Add package context to release notes
    presetConfig: {
      types: [
        {type: 'feat', section: 'Features'},
        {type: 'fix', section: 'Bug Fixes'},
        {type: 'perf', section: 'Performance Improvements'},
        {type: 'revert', section: 'Reverts'},
        {type: 'docs', section: 'Documentation', hidden: true},
        {type: 'style', section: 'Styles', hidden: true},
        {type: 'chore', section: 'Miscellaneous Chores', hidden: true},
        {type: 'refactor', section: 'Code Refactoring', hidden: true},
        {type: 'test', section: 'Tests', hidden: true},
        {type: 'build', section: 'Build System', hidden: true},
        {type: 'ci', section: 'Continuous Integration', hidden: true},
      ],
    },
  })

  // Configure npm publishing with package root
  if (pkgRoot != null && pkgRoot.length > 0) {
    const npmConfig: {pkgRoot: string; publishOnly?: boolean; tarballDir?: string} = {pkgRoot}

    // Optimize for changesets workflow
    if (changesetsIntegration) {
      // Only publish if package.json version has changed
      npmConfig.publishOnly = publishOnlyIfChanged
      // Use dist-tags for monorepo releases
      npmConfig.tarballDir = `${pkgRoot}/dist`
    }

    pluginBuilder.npm(npmConfig)
  } else {
    pluginBuilder.npm()
  }

  // Configure GitHub releases with monorepo-specific settings
  pluginBuilder.github({
    // Use package-specific release titles
    ...(packageName != null && packageName.length > 0
      ? {
          releaseNameTemplate: `${packageName}@\${nextRelease.version}`,
          releaseBodyTemplate: `Release notes for ${packageName}@\${nextRelease.version}

\${nextRelease.notes}`,
        }
      : {}),
    // Optimize for monorepo workflow
    successComment: changesetsIntegration
      ? // Changesets-aware success comment
        // eslint-disable-next-line no-template-curly-in-string
        'This ${issue.pull_request ? "PR is included" : "issue has been resolved"} in ${packageName ?? "package"}@${nextRelease.version} :tada:'
      : // Standard success comment
        // eslint-disable-next-line no-template-curly-in-string
        'This ${issue.pull_request ? "PR is included" : "issue has been resolved"} in version ${nextRelease.version} :tada:',
  })

  // Configure git commits with monorepo-aware settings
  const gitAssets = ['package.json']

  // Include changelog for non-changesets workflows
  if (!changesetsIntegration) {
    gitAssets.push('CHANGELOG.md')
  }

  // Add package-specific assets if in package root
  if (pkgRoot != null && pkgRoot.length > 0) {
    gitAssets.forEach((asset, index) => {
      gitAssets[index] = `${pkgRoot}/${asset}`
    })
  }

  pluginBuilder.git({
    assets: gitAssets,
    // Use package-aware commit message
    message:
      packageName != null && packageName.length > 0
        ? `chore(release): ${packageName}@\${nextRelease.version} [skip ci]\n\n\${nextRelease.notes}`
        : // eslint-disable-next-line no-template-curly-in-string
          'chore(release): \${nextRelease.version} [skip ci]\n\n\${nextRelease.notes}',
  })

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
