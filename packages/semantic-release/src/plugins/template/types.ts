/**
 * TypeScript types for plugin template generation.
 */

/**
 * Plugin type determining which lifecycle hooks to implement.
 */
export type PluginType =
  | 'analyze' // Commit analysis plugins (analyzeCommits hook)
  | 'generate' // Release notes generation plugins (generateNotes hook)
  | 'prepare' // Preparation plugins (prepare hook)
  | 'publish' // Publishing plugins (publish hook)
  | 'success' // Success notification plugins (success hook)
  | 'fail' // Failure notification plugins (fail hook)
  | 'verify' // Verification plugins (verifyConditions, verifyRelease hooks)
  | 'complete' // Complete plugins with all lifecycle hooks

/**
 * Template configuration for plugin generation.
 */
export interface PluginTemplateConfig {
  /** Name of the plugin (without semantic-release- prefix) */
  name: string
  /** Plugin description */
  description: string
  /** Plugin author */
  author: string
  /** Plugin email */
  email?: string
  /** Plugin type determining lifecycle hooks */
  type: PluginType
  /** Custom lifecycle hooks to include (overrides type defaults) */
  customHooks?: PluginLifecycleHook[]
  /** Output directory for generated plugin */
  outputDir: string
  /** Package manager to use */
  packageManager: 'npm' | 'yarn' | 'pnpm'
  /** Include testing setup */
  includeTests: boolean
  /** Include documentation */
  includeDocs: boolean
  /** Include CI/CD setup */
  includeCI: boolean
  /** TypeScript configuration */
  typescript: boolean
  /** Plugin configuration interface name */
  configInterface?: string
  /** Additional dependencies to include */
  dependencies?: string[]
  /** Development dependencies to include */
  devDependencies?: string[]
}

/**
 * Semantic-release plugin lifecycle hooks.
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
 * Template file metadata.
 */
export interface TemplateFile {
  /** Source file path relative to template directory */
  sourcePath: string
  /** Target file path relative to output directory */
  targetPath: string
  /** Whether this file should be processed for template variables */
  processTemplate: boolean
  /** File encoding */
  encoding?: BufferEncoding
}

/**
 * Plugin template metadata.
 */
export interface PluginTemplate {
  /** Template name */
  name: string
  /** Template description */
  description: string
  /** Plugin type this template is for */
  pluginType: PluginType
  /** Template files to generate */
  files: TemplateFile[]
  /** Default lifecycle hooks for this template */
  defaultHooks: PluginLifecycleHook[]
  /** Required dependencies */
  dependencies: string[]
  /** Required development dependencies */
  devDependencies: string[]
  /** Template variables for processing */
  variables: Record<string, unknown>
}

/**
 * Plugin generation result.
 */
export interface PluginGenerationResult {
  /** Whether generation was successful */
  success: boolean
  /** Generated plugin path */
  pluginPath?: string
  /** Generated files */
  files?: string[]
  /** Error message if generation failed */
  error?: string
  /** Warning messages */
  warnings?: string[]
}

/**
 * Plugin template context for variable substitution.
 */
export interface PluginTemplateContext {
  /** Plugin configuration */
  plugin: {
    name: string
    description: string
    author: string
    email: string
    version: string
    packageName: string
    className: string
    configInterface: string
  }
  /** Project configuration */
  project: {
    packageManager: string
    typescript: boolean
    includeTests: boolean
    includeDocs: boolean
    includeCI: boolean
  }
  /** Lifecycle configuration */
  lifecycle: {
    hooks: PluginLifecycleHook[]
    type: PluginType
  }
  /** Dependencies */
  dependencies: {
    runtime: string[]
    development: string[]
  }
  /** Generation metadata */
  meta: {
    generatedAt: string
    generatorVersion: string
  }
}
