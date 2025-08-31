/**
 * Core TypeScript types for semantic-release global configuration.
 *
 * This module provides comprehensive type definitions for semantic-release v23+
 * configuration options, ensuring type safety and preventing runtime errors.
 *
 * @see https://semantic-release.gitbook.io/semantic-release/usage/configuration
 */

import type {LiteralUnion} from 'type-fest'

/**
 * Branch specification for semantic-release branches configuration.
 */
export interface BranchSpec {
  /**
   * The name of the branch.
   */
  name: string

  /**
   * The range of versions to be released from this branch.
   * Used for maintenance releases.
   */
  range?: string

  /**
   * The npm distribution channel to publish releases from this branch.
   */
  channel?: string | false

  /**
   * Whether this branch should publish prereleases.
   */
  prerelease?: boolean | string
}

/**
 * Branch configuration - can be a string, object, or array of either.
 */
export type BranchConfig = string | BranchSpec | readonly (string | BranchSpec)[]

/**
 * Plugin specification type that can be either:
 * - A string (plugin name)
 * - A tuple of [plugin name, plugin options]
 */
export type PluginSpec<TOptions = Record<string, unknown>> = string | readonly [string, TOptions]

/**
 * Environment variable configuration for semantic-release.
 */
export interface EnvironmentConfig {
  /**
   * The Git repository URL.
   */
  SEMANTIC_RELEASE_REPOSITORY_URL?: string

  /**
   * GitHub authentication token.
   */
  GITHUB_TOKEN?: string

  /**
   * GitLab authentication token.
   */
  GITLAB_TOKEN?: string

  /**
   * npm authentication token.
   */
  NPM_TOKEN?: string

  /**
   * Additional environment variables that plugins might use.
   */
  [key: string]: string | undefined
}

/**
 * Core semantic-release global configuration interface.
 *
 * This interface defines all the configuration options that can be used
 * to configure semantic-release behavior.
 */
export interface GlobalConfig {
  /**
   * List of modules or file paths containing shareable configurations.
   * If multiple shareable configurations are set, they will be imported
   * in the order defined with each configuration option taking precedence.
   */
  extends?: string | readonly string[]

  /**
   * The branches on which releases should happen.
   *
   * @default ['+([0-9])?(.{+([0-9]),x}).x', 'master', 'main', 'next', 'next-major', {name: 'beta', prerelease: true}, {name: 'alpha', prerelease: true}]
   */
  branches?: BranchConfig

  /**
   * The Git repository URL.
   * Can be set via SEMANTIC_RELEASE_REPOSITORY_URL environment variable.
   */
  repositoryUrl?: string

  /**
   * The Git tag format used to identify releases.
   *
   * @default 'v${version}'
   */
  tagFormat?: string

  /**
   * List of plugins to use during the release process.
   * If not specified, uses the default plugin list.
   *
   * @default ['@semantic-release/commit-analyzer', '@semantic-release/release-notes-generator', '@semantic-release/npm', '@semantic-release/github']
   */
  plugins?: readonly PluginSpec[]

  /**
   * Dry-run mode. Skip publishing, print next version and release notes.
   *
   * @default false
   */
  dryRun?: boolean

  /**
   * Set to false to skip Continuous Integration environment verifications.
   * This allows for making releases from a local machine.
   *
   * @default true
   */
  ci?: boolean

  /**
   * Set to true when the ci option is set to false.
   * Internal property used by semantic-release.
   */
  noCi?: boolean

  /**
   * Global plugin configuration options.
   * These options will be passed to all plugins.
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
   * This allows for forward compatibility with new options.
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
