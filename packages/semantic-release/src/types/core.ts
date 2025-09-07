/**
 * Core TypeScript types for semantic-release global configuration.
 *
 * This module provides comprehensive type definitions for semantic-release v23+
 * configuration options, ensuring type safety and preventing runtime errors.
 * All types are designed to provide maximum IntelliSense support while maintaining
 * compatibility with the semantic-release ecosystem.
 *
 * @example
 * ```typescript
 * import type { GlobalConfig, BranchSpec, PluginSpec } from '@bfra.me/semantic-release'
 *
 * const config: GlobalConfig = {
 *   branches: ['main', { name: 'beta', prerelease: true }],
 *   plugins: ['@semantic-release/npm']
 * }
 * ```
 *
 * @see {@link https://semantic-release.gitbook.io/semantic-release/usage/configuration} for semantic-release configuration documentation
 */

import type {LiteralUnion} from 'type-fest'

/**
 * Branch specification for semantic-release branches configuration.
 *
 * Defines a release branch with optional prerelease and maintenance configurations.
 * Used to control which branches can trigger releases and how those releases are tagged.
 *
 * @example
 * ```typescript
 * // Production branch
 * const mainBranch: BranchSpec = { name: 'main' }
 *
 * // Prerelease branch
 * const betaBranch: BranchSpec = {
 *   name: 'beta',
 *   prerelease: true
 * }
 *
 * // Maintenance branch
 * const maintenance: BranchSpec = {
 *   name: 'maintenance',
 *   range: '1.x.x',
 *   channel: 'maintenance'
 * }
 * ```
 */
export interface BranchSpec {
  /**
   * The name of the branch that should trigger releases.
   *
   * This should exactly match the Git branch name in your repository.
   *
   * @example 'main'
   * @example 'develop'
   * @example 'release/v2'
   */
  name: string

  /**
   * The range of versions to be released from this branch.
   *
   * Used primarily for maintenance releases to specify which major/minor
   * versions this branch should handle. Follows semantic versioning patterns.
   *
   * @example '1.x.x' - Only 1.x patch releases
   * @example '2.0.x' - Only 2.0 patch releases
   * @example '+([0-9])?(.{+([0-9]),x}).x' - Pattern for multiple versions
   *
   * @see {@link https://semantic-release.gitbook.io/semantic-release/usage/configuration#branches} for patterns
   */
  range?: string

  /**
   * The npm distribution channel (dist-tag) to publish releases from this branch.
   *
   * Determines which npm dist-tag will be used when publishing packages.
   * Set to `false` to skip npm publishing for this branch.
   *
   * @default The branch name for prerelease branches, 'latest' for production branches
   *
   * @example 'beta' - Publishes to @beta dist-tag
   * @example 'next' - Publishes to @next dist-tag
   * @example 'latest' - Publishes to @latest dist-tag (default for main)
   * @example false - Skip npm publishing
   */
  channel?: string | false

  /**
   * Whether this branch should publish prereleases.
   *
   * When `true`, versions will be tagged as prereleases (e.g., 1.0.0-beta.1).
   * When a string, uses that string as the prerelease identifier.
   *
   * @default false
   *
   * @example true - Uses branch name as prerelease identifier
   * @example 'alpha' - Uses 'alpha' as prerelease identifier
   * @example false - Production releases only
   */
  prerelease?: boolean | string
}

/**
 * Branch configuration - flexible type accepting various branch specification formats.
 *
 * Can be:
 * - A single branch name as string
 * - A single branch specification object
 * - An array of branch names and/or specification objects
 *
 * @example
 * ```typescript
 * // Single branch name
 * const simple: BranchConfig = 'main'
 *
 * // Single branch spec
 * const spec: BranchConfig = { name: 'main' }
 *
 * // Mixed array
 * const complex: BranchConfig = [
 *   'main',
 *   { name: 'beta', prerelease: true },
 *   'develop'
 * ]
 * ```
 */
export type BranchConfig = string | BranchSpec | readonly (string | BranchSpec)[]

/**
 * Plugin specification type supporting both simple and configured plugins.
 *
 * Can be either:
 * - A string representing the plugin package name
 * - A tuple of [plugin name, plugin configuration options]
 *
 * This flexible type allows for both simple plugin inclusion and detailed
 * plugin configuration within the same plugins array.
 *
 * @template TOptions - Type of the plugin configuration options object
 *
 * @example
 * ```typescript
 * // Simple plugin (uses defaults)
 * const simple: PluginSpec = '@semantic-release/npm'
 *
 * // Configured plugin
 * const configured: PluginSpec<NpmConfig> = [
 *   '@semantic-release/npm',
 *   { npmPublish: true, tarballDir: 'dist' }
 * ]
 *
 * // Mixed usage in plugins array
 * const plugins: PluginSpec[] = [
 *   '@semantic-release/commit-analyzer',
 *   ['@semantic-release/npm', { npmPublish: false }],
 *   '@semantic-release/github'
 * ]
 * ```
 */
export type PluginSpec<TOptions = Record<string, unknown>> = string | readonly [string, TOptions]

/**
 * Environment variable configuration for semantic-release.
 *
 * Defines the environment variables that semantic-release and its plugins
 * can use for authentication and configuration. These variables are typically
 * set in CI/CD environments.
 *
 * @example
 * ```typescript
 * const env: EnvironmentConfig = {
 *   GITHUB_TOKEN: 'ghp_...',
 *   NPM_TOKEN: 'npm_...',
 *   SEMANTIC_RELEASE_REPOSITORY_URL: 'https://github.com/owner/repo.git'
 * }
 * ```
 */
export interface EnvironmentConfig {
  /**
   * The Git repository URL for semantic-release operations.
   *
   * Used to override the repository URL detection. Useful in CI environments
   * where the origin remote might not be set correctly.
   *
   * @example 'https://github.com/owner/repo.git'
   * @example 'git@github.com:owner/repo.git'
   */
  SEMANTIC_RELEASE_REPOSITORY_URL?: string

  /**
   * GitHub personal access token for GitHub API operations.
   *
   * Required for GitHub releases, issue comments, and other GitHub integrations.
   * Token should have appropriate repository permissions.
   *
   * @example 'ghp_1234567890abcdef...'
   *
   * @see {@link https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token} for token creation
   */
  GITHUB_TOKEN?: string

  /**
   * GitLab personal access token for GitLab API operations.
   *
   * Required when using semantic-release with GitLab repositories.
   *
   * @example 'glpat-1234567890abcdef...'
   */
  GITLAB_TOKEN?: string

  /**
   * npm authentication token for package publishing.
   *
   * Required for publishing packages to the npm registry or private registries.
   * Can be obtained from npm account settings.
   *
   * @example 'npm_1234567890abcdef...'
   *
   * @see {@link https://docs.npmjs.com/creating-and-viewing-access-tokens} for token creation
   */
  NPM_TOKEN?: string

  /**
   * Additional environment variables that plugins might use.
   *
   * This allows for custom environment variables used by third-party plugins
   * or custom configurations.
   *
   * @example
   * ```typescript
   * {
   *   SLACK_WEBHOOK_URL: 'https://hooks.slack.com/...',
   *   CUSTOM_REGISTRY_TOKEN: 'custom_token_...'
   * }
   * ```
   */
  [key: string]: string | undefined
}

/**
 * Core semantic-release global configuration interface.
 *
 * This interface defines all the configuration options that can be used
 * to configure semantic-release behavior. It provides full TypeScript
 * support with comprehensive documentation and examples.
 *
 * @example
 * ```typescript
 * // Basic configuration
 * const config: GlobalConfig = {
 *   branches: ['main'],
 *   plugins: ['@semantic-release/npm', '@semantic-release/github']
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Advanced configuration
 * const config: GlobalConfig = {
 *   branches: [
 *     'main',
 *     { name: 'beta', prerelease: true },
 *     { name: 'alpha', prerelease: 'alpha' }
 *   ],
 *   repositoryUrl: 'https://github.com/owner/repo.git',
 *   tagFormat: 'v${version}',
 *   plugins: [
 *     '@semantic-release/commit-analyzer',
 *     ['@semantic-release/npm', { npmPublish: true }],
 *     '@semantic-release/github'
 *   ],
 *   dryRun: false,
 *   ci: true
 * }
 * ```
 */
export interface GlobalConfig {
  /**
   * List of modules or file paths containing shareable configurations.
   *
   * If multiple shareable configurations are set, they will be imported
   * in the order defined with each configuration option taking precedence
   * over previous ones.
   *
   * @example
   * ```typescript
   * // Single shareable config
   * extends: '@my-company/semantic-release-config'
   *
   * // Multiple configs (order matters)
   * extends: [
   *   '@my-company/semantic-release-config-base',
   *   '@my-company/semantic-release-config-npm'
   * ]
   * ```
   */
  extends?: string | readonly string[]

  /**
   * The branches on which releases should happen.
   *
   * Defines which Git branches should trigger releases and how those releases
   * should be handled (production vs prerelease). Supports complex branching
   * strategies including maintenance branches and multiple prerelease channels.
   *
   * @default ['+([0-9])?(.{+([0-9]),x}).x', 'master', 'main', 'next', 'next-major', {name: 'beta', prerelease: true}, {name: 'alpha', prerelease: true}]
   *
   * @example
   * ```typescript
   * // Simple main branch only
   * branches: ['main']
   *
   * // Main + prerelease branches
   * branches: [
   *   'main',
   *   { name: 'beta', prerelease: true },
   *   { name: 'alpha', prerelease: true }
   * ]
   *
   * // Complex with maintenance
   * branches: [
   *   'main',
   *   { name: 'next', prerelease: true },
   *   { name: 'maintenance', range: '1.x.x' }
   * ]
   * ```
   */
  branches?: BranchConfig

  /**
   * The Git repository URL.
   *
   * Used to determine the repository for operations like creating releases
   * and tags. Can be automatically detected from Git remotes or set via
   * SEMANTIC_RELEASE_REPOSITORY_URL environment variable.
   *
   * @example 'https://github.com/owner/repo.git'
   * @example 'git@github.com:owner/repo.git'
   * @example 'https://gitlab.com/owner/repo.git'
   */
  repositoryUrl?: string

  /**
   * The Git tag format used to identify releases.
   *
   * Template string that defines how Git tags are formatted. The `${version}`
   * placeholder is replaced with the actual version number.
   *
   * @default 'v${version}'
   *
   * @example
   * ```typescript
   * // Standard versioning
   * tagFormat: 'v${version}' // Results in tags like v1.2.3
   *
   * // Monorepo package versioning
   * tagFormat: '${name}@${version}' // Results in tags like my-package@1.2.3
   *
   * // Custom prefix
   * tagFormat: 'release-${version}' // Results in tags like release-1.2.3
   * ```
   */
  tagFormat?: string

  /**
   * List of plugins to use during the release process.
   *
   * Defines the plugins that will be executed during the semantic-release
   * workflow. Each plugin can be a simple string (using defaults) or a
   * tuple with configuration options.
   *
   * @default ['@semantic-release/commit-analyzer', '@semantic-release/release-notes-generator', '@semantic-release/npm', '@semantic-release/github']
   *
   * @example
   * ```typescript
   * // Basic plugin list
   * plugins: [
   *   '@semantic-release/commit-analyzer',
   *   '@semantic-release/npm',
   *   '@semantic-release/github'
   * ]
   *
   * // With plugin configurations
   * plugins: [
   *   '@semantic-release/commit-analyzer',
   *   ['@semantic-release/npm', {
   *     npmPublish: true,
   *     tarballDir: 'dist'
   *   }],
   *   ['@semantic-release/github', {
   *     assets: ['dist/*.tgz']
   *   }]
   * ]
   * ```
   */
  plugins?: readonly PluginSpec[]

  /**
   * Dry-run mode. Skip publishing, print next version and release notes.
   *
   * When enabled, semantic-release will analyze commits and generate release
   * notes but will not actually publish anything. Useful for testing
   * configurations and CI setups.
   *
   * @default false
   *
   * @example
   * ```typescript
   * // Enable dry-run for testing
   * dryRun: true
   *
   * // Conditional dry-run based on environment
   * dryRun: process.env.NODE_ENV !== 'production'
   * ```
   */
  dryRun?: boolean

  /**
   * Set to false to skip Continuous Integration environment verifications.
   *
   * This allows for making releases from a local machine. When false,
   * semantic-release will not verify that it's running in a CI environment.
   *
   * @default true
   *
   * @example
   * ```typescript
   * // Allow local releases
   * ci: false
   *
   * // Standard CI-only releases
   * ci: true
   * ```
   */
  ci?: boolean

  /**
   * Set to true when the ci option is set to false.
   *
   * Internal property used by semantic-release to track CI mode state.
   * Generally should not be set manually.
   *
   * @internal
   */
  noCi?: boolean

  /**
   * Global plugin configuration preset.
   *
   * Specifies a conventional commit preset that provides default rules
   * for commit analysis and release note generation. Affects how commit
   * messages are interpreted.
   *
   * @example
   * ```typescript
   * // Use Angular commit conventions
   * preset: 'angular'
   *
   * // Use Conventional Commits standard
   * preset: 'conventionalcommits'
   *
   * // Custom preset
   * preset: '@my-company/commit-preset'
   * ```
   */
  preset?: LiteralUnion<
    | 'angular'
    | 'atom'
    | 'codemirror'
    | 'ember'
    | 'eslint'
    | 'express'
    | 'jquery'
    | 'jshint'
    | 'conventionalcommits',
    string
  >

  /**
   * Additional configuration options that might be used by plugins.
   *
   * This allows for forward compatibility with new options and custom
   * plugin configurations that are not part of the core semantic-release API.
   *
   * @example
   * ```typescript
   * {
   *   // Custom options for third-party plugins
   *   customPlugin: {
   *     apiKey: 'secret'
   *   },
   *   // Future semantic-release options
   *   experimentalFeature: true
   * }
   * ```
   */
  [key: string]: unknown
}

/**
 * Branded type for validated semantic-release configuration.
 * This ensures that configurations have been validated at runtime.
 */
export interface ValidatedConfig extends GlobalConfig {
  readonly __validated: true
}

/**
 * Type guard to check if a configuration has been validated.
 */
export function isValidatedConfig(config: GlobalConfig): config is ValidatedConfig {
  return '__validated' in config && config.__validated === true
}

/**
 * Context objects that are passed to plugins during different lifecycle phases.
 */
export interface BaseContext {
  /**
   * The semantic-release configuration.
   */
  options: GlobalConfig

  /**
   * Environment variables.
   */
  env: EnvironmentConfig

  /**
   * The current working directory.
   */
  cwd: string

  /**
   * Logger instance for outputting messages.
   */
  logger: {
    log: (message: string, ...args: unknown[]) => void
    error: (message: string, ...args: unknown[]) => void
    success: (message: string, ...args: unknown[]) => void
  }
}

/**
 * Release information object.
 */
export interface Release {
  /**
   * The release version.
   */
  version: string

  /**
   * The Git tag for this release.
   */
  gitTag: string

  /**
   * The Git commit hash for this release.
   */
  gitHead: string

  /**
   * The release notes for this release.
   */
  notes: string

  /**
   * The release channel (npm dist-tag).
   */
  channel?: string

  /**
   * The release name.
   */
  name?: string
}

/**
 * Last release information.
 */
export interface LastRelease extends Release {
  /**
   * The channels on which the release was published.
   */
  channels: string[]
}

/**
 * Next release information.
 */
export interface NextRelease extends Release {
  /**
   * The type of release (major, minor, patch).
   */
  type: 'major' | 'minor' | 'patch'
}
