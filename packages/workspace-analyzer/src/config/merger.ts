/**
 * Configuration merging utilities for workspace analyzer.
 *
 * Provides deep merging of configuration sources with proper precedence:
 * programmatic options > config file > defaults
 */

import type {WorkspaceAnalyzerConfig} from './loader'
import type {WorkspaceAnalyzerConfigOutput} from './schema'

import {
  DEFAULT_ANALYZER_CONFIG,
  DEFAULT_CACHE_DIR,
  DEFAULT_CONCURRENCY,
  DEFAULT_HASH_ALGORITHM,
  DEFAULT_MAX_CACHE_AGE,
  DEFAULT_PACKAGE_PATTERNS,
} from './defaults'

/**
 * Complete configuration after merging all sources.
 */
export interface MergedConfig {
  /** Glob patterns for files to include */
  readonly include: readonly string[]
  /** Glob patterns for files to exclude */
  readonly exclude: readonly string[]
  /** Minimum severity level to report */
  readonly minSeverity: 'info' | 'warning' | 'error' | 'critical'
  /** Categories of issues to check (empty means all) */
  readonly categories: readonly (
    | 'configuration'
    | 'dependency'
    | 'architecture'
    | 'performance'
    | 'circular-import'
    | 'unused-export'
    | 'type-safety'
  )[]
  /** Enable incremental analysis caching */
  readonly cache: boolean
  /** Custom rules configuration */
  readonly rules: Readonly<Record<string, unknown>>
  /** Glob patterns for package locations */
  readonly packagePatterns: readonly string[]
  /** Maximum parallel analysis operations */
  readonly concurrency: number
  /** Directory for analysis cache files */
  readonly cacheDir: string
  /** Maximum cache age in milliseconds */
  readonly maxCacheAge: number
  /** Hash algorithm for file content */
  readonly hashAlgorithm: 'sha256' | 'md5'
  /** Per-analyzer configuration */
  readonly analyzers: Readonly<
    Record<
      string,
      {
        readonly enabled?: boolean
        readonly severity?: 'info' | 'warning' | 'error' | 'critical'
        readonly options?: Readonly<Record<string, unknown>>
      }
    >
  >
  /** Architectural analysis rules */
  readonly architecture?: {
    readonly layers?: readonly {
      readonly name: string
      readonly patterns: readonly string[]
      readonly allowedImports: readonly string[]
    }[]
    readonly allowBarrelExports?: boolean | readonly string[]
    readonly enforcePublicApi?: boolean
  }
}

/**
 * Gets the default merged configuration.
 */
export function getDefaultMergedConfig(): MergedConfig {
  return {
    include: DEFAULT_ANALYZER_CONFIG.include,
    exclude: DEFAULT_ANALYZER_CONFIG.exclude,
    minSeverity: DEFAULT_ANALYZER_CONFIG.minSeverity,
    categories: DEFAULT_ANALYZER_CONFIG.categories,
    cache: DEFAULT_ANALYZER_CONFIG.cache,
    rules: DEFAULT_ANALYZER_CONFIG.rules,
    packagePatterns: DEFAULT_PACKAGE_PATTERNS,
    concurrency: DEFAULT_CONCURRENCY,
    cacheDir: DEFAULT_CACHE_DIR,
    maxCacheAge: DEFAULT_MAX_CACHE_AGE,
    hashAlgorithm: DEFAULT_HASH_ALGORITHM,
    analyzers: {},
    architecture: undefined,
  }
}

/**
 * Merges analyzer-specific configurations.
 *
 * @param baseAnalyzers - Base analyzer config from file
 * @param overrideAnalyzers - Override config from programmatic options
 * @returns Merged analyzer configurations
 */
export function mergeAnalyzerConfigs(
  baseAnalyzers: MergedConfig['analyzers'],
  overrideAnalyzers?: WorkspaceAnalyzerConfig['analyzers'],
): MergedConfig['analyzers'] {
  if (overrideAnalyzers == null) {
    return baseAnalyzers
  }

  const merged = {...baseAnalyzers}

  for (const [id, config] of Object.entries(overrideAnalyzers)) {
    const base = merged[id]
    if (base == null) {
      merged[id] = config
    } else {
      merged[id] = {
        ...base,
        ...config,
        options: config.options == null ? base.options : {...base.options, ...config.options},
      }
    }
  }

  return merged
}

/**
 * Converts a validated config to a merged config structure.
 */
function validatedToMerged(config: WorkspaceAnalyzerConfigOutput): MergedConfig {
  return {
    include: config.include,
    exclude: config.exclude,
    minSeverity: config.minSeverity,
    categories: config.categories,
    cache: config.cache,
    rules: config.rules,
    packagePatterns: config.packagePatterns,
    concurrency: config.concurrency,
    cacheDir: config.cacheDir,
    maxCacheAge: config.maxCacheAge,
    hashAlgorithm: config.hashAlgorithm,
    analyzers: config.analyzers,
    architecture: config.architecture,
  }
}

/**
 * Applies partial options to a merged configuration.
 */
function applyOptions(base: MergedConfig, options: WorkspaceAnalyzerConfig): MergedConfig {
  return {
    include: options.include ?? base.include,
    exclude: options.exclude ?? base.exclude,
    minSeverity: options.minSeverity ?? base.minSeverity,
    categories: options.categories ?? base.categories,
    cache: options.cache ?? base.cache,
    rules: options.rules == null ? base.rules : {...base.rules, ...options.rules},
    packagePatterns: options.packagePatterns ?? base.packagePatterns,
    concurrency: options.concurrency ?? base.concurrency,
    cacheDir: options.cacheDir ?? base.cacheDir,
    maxCacheAge: options.maxCacheAge ?? base.maxCacheAge,
    hashAlgorithm: options.hashAlgorithm ?? base.hashAlgorithm,
    analyzers: mergeAnalyzerConfigs(base.analyzers, options.analyzers),
    architecture: options.architecture ?? base.architecture,
  }
}

/**
 * Merges configuration from multiple sources.
 *
 * Precedence (highest to lowest):
 * 1. Programmatic options passed to analyzeWorkspace()
 * 2. Configuration file (workspace-analyzer.config.ts)
 * 3. Default values
 *
 * @param fileConfig - Configuration loaded from file (optional)
 * @param programmaticOptions - Options passed programmatically (optional)
 * @returns Fully merged configuration with all defaults applied
 */
export function mergeConfig(
  fileConfig?: WorkspaceAnalyzerConfigOutput,
  programmaticOptions?: WorkspaceAnalyzerConfig,
): MergedConfig {
  // Start with defaults
  let merged = getDefaultMergedConfig()

  // Apply file config if present
  if (fileConfig != null) {
    merged = validatedToMerged(fileConfig)
  }

  // Apply programmatic options with highest precedence
  if (programmaticOptions != null) {
    merged = applyOptions(merged, programmaticOptions)
  }

  return merged
}

/**
 * Creates analyzer options from merged configuration for a specific analyzer.
 *
 * @param mergedConfig - The fully merged configuration
 * @param analyzerId - The ID of the analyzer to get options for
 * @returns Options for the specified analyzer
 */
export function getAnalyzerOptions(
  mergedConfig: MergedConfig,
  analyzerId: string,
): {
  enabled: boolean
  minSeverity: MergedConfig['minSeverity']
  categories: MergedConfig['categories']
  options: Record<string, unknown>
} {
  const analyzerConfig = mergedConfig.analyzers[analyzerId]

  return {
    enabled: analyzerConfig?.enabled ?? true,
    minSeverity: analyzerConfig?.severity ?? mergedConfig.minSeverity,
    categories: mergedConfig.categories,
    options: (analyzerConfig?.options ?? {}) as Record<string, unknown>,
  }
}
