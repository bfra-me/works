/**
 * Default configuration values for workspace analyzer.
 *
 * Provides sensible defaults that work well for typical TypeScript monorepo projects,
 * with all options explicitly documented and type-safe.
 */

import type {IssueCategory, Severity} from '../types/index'

/**
 * Default glob patterns for including source files in analysis.
 */
export const DEFAULT_INCLUDE_PATTERNS: readonly string[] = [
  '**/*.ts',
  '**/*.tsx',
  '**/*.js',
  '**/*.jsx',
  '**/*.mts',
  '**/*.cts',
]

/**
 * Default glob patterns for excluding files from analysis.
 */
export const DEFAULT_EXCLUDE_PATTERNS: readonly string[] = [
  '**/node_modules/**',
  '**/dist/**',
  '**/lib/**',
  '**/build/**',
  '**/coverage/**',
  '**/*.d.ts',
  '**/*.test.ts',
  '**/*.test.tsx',
  '**/*.spec.ts',
  '**/*.spec.tsx',
  '**/__tests__/**',
  '**/__mocks__/**',
]

/**
 * Default package location patterns for monorepo scanning.
 */
export const DEFAULT_PACKAGE_PATTERNS: readonly string[] = ['packages/*', 'apps/*']

/**
 * Default severity threshold for issue reporting.
 */
export const DEFAULT_MIN_SEVERITY: Severity = 'info'

/**
 * Default categories to analyze (all categories when empty).
 */
export const DEFAULT_CATEGORIES: readonly IssueCategory[] = []

/**
 * Default concurrency limit for parallel analysis.
 */
export const DEFAULT_CONCURRENCY = 4

/**
 * Default cache directory name.
 */
export const DEFAULT_CACHE_DIR = '.workspace-analyzer-cache'

/**
 * Default maximum cache age in milliseconds (7 days).
 */
export const DEFAULT_MAX_CACHE_AGE = 7 * 24 * 60 * 60 * 1000

/**
 * Default hash algorithm for file content hashing.
 */
export const DEFAULT_HASH_ALGORITHM = 'sha256' as const

/**
 * Complete default analyzer configuration.
 */
export interface DefaultAnalyzerConfig {
  /** Glob patterns for files to include */
  readonly include: readonly string[]
  /** Glob patterns for files to exclude */
  readonly exclude: readonly string[]
  /** Minimum severity level to report */
  readonly minSeverity: Severity
  /** Categories of issues to check (empty means all) */
  readonly categories: readonly IssueCategory[]
  /** Whether to enable caching */
  readonly cache: boolean
  /** Custom rules configuration */
  readonly rules: Readonly<Record<string, unknown>>
}

/**
 * Default analyzer configuration values.
 */
export const DEFAULT_ANALYZER_CONFIG: DefaultAnalyzerConfig = {
  include: DEFAULT_INCLUDE_PATTERNS,
  exclude: DEFAULT_EXCLUDE_PATTERNS,
  minSeverity: DEFAULT_MIN_SEVERITY,
  categories: DEFAULT_CATEGORIES,
  cache: true,
  rules: {},
}

/**
 * Default workspace analyzer options.
 */
export interface DefaultWorkspaceOptions {
  /** Glob patterns for package locations */
  readonly packagePatterns: readonly string[]
  /** Maximum parallel analysis operations */
  readonly concurrency: number
  /** Cache directory path */
  readonly cacheDir: string
  /** Maximum cache age in milliseconds */
  readonly maxCacheAge: number
  /** Hash algorithm for file content */
  readonly hashAlgorithm: 'sha256' | 'md5'
}

/**
 * Default workspace analyzer options values.
 */
export const DEFAULT_WORKSPACE_OPTIONS: DefaultWorkspaceOptions = {
  packagePatterns: DEFAULT_PACKAGE_PATTERNS,
  concurrency: DEFAULT_CONCURRENCY,
  cacheDir: DEFAULT_CACHE_DIR,
  maxCacheAge: DEFAULT_MAX_CACHE_AGE,
  hashAlgorithm: DEFAULT_HASH_ALGORITHM,
}

/**
 * Complete default configuration combining analyzer and workspace options.
 */
export interface DefaultConfig extends DefaultAnalyzerConfig, DefaultWorkspaceOptions {
  /** Configuration file path (optional) */
  readonly configPath?: string
}

/**
 * Get the complete default configuration.
 */
export function getDefaultConfig(): DefaultConfig {
  return {
    ...DEFAULT_ANALYZER_CONFIG,
    ...DEFAULT_WORKSPACE_OPTIONS,
    configPath: undefined,
  }
}

/**
 * Built-in analyzer IDs that are enabled by default.
 */
export const DEFAULT_ENABLED_ANALYZERS = [
  'package-json',
  'tsconfig',
  'eslint-config',
  'build-config',
  'config-consistency',
  'version-alignment',
  'exports-field',
  'unused-dependency',
  'circular-import',
  'peer-dependency',
  'duplicate-dependency',
  'architectural',
  'dead-code',
  'duplicate-code',
  'large-dependency',
  'tree-shaking-blocker',
] as const

/**
 * Built-in rule IDs that are enabled by default.
 */
export const DEFAULT_ENABLED_RULES = [
  'layer-violation',
  'barrel-export',
  'public-api',
  'side-effect',
  'package-boundary',
  'path-alias',
] as const
