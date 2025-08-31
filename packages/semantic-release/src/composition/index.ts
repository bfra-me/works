/**
 * Configuration composition utilities for semantic-release.
 *
 * This module provides utilities for merging, extending, and overriding
 * semantic-release configurations, enabling complex configuration scenarios
 * where presets need to be combined with custom settings.
 *
 * @example
 * ```typescript
 * import {mergeConfigs, extendConfig} from '@bfra.me/semantic-release/composition'
 * import {npmPreset, githubPreset} from '@bfra.me/semantic-release/presets'
 *
 * // Merge multiple configurations
 * const merged = mergeConfigs(
 *   npmPreset(),
 *   githubPreset(),
 *   { dryRun: true }
 * )
 *
 * // Extend a base configuration
 * const extended = extendConfig(npmPreset(), {
 *   plugins: [['@semantic-release/npm', { npmPublish: false }]]
 * })
 * ```
 */

import type {BranchSpec, GlobalConfig, PluginSpec} from '../types/core.js'

/**
 * Options for configuration composition operations.
 */
export interface CompositionOptions {
  /**
   * How to handle plugin conflicts when merging configurations.
   * - 'replace': Replace existing plugins entirely
   * - 'merge': Merge plugin configurations (default)
   * - 'append': Append new plugins to existing ones
   * - 'prepend': Prepend new plugins before existing ones
   */
  pluginStrategy?: 'replace' | 'merge' | 'append' | 'prepend'

  /**
   * How to handle branch configuration conflicts.
   * - 'replace': Replace with the new branch configuration
   * - 'merge': Merge branch configurations (default)
   */
  branchStrategy?: 'replace' | 'merge'

  /**
   * Whether to perform deep validation on the result.
   * @default true
   */
  validate?: boolean
}

/**
 * Merge multiple semantic-release configurations.
 *
 * This function takes multiple configuration objects and merges them together,
 * applying intelligent strategies for handling conflicts in plugins, branches,
 * and other configuration options.
 *
 * @param config1 - First configuration object
 * @param config2 - Second configuration object
 * @param restConfigs - Additional configuration objects
 * @returns A merged configuration object
 *
 * @example
 * ```typescript
 * const base = npmPreset()
 * const custom = { dryRun: true, repositoryUrl: 'https://github.com/user/repo' }
 * const merged = mergeConfigs(base, custom)
 * ```
 */
export function mergeConfigs(
  config1: GlobalConfig,
  config2: GlobalConfig,
  ...restConfigs: GlobalConfig[]
): GlobalConfig {
  return mergeConfigsWithOptions([config1, config2, ...restConfigs], {})
}

/**
 * Merge multiple semantic-release configurations with options.
 *
 * @param configs - Array of configuration objects to merge
 * @param options - Options controlling merge behavior
 * @returns A merged configuration object
 */
export function mergeConfigsWithOptions(
  configs: readonly [GlobalConfig, ...GlobalConfig[]],
  options: CompositionOptions = {},
): GlobalConfig {
  const {pluginStrategy = 'merge', branchStrategy = 'merge', validate = true} = options

  const result: GlobalConfig = {}

  // Merge simple properties (last wins)
  for (const config of configs) {
    if (config.repositoryUrl != null) {
      result.repositoryUrl = config.repositoryUrl
    }
    if (config.tagFormat != null) {
      result.tagFormat = config.tagFormat
    }
    if (config.dryRun != null) {
      result.dryRun = config.dryRun
    }
    if (config.ci != null) {
      result.ci = config.ci
    }
  }

  // Merge extends configuration
  const allExtends = configs
    .map(config => config.extends)
    .filter((extend): extend is string | readonly string[] => extend != null)
    .flat()

  if (allExtends.length > 0) {
    result.extends = allExtends.length === 1 ? allExtends[0] : allExtends
  }

  // Merge branches configuration
  result.branches = mergeBranches(
    configs.map(config => config.branches).filter(branches => branches != null),
    branchStrategy,
  )

  // Merge plugins configuration
  result.plugins = mergePlugins(
    configs.map(config => config.plugins).filter(plugins => plugins != null),
    pluginStrategy,
  )

  // Merge additional properties
  for (const config of configs) {
    for (const [key, value] of Object.entries(config)) {
      if (
        key !== 'extends' &&
        key !== 'branches' &&
        key !== 'repositoryUrl' &&
        key !== 'tagFormat' &&
        key !== 'plugins' &&
        key !== 'dryRun' &&
        key !== 'ci' &&
        value != null
      ) {
        result[key] = value
      }
    }
  }

  // Clean up undefined values
  Object.keys(result).forEach(key => {
    if (result[key] === undefined) {
      delete result[key]
    }
  })

  // Note: Validation is deferred to avoid complex type dependencies
  // Users can call validateConfig directly if needed
  if (validate) {
    // Validation will be implemented in TASK-016
  }

  return result
}

/**
 * Extend a base configuration with additional options.
 *
 * This function takes a base configuration and extends it with additional options,
 * using the same merging strategies as `mergeConfigs` but with a cleaner API
 * for the common case of extending a single base configuration.
 *
 * @param base - Base configuration to extend
 * @param extension - Extension configuration
 * @param options - Options controlling merge behavior
 * @returns An extended configuration object
 *
 * @example
 * ```typescript
 * const base = npmPreset()
 * const extended = extendConfig(base, {
 *   dryRun: true,
 *   plugins: [['@semantic-release/npm', { npmPublish: false }]]
 * })
 * ```
 */
export function extendConfig(
  base: GlobalConfig,
  extension: GlobalConfig,
  options: CompositionOptions = {},
): GlobalConfig {
  return mergeConfigsWithOptions([base, extension], options)
}

/**
 * Override a base configuration with new options.
 *
 * This function provides complete replacement semantics, where the override
 * configuration completely replaces matching properties in the base configuration.
 * This is useful when you need to completely replace certain aspects like plugins.
 *
 * @param base - Base configuration to override
 * @param override - Override configuration
 * @param options - Options controlling override behavior
 * @returns An overridden configuration object
 *
 * @example
 * ```typescript
 * const base = npmPreset()
 * const overridden = overrideConfig(base, {
 *   plugins: [['@semantic-release/git']] // Completely replaces plugins
 * })
 * ```
 */
export function overrideConfig(
  base: GlobalConfig,
  override: GlobalConfig,
  options: Omit<CompositionOptions, 'pluginStrategy' | 'branchStrategy'> = {},
): GlobalConfig {
  return mergeConfigsWithOptions([base, override], {
    ...options,
    pluginStrategy: 'replace',
    branchStrategy: 'replace',
  })
}

/**
 * Merge branch configurations using the specified strategy.
 *
 * @param branchConfigs - Array of branch configurations to merge
 * @param strategy - Strategy for merging branches
 * @returns Merged branch configuration
 */
function mergeBranches(
  branchConfigs: NonNullable<GlobalConfig['branches']>[],
  strategy: CompositionOptions['branchStrategy'],
): GlobalConfig['branches'] {
  if (branchConfigs.length === 0) {
    return undefined
  }

  if (strategy === 'replace') {
    return branchConfigs.at(-1)
  }

  // For merge strategy, combine all unique branches
  const allBranches = branchConfigs.flat()
  const uniqueBranches = new Map<string, string | BranchSpec>()

  for (const branch of allBranches) {
    const key = typeof branch === 'string' ? branch : branch.name
    uniqueBranches.set(key, branch)
  }

  const result = Array.from(uniqueBranches.values())
  return result
}

/**
 * Merge plugin configurations using the specified strategy.
 *
 * @param pluginConfigs - Array of plugin configurations to merge
 * @param strategy - Strategy for merging plugins
 * @returns Merged plugin configuration
 */
function mergePlugins(
  pluginConfigs: NonNullable<GlobalConfig['plugins']>[],
  strategy: CompositionOptions['pluginStrategy'],
): GlobalConfig['plugins'] {
  if (pluginConfigs.length === 0) {
    return undefined
  }

  if (strategy === 'replace') {
    return pluginConfigs.at(-1)
  }

  if (strategy === 'append') {
    return pluginConfigs.flat()
  }

  if (strategy === 'prepend') {
    return pluginConfigs.reverse().flat()
  }

  // For merge strategy, intelligently merge plugins by name
  const mergedPlugins = new Map<string, PluginSpec>()

  for (const plugins of pluginConfigs) {
    for (const plugin of plugins) {
      const pluginName = typeof plugin === 'string' ? plugin : plugin[0]

      const existing = mergedPlugins.get(pluginName)
      if (existing === undefined) {
        mergedPlugins.set(pluginName, plugin)
      } else {
        // Merge plugin configurations
        const merged = mergePluginConfigurations(existing, plugin)
        mergedPlugins.set(pluginName, merged)
      }
    }
  }

  return Array.from(mergedPlugins.values())
}

/**
 * Merge two plugin configurations.
 *
 * @param existing - Existing plugin configuration
 * @param newPlugin - New plugin configuration to merge
 * @returns Merged plugin configuration
 */
function mergePluginConfigurations(existing: PluginSpec, newPlugin: PluginSpec): PluginSpec {
  if (typeof existing === 'string' && typeof newPlugin === 'string') {
    return newPlugin // New plugin name takes precedence
  }

  if (typeof existing === 'string') {
    return newPlugin // New configuration takes precedence
  }

  if (typeof newPlugin === 'string') {
    return newPlugin // Simple string configuration takes precedence
  }

  // Both are tuples, merge their configurations
  const [, existingConfig] = existing
  const [newName, newConfig] = newPlugin

  const mergedConfig = {
    ...existingConfig,
    ...newConfig,
  }

  return [newName, mergedConfig]
}
