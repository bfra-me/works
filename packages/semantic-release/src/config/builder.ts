/**
 * Configuration builder pattern for fluent API construction.
 *
 * This module provides a fluent API builder pattern for constructing complex
 * semantic-release configurations in a type-safe and developer-friendly manner,
 * similar to the pattern used in @bfra.me/eslint-config.
 *
 * @example
 * ```typescript
 * import {createConfigBuilder} from '@bfra.me/semantic-release'
 *
 * const config = createConfigBuilder()
 *   .branches(['main', 'develop'])
 *   .plugins()
 *     .commitAnalyzer()
 *     .releaseNotesGenerator()
 *     .npm()
 *     .github()
 *   .build()
 * ```
 */

import type {BranchConfig, GlobalConfig, PluginSpec} from '../types/core.js'
import type {
  ChangelogConfig,
  CommitAnalyzerConfig,
  GitConfig,
  GithubConfig,
  NpmConfig,
  ReleaseNotesGeneratorConfig,
} from '../types/index.js'
import {defineConfig, type DefineConfigOptions} from './define-config.js'

/**
 * Configuration builder for fluent API construction.
 *
 * Provides a chainable interface for building semantic-release configurations
 * with type safety and IntelliSense support.
 */
export class ConfigBuilder {
  private config: GlobalConfig = {}
  private pluginsList: PluginSpec[] = []

  /**
   * Set the branches configuration.
   *
   * @param branches - Branch configuration
   * @returns The builder instance for chaining
   */
  branches(branches: BranchConfig): this {
    this.config = {...this.config, branches}
    return this
  }

  /**
   * Set the repository URL.
   *
   * @param url - Repository URL
   * @returns The builder instance for chaining
   */
  repositoryUrl(url: string): this {
    this.config = {...this.config, repositoryUrl: url}
    return this
  }

  /**
   * Set the tag format.
   *
   * @param format - Tag format string
   * @returns The builder instance for chaining
   */
  tagFormat(format: string): this {
    this.config = {...this.config, tagFormat: format}
    return this
  }

  /**
   * Enable or disable dry-run mode.
   *
   * @param enabled - Whether to enable dry-run mode
   * @returns The builder instance for chaining
   */
  dryRun(enabled = true): this {
    this.config = {...this.config, dryRun: enabled}
    return this
  }

  /**
   * Enable or disable CI mode.
   *
   * @param enabled - Whether to enable CI mode
   * @returns The builder instance for chaining
   */
  ci(enabled = true): this {
    this.config = {...this.config, ci: enabled}
    return this
  }

  /**
   * Set debug mode.
   *
   * @param enabled - Whether to enable debug mode
   * @returns The builder instance for chaining
   */
  debug(enabled = true): this {
    this.config = {...this.config, debug: enabled}
    return this
  }

  /**
   * Enter plugin configuration mode.
   *
   * @returns A plugin builder for configuring plugins
   */
  plugins(): PluginBuilder {
    return new PluginBuilder(this, this.pluginsList)
  }

  /**
   * Add a custom plugin configuration.
   *
   * @param plugin - Plugin specification
   * @returns The builder instance for chaining
   */
  addPlugin(plugin: PluginSpec): this {
    this.pluginsList.push(plugin)
    return this
  }

  /**
   * Set plugins directly (replaces any existing plugins).
   *
   * @param plugins - Array of plugin specifications
   * @returns The builder instance for chaining
   */
  setPlugins(plugins: PluginSpec[]): this {
    this.pluginsList = [...plugins]
    return this
  }

  /**
   * Build the final configuration.
   *
   * @param options - Build options for validation and processing
   * @returns The built semantic-release configuration
   */
  build(options?: DefineConfigOptions): GlobalConfig {
    const finalConfig = {
      ...this.config,
      plugins: this.pluginsList.length > 0 ? this.pluginsList : undefined,
    }

    return defineConfig(finalConfig, options)
  }

  /**
   * Get the current configuration without finalizing.
   *
   * @returns The current configuration state
   */
  toConfig(): GlobalConfig {
    return {
      ...this.config,
      plugins: this.pluginsList.length > 0 ? this.pluginsList : undefined,
    }
  }
}

/**
 * Plugin builder for fluent plugin configuration.
 *
 * Provides a chainable interface for adding and configuring semantic-release plugins.
 */
export class PluginBuilder {
  constructor(
    private readonly configBuilder: ConfigBuilder,
    private readonly pluginsList: PluginSpec[],
  ) {}

  /**
   * Add @semantic-release/commit-analyzer plugin.
   *
   * @param config - Plugin configuration options
   * @returns The plugin builder for chaining
   */
  commitAnalyzer(config?: CommitAnalyzerConfig): this {
    const plugin: PluginSpec = config
      ? ['@semantic-release/commit-analyzer', config]
      : '@semantic-release/commit-analyzer'

    this.pluginsList.push(plugin)
    return this
  }

  /**
   * Add @semantic-release/release-notes-generator plugin.
   *
   * @param config - Plugin configuration options
   * @returns The plugin builder for chaining
   */
  releaseNotesGenerator(config?: ReleaseNotesGeneratorConfig): this {
    const plugin: PluginSpec = config
      ? ['@semantic-release/release-notes-generator', config]
      : '@semantic-release/release-notes-generator'

    this.pluginsList.push(plugin)
    return this
  }

  /**
   * Add @semantic-release/changelog plugin.
   *
   * @param config - Plugin configuration options
   * @returns The plugin builder for chaining
   */
  changelog(config?: ChangelogConfig): this {
    const plugin: PluginSpec = config
      ? ['@semantic-release/changelog', config]
      : '@semantic-release/changelog'

    this.pluginsList.push(plugin)
    return this
  }

  /**
   * Add @semantic-release/npm plugin.
   *
   * @param config - Plugin configuration options
   * @returns The plugin builder for chaining
   */
  npm(config?: NpmConfig): this {
    const plugin: PluginSpec = config ? ['@semantic-release/npm', config] : '@semantic-release/npm'

    this.pluginsList.push(plugin)
    return this
  }

  /**
   * Add @semantic-release/github plugin.
   *
   * @param config - Plugin configuration options
   * @returns The plugin builder for chaining
   */
  github(config?: GithubConfig): this {
    const plugin: PluginSpec = config
      ? ['@semantic-release/github', config]
      : '@semantic-release/github'

    this.pluginsList.push(plugin)
    return this
  }

  /**
   * Add @semantic-release/git plugin.
   *
   * @param config - Plugin configuration options
   * @returns The plugin builder for chaining
   */
  git(config?: GitConfig): this {
    const plugin: PluginSpec = config ? ['@semantic-release/git', config] : '@semantic-release/git'

    this.pluginsList.push(plugin)
    return this
  }

  /**
   * Add a custom plugin.
   *
   * @param plugin - Plugin specification
   * @returns The plugin builder for chaining
   */
  custom(plugin: PluginSpec): this {
    this.pluginsList.push(plugin)
    return this
  }

  /**
   * Return to the main configuration builder.
   *
   * @returns The main configuration builder
   */
  done(): ConfigBuilder {
    return this.configBuilder
  }

  /**
   * Build the final configuration directly from the plugin builder.
   *
   * @param options - Build options for validation and processing
   * @returns The built semantic-release configuration
   */
  build(options?: DefineConfigOptions): GlobalConfig {
    return this.configBuilder.build(options)
  }
}

/**
 * Create a new configuration builder.
 *
 * @returns A new configuration builder instance
 *
 * @example
 * ```typescript
 * const config = createConfigBuilder()
 *   .branches(['main'])
 *   .dryRun(false)
 *   .plugins()
 *     .commitAnalyzer()
 *     .releaseNotesGenerator()
 *     .npm()
 *     .github()
 *   .build()
 * ```
 */
export function createConfigBuilder(): ConfigBuilder {
  return new ConfigBuilder()
}

/**
 * Create a configuration builder with default plugins.
 *
 * @returns A configuration builder with common plugins pre-configured
 *
 * @example
 * ```typescript
 * const config = createDefaultBuilder()
 *   .branches(['main'])
 *   .build()
 * ```
 */
export function createDefaultBuilder(): ConfigBuilder {
  return createConfigBuilder()
    .plugins()
    .commitAnalyzer()
    .releaseNotesGenerator()
    .npm()
    .github()
    .done()
}

/**
 * Create a configuration builder for npm packages.
 *
 * @returns A configuration builder optimized for npm package releases
 *
 * @example
 * ```typescript
 * const config = createNpmBuilder()
 *   .branches(['main'])
 *   .build()
 * ```
 */
export function createNpmBuilder(): ConfigBuilder {
  return createConfigBuilder()
    .plugins()
    .commitAnalyzer()
    .releaseNotesGenerator()
    .changelog()
    .npm()
    .github()
    .git({
      assets: ['CHANGELOG.md', 'package.json'],
      // eslint-disable-next-line no-template-curly-in-string
      message: 'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}',
    })
    .done()
}

/**
 * Create a configuration builder for GitHub releases only.
 *
 * @returns A configuration builder optimized for GitHub-only releases
 *
 * @example
 * ```typescript
 * const config = createGitHubBuilder()
 *   .branches(['main'])
 *   .build()
 * ```
 */
export function createGitHubBuilder(): ConfigBuilder {
  return createConfigBuilder().plugins().commitAnalyzer().releaseNotesGenerator().github().done()
}
