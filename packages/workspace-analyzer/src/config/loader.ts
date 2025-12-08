/**
 * Configuration file loader for workspace-analyzer.config.ts files.
 *
 * Provides functionality to discover, load, and parse TypeScript configuration files
 * using the defineConfig() pattern similar to other tools in the ecosystem.
 */

import type {Result} from '../types/result'
import type {WorkspaceAnalyzerConfigOutput} from './schema'

import fs from 'node:fs/promises'
import path from 'node:path'
import {pathToFileURL} from 'node:url'

import {err, ok} from '@bfra.me/es/result'

import {safeParseWorkspaceAnalyzerConfig} from './schema'

/**
 * Configuration file names to search for, in order of precedence.
 */
export const CONFIG_FILE_NAMES = [
  'workspace-analyzer.config.ts',
  'workspace-analyzer.config.js',
  'workspace-analyzer.config.mjs',
  'workspace-analyzer.config.mts',
] as const

/**
 * Error codes for configuration loading operations.
 */
export type ConfigLoadErrorCode =
  | 'FILE_NOT_FOUND'
  | 'IMPORT_ERROR'
  | 'VALIDATION_ERROR'
  | 'INVALID_EXPORT'

/**
 * Error that occurred during configuration loading.
 */
export interface ConfigLoadError {
  readonly code: ConfigLoadErrorCode
  readonly message: string
  readonly filePath?: string
  readonly cause?: unknown
}

/**
 * Result of loading a configuration file.
 */
export interface ConfigLoadResult {
  /** Loaded and validated configuration */
  readonly config: WorkspaceAnalyzerConfigOutput
  /** Path to the loaded configuration file */
  readonly filePath: string
}

/**
 * User-facing configuration interface for defineConfig().
 * Allows partial configuration that will be merged with defaults.
 */
export interface WorkspaceAnalyzerConfig {
  /** Glob patterns for files to include */
  include?: readonly string[]
  /** Glob patterns for files to exclude */
  exclude?: readonly string[]
  /** Minimum severity level to report */
  minSeverity?: 'info' | 'warning' | 'error' | 'critical'
  /** Categories of issues to check (empty means all) */
  categories?: readonly (
    | 'configuration'
    | 'dependency'
    | 'architecture'
    | 'performance'
    | 'circular-import'
    | 'unused-export'
    | 'type-safety'
  )[]
  /** Enable incremental analysis caching */
  cache?: boolean
  /** Custom rules configuration */
  rules?: Record<string, unknown>
  /** Glob patterns for package locations */
  packagePatterns?: readonly string[]
  /** Maximum parallel analysis operations */
  concurrency?: number
  /** Directory for analysis cache files */
  cacheDir?: string
  /** Maximum cache age in milliseconds */
  maxCacheAge?: number
  /** Hash algorithm for file content */
  hashAlgorithm?: 'sha256' | 'md5'
  /** Per-analyzer configuration */
  analyzers?: Record<
    string,
    {
      enabled?: boolean
      severity?: 'info' | 'warning' | 'error' | 'critical'
      options?: Record<string, unknown>
    }
  >
  /** Architectural analysis rules */
  architecture?: {
    layers?: {
      name: string
      patterns: string[]
      allowedImports: string[]
    }[]
    allowBarrelExports?: boolean | string[]
    enforcePublicApi?: boolean
  }
}

/**
 * Helper function for defining configuration with type safety.
 *
 * @example
 * ```ts
 * // workspace-analyzer.config.ts
 * import {defineConfig} from '@bfra.me/workspace-analyzer'
 *
 * export default defineConfig({
 *   minSeverity: 'warning',
 *   categories: ['dependency', 'architecture'],
 *   analyzers: {
 *     'circular-import': {enabled: true},
 *     'unused-dependency': {enabled: true},
 *   },
 * })
 * ```
 */
export function defineConfig(config: WorkspaceAnalyzerConfig): WorkspaceAnalyzerConfig {
  return config
}

/**
 * Finds a configuration file in the given directory or its parents.
 *
 * @param startDir - Directory to start searching from
 * @param stopAt - Directory to stop searching at (defaults to filesystem root)
 * @returns Path to the found configuration file, or undefined if not found
 */
export async function findConfigFile(
  startDir: string,
  stopAt?: string,
): Promise<string | undefined> {
  let currentDir = path.resolve(startDir)
  const root = stopAt == null ? path.parse(currentDir).root : path.resolve(stopAt)

  while (currentDir !== root && currentDir !== path.dirname(currentDir)) {
    for (const fileName of CONFIG_FILE_NAMES) {
      const filePath = path.join(currentDir, fileName)
      try {
        await fs.access(filePath)
        return filePath
      } catch {
        // File doesn't exist, continue searching
      }
    }
    currentDir = path.dirname(currentDir)
  }

  // Check the root directory as well
  for (const fileName of CONFIG_FILE_NAMES) {
    const filePath = path.join(root, fileName)
    try {
      await fs.access(filePath)
      return filePath
    } catch {
      // File doesn't exist
    }
  }

  return undefined
}

/**
 * Loads and validates a configuration file.
 *
 * @param filePath - Path to the configuration file
 * @returns Result containing the loaded config or an error
 */
export async function loadConfigFile(
  filePath: string,
): Promise<Result<ConfigLoadResult, ConfigLoadError>> {
  const absolutePath = path.resolve(filePath)

  // Verify file exists
  try {
    await fs.access(absolutePath)
  } catch {
    return err({
      code: 'FILE_NOT_FOUND',
      message: `Configuration file not found: ${absolutePath}`,
      filePath: absolutePath,
    })
  }

  // Import the module
  let module: unknown
  try {
    const fileUrl = pathToFileURL(absolutePath).href
    module = await import(fileUrl)
  } catch (error) {
    return err({
      code: 'IMPORT_ERROR',
      message: `Failed to import configuration file: ${(error as Error).message}`,
      filePath: absolutePath,
      cause: error,
    })
  }

  // Extract the default export
  const moduleObj = module as Record<string, unknown>
  const rawConfig = moduleObj.default ?? module

  if (rawConfig == null || typeof rawConfig !== 'object') {
    return err({
      code: 'INVALID_EXPORT',
      message: 'Configuration file must export an object as default export',
      filePath: absolutePath,
    })
  }

  // Validate the configuration
  const parseResult = safeParseWorkspaceAnalyzerConfig(rawConfig)

  if (!parseResult.success) {
    const issues = parseResult.error.issues
      .map(issue => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n')
    return err({
      code: 'VALIDATION_ERROR',
      message: `Invalid configuration:\n${issues}`,
      filePath: absolutePath,
      cause: parseResult.error,
    })
  }

  return ok({
    config: parseResult.data,
    filePath: absolutePath,
  })
}

/**
 * Discovers and loads configuration from the workspace.
 *
 * @param workspacePath - Root path of the workspace
 * @param explicitPath - Optional explicit path to config file
 * @returns Result containing the loaded config or an error
 */
export async function loadConfig(
  workspacePath: string,
  explicitPath?: string,
): Promise<Result<ConfigLoadResult | undefined, ConfigLoadError>> {
  // Use explicit path if provided
  if (explicitPath != null) {
    return loadConfigFile(explicitPath)
  }

  // Search for config file
  const configPath = await findConfigFile(workspacePath)

  if (configPath == null) {
    return ok(undefined)
  }

  return loadConfigFile(configPath)
}
