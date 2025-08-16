/**
 * Comprehensive type definitions for the @bfra.me/create CLI redesign
 */

// Template System Types
export interface TemplateSource {
  /** Template source type */
  type: 'github' | 'local' | 'url' | 'builtin'
  /** Source location (repo, path, URL, or builtin name) */
  location: string
  /** Branch or tag for GitHub repositories */
  ref?: string
  /** Subdirectory within the source */
  subdir?: string
}

export interface TemplateMetadata {
  /** Template name */
  name: string
  /** Template description */
  description: string
  /** Template version */
  version: string
  /** Template author */
  author?: string
  /** Template tags for categorization */
  tags?: string[]
  /** Required variables for template processing */
  variables?: TemplateVariable[]
  /** Template dependencies */
  dependencies?: string[]
  /** Minimum Node.js version required */
  nodeVersion?: string
}

export interface TemplateVariable {
  /** Variable name */
  name: string
  /** Variable description */
  description: string
  /** Variable type */
  type: 'string' | 'boolean' | 'number' | 'select'
  /** Default value */
  default?: unknown
  /** Required flag */
  required?: boolean
  /** Options for select type */
  options?: string[]
  /** Validation pattern for string type */
  pattern?: string
}

export interface TemplateContext {
  /** Project name */
  projectName: string
  /** Project description */
  description?: string
  /** Project author */
  author?: string
  /** Project version */
  version?: string
  /** Package manager */
  packageManager?: 'npm' | 'yarn' | 'pnpm' | 'bun'
  /** Additional variables */
  variables?: Record<string, unknown>
}

export interface ResolvedTemplate {
  /** Template metadata */
  metadata: TemplateMetadata
  /** Template source information */
  source: TemplateSource
  /** Local path to template files */
  path: string
  /** Template context for variable substitution */
  context: TemplateContext
}

// CLI and Command Types
export interface BaseCommandOptions {
  /** Working directory */
  cwd?: string
  /** Verbose output */
  verbose?: boolean
  /** Dry run mode */
  dryRun?: boolean
}

export interface CreateCommandOptions extends BaseCommandOptions {
  /** Project name */
  name?: string
  /** Template to use */
  template?: string
  /** Project description */
  description?: string
  /** Project author */
  author?: string
  /** Project version */
  version?: string
  /** Output directory */
  outputDir?: string
  /** Package manager */
  packageManager?: 'npm' | 'yarn' | 'pnpm' | 'bun'
  /** Skip prompts */
  skipPrompts?: boolean
  /** Force overwrite */
  force?: boolean
  /** Interactive mode */
  interactive?: boolean
}

export interface AddCommandOptions extends BaseCommandOptions {
  /** Feature to add */
  feature: string
  /** Feature options */
  options?: Record<string, unknown>
  /** Skip confirmation */
  skipConfirm?: boolean
}

// AI Integration Types
export interface AIProvider {
  /** Provider name */
  name: 'openai' | 'anthropic' | 'custom'
  /** API key */
  apiKey?: string
  /** API endpoint */
  endpoint?: string
  /** Model name */
  model?: string
}

export interface AIProjectAnalysis {
  /** Recommended template */
  recommendedTemplate?: string
  /** Suggested dependencies */
  dependencies?: string[]
  /** Configuration recommendations */
  configurations?: Record<string, unknown>
  /** Analysis confidence score */
  confidence?: number
}

export interface AICodeGeneration {
  /** Generated code */
  code: string
  /** Code language */
  language: string
  /** Generation context */
  context: string
  /** Quality score */
  quality?: number
}

// Project Detection Types
export interface ProjectInfo {
  /** Project type */
  type: 'typescript' | 'javascript' | 'react' | 'vue' | 'angular' | 'node' | 'unknown'
  /** Package manager detected */
  packageManager?: 'npm' | 'yarn' | 'pnpm' | 'bun'
  /** Framework detected */
  framework?: string
  /** Existing configurations */
  configurations?: string[]
  /** Dependencies */
  dependencies?: string[]
  /** Dev dependencies */
  devDependencies?: string[]
}

// File System Types
export interface FileSystemOptions {
  /** Base directory */
  baseDir: string
  /** Include patterns */
  include?: string[]
  /** Exclude patterns */
  exclude?: string[]
  /** Follow symlinks */
  followSymlinks?: boolean
}

export interface FileOperation {
  /** Operation type */
  type: 'create' | 'update' | 'delete' | 'copy' | 'move'
  /** Source path */
  source?: string
  /** Target path */
  target: string
  /** File content */
  content?: string
  /** Backup original */
  backup?: boolean
}

// Configuration Types
export interface CreateConfig {
  /** Default template */
  defaultTemplate?: string
  /** Template directories */
  templateDirs?: string[]
  /** AI configuration */
  ai?: {
    /** Enable AI features */
    enabled?: boolean
    /** AI provider configuration */
    provider?: AIProvider
  }
  /** Cache configuration */
  cache?: {
    /** Enable caching */
    enabled?: boolean
    /** Cache directory */
    dir?: string
    /** Cache TTL in seconds */
    ttl?: number
  }
}

// Legacy compatibility - will be removed in future versions
export interface CreatePackageOptions extends CreateCommandOptions {
  /** @deprecated Use name instead */
  template?: string
  /** @deprecated Use outputDir instead */
  outputDir?: string
}

// Result Types
export type Result<T, E = Error> = {success: true; data: T} | {success: false; error: E}

export interface ValidationResult {
  /** Validation passed */
  valid: boolean
  /** Validation errors */
  errors?: string[]
  /** Validation warnings */
  warnings?: string[]
}

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
