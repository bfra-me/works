/**
 * Zod schemas for configuration validation.
 *
 * Provides runtime validation for workspace analyzer configuration,
 * ensuring type safety and helpful error messages for invalid configs.
 */

import {z} from 'zod'

import {
  DEFAULT_ANALYZER_CONFIG,
  DEFAULT_CACHE_DIR,
  DEFAULT_CONCURRENCY,
  DEFAULT_MAX_CACHE_AGE,
  DEFAULT_PACKAGE_PATTERNS,
} from './defaults'

/**
 * Valid severity levels for issue filtering.
 */
export const severitySchema = z.enum(['info', 'warning', 'error', 'critical'])

/**
 * Valid issue categories for filtering.
 */
export const categorySchema = z.enum([
  'configuration',
  'dependency',
  'architecture',
  'performance',
  'circular-import',
  'unused-export',
  'type-safety',
])

/**
 * Schema for custom rule configuration.
 */
export const ruleConfigSchema = z
  .record(z.string(), z.unknown())
  .describe('Custom rule configuration keyed by rule ID')

/**
 * Schema for analyzer-specific options.
 */
export const analyzerOptionsSchema = z
  .object({
    enabled: z.boolean().optional().describe('Whether this analyzer is enabled'),
    severity: severitySchema.optional().describe('Override default severity'),
    options: z.record(z.string(), z.unknown()).optional().describe('Analyzer-specific options'),
  })
  .strict()

/**
 * Schema for layer configuration in architectural analysis.
 */
export const layerConfigSchema = z.object({
  name: z.string().describe('Layer name'),
  patterns: z.array(z.string()).describe('File path patterns matching this layer'),
  allowedImports: z.array(z.string()).describe('Layers this layer can import from'),
})

/**
 * Schema for architectural rules configuration.
 */
export const architecturalRulesSchema = z
  .object({
    layers: z
      .array(layerConfigSchema)
      .optional()
      .describe('Custom layer definitions for layer violation detection'),
    allowBarrelExports: z
      .union([z.boolean(), z.array(z.string())])
      .optional()
      .describe('Allow barrel exports (true/false or array of allowed paths)'),
    enforcePublicApi: z.boolean().optional().describe('Enforce explicit public API exports'),
  })
  .strict()

/**
 * Core analyzer configuration schema.
 */
export const analyzerConfigSchema = z
  .object({
    include: z
      .array(z.string())
      .optional()
      .default([...DEFAULT_ANALYZER_CONFIG.include])
      .describe('Glob patterns for files to include in analysis'),
    exclude: z
      .array(z.string())
      .optional()
      .default([...DEFAULT_ANALYZER_CONFIG.exclude])
      .describe('Glob patterns for files to exclude from analysis'),
    minSeverity: severitySchema
      .optional()
      .default(DEFAULT_ANALYZER_CONFIG.minSeverity)
      .describe('Minimum severity level to report'),
    categories: z
      .array(categorySchema)
      .optional()
      .default([])
      .describe('Categories of issues to check (empty means all)'),
    cache: z.boolean().optional().default(true).describe('Enable incremental analysis caching'),
    rules: ruleConfigSchema.optional().default({}).describe('Custom rules configuration'),
  })
  .strict()

/**
 * Workspace-specific options schema.
 */
export const workspaceOptionsSchema = z
  .object({
    packagePatterns: z
      .array(z.string())
      .optional()
      .default([...DEFAULT_PACKAGE_PATTERNS])
      .describe('Glob patterns for package locations'),
    concurrency: z
      .number()
      .int()
      .min(1)
      .max(16)
      .optional()
      .default(DEFAULT_CONCURRENCY)
      .describe('Maximum parallel analysis operations'),
    cacheDir: z
      .string()
      .optional()
      .default(DEFAULT_CACHE_DIR)
      .describe('Directory for analysis cache files'),
    maxCacheAge: z
      .number()
      .int()
      .min(0)
      .optional()
      .default(DEFAULT_MAX_CACHE_AGE)
      .describe('Maximum cache age in milliseconds'),
    hashAlgorithm: z
      .enum(['sha256', 'md5'])
      .optional()
      .default('sha256')
      .describe('Hash algorithm for file content'),
  })
  .strict()

/**
 * Per-analyzer configuration in the config file.
 */
export const analyzersConfigSchema = z
  .record(z.string(), analyzerOptionsSchema)
  .optional()
  .default({})
  .describe('Per-analyzer configuration overrides')

/**
 * Complete workspace analyzer configuration schema.
 */
export const workspaceAnalyzerConfigSchema = z
  .object({
    // Extend from core analyzer config
    ...analyzerConfigSchema.shape,
    // Add workspace-specific options
    ...workspaceOptionsSchema.shape,
    // Per-analyzer configuration
    analyzers: analyzersConfigSchema,
    // Architectural rules
    architecture: architecturalRulesSchema.optional().describe('Architectural analysis rules'),
  })
  .strict()

/**
 * Schema for the analyzeWorkspace() options parameter.
 */
export const analyzeWorkspaceOptionsSchema = z
  .object({
    // Include base config options
    ...analyzerConfigSchema.shape,
    // Include workspace options
    ...workspaceOptionsSchema.shape,
    // API-specific options
    configPath: z.string().optional().describe('Path to workspace-analyzer.config.ts file'),
    // onProgress is validated at runtime, not in schema (function types not well-supported in zod v4)
    analyzers: analyzersConfigSchema,
    architecture: architecturalRulesSchema.optional(),
  })
  .strict()

/**
 * Inferred types from schemas.
 */
export type SeverityInput = z.input<typeof severitySchema>
export type CategoryInput = z.input<typeof categorySchema>
export type AnalyzerConfigInput = z.input<typeof analyzerConfigSchema>
export type WorkspaceOptionsInput = z.input<typeof workspaceOptionsSchema>
export type WorkspaceAnalyzerConfigInput = z.input<typeof workspaceAnalyzerConfigSchema>
export type AnalyzeWorkspaceOptionsInput = z.input<typeof analyzeWorkspaceOptionsSchema>

export type SeverityOutput = z.output<typeof severitySchema>
export type CategoryOutput = z.output<typeof categorySchema>
export type AnalyzerConfigOutput = z.output<typeof analyzerConfigSchema>
export type WorkspaceOptionsOutput = z.output<typeof workspaceOptionsSchema>
export type WorkspaceAnalyzerConfigOutput = z.output<typeof workspaceAnalyzerConfigSchema>
export type AnalyzeWorkspaceOptionsOutput = z.output<typeof analyzeWorkspaceOptionsSchema>

/**
 * Validates and parses analyzer configuration.
 *
 * @param config - Raw configuration input
 * @returns Validated and defaulted configuration
 * @throws {z.ZodError} If validation fails
 */
export function parseAnalyzerConfig(config: unknown): AnalyzerConfigOutput {
  return analyzerConfigSchema.parse(config)
}

/**
 * Validates and parses workspace analyzer configuration.
 *
 * @param config - Raw configuration input
 * @returns Validated and defaulted configuration
 * @throws {z.ZodError} If validation fails
 */
export function parseWorkspaceAnalyzerConfig(config: unknown): WorkspaceAnalyzerConfigOutput {
  return workspaceAnalyzerConfigSchema.parse(config)
}

/**
 * Safe parse result type for configuration validation.
 */
export type SafeParseResult<T> = {success: true; data: T} | {success: false; error: z.ZodError}

/**
 * Safely validates configuration without throwing.
 *
 * @param config - Raw configuration input
 * @returns Validation result with success status and data/error
 */
export function safeParseWorkspaceAnalyzerConfig(
  config: unknown,
): SafeParseResult<WorkspaceAnalyzerConfigOutput> {
  const result = workspaceAnalyzerConfigSchema.safeParse(config)
  if (result.success) {
    return {success: true, data: result.data}
  }
  return {success: false, error: result.error}
}

/**
 * Validates analyzeWorkspace() options.
 *
 * @param options - Raw options input
 * @returns Validation result with success status and data/error
 */
export function safeParseAnalyzeOptions(
  options: unknown,
): SafeParseResult<AnalyzeWorkspaceOptionsOutput> {
  const result = analyzeWorkspaceOptionsSchema.safeParse(options)
  if (result.success) {
    return {success: true, data: result.data}
  }
  return {success: false, error: result.error}
}
