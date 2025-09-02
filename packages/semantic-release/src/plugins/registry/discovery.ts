/**
 * Plugin discovery service for finding semantic-release plugins.
 */

import type {
  PluginDiscoveryError,
  PluginDiscoveryMetrics,
  PluginDiscoveryOptions,
  PluginDiscoveryResult,
  PluginDiscoverySource,
  PluginLifecycleHook,
  PluginRegistryConfig,
  PluginRegistryEntry,
} from './types.js'
import {promises as fs} from 'node:fs'
import path from 'node:path'
import process from 'node:process'

/**
 * Service for discovering semantic-release plugins from various sources.
 */
export class PluginDiscoveryService {
  constructor(_config: Required<PluginRegistryConfig>) {
    // Configuration will be used in future enhancements
  }

  /**
   * Discover plugins from all configured sources.
   */
  async discover(options: PluginDiscoveryOptions): Promise<PluginDiscoveryResult> {
    const startTime = Date.now()
    const plugins: PluginRegistryEntry[] = []
    const errors: PluginDiscoveryError[] = []
    const sourceTime: Record<PluginDiscoverySource, number> = {
      local: 0,
      npm: 0,
      node_modules: 0,
      git: 0,
      manual: 0,
    }
    const sourceCount: Record<PluginDiscoverySource, number> = {
      local: 0,
      npm: 0,
      node_modules: 0,
      git: 0,
      manual: 0,
    }

    // Discover from local filesystem
    if (options.searchPaths !== undefined && options.searchPaths.length > 0) {
      const localStart = Date.now()
      try {
        const localPlugins = await this.discoverLocalPlugins(options.searchPaths, options)
        plugins.push(...localPlugins)
        sourceCount.local = localPlugins.length
      } catch (error) {
        errors.push({
          source: 'local',
          message: error instanceof Error ? error.message : String(error),
        })
      }
      sourceTime.local = Date.now() - localStart
    }

    // Discover from node_modules
    if (options.includeNodeModules === true) {
      const nodeModulesStart = Date.now()
      try {
        const nodeModulesPlugins = await this.discoverNodeModulesPlugins(options)
        plugins.push(...nodeModulesPlugins)
        sourceCount.node_modules = nodeModulesPlugins.length
      } catch (error) {
        errors.push({
          source: 'node_modules',
          message: error instanceof Error ? error.message : String(error),
        })
      }
      sourceTime.node_modules = Date.now() - nodeModulesStart
    }

    // Discover from npm registry
    if (options.includeNpmRegistry === true) {
      const npmStart = Date.now()
      try {
        const npmPlugins = await this.discoverNpmPlugins(options)
        plugins.push(...npmPlugins)
        sourceCount.npm = npmPlugins.length
      } catch (error) {
        errors.push({
          source: 'npm',
          message: error instanceof Error ? error.message : String(error),
        })
      }
      sourceTime.npm = Date.now() - npmStart
    }

    // Remove duplicates based on plugin ID
    const uniquePlugins = this.deduplicatePlugins(plugins)

    // Apply result limits
    const limitedPlugins =
      options.maxResults !== undefined && options.maxResults > 0
        ? uniquePlugins.slice(0, options.maxResults)
        : uniquePlugins

    const totalTime = Date.now() - startTime
    const metrics: PluginDiscoveryMetrics = {
      totalTime,
      sourceTime,
      sourceCount,
    }

    return {
      plugins: limitedPlugins,
      total: limitedPlugins.length,
      sources: ['local', 'node_modules', 'npm'],
      errors: errors.length > 0 ? errors : undefined,
      metrics,
    }
  }

  /**
   * Discover plugins from local filesystem paths.
   */
  private async discoverLocalPlugins(
    searchPaths: string[],
    options: PluginDiscoveryOptions,
  ): Promise<PluginRegistryEntry[]> {
    const plugins: PluginRegistryEntry[] = []

    for (const searchPath of searchPaths) {
      try {
        const absolutePath = path.isAbsolute(searchPath)
          ? searchPath
          : path.resolve(process.cwd(), searchPath)

        const stats = await fs.stat(absolutePath)
        if (stats.isDirectory()) {
          const directoryPlugins = await this.scanDirectory(absolutePath, options)
          plugins.push(...directoryPlugins)
        } else if (stats.isFile() && searchPath.endsWith('package.json')) {
          const filePlugin = await this.loadPluginFromPackageJson(absolutePath)
          if (filePlugin !== undefined) {
            plugins.push(filePlugin)
          }
        }
      } catch {
        // Path doesn't exist or is not accessible, skip
      }
    }

    return plugins
  }

  /**
   * Discover plugins from node_modules directory.
   */
  private async discoverNodeModulesPlugins(
    options: PluginDiscoveryOptions,
  ): Promise<PluginRegistryEntry[]> {
    const plugins: PluginRegistryEntry[] = []
    const nodeModulesPath = path.resolve(process.cwd(), 'node_modules')

    try {
      const entries = await fs.readdir(nodeModulesPath, {withFileTypes: true})

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const packagePath = path.join(nodeModulesPath, entry.name)
          const packageJsonPath = path.join(packagePath, 'package.json')

          try {
            const plugin = await this.loadPluginFromPackageJson(packageJsonPath)
            if (plugin !== undefined && this.matchesPluginPatterns(plugin, options)) {
              plugins.push({
                ...plugin,
                source: 'node_modules',
                installed: true,
                path: packagePath,
              })
            }
          } catch {
            // Package.json doesn't exist or is invalid, skip
          }
        }
      }
    } catch {
      // node_modules doesn't exist, return empty array
    }

    return plugins
  }

  /**
   * Discover plugins from npm registry (placeholder implementation).
   */
  private async discoverNpmPlugins(
    _options: PluginDiscoveryOptions,
  ): Promise<PluginRegistryEntry[]> {
    // This is a placeholder implementation
    // In a real implementation, you would query the npm registry API
    // for packages matching semantic-release plugin patterns
    return []
  }

  /**
   * Scan a directory for plugin packages.
   */
  private async scanDirectory(
    directoryPath: string,
    options: PluginDiscoveryOptions,
  ): Promise<PluginRegistryEntry[]> {
    const plugins: PluginRegistryEntry[] = []

    try {
      const entries = await fs.readdir(directoryPath, {withFileTypes: true})

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const subPath = path.join(directoryPath, entry.name)
          const packageJsonPath = path.join(subPath, 'package.json')

          try {
            const plugin = await this.loadPluginFromPackageJson(packageJsonPath)
            if (plugin !== undefined && this.matchesPluginPatterns(plugin, options)) {
              plugins.push({
                ...plugin,
                source: 'local',
                installed: false,
                path: subPath,
              })
            }
          } catch {
            // Package.json doesn't exist or is invalid, continue scanning subdirectories
            const subPlugins = await this.scanDirectory(subPath, options)
            plugins.push(...subPlugins)
          }
        }
      }
    } catch {
      // Directory is not accessible, skip
    }

    return plugins
  }

  /**
   * Load plugin metadata from package.json file.
   */
  private async loadPluginFromPackageJson(
    packageJsonPath: string,
  ): Promise<PluginRegistryEntry | undefined> {
    try {
      const content = await fs.readFile(packageJsonPath, 'utf8')
      const packageJson = JSON.parse(content) as Record<string, unknown>

      // Check if this is a semantic-release plugin
      if (!this.isSemanticReleasePlugin(packageJson)) {
        return undefined
      }

      const plugin: PluginRegistryEntry = {
        id: packageJson.name as string,
        name: packageJson.name as string,
        version: packageJson.version as string,
        description: packageJson.description as string | undefined,
        author: packageJson.author as string | undefined,
        license: packageJson.license as string | undefined,
        homepage: packageJson.homepage as string | undefined,
        repository:
          typeof packageJson.repository === 'string'
            ? packageJson.repository
            : ((packageJson.repository as Record<string, unknown> | undefined)?.url as
                | string
                | undefined),
        keywords: packageJson.keywords as string[] | undefined,
        semanticReleaseVersions: this.extractSemanticReleaseVersions(packageJson),
        hooks: this.extractPluginHooks(packageJson),
        dependencies: packageJson.dependencies as Record<string, string> | undefined,
        peerDependencies: packageJson.peerDependencies as Record<string, string> | undefined,
        main: packageJson.main as string | undefined,
        types: packageJson.types as string | undefined,
        installed: false,
        source: 'local',
        lastUpdated: new Date(),
      }

      return plugin
    } catch {
      return undefined
    }
  }

  /**
   * Check if a package is a semantic-release plugin.
   */
  private isSemanticReleasePlugin(packageJson: Record<string, unknown>): boolean {
    const name = packageJson.name as string
    const keywords = packageJson.keywords as string[] | undefined

    // Check common naming patterns
    if (name.includes('semantic-release') && name.includes('plugin')) {
      return true
    }

    // Check keywords
    if (
      keywords !== undefined &&
      keywords.some(
        keyword =>
          keyword.includes('semantic-release') || keyword.includes('semantic-release-plugin'),
      )
    ) {
      return true
    }

    // Check for semantic-release in dependencies or peerDependencies
    const dependencies = packageJson.dependencies as Record<string, string> | undefined
    const peerDependencies = packageJson.peerDependencies as Record<string, string> | undefined

    if (dependencies !== undefined && 'semantic-release' in dependencies) {
      return true
    }

    if (peerDependencies !== undefined && 'semantic-release' in peerDependencies) {
      return true
    }

    return false
  }

  /**
   * Extract semantic-release version requirements from package.json.
   */
  private extractSemanticReleaseVersions(packageJson: Record<string, unknown>): string[] {
    const peerDependencies = packageJson.peerDependencies as Record<string, string> | undefined
    const dependencies = packageJson.dependencies as Record<string, string> | undefined

    const version = peerDependencies?.['semantic-release'] ?? dependencies?.['semantic-release']
    if (version !== undefined) {
      return [version]
    }

    // Default to recent versions if not specified
    return ['>=23.0.0']
  }

  /**
   * Extract plugin lifecycle hooks from package.json.
   */
  private extractPluginHooks(packageJson: Record<string, unknown>): PluginLifecycleHook[] {
    // This is a simplified implementation
    // In a real implementation, you would analyze the plugin's code or metadata
    // to determine which hooks it implements

    // For now, return common hooks based on plugin type hints in name/keywords
    const name = packageJson.name as string
    const keywords = packageJson.keywords as string[] | undefined

    const allKeywords = [name, ...(keywords ?? [])].join(' ').toLowerCase()

    const hooks: PluginLifecycleHook[] = []

    if (allKeywords.includes('analyze') || allKeywords.includes('commit')) {
      hooks.push('analyzeCommits')
    }
    if (
      allKeywords.includes('generate') ||
      allKeywords.includes('notes') ||
      allKeywords.includes('changelog')
    ) {
      hooks.push('generateNotes')
    }
    if (allKeywords.includes('publish') || allKeywords.includes('release')) {
      hooks.push('publish')
    }
    if (allKeywords.includes('notify') || allKeywords.includes('success')) {
      hooks.push('success')
    }
    if (allKeywords.includes('prepare') || allKeywords.includes('build')) {
      hooks.push('prepare')
    }

    // If no specific hooks detected, assume basic plugin
    if (hooks.length === 0) {
      hooks.push('verifyConditions')
    }

    return hooks
  }

  /**
   * Check if plugin matches the search patterns.
   */
  private matchesPluginPatterns(
    plugin: PluginRegistryEntry,
    options: PluginDiscoveryOptions,
  ): boolean {
    if (options.namePatterns === undefined || options.namePatterns.length === 0) {
      return true
    }

    return options.namePatterns.some(pattern => {
      const regex = new RegExp(pattern, 'i')
      return regex.test(plugin.name)
    })
  }

  /**
   * Remove duplicate plugins based on ID.
   */
  private deduplicatePlugins(plugins: PluginRegistryEntry[]): PluginRegistryEntry[] {
    const seen = new Set<string>()
    const unique: PluginRegistryEntry[] = []

    for (const plugin of plugins) {
      if (!seen.has(plugin.id)) {
        seen.add(plugin.id)
        unique.push(plugin)
      }
    }

    return unique
  }
}
