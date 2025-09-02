/**
 * Main plugin registry class for managing semantic-release plugins.
 */

import type {
  PluginCollection,
  PluginDependencyResult,
  PluginDiscoveryOptions,
  PluginDiscoveryResult,
  PluginDiscoverySource,
  PluginLifecycleHook,
  PluginQueryOptions,
  PluginRegistryConfig,
  PluginRegistryEntry,
  PluginRegistryValidationContext,
} from './types.js'
import {promises as fs} from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import {PluginDependencyResolver} from './dependency-resolver.js'
import {PluginDiscoveryService} from './discovery.js'

/**
 * Main plugin registry for managing semantic-release plugins.
 */
export class PluginRegistry {
  private readonly config: Required<PluginRegistryConfig>
  private readonly discoveryService: PluginDiscoveryService
  private readonly dependencyResolver: PluginDependencyResolver
  private readonly plugins = new Map<string, PluginRegistryEntry>()
  private readonly collections = new Map<string, PluginCollection>()

  constructor(config: PluginRegistryConfig = {}) {
    this.config = {
      cacheDir: config.cacheDir ?? path.join(process.cwd(), '.semantic-release-cache'),
      defaultCacheTtl: config.defaultCacheTtl ?? 3_600_000, // 1 hour
      defaultSearchPaths: config.defaultSearchPaths ?? ['./plugins', './src/plugins'],
      autoDiscover: config.autoDiscover ?? true,
      updateInterval: config.updateInterval ?? 86_400_000, // 24 hours
      maxConcurrency: config.maxConcurrency ?? 5,
    }

    this.discoveryService = new PluginDiscoveryService(this.config)
    this.dependencyResolver = new PluginDependencyResolver()

    if (this.config.autoDiscover) {
      this.initialize().catch(error => {
        console.error('Failed to auto-initialize plugin registry:', error)
      })
    }
  }

  /**
   * Initialize the registry by discovering plugins.
   */
  async initialize(): Promise<void> {
    try {
      await this.ensureCacheDir()
      await this.loadCache()
      const result = await this.discoverPlugins()
      for (const plugin of result.plugins) {
        this.plugins.set(plugin.id, plugin)
      }
    } catch (error) {
      console.error('Failed to initialize plugin registry:', error)
    }
  }

  /**
   * Register a plugin manually.
   */
  async registerPlugin(plugin: PluginRegistryEntry): Promise<void> {
    this.plugins.set(plugin.id, {
      ...plugin,
      lastUpdated: new Date(),
      source: 'manual',
    })
    await this.persistCache()
  }

  /**
   * Unregister a plugin.
   */
  async unregisterPlugin(pluginId: string): Promise<boolean> {
    const removed = this.plugins.delete(pluginId)
    if (removed) {
      await this.persistCache()
    }
    return removed
  }

  /**
   * Get a specific plugin by ID.
   */
  getPlugin(pluginId: string): PluginRegistryEntry | undefined {
    return this.plugins.get(pluginId)
  }

  /**
   * Get all registered plugins.
   */
  getAllPlugins(): PluginRegistryEntry[] {
    return Array.from(this.plugins.values())
  }

  /**
   * Query plugins with filtering and sorting options.
   */
  queryPlugins(options: PluginQueryOptions = {}): PluginRegistryEntry[] {
    let results = Array.from(this.plugins.values())

    // Apply filters
    if (options.name !== undefined) {
      const nameFilter =
        typeof options.name === 'string'
          ? (plugin: PluginRegistryEntry) => plugin.name.includes(options.name as string)
          : (plugin: PluginRegistryEntry) => (options.name as RegExp).test(plugin.name)
      results = results.filter(nameFilter)
    }

    if (options.keywords !== undefined && options.keywords.length > 0) {
      results = results.filter(
        plugin =>
          plugin.keywords?.some(
            keyword =>
              options.keywords?.some(filterKeyword =>
                keyword.toLowerCase().includes(filterKeyword.toLowerCase()),
              ) ?? false,
          ) ?? false,
      )
    }

    if (options.hooks !== undefined && options.hooks.length > 0) {
      results = results.filter(
        plugin => options.hooks?.every(hook => plugin.hooks.includes(hook)) ?? false,
      )
    }

    if (options.installed !== undefined) {
      results = results.filter(plugin => plugin.installed === options.installed)
    }

    if (options.source !== undefined) {
      const sources = Array.isArray(options.source) ? options.source : [options.source]
      results = results.filter(plugin => sources.includes(plugin.source))
    }

    // Apply sorting
    if (options.sortBy !== undefined) {
      results.sort((a, b) => {
        let comparison = 0
        const sortBy = options.sortBy as NonNullable<typeof options.sortBy>
        switch (sortBy) {
          case 'name':
            comparison = a.name.localeCompare(b.name)
            break
          case 'version':
            comparison = this.compareVersions(a.version, b.version)
            break
          case 'lastUpdated':
            comparison = a.lastUpdated.getTime() - b.lastUpdated.getTime()
            break
          case 'popularity':
            // Placeholder for popularity ranking
            comparison = 0
            break
          case 'relevance':
            // Placeholder for relevance ranking
            comparison = 0
            break
        }
        return options.sortOrder === 'desc' ? -comparison : comparison
      })
    }

    // Apply pagination
    if (options.offset !== undefined) {
      results = results.slice(options.offset)
    }
    if (options.limit !== undefined) {
      results = results.slice(0, options.limit)
    }

    return results
  }

  /**
   * Discover plugins from various sources.
   */
  async discoverPlugins(options?: PluginDiscoveryOptions): Promise<PluginDiscoveryResult> {
    const discoveryOptions = {
      searchPaths: this.config.defaultSearchPaths,
      includeNodeModules: true,
      includeNpmRegistry: false, // Disabled by default for performance
      useCache: true,
      cacheTtl: this.config.defaultCacheTtl,
      ...options,
    }

    return this.discoveryService.discover(discoveryOptions)
  }

  /**
   * Update plugin registry by refreshing plugin data.
   */
  async updateRegistry(): Promise<PluginDiscoveryResult> {
    const result = await this.discoverPlugins({
      useCache: false, // Force refresh
    })

    // Update existing plugins
    for (const plugin of result.plugins) {
      this.plugins.set(plugin.id, plugin)
    }

    await this.persistCache()
    return result
  }

  /**
   * Validate plugin dependencies.
   */
  async validateDependencies(
    pluginIds: string[],
    context: PluginRegistryValidationContext,
  ): Promise<PluginDependencyResult> {
    const plugins = pluginIds
      .map(id => this.plugins.get(id))
      .filter((plugin): plugin is PluginRegistryEntry => plugin !== undefined)

    return this.dependencyResolver.resolve(plugins, context)
  }

  /**
   * Create a new plugin collection.
   */
  createCollection(name: string, description?: string): PluginCollection {
    const collection: PluginCollection = {
      name,
      description,
      plugins: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    this.collections.set(name, collection)
    return collection
  }

  /**
   * Get a plugin collection by name.
   */
  getCollection(name: string): PluginCollection | undefined {
    return this.collections.get(name)
  }

  /**
   * Add plugins to a collection.
   */
  addToCollection(collectionName: string, pluginIds: string[]): boolean {
    const collection = this.collections.get(collectionName)
    if (!collection) {
      return false
    }

    const plugins = pluginIds
      .map(id => this.plugins.get(id))
      .filter((plugin): plugin is PluginRegistryEntry => plugin !== undefined)

    collection.plugins.push(...plugins)
    collection.updatedAt = new Date()
    return true
  }

  /**
   * Remove plugins from a collection.
   */
  removeFromCollection(collectionName: string, pluginIds: string[]): boolean {
    const collection = this.collections.get(collectionName)
    if (!collection) {
      return false
    }

    collection.plugins = collection.plugins.filter(plugin => !pluginIds.includes(plugin.id))
    collection.updatedAt = new Date()
    return true
  }

  /**
   * Delete a plugin collection.
   */
  deleteCollection(name: string): boolean {
    return this.collections.delete(name)
  }

  /**
   * Get all plugin collections.
   */
  getAllCollections(): PluginCollection[] {
    return Array.from(this.collections.values())
  }

  /**
   * Get plugin statistics.
   */
  getStatistics() {
    const plugins = Array.from(this.plugins.values())
    const sourceCount = new Map<string, number>()
    const hookCount = new Map<string, number>()

    for (const plugin of plugins) {
      // Count by source
      sourceCount.set(plugin.source, (sourceCount.get(plugin.source) ?? 0) + 1)

      // Count by hooks
      for (const hook of plugin.hooks) {
        hookCount.set(hook, (hookCount.get(hook) ?? 0) + 1)
      }
    }

    return {
      totalPlugins: plugins.length,
      installedPlugins: plugins.filter(p => p.installed).length,
      pluginsBySource: Object.fromEntries(sourceCount),
      pluginsByHook: Object.fromEntries(hookCount),
      collections: this.collections.size,
      lastUpdate: Math.max(...plugins.map(p => p.lastUpdated.getTime()), 0),
    }
  }

  /**
   * Clear all plugins and collections.
   */
  async clear(): Promise<void> {
    this.plugins.clear()
    this.collections.clear()
    await this.persistCache()
  }

  /**
   * Ensure cache directory exists.
   */
  private async ensureCacheDir(): Promise<void> {
    try {
      await fs.mkdir(this.config.cacheDir, {recursive: true})
    } catch (error) {
      console.error('Failed to create cache directory:', error)
    }
  }

  /**
   * Persist registry data to cache.
   */
  private async persistCache(): Promise<void> {
    try {
      const cacheFile = path.join(this.config.cacheDir, 'registry.json')
      const data = {
        plugins: Array.from(this.plugins.entries()),
        collections: Array.from(this.collections.entries()),
        timestamp: Date.now(),
      }
      await fs.writeFile(cacheFile, JSON.stringify(data, null, 2))
    } catch (error) {
      console.error('Failed to persist registry cache:', error)
    }
  }

  /**
   * Load registry data from cache.
   */
  private async loadCache(): Promise<void> {
    try {
      const cacheFile = path.join(this.config.cacheDir, 'registry.json')
      const rawData = await fs.readFile(cacheFile, 'utf8')
      const data = JSON.parse(rawData) as {
        timestamp?: number
        plugins?: [string, Record<string, unknown>][]
        collections?: [string, Record<string, unknown>][]
      }

      // Check if cache data is valid
      if (typeof data.timestamp !== 'number') {
        return
      }

      // Check if cache is still valid
      const age = Date.now() - data.timestamp
      if (age > this.config.defaultCacheTtl) {
        return
      }

      // Load plugins
      if (Array.isArray(data.plugins)) {
        for (const [id, plugin] of data.plugins) {
          if (
            typeof id === 'string' &&
            plugin !== null &&
            typeof plugin.name === 'string' &&
            typeof plugin.version === 'string' &&
            Array.isArray(plugin.semanticReleaseVersions) &&
            Array.isArray(plugin.hooks) &&
            typeof plugin.installed === 'boolean' &&
            typeof plugin.source === 'string' &&
            typeof plugin.lastUpdated === 'string'
          ) {
            this.plugins.set(id, {
              id,
              name: plugin.name,
              version: plugin.version,
              description: typeof plugin.description === 'string' ? plugin.description : undefined,
              author: typeof plugin.author === 'string' ? plugin.author : undefined,
              license: typeof plugin.license === 'string' ? plugin.license : undefined,
              homepage: typeof plugin.homepage === 'string' ? plugin.homepage : undefined,
              repository: typeof plugin.repository === 'string' ? plugin.repository : undefined,
              keywords: Array.isArray(plugin.keywords) ? (plugin.keywords as string[]) : [],
              semanticReleaseVersions: plugin.semanticReleaseVersions as string[],
              hooks: plugin.hooks as PluginLifecycleHook[],
              dependencies:
                typeof plugin.dependencies === 'object' && plugin.dependencies !== null
                  ? (plugin.dependencies as Record<string, string>)
                  : undefined,
              peerDependencies:
                typeof plugin.peerDependencies === 'object' && plugin.peerDependencies !== null
                  ? (plugin.peerDependencies as Record<string, string>)
                  : undefined,
              main: typeof plugin.main === 'string' ? plugin.main : undefined,
              types: typeof plugin.types === 'string' ? plugin.types : undefined,
              installed: plugin.installed,
              path: typeof plugin.path === 'string' ? plugin.path : undefined,
              source: plugin.source as PluginDiscoverySource,
              lastUpdated: new Date(plugin.lastUpdated),
              configSchema:
                typeof plugin.configSchema === 'object' && plugin.configSchema !== null
                  ? (plugin.configSchema as Record<string, unknown>)
                  : undefined,
            })
          }
        }
      }

      // Load collections - simplified approach, store only references that can be resolved later
      if (Array.isArray(data.collections)) {
        for (const [name, collection] of data.collections) {
          if (
            typeof name === 'string' &&
            collection !== null &&
            typeof collection.description === 'string' &&
            Array.isArray(collection.pluginIds) &&
            typeof collection.createdAt === 'string' &&
            typeof collection.updatedAt === 'string'
          ) {
            // Create collection with empty plugins array, will be populated by plugin IDs resolution
            this.collections.set(name, {
              name,
              description: collection.description,
              plugins: [], // Will be resolved from pluginIds later
              metadata:
                typeof collection.metadata === 'object' && collection.metadata !== null
                  ? (collection.metadata as Record<string, unknown>)
                  : undefined,
              createdAt: new Date(collection.createdAt),
              updatedAt: new Date(collection.updatedAt),
            })
          }
        }
      }
    } catch {
      // Cache file doesn't exist or is invalid, ignore
    }
  }

  /**
   * Compare two version strings.
   */
  private compareVersions(a: string, b: string): number {
    const aParts = a.split('.').map(Number)
    const bParts = b.split('.').map(Number)
    const maxLength = Math.max(aParts.length, bParts.length)

    for (let i = 0; i < maxLength; i++) {
      const aPart = aParts[i] ?? 0
      const bPart = bParts[i] ?? 0
      if (aPart !== bPart) {
        return aPart - bPart
      }
    }

    return 0
  }
}

/**
 * Create a new plugin registry instance.
 */
export function createPluginRegistry(config?: PluginRegistryConfig): PluginRegistry {
  return new PluginRegistry(config)
}

/**
 * Default plugin registry instance.
 */
export const defaultRegistry = new PluginRegistry()
