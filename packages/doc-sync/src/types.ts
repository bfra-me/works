/**
 * @bfra.me/doc-sync/types - Core type definitions for documentation synchronization
 */

import type {Result} from '@bfra.me/es/result'
import type {z} from 'zod'

/**
 * Metadata extracted from a package.json file
 */
export interface PackageInfo {
  /** Package name from package.json */
  readonly name: string
  /** Package version from package.json */
  readonly version: string
  /** Package description from package.json */
  readonly description?: string
  /** Keywords for categorization */
  readonly keywords?: readonly string[]
  /** Path to the package directory */
  readonly packagePath: string
  /** Path to the package's source directory */
  readonly srcPath: string
  /** Path to the package's README file if it exists */
  readonly readmePath?: string
  /** Custom documentation config from package.json "docs" field */
  readonly docsConfig?: DocConfigSource
}

/**
 * Source configuration for documentation, from package.json or docs.config.json
 */
export interface DocConfigSource {
  /** Custom title override for the documentation page */
  readonly title?: string
  /** Custom description override */
  readonly description?: string
  /** Sidebar configuration */
  readonly sidebar?: {
    /** Label shown in sidebar navigation */
    readonly label?: string
    /** Sort order in sidebar */
    readonly order?: number
    /** Whether to hide from sidebar */
    readonly hidden?: boolean
  }
  /** Sections to exclude from auto-generation */
  readonly excludeSections?: readonly string[]
  /** Custom frontmatter fields to include */
  readonly frontmatter?: Record<string, unknown>
}

/**
 * Configuration for documentation generation
 */
export interface DocConfig {
  /** Root directory of the monorepo */
  readonly rootDir: string
  /** Output directory for generated documentation */
  readonly outputDir: string
  /** Glob patterns for packages to include */
  readonly includePatterns: readonly string[]
  /** Glob patterns for packages to exclude */
  readonly excludePatterns?: readonly string[]
  /** Whether to watch for changes */
  readonly watch?: boolean
  /** Debounce delay in milliseconds for watch mode */
  readonly debounceMs?: number
}

/**
 * Error types for parse operations
 */
export type ParseErrorCode =
  | 'INVALID_SYNTAX'
  | 'FILE_NOT_FOUND'
  | 'READ_ERROR'
  | 'MALFORMED_JSON'
  | 'UNSUPPORTED_FORMAT'

/**
 * Structured error for parse operations
 */
export interface ParseError {
  /** Error classification code */
  readonly code: ParseErrorCode
  /** Human-readable error message */
  readonly message: string
  /** File path that caused the error */
  readonly filePath?: string
  /** Line number where error occurred (1-indexed) */
  readonly line?: number
  /** Column number where error occurred (1-indexed) */
  readonly column?: number
  /** Original error if wrapping */
  readonly cause?: unknown
}

/**
 * Result type for parse operations
 */
export type ParseResult<T> = Result<T, ParseError>

/**
 * Error types for sync operations
 */
export type SyncErrorCode =
  | 'WRITE_ERROR'
  | 'VALIDATION_ERROR'
  | 'GENERATION_ERROR'
  | 'PACKAGE_NOT_FOUND'
  | 'CONFIG_ERROR'

/**
 * Structured error for sync operations
 */
export interface SyncError {
  /** Error classification code */
  readonly code: SyncErrorCode
  /** Human-readable error message */
  readonly message: string
  /** Package name that caused the error */
  readonly packageName?: string
  /** File path that caused the error */
  readonly filePath?: string
  /** Original error if wrapping */
  readonly cause?: unknown
}

/**
 * Result type for sync operations
 */
export type SyncResult<T> = Result<T, SyncError>

/**
 * Information about a single sync operation
 */
export interface SyncInfo {
  /** Package name that was synced */
  readonly packageName: string
  /** Output file path */
  readonly outputPath: string
  /** Whether the file was created or updated */
  readonly action: 'created' | 'updated' | 'unchanged'
  /** Timestamp of the sync operation */
  readonly timestamp: Date
}

/**
 * Summary of a complete sync run
 */
export interface SyncSummary {
  /** Total number of packages processed */
  readonly totalPackages: number
  /** Number of successful syncs */
  readonly successCount: number
  /** Number of failed syncs */
  readonly failureCount: number
  /** Number of unchanged packages */
  readonly unchangedCount: number
  /** Details of each sync operation */
  readonly details: readonly SyncInfo[]
  /** Errors encountered during sync */
  readonly errors: readonly SyncError[]
  /** Duration of the sync run in milliseconds */
  readonly durationMs: number
}

/**
 * Extracted JSDoc information
 */
export interface JSDocInfo {
  /** Main description from JSDoc */
  readonly description?: string
  /** @param tags with name and description */
  readonly params?: readonly JSDocParam[]
  /** @returns description */
  readonly returns?: string
  /** @example code blocks */
  readonly examples?: readonly string[]
  /** @deprecated message if present */
  readonly deprecated?: string
  /** @since version if present */
  readonly since?: string
  /** @see references */
  readonly see?: readonly string[]
  /** Custom tags not in standard set */
  readonly customTags?: readonly JSDocTag[]
}

/**
 * A single JSDoc @param entry
 */
export interface JSDocParam {
  /** Parameter name */
  readonly name: string
  /** Parameter type (from JSDoc or inferred) */
  readonly type?: string
  /** Parameter description */
  readonly description?: string
  /** Whether the parameter is optional */
  readonly optional?: boolean
  /** Default value if specified */
  readonly defaultValue?: string
}

/**
 * A custom JSDoc tag
 */
export interface JSDocTag {
  /** Tag name without @ symbol */
  readonly name: string
  /** Tag value/content */
  readonly value?: string
}

/**
 * Information about an exported function
 */
export interface ExportedFunction {
  /** Function name */
  readonly name: string
  /** JSDoc documentation */
  readonly jsdoc?: JSDocInfo
  /** Function signature as string */
  readonly signature: string
  /** Whether it's async */
  readonly isAsync: boolean
  /** Whether it's a generator */
  readonly isGenerator: boolean
  /** Parameter information */
  readonly parameters: readonly FunctionParameter[]
  /** Return type as string */
  readonly returnType: string
  /** Whether it's the default export */
  readonly isDefault: boolean
}

/**
 * Function parameter information
 */
export interface FunctionParameter {
  /** Parameter name */
  readonly name: string
  /** TypeScript type */
  readonly type: string
  /** Whether optional */
  readonly optional: boolean
  /** Default value if provided */
  readonly defaultValue?: string
}

/**
 * Information about an exported type or interface
 */
export interface ExportedType {
  /** Type name */
  readonly name: string
  /** JSDoc documentation */
  readonly jsdoc?: JSDocInfo
  /** Full type definition as string */
  readonly definition: string
  /** Kind of type declaration */
  readonly kind: 'interface' | 'type' | 'enum' | 'class'
  /** Whether it's the default export */
  readonly isDefault: boolean
  /** Type parameters (generics) */
  readonly typeParameters?: readonly string[]
}

/**
 * Complete API surface extracted from a package
 */
export interface PackageAPI {
  /** Exported functions */
  readonly functions: readonly ExportedFunction[]
  /** Exported types/interfaces */
  readonly types: readonly ExportedType[]
  /** Re-exported modules */
  readonly reExports: readonly ReExport[]
}

/**
 * Information about a re-export statement
 */
export interface ReExport {
  /** Module path being re-exported from */
  readonly from: string
  /** Named exports being re-exported, or '*' for all */
  readonly exports: readonly string[] | '*'
  /** Alias if renamed during re-export */
  readonly alias?: string
}

/**
 * Parsed README content with sections
 */
export interface ReadmeContent {
  /** Main title (first H1) */
  readonly title?: string
  /** Content before first heading */
  readonly preamble?: string
  /** Structured sections by heading */
  readonly sections: readonly ReadmeSection[]
  /** Raw markdown content */
  readonly raw: string
}

/**
 * A section in the README
 */
export interface ReadmeSection {
  /** Section heading text */
  readonly heading: string
  /** Heading level (1-6) */
  readonly level: number
  /** Section content (markdown) */
  readonly content: string
  /** Nested subsections */
  readonly children: readonly ReadmeSection[]
}

/**
 * MDX frontmatter for Starlight
 */
export interface MDXFrontmatter {
  /** Page title */
  readonly title: string
  /** Page description for SEO */
  readonly description?: string
  /** Sidebar configuration */
  readonly sidebar?: {
    readonly label?: string
    readonly order?: number
    readonly hidden?: boolean
    readonly badge?:
      | string
      | {
          readonly text: string
          readonly variant?: 'note' | 'tip' | 'caution' | 'danger' | 'success' | 'default'
        }
  }
  /** Table of contents configuration */
  readonly tableOfContents?:
    | boolean
    | {
        readonly minHeadingLevel?: number
        readonly maxHeadingLevel?: number
      }
  /** Template to use */
  readonly template?: 'doc' | 'splash'
  /** Hero configuration for splash template */
  readonly hero?: {
    readonly title?: string
    readonly tagline?: string
    readonly image?: {readonly src: string; readonly alt: string}
    readonly actions?: readonly {
      readonly text: string
      readonly link: string
      readonly icon?: string
      readonly variant?: 'primary' | 'secondary' | 'minimal'
    }[]
  }
}

/**
 * Generated MDX document
 */
export interface MDXDocument {
  /** Frontmatter configuration */
  readonly frontmatter: MDXFrontmatter
  /** Document body content */
  readonly content: string
  /** Full rendered document */
  readonly rendered: string
}

/**
 * Sentinel markers for content preservation
 */
export const SENTINEL_MARKERS = {
  AUTO_START: '{/* AUTO-GENERATED-START */}',
  AUTO_END: '{/* AUTO-GENERATED-END */}',
  MANUAL_START: '{/* MANUAL-CONTENT-START */}',
  MANUAL_END: '{/* MANUAL-CONTENT-END */}',
} as const

/**
 * File change event from watcher
 */
export interface FileChangeEvent {
  /** Type of change */
  readonly type: 'add' | 'change' | 'unlink'
  /** Absolute path to the changed file */
  readonly path: string
  /** Package name if determinable */
  readonly packageName?: string
  /** Timestamp of the change */
  readonly timestamp: Date
}

/**
 * Options for the CLI
 */
export interface CLIOptions {
  /** Root directory to operate from */
  readonly root?: string
  /** Specific packages to sync */
  readonly packages?: readonly string[]
  /** Run in watch mode */
  readonly watch?: boolean
  /** Dry run without writing files */
  readonly dryRun?: boolean
  /** Verbose logging */
  readonly verbose?: boolean
  /** Quiet mode (minimal output) */
  readonly quiet?: boolean
}

/**
 * Zod schema type helper for runtime validation
 */
export type InferSchema<T extends z.ZodTypeAny> = z.infer<T>
