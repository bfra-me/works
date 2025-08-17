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
  /** Template git reference (branch/tag) */
  templateRef?: string
  /** Template subdirectory */
  templateSubdir?: string
  /** Comma-separated features list */
  features?: string
  /** Skip git initialization */
  git?: boolean
  /** Skip dependency installation */
  install?: boolean
  /** Configuration preset */
  preset?: 'minimal' | 'standard' | 'full'
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

// Interactive Prompts Types
export interface ProjectSetupResult {
  /** Final project name */
  projectName: string
  /** Selected template */
  template: TemplateSelection
  /** Final command options */
  options: CreateCommandOptions
  /** Customization results */
  customization: ProjectCustomization
}

export interface TemplateSelection {
  /** Template type */
  type: 'github' | 'local' | 'url' | 'builtin'
  /** Template location */
  location: string
  /** Template metadata */
  metadata: TemplateMetadata
  /** Template branch/ref */
  ref?: string
  /** Template subdirectory */
  subdir?: string
}

export interface ProjectCustomization {
  /** Project description */
  description?: string
  /** Project author */
  author?: string
  /** Project version */
  version?: string
  /** Package manager choice */
  packageManager?: 'npm' | 'yarn' | 'pnpm' | 'bun'
  /** Output directory */
  outputDir?: string
  /** Selected features */
  features: string[]
  /** Custom variables */
  variables?: Record<string, unknown>
}

export interface ConfirmationSummary {
  /** Project name */
  projectName: string
  /** Template information */
  template: TemplateSelection
  /** Customization details */
  customization: ProjectCustomization
}

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

// AI-Powered Features Types
export interface AIConfig {
  /** Whether AI features are enabled */
  enabled: boolean
  /** OpenAI API configuration */
  openai?: {
    apiKey?: string
    model?: string
    baseURL?: string
  }
  /** Anthropic API configuration */
  anthropic?: {
    apiKey?: string
    model?: string
    baseURL?: string
  }
  /** Preferred LLM provider */
  provider?: 'openai' | 'anthropic' | 'auto'
  /** Maximum tokens for AI responses */
  maxTokens?: number
  /** Temperature for AI responses (0-1) */
  temperature?: number
}

export interface LLMProvider {
  /** Provider name */
  name: 'openai' | 'anthropic'
  /** Whether the provider is available */
  available: boolean
  /** Initialize the provider */
  initialize: (config: AIConfig) => Promise<void>
  /** Generate text completion */
  complete: (prompt: string, options?: LLMOptions) => Promise<LLMResponse>
  /** Check if the provider is healthy */
  healthCheck: () => Promise<boolean>
}

export interface LLMOptions {
  /** Maximum tokens for the response */
  maxTokens?: number
  /** Temperature for response randomness (0-1) */
  temperature?: number
  /** System prompt to guide the model */
  systemPrompt?: string
  /** Additional context for the model */
  context?: string
}

export interface LLMResponse {
  /** Whether the request was successful */
  success: boolean
  /** Generated text content */
  content: string
  /** Error message if request failed */
  error?: string
  /** Usage statistics */
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  /** Response metadata */
  metadata?: Record<string, unknown>
}

export interface ProjectAnalysis {
  /** Detected project type */
  projectType: 'library' | 'cli' | 'web-app' | 'api' | 'config' | 'other'
  /** Confidence score (0-1) */
  confidence: number
  /** Project description summary */
  description: string
  /** Recommended features */
  features: string[]
  /** Suggested dependencies */
  dependencies: DependencyRecommendation[]
  /** Technology stack recommendations */
  techStack: TechStackRecommendation[]
  /** Template recommendations */
  templates: TemplateRecommendation[]
}

export interface DependencyRecommendation {
  /** Package name */
  name: string
  /** Package description */
  description: string
  /** Reason for recommendation */
  reason: string
  /** Confidence score (0-1) */
  confidence: number
  /** Whether it's a dev dependency */
  isDev: boolean
  /** Suggested version range */
  version?: string
  /** Installation command */
  installCommand?: string
}

export interface TechStackRecommendation {
  /** Technology name */
  name: string
  /** Technology category */
  category: 'runtime' | 'framework' | 'build-tool' | 'testing' | 'linting' | 'other'
  /** Recommendation reason */
  reason: string
  /** Confidence score (0-1) */
  confidence: number
  /** Configuration suggestions */
  config?: Record<string, unknown>
}

export interface TemplateRecommendation {
  /** Template source */
  source: TemplateSource
  /** Recommendation reason */
  reason: string
  /** Confidence score (0-1) */
  confidence: number
  /** Match score based on requirements */
  matchScore: number
}

export interface CodeGenerationRequest {
  /** Type of code to generate */
  type: 'component' | 'function' | 'class' | 'test' | 'config' | 'documentation'
  /** Context description */
  description: string
  /** Target language/framework */
  language: string
  /** Additional context */
  context?: {
    projectType?: string
    existingCode?: string
    requirements?: string[]
    style?: 'functional' | 'class-based' | 'mixed'
  }
}

export interface CodeGenerationResult {
  /** Whether generation was successful */
  success: boolean
  /** Generated code */
  code: string
  /** Generated file path suggestion */
  suggestedPath?: string
  /** Additional files to create */
  additionalFiles?: {
    path: string
    content: string
    description: string
  }[]
  /** Explanation of the generated code */
  explanation?: string
  /** Suggestions for next steps */
  nextSteps?: string[]
  /** Error message if generation failed */
  error?: string
}

export interface ConfigOptimizationSuggestion {
  /** Configuration file type */
  type: 'eslint' | 'typescript' | 'prettier' | 'vitest' | 'package.json' | 'other'
  /** Current configuration */
  current: Record<string, unknown>
  /** Suggested configuration */
  suggested: Record<string, unknown>
  /** Reason for the suggestion */
  reason: string
  /** Confidence score (0-1) */
  confidence: number
  /** Impact level */
  impact: 'low' | 'medium' | 'high'
  /** Whether it's a breaking change */
  breaking: boolean
}

export interface DocumentationGenerationRequest {
  /** Project information */
  project: {
    name: string
    description?: string
    type: string
    features?: string[]
  }
  /** Existing files to analyze */
  files?: {
    path: string
    content: string
    language: string
  }[]
  /** Documentation type to generate */
  type: 'readme' | 'api' | 'guide' | 'changelog' | 'contributing'
  /** Documentation style */
  style?: 'technical' | 'user-friendly' | 'comprehensive' | 'minimal'
}

export interface DocumentationGenerationResult {
  /** Whether generation was successful */
  success: boolean
  /** Generated documentation content */
  content: string
  /** Suggested file path */
  path: string
  /** Additional sections suggested */
  additionalSections?: {
    title: string
    content: string
    priority: number
  }[]
  /** Error message if generation failed */
  error?: string
}

export interface AIAssistantMessage {
  /** Message role */
  role: 'user' | 'assistant' | 'system'
  /** Message content */
  content: string
  /** Message timestamp */
  timestamp: Date
  /** Message context */
  context?: {
    step?: string
    suggestions?: string[]
    actions?: string[]
  }
}

export interface AIAssistSession {
  /** Session ID */
  id: string
  /** Session messages */
  messages: AIAssistantMessage[]
  /** Current project context */
  projectContext: {
    name?: string
    description?: string
    type?: string
    currentStep?: string
  }
  /** Session configuration */
  config: AIConfig
  /** Session start time */
  startTime: Date
  /** Whether session is active */
  active: boolean
}

export interface AIFallbackStrategy {
  /** Strategy name */
  name: string
  /** Whether this strategy is available */
  available: boolean
  /** Execute the fallback strategy */
  execute: (context: unknown) => Promise<unknown>
  /** Description of what this strategy provides */
  description: string
}

// Feature System Types
export interface FeatureInfo {
  /** Feature name */
  name: string
  /** Feature description */
  description: string
  /** Category of the feature */
  category: 'linting' | 'testing' | 'build' | 'documentation' | 'component' | 'configuration'
  /** Dependencies required for this feature */
  dependencies?: string[]
  /** Dev dependencies required for this feature */
  devDependencies?: string[]
  /** Supported frameworks */
  supportedFrameworks?: string[]
  /** Files that will be created/modified */
  files?: string[]
  /** Configuration options */
  options?: FeatureOption[]
  /** Next steps to show after installation */
  nextSteps?: string[]
}

export interface FeatureOption {
  /** Option name */
  name: string
  /** Option description */
  description: string
  /** Option type */
  type: 'string' | 'boolean' | 'number' | 'select'
  /** Default value */
  default?: unknown
  /** Required flag */
  required?: boolean
  /** Options for select type */
  choices?: string[]
}

export interface FeatureAddContext {
  /** Target directory */
  targetDir: string
  /** Project information */
  projectInfo: ProjectInfo
  /** Verbose output */
  verbose?: boolean
  /** Dry run mode */
  dryRun?: boolean
  /** Feature-specific options */
  options?: Record<string, unknown>
}

export interface ConflictInfo {
  /** Conflict type */
  type: 'file' | 'dependency' | 'configuration'
  /** Description of the conflict */
  description: string
  /** Existing file/config path */
  existing?: string
  /** Proposed new file/config path */
  proposed?: string
  /** Severity level */
  severity: 'low' | 'medium' | 'high'
}

export interface BackupInfo {
  /** Backup ID */
  id: string
  /** Backup timestamp */
  timestamp: Date
  /** Feature that triggered the backup */
  feature: string
  /** Files that were backed up */
  files: string[]
  /** Backup directory */
  backupDir: string
}
