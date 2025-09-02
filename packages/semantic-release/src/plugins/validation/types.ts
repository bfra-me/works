/**
 * TypeScript types for plugin validation and compatibility checking.
 */

/**
 * Plugin lifecycle hooks available in semantic-release.
 */
export type PluginLifecycleHook =
  | 'verifyConditions'
  | 'analyzeCommits'
  | 'verifyRelease'
  | 'generateNotes'
  | 'prepare'
  | 'publish'
  | 'success'
  | 'fail'

/**
 * Plugin validation result.
 */
export interface PluginValidationResult {
  /** Whether validation passed */
  valid: boolean
  /** Error message if validation failed */
  error?: string
  /** Warning messages */
  warnings?: string[]
  /** Validation details */
  details?: ValidationDetail[]
}

/**
 * Validation detail for specific check.
 */
export interface ValidationDetail {
  /** Check identifier */
  check: string
  /** Check status */
  status: 'pass' | 'warn' | 'fail'
  /** Check message */
  message: string
  /** Additional context */
  context?: Record<string, unknown>
}

/**
 * Plugin configuration validation options.
 */
export interface ConfigValidationOptions {
  /** Strict mode for validation */
  strict?: boolean
  /** Allow unknown properties */
  allowUnknown?: boolean
  /** Schema to validate against */
  schema?: Record<string, unknown>
  /** Custom validation rules */
  customRules?: ValidationRule[]
}

/**
 * Custom validation rule.
 */
export interface ValidationRule {
  /** Rule name */
  name: string
  /** Rule description */
  description: string
  /** Validation function */
  validate: (config: unknown) => ValidationRuleResult
}

/**
 * Validation rule result.
 */
export interface ValidationRuleResult {
  /** Whether rule passed */
  valid: boolean
  /** Error message if rule failed */
  message?: string
  /** Warning message */
  warning?: string
}

/**
 * Plugin compatibility check result.
 */
export interface CompatibilityResult {
  /** Whether plugin is compatible */
  compatible: boolean
  /** Compatibility level */
  level: 'full' | 'partial' | 'none'
  /** Compatibility issues */
  issues?: CompatibilityIssue[]
  /** Recommendations for fixing issues */
  recommendations?: string[]
}

/**
 * Compatibility issue.
 */
export interface CompatibilityIssue {
  /** Issue type */
  type: 'version' | 'hook' | 'config' | 'dependency' | 'runtime'
  /** Issue severity */
  severity: 'error' | 'warning' | 'info'
  /** Issue description */
  description: string
  /** Expected value */
  expected?: string
  /** Actual value */
  actual?: string
  /** Fix suggestion */
  fix?: string
}

/**
 * Plugin runtime validation options.
 */
export interface RuntimeValidationOptions {
  /** Check hook implementations */
  validateHooks?: boolean
  /** Check configuration schema */
  validateConfig?: boolean
  /** Check compatibility */
  validateCompatibility?: boolean
  /** Check dependencies */
  validateDependencies?: boolean
  /** Semantic-release version to check against */
  semanticReleaseVersion?: string
}

/**
 * Plugin metadata for validation.
 */
export interface PluginMetadata {
  /** Plugin name */
  name: string
  /** Plugin version */
  version: string
  /** Supported semantic-release versions */
  semanticReleaseVersions: string[]
  /** Implemented lifecycle hooks */
  hooks: PluginLifecycleHook[]
  /** Configuration schema */
  configSchema?: Record<string, unknown>
  /** Plugin dependencies */
  dependencies?: Record<string, string>
  /** Peer dependencies */
  peerDependencies?: Record<string, string>
}

/**
 * Plugin implementation to validate.
 */
export interface PluginImplementation {
  /** Plugin metadata */
  metadata: PluginMetadata
  /** Plugin exports/functions */
  exports: Record<string, unknown>
  /** Plugin configuration */
  config?: unknown
}

/**
 * Validation context for plugins.
 */
export interface ValidationContext {
  /** Semantic-release version being used */
  semanticReleaseVersion: string
  /** Available plugins in the configuration */
  availablePlugins: string[]
  /** Plugin configuration */
  pluginConfig: unknown
  /** Environment variables */
  env: Record<string, string | undefined>
}

/**
 * Schema validation result.
 */
export interface SchemaValidationResult {
  /** Whether schema validation passed */
  valid: boolean
  /** Schema validation errors */
  errors?: SchemaValidationError[]
  /** Transformed/coerced value */
  value?: unknown
}

/**
 * Schema validation error.
 */
export interface SchemaValidationError {
  /** Error path in the object */
  path: string
  /** Error message */
  message: string
  /** Expected type or value */
  expected?: string
  /** Actual value */
  actual?: unknown
}
