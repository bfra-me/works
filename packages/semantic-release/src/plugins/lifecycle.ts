/**
 * TypeScript interfaces for semantic-release plugin lifecycle hooks.
 *
 * This module provides comprehensive type definitions for all semantic-release
 * plugin lifecycle methods, enabling type-safe plugin development with full
 * IntelliSense support.
 */

import type {
  AnalyzeCommitsContext,
  AnalyzeCommitsResult,
  BaseContext,
  FailContext,
  GenerateNotesContext,
  GenerateNotesResult,
  PluginConfig,
  PrepareContext,
  PublishContext,
  PublishResult,
  SuccessContext,
  VerifyConditionsContext,
  VerifyReleaseContext,
} from './context.js'

/**
 * Base type for all plugin lifecycle hooks.
 *
 * Each lifecycle hook receives plugin configuration and a context object
 * with semantic-release runtime information.
 */
export type BaseLifecycleHook<TConfig = PluginConfig, TContext = BaseContext> = (
  pluginConfig: TConfig,
  context: TContext,
) => Promise<void> | void

/**
 * Verify conditions lifecycle hook.
 *
 * Called by semantic-release to validate plugin configuration and environment.
 * Should throw an error if conditions are not met for the plugin to work properly.
 *
 * @param pluginConfig - Plugin-specific configuration options
 * @param context - Semantic-release context with environment and configuration
 */
export type VerifyConditionsHook<TConfig = PluginConfig> = BaseLifecycleHook<
  TConfig,
  VerifyConditionsContext
>

/**
 * Analyze commits lifecycle hook.
 *
 * Called by semantic-release to determine the type of release based on commits.
 * Should return the release type or undefined if no release is needed.
 *
 * @param pluginConfig - Plugin-specific configuration options
 * @param context - Semantic-release context with commits and release information
 * @returns Release type ('major', 'minor', 'patch', etc.) or undefined
 */
export type AnalyzeCommitsHook<TConfig = PluginConfig> = (
  pluginConfig: TConfig,
  context: AnalyzeCommitsContext,
) => Promise<AnalyzeCommitsResult> | AnalyzeCommitsResult

/**
 * Verify release lifecycle hook.
 *
 * Called by semantic-release to validate the release before proceeding.
 * Should throw an error if the release should be blocked.
 *
 * @param pluginConfig - Plugin-specific configuration options
 * @param context - Semantic-release context with next release information
 */
export type VerifyReleaseHook<TConfig = PluginConfig> = BaseLifecycleHook<
  TConfig,
  VerifyReleaseContext
>

/**
 * Generate notes lifecycle hook.
 *
 * Called by semantic-release to create release notes.
 * Should return the release notes as a string.
 *
 * @param pluginConfig - Plugin-specific configuration options
 * @param context - Semantic-release context with commits and release information
 * @returns Release notes as string
 */
export type GenerateNotesHook<TConfig = PluginConfig> = (
  pluginConfig: TConfig,
  context: GenerateNotesContext,
) => Promise<GenerateNotesResult> | GenerateNotesResult

/**
 * Prepare lifecycle hook.
 *
 * Called by semantic-release to prepare the release (e.g., update files, create changelog).
 * Should perform any necessary file updates or preparations before publishing.
 *
 * @param pluginConfig - Plugin-specific configuration options
 * @param context - Semantic-release context with next release and notes
 */
export type PrepareHook<TConfig = PluginConfig> = BaseLifecycleHook<TConfig, PrepareContext>

/**
 * Publish lifecycle hook.
 *
 * Called by semantic-release to publish the release.
 * Should return publication information with name and URL.
 *
 * @param pluginConfig - Plugin-specific configuration options
 * @param context - Semantic-release context with release information
 * @returns Publication result with name and URL, or void
 */
export type PublishHook<TConfig = PluginConfig> = (
  pluginConfig: TConfig,
  context: PublishContext,
) => Promise<PublishResult | void> | PublishResult | void

/**
 * Success lifecycle hook.
 *
 * Called by semantic-release after a successful release.
 * Should perform any post-release notifications or cleanup.
 *
 * @param pluginConfig - Plugin-specific configuration options
 * @param context - Semantic-release context with successful releases
 */
export type SuccessHook<TConfig = PluginConfig> = BaseLifecycleHook<TConfig, SuccessContext>

/**
 * Fail lifecycle hook.
 *
 * Called by semantic-release when the release process fails.
 * Should perform any error notifications or cleanup.
 *
 * @param pluginConfig - Plugin-specific configuration options
 * @param context - Semantic-release context with error information
 */
export type FailHook<TConfig = PluginConfig> = BaseLifecycleHook<TConfig, FailContext>

/**
 * Complete plugin lifecycle hooks interface.
 *
 * A plugin can implement any subset of these lifecycle hooks.
 * At least one hook must be implemented for a valid plugin.
 */
export interface PluginLifecycleHooks<TConfig = PluginConfig> {
  /**
   * Verify conditions step - validates plugin configuration and environment.
   */
  verifyConditions?: VerifyConditionsHook<TConfig>

  /**
   * Analyze commits step - determines the type of release based on commits.
   */
  analyzeCommits?: AnalyzeCommitsHook<TConfig>

  /**
   * Verify release step - validates the release before proceeding.
   */
  verifyRelease?: VerifyReleaseHook<TConfig>

  /**
   * Generate notes step - creates release notes.
   */
  generateNotes?: GenerateNotesHook<TConfig>

  /**
   * Prepare step - prepares the release (e.g., update files, create changelog).
   */
  prepare?: PrepareHook<TConfig>

  /**
   * Publish step - publishes the release.
   */
  publish?: PublishHook<TConfig>

  /**
   * Success step - called after a successful release.
   */
  success?: SuccessHook<TConfig>

  /**
   * Fail step - called when the release process fails.
   */
  fail?: FailHook<TConfig>
}

/**
 * Plugin definition interface for creating custom plugins.
 *
 * Combines lifecycle hooks with optional metadata and configuration schema.
 */
export interface PluginDefinition<TConfig = PluginConfig> extends PluginLifecycleHooks<TConfig> {
  /**
   * Plugin configuration schema (optional, for validation).
   * Can be a Zod schema, JSON Schema, or any validation schema.
   */
  configSchema?: unknown

  /**
   * Plugin metadata.
   */
  metadata?: {
    /**
     * Plugin name (should match package name).
     */
    name: string

    /**
     * Plugin version.
     */
    version: string

    /**
     * Plugin description.
     */
    description?: string

    /**
     * Plugin author.
     */
    author?: string

    /**
     * Plugin homepage URL.
     */
    homepage?: string

    /**
     * Plugin repository URL.
     */
    repository?: string

    /**
     * Plugin keywords for discovery.
     */
    keywords?: readonly string[]

    /**
     * Semantic-release version compatibility.
     */
    semanticReleaseCompatibility?: string
  }
}

/**
 * Type guard to check if an object implements plugin lifecycle hooks.
 */
export function isValidPlugin(plugin: unknown): plugin is PluginLifecycleHooks {
  if (typeof plugin !== 'object' || plugin === null) {
    return false
  }

  const hooks = plugin as Record<string, unknown>
  const validHooks = [
    'verifyConditions',
    'analyzeCommits',
    'verifyRelease',
    'generateNotes',
    'prepare',
    'publish',
    'success',
    'fail',
  ]

  // Must implement at least one valid hook
  return validHooks.some(hook => typeof hooks[hook] === 'function')
}

/**
 * Type for validating plugin implementations.
 * Ensures at least one lifecycle hook is implemented.
 */
export type ValidPlugin<TConfig = PluginConfig> = PluginDefinition<TConfig> &
  (
    | {verifyConditions: NonNullable<PluginLifecycleHooks<TConfig>['verifyConditions']>}
    | {analyzeCommits: NonNullable<PluginLifecycleHooks<TConfig>['analyzeCommits']>}
    | {verifyRelease: NonNullable<PluginLifecycleHooks<TConfig>['verifyRelease']>}
    | {generateNotes: NonNullable<PluginLifecycleHooks<TConfig>['generateNotes']>}
    | {prepare: NonNullable<PluginLifecycleHooks<TConfig>['prepare']>}
    | {publish: NonNullable<PluginLifecycleHooks<TConfig>['publish']>}
    | {success: NonNullable<PluginLifecycleHooks<TConfig>['success']>}
    | {fail: NonNullable<PluginLifecycleHooks<TConfig>['fail']>}
  )
