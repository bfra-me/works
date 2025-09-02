/**
 * TypeScript types for plugin registry and discovery system.
 */

import type {PluginLifecycleHook} from '../validation/types.js'

// Re-export types from validation
export type {PluginLifecycleHook}

/**
 * Plugin registry entry containing metadata and references.
 */
export interface PluginRegistryEntry {
  /** Unique plugin identifier */
  id: string
  /** Plugin name */
  name: string
  /** Plugin version */
  version: string
  /** Plugin description */
  description?: string
  /** Plugin author information */
  author?: string | PluginAuthor
  /** Plugin license */
  license?: string
  /** Plugin homepage URL */
  homepage?: string
  /** Plugin repository information */
  repository?: string | PluginRepository
  /** Plugin keywords for discovery */
  keywords?: string[]
  /** Supported semantic-release versions */
  semanticReleaseVersions: string[]
  /** Implemented lifecycle hooks */
  hooks: PluginLifecycleHook[]
  /** Plugin dependencies */
  dependencies?: Record<string, string>
  /** Plugin peer dependencies */
  peerDependencies?: Record<string, string>
  /** Plugin entry point */
  main?: string
  /** Plugin type definitions */
  types?: string
  /** Whether plugin is installed locally */
  installed: boolean
  /** Installation path if locally installed */
  path?: string
  /** Plugin discovery source */
  source: PluginDiscoverySource
  /** Last time plugin metadata was updated */
  lastUpdated: Date
  /** Plugin configuration schema */
  configSchema?: Record<string, unknown>
}

/**
 * Plugin author information.
 */
export interface PluginAuthor {
  /** Author name */
  name: string
  /** Author email */
  email?: string
  /** Author URL */
  url?: string
}

/**
 * Plugin repository information.
 */
export interface PluginRepository {
  /** Repository type */
  type: string
  /** Repository URL */
  url: string
  /** Repository directory for monorepos */
  directory?: string
}

/**
 * Plugin discovery source types.
 */
export type PluginDiscoverySource =
  | 'local' // Local filesystem
  | 'npm' // NPM registry
  | 'node_modules' // Node modules directory
  | 'git' // Git repository
  | 'manual' // Manually registered

/**
 * Plugin discovery options.
 */
export interface PluginDiscoveryOptions {
  /** Directories to search for plugins */
  searchPaths?: string[]
  /** Whether to search node_modules */
  includeNodeModules?: boolean
  /** Whether to search npm registry */
  includeNpmRegistry?: boolean
  /** Plugin name patterns to match */
  namePatterns?: string[]
  /** Semantic-release version to filter by */
  semanticReleaseVersion?: string
  /** Maximum number of results */
  maxResults?: number
  /** Whether to include cached results */
  useCache?: boolean
  /** Cache TTL in milliseconds */
  cacheTtl?: number
}

/**
 * Plugin discovery result.
 */
export interface PluginDiscoveryResult {
  /** Discovered plugins */
  plugins: PluginRegistryEntry[]
  /** Total number of plugins found */
  total: number
  /** Discovery sources checked */
  sources: PluginDiscoverySource[]
  /** Errors encountered during discovery */
  errors?: PluginDiscoveryError[]
  /** Discovery performance metrics */
  metrics?: PluginDiscoveryMetrics
}

/**
 * Plugin discovery error.
 */
export interface PluginDiscoveryError {
  /** Error source */
  source: PluginDiscoverySource
  /** Error message */
  message: string
  /** Error path or location */
  path?: string
  /** Original error if available */
  error?: Error
}

/**
 * Plugin discovery performance metrics.
 */
export interface PluginDiscoveryMetrics {
  /** Total discovery time in milliseconds */
  totalTime: number
  /** Time per source */
  sourceTime: Record<PluginDiscoverySource, number>
  /** Plugins found per source */
  sourceCount: Record<PluginDiscoverySource, number>
  /** Cache hit rate */
  cacheHitRate?: number
}

/**
 * Plugin query options for filtering and sorting.
 */
export interface PluginQueryOptions {
  /** Filter by plugin name or pattern */
  name?: string | RegExp
  /** Filter by plugin keywords */
  keywords?: string[]
  /** Filter by implemented hooks */
  hooks?: PluginLifecycleHook[]
  /** Filter by semantic-release version compatibility */
  semanticReleaseVersion?: string
  /** Filter by installation status */
  installed?: boolean
  /** Filter by discovery source */
  source?: PluginDiscoverySource | PluginDiscoverySource[]
  /** Sort criteria */
  sortBy?: PluginSortCriteria
  /** Sort direction */
  sortOrder?: 'asc' | 'desc'
  /** Maximum number of results */
  limit?: number
  /** Number of results to skip */
  offset?: number
}

/**
 * Plugin sorting criteria.
 */
export type PluginSortCriteria =
  | 'name' // Sort by plugin name
  | 'version' // Sort by version
  | 'lastUpdated' // Sort by last update time
  | 'popularity' // Sort by download count or stars
  | 'relevance' // Sort by search relevance

/**
 * Plugin collection for managing groups of plugins.
 */
export interface PluginCollection {
  /** Collection name */
  name: string
  /** Collection description */
  description?: string
  /** Plugins in the collection */
  plugins: PluginRegistryEntry[]
  /** Collection metadata */
  metadata?: Record<string, unknown>
  /** Collection creation time */
  createdAt: Date
  /** Collection last modified time */
  updatedAt: Date
}

/**
 * Plugin registry configuration.
 */
export interface PluginRegistryConfig {
  /** Registry cache directory */
  cacheDir?: string
  /** Default cache TTL in milliseconds */
  defaultCacheTtl?: number
  /** Default search paths */
  defaultSearchPaths?: string[]
  /** Whether to auto-discover plugins */
  autoDiscover?: boolean
  /** Registry update interval */
  updateInterval?: number
  /** Maximum concurrent discovery operations */
  maxConcurrency?: number
}

/**
 * Plugin installation options.
 */
export interface PluginInstallOptions {
  /** Installation method */
  method?: 'npm' | 'yarn' | 'pnpm'
  /** Whether to save to package.json */
  save?: boolean
  /** Installation scope */
  scope?: 'dev' | 'prod'
  /** Package version to install */
  version?: string
}

/**
 * Plugin validation context for registry operations.
 */
export interface PluginRegistryValidationContext {
  /** Target semantic-release version */
  semanticReleaseVersion: string
  /** Required hooks */
  requiredHooks?: PluginLifecycleHook[]
  /** Forbidden hooks */
  forbiddenHooks?: PluginLifecycleHook[]
  /** Environment requirements */
  environment?: Record<string, string>
}

/**
 * Plugin dependency resolution result.
 */
export interface PluginDependencyResult {
  /** Whether all dependencies are resolved */
  resolved: boolean
  /** Missing dependencies */
  missing?: string[]
  /** Conflicting dependencies */
  conflicts?: PluginDependencyConflict[]
  /** Resolution suggestions */
  suggestions?: string[]
}

/**
 * Plugin dependency conflict information.
 */
export interface PluginDependencyConflict {
  /** Dependency name */
  dependency: string
  /** Required version */
  required: string
  /** Currently installed version */
  installed: string
  /** Conflicting plugins */
  conflictingPlugins: string[]
}
