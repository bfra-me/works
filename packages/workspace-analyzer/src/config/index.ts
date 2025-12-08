/**
 * Configuration module for workspace analyzer.
 *
 * Provides configuration loading, validation, merging, and the defineConfig() helper
 * for workspace-analyzer.config.ts files.
 */

// Default configuration values
export {
  DEFAULT_ANALYZER_CONFIG,
  DEFAULT_CACHE_DIR,
  DEFAULT_CATEGORIES,
  DEFAULT_CONCURRENCY,
  DEFAULT_ENABLED_ANALYZERS,
  DEFAULT_ENABLED_RULES,
  DEFAULT_EXCLUDE_PATTERNS,
  DEFAULT_HASH_ALGORITHM,
  DEFAULT_INCLUDE_PATTERNS,
  DEFAULT_MAX_CACHE_AGE,
  DEFAULT_MIN_SEVERITY,
  DEFAULT_PACKAGE_PATTERNS,
  DEFAULT_WORKSPACE_OPTIONS,
  getDefaultConfig,
} from './defaults'

export type {DefaultAnalyzerConfig, DefaultConfig, DefaultWorkspaceOptions} from './defaults'

// Configuration file loader
export {CONFIG_FILE_NAMES, defineConfig, findConfigFile, loadConfig, loadConfigFile} from './loader'

export type {
  ConfigLoadError,
  ConfigLoadErrorCode,
  ConfigLoadResult,
  WorkspaceAnalyzerConfig,
} from './loader'

// Configuration merging
export {
  getAnalyzerOptions,
  getDefaultMergedConfig,
  mergeAnalyzerConfigs,
  mergeConfig,
} from './merger'

export type {MergedConfig} from './merger'

// Zod schemas and validation
export {
  analyzerConfigSchema,
  analyzerOptionsSchema,
  analyzersConfigSchema,
  analyzeWorkspaceOptionsSchema,
  architecturalRulesSchema,
  categorySchema,
  layerConfigSchema,
  parseAnalyzerConfig,
  parseWorkspaceAnalyzerConfig,
  ruleConfigSchema,
  safeParseAnalyzeOptions,
  safeParseWorkspaceAnalyzerConfig,
  severitySchema,
  workspaceAnalyzerConfigSchema,
  workspaceOptionsSchema,
} from './schema'

export type {
  AnalyzerConfigInput,
  AnalyzerConfigOutput,
  AnalyzeWorkspaceOptionsInput,
  AnalyzeWorkspaceOptionsOutput,
  CategoryInput,
  CategoryOutput,
  SafeParseResult,
  SeverityInput,
  SeverityOutput,
  WorkspaceAnalyzerConfigInput,
  WorkspaceAnalyzerConfigOutput,
  WorkspaceOptionsInput,
  WorkspaceOptionsOutput,
} from './schema'
