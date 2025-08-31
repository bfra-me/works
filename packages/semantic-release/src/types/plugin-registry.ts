/**
 * Extensible plugin registry system for third-party plugin type declarations.
 *
 * This module provides a system for registering custom plugin types that can be used
 * throughout the semantic-release configuration with full TypeScript support.
 */

import type {LiteralUnion} from 'type-fest'
import type {BaseContext} from './core.js'
import type {ChangelogConfig} from './plugins/changelog.js'
import type {
  AnalyzeCommitsContext,
  AnalyzeCommitsResult,
  CommitAnalyzerConfig,
} from './plugins/commit-analyzer.js'
import type {GitConfig} from './plugins/git.js'
import type {GithubConfig} from './plugins/github.js'
import type {NpmConfig} from './plugins/npm.js'
import type {
  GenerateNotesContext,
  GenerateNotesResult,
  ReleaseNotesGeneratorConfig,
} from './plugins/release-notes-generator.js'

/**
 * Plugin lifecycle hooks with their expected function signatures.
 */
export interface PluginLifecycleHooks {
  /**
   * Verify conditions step - validates plugin configuration and environment.
   */
  verifyConditions?: (
    pluginConfig: Record<string, unknown>,
    context: BaseContext,
  ) => Promise<void> | void

  /**
   * Analyze commits step - determines the type of release based on commits.
   */
  analyzeCommits?: (
    pluginConfig: Record<string, unknown>,
    context: AnalyzeCommitsContext,
  ) => Promise<AnalyzeCommitsResult> | AnalyzeCommitsResult

  /**
   * Verify release step - validates the release before proceeding.
   */
  verifyRelease?: (
    pluginConfig: Record<string, unknown>,
    context: BaseContext,
  ) => Promise<void> | void

  /**
   * Generate notes step - creates release notes.
   */
  generateNotes?: (
    pluginConfig: Record<string, unknown>,
    context: GenerateNotesContext,
  ) => Promise<GenerateNotesResult> | GenerateNotesResult

  /**
   * Prepare step - prepares the release (e.g., update files, create changelog).
   */
  prepare?: (pluginConfig: Record<string, unknown>, context: BaseContext) => Promise<void> | void

  /**
   * Publish step - publishes the release.
   */
  publish?: (
    pluginConfig: Record<string, unknown>,
    context: BaseContext,
  ) => Promise<{name: string; url: string} | void> | {name: string; url: string} | void

  /**
   * Success step - called after a successful release.
   */
  success?: (pluginConfig: Record<string, unknown>, context: BaseContext) => Promise<void> | void

  /**
   * Fail step - called when the release process fails.
   */
  fail?: (pluginConfig: Record<string, unknown>, context: BaseContext) => Promise<void> | void
}

/**
 * Registry of known semantic-release plugins with their configuration types.
 */
export interface KnownPluginRegistry {
  /**
   * @semantic-release/commit-analyzer - Analyzes commits to determine release type.
   */
  '@semantic-release/commit-analyzer': CommitAnalyzerConfig

  /**
   * @semantic-release/release-notes-generator - Generates release notes.
   */
  '@semantic-release/release-notes-generator': ReleaseNotesGeneratorConfig

  /**
   * @semantic-release/changelog - Creates or updates changelog file.
   */
  '@semantic-release/changelog': ChangelogConfig

  /**
   * @semantic-release/npm - Publishes to npm registry.
   */
  '@semantic-release/npm': NpmConfig

  /**
   * @semantic-release/github - Creates GitHub releases.
   */
  '@semantic-release/github': GithubConfig

  /**
   * @semantic-release/git - Commits files to Git repository.
   */
  '@semantic-release/git': GitConfig
}

/**
 * Custom plugin configuration registry.
 *
 * Third-party packages can extend this interface to add their own plugin types:
 *
 * @example
 * ```typescript
 * declare module '@bfra.me/semantic-release' {
 *   interface CustomPluginRegistry {
 *     'semantic-release-license': {
 *       license: {
 *         path?: string
 *       }
 *     }
 *   }
 * }
 * ```
 */
export interface CustomPluginRegistry {}

/**
 * Combined plugin registry including both known and custom plugins.
 */
export interface PluginRegistry extends KnownPluginRegistry, CustomPluginRegistry {}

/**
 * Type for plugin names that can be used in configuration.
 */
export type PluginName = LiteralUnion<keyof PluginRegistry, string>

/**
 * Type for getting plugin configuration type by plugin name.
 */
export type PluginConfigFor<TPlugin extends PluginName> = TPlugin extends keyof PluginRegistry
  ? PluginRegistry[TPlugin]
  : Record<string, unknown>

/**
 * Plugin specification that can be either a plugin name or a tuple of [name, config].
 */
export type PluginSpec<TPlugin extends PluginName = PluginName> =
  | TPlugin
  | readonly [TPlugin, PluginConfigFor<TPlugin>]

/**
 * Utility type to extract plugin name from a plugin specification.
 */
export type ExtractPluginName<TSpec extends PluginSpec> = TSpec extends readonly [
  infer TName,
  unknown,
]
  ? TName
  : TSpec

/**
 * Utility type to extract plugin configuration from a plugin specification.
 */
export type ExtractPluginConfig<TSpec extends PluginSpec> = TSpec extends readonly [
  infer _TName extends PluginName,
  infer TConfig,
]
  ? TConfig
  : TSpec extends PluginName
    ? PluginConfigFor<TSpec>
    : never

/**
 * Type guard to check if a plugin specification includes configuration.
 */
export function hasPluginConfig<TSpec extends PluginSpec>(
  spec: TSpec,
): spec is TSpec & readonly [PluginName, Record<string, unknown>] {
  return Array.isArray(spec) && spec.length === 2
}

/**
 * Utility function to get plugin name from a specification.
 */
export function getPluginName<TSpec extends PluginSpec>(spec: TSpec): ExtractPluginName<TSpec> {
  return (Array.isArray(spec) ? spec[0] : spec) as ExtractPluginName<TSpec>
}

/**
 * Utility function to get plugin configuration from a specification.
 */
export function getPluginConfig<TSpec extends PluginSpec>(spec: TSpec): ExtractPluginConfig<TSpec> {
  return (Array.isArray(spec) ? spec[1] : {}) as ExtractPluginConfig<TSpec>
}

/**
 * Plugin definition interface for creating custom plugins.
 */
export interface PluginDefinition extends Partial<PluginLifecycleHooks> {
  /**
   * Plugin configuration schema (optional, for validation).
   */
  configSchema?: unknown

  /**
   * Plugin metadata.
   */
  metadata?: {
    name: string
    version: string
    description?: string
    author?: string
    homepage?: string
  }
}

/**
 * Type for validating plugin implementations.
 */
export type ValidPlugin = PluginDefinition &
  (
    | {verifyConditions: NonNullable<PluginLifecycleHooks['verifyConditions']>}
    | {analyzeCommits: NonNullable<PluginLifecycleHooks['analyzeCommits']>}
    | {verifyRelease: NonNullable<PluginLifecycleHooks['verifyRelease']>}
    | {generateNotes: NonNullable<PluginLifecycleHooks['generateNotes']>}
    | {prepare: NonNullable<PluginLifecycleHooks['prepare']>}
    | {publish: NonNullable<PluginLifecycleHooks['publish']>}
    | {success: NonNullable<PluginLifecycleHooks['success']>}
    | {fail: NonNullable<PluginLifecycleHooks['fail']>}
  )
