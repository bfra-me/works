/**
 * Configuration file parser for package.json, tsconfig.json, and other config files.
 *
 * Provides utilities for parsing and extracting information from various
 * configuration files used in TypeScript/JavaScript projects.
 */

import type {Result} from '../types/result'

import fs from 'node:fs/promises'
import path from 'node:path'

import {err, ok} from '@bfra.me/es/result'

/**
 * Error codes for configuration parsing.
 */
export type ConfigErrorCode = 'FILE_NOT_FOUND' | 'INVALID_JSON' | 'INVALID_CONFIG' | 'READ_ERROR'

/**
 * Error that occurred during configuration parsing.
 */
export interface ConfigError {
  /** Error code for programmatic handling */
  readonly code: ConfigErrorCode
  /** Human-readable error message */
  readonly message: string
  /** Path to the config file */
  readonly filePath: string
  /** Underlying cause */
  readonly cause?: unknown
}

/**
 * Parsed package.json structure with relevant fields for analysis.
 */
export interface ParsedPackageJson {
  /** Package name */
  readonly name: string
  /** Package version */
  readonly version: string
  /** Package description */
  readonly description?: string
  /** Main entry point */
  readonly main?: string
  /** Module entry point (ESM) */
  readonly module?: string
  /** Types entry point */
  readonly types?: string
  /** Exports map */
  readonly exports?: Record<string, unknown>
  /** Dependencies */
  readonly dependencies?: Readonly<Record<string, string>>
  /** Development dependencies */
  readonly devDependencies?: Readonly<Record<string, string>>
  /** Peer dependencies */
  readonly peerDependencies?: Readonly<Record<string, string>>
  /** Optional dependencies */
  readonly optionalDependencies?: Readonly<Record<string, string>>
  /** Package type (module or commonjs) */
  readonly type?: 'module' | 'commonjs'
  /** Scripts */
  readonly scripts?: Readonly<Record<string, string>>
  /** Files to include in package */
  readonly files?: readonly string[]
  /** Raw package.json data */
  readonly raw: Readonly<Record<string, unknown>>
}

/**
 * Parsed tsconfig.json structure with relevant fields for analysis.
 */
export interface ParsedTsConfig {
  /** Extends from another config */
  readonly extends?: string | readonly string[]
  /** Compiler options */
  readonly compilerOptions?: TsCompilerOptions
  /** Include patterns */
  readonly include?: readonly string[]
  /** Exclude patterns */
  readonly exclude?: readonly string[]
  /** Project references */
  readonly references?: readonly TsProjectReference[]
  /** File path of the config */
  readonly filePath: string
  /** Raw tsconfig data */
  readonly raw: Readonly<Record<string, unknown>>
}

/**
 * TypeScript compiler options subset relevant for analysis.
 */
export interface TsCompilerOptions {
  /** Target ECMAScript version */
  readonly target?: string
  /** Module system */
  readonly module?: string
  /** Module resolution strategy */
  readonly moduleResolution?: string
  /** Path mappings */
  readonly paths?: Readonly<Record<string, readonly string[]>>
  /** Base URL for path resolution */
  readonly baseUrl?: string
  /** Root directory */
  readonly rootDir?: string
  /** Output directory */
  readonly outDir?: string
  /** Strict mode */
  readonly strict?: boolean
  /** Declaration files */
  readonly declaration?: boolean
  /** Source maps */
  readonly sourceMap?: boolean
  /** ESM interop */
  readonly esModuleInterop?: boolean
  /** Allow synthetic default imports */
  readonly allowSyntheticDefaultImports?: boolean
  /** Skip library check */
  readonly skipLibCheck?: boolean
  /** Resolve JSON modules */
  readonly resolveJsonModule?: boolean
  /** Isolated modules */
  readonly isolatedModules?: boolean
}

/**
 * TypeScript project reference.
 */
export interface TsProjectReference {
  /** Path to referenced project */
  readonly path: string
}

/**
 * Parses a package.json file.
 *
 * @example
 * ```ts
 * const result = await parsePackageJson('/path/to/package.json')
 * if (result.success) {
 *   console.log(`Package: ${result.data.name}@${result.data.version}`)
 * }
 * ```
 */
export async function parsePackageJson(
  packageJsonPath: string,
): Promise<Result<ParsedPackageJson, ConfigError>> {
  const normalizedPath = packageJsonPath.endsWith('package.json')
    ? packageJsonPath
    : path.join(packageJsonPath, 'package.json')

  let content: string
  try {
    content = await fs.readFile(normalizedPath, 'utf-8')
  } catch (error) {
    if (isNodeError(error) && error.code === 'ENOENT') {
      return err({
        code: 'FILE_NOT_FOUND',
        message: `package.json not found: ${normalizedPath}`,
        filePath: normalizedPath,
        cause: error,
      })
    }
    return err({
      code: 'READ_ERROR',
      message: `Failed to read package.json: ${normalizedPath}`,
      filePath: normalizedPath,
      cause: error,
    })
  }

  return parsePackageJsonContent(content, normalizedPath)
}

/**
 * Parses package.json content from a string.
 */
export function parsePackageJsonContent(
  content: string,
  filePath: string,
): Result<ParsedPackageJson, ConfigError> {
  let raw: unknown
  try {
    raw = JSON.parse(content)
  } catch (error) {
    return err({
      code: 'INVALID_JSON',
      message: `Invalid JSON in package.json: ${filePath}`,
      filePath,
      cause: error,
    })
  }

  if (!isValidPackageJson(raw)) {
    return err({
      code: 'INVALID_CONFIG',
      message: 'package.json is missing required fields (name, version)',
      filePath,
    })
  }

  const pkg = raw as Record<string, unknown>

  return ok({
    name: pkg.name as string,
    version: pkg.version as string,
    description: pkg.description as string | undefined,
    main: pkg.main as string | undefined,
    module: pkg.module as string | undefined,
    types: pkg.types as string | undefined,
    exports: pkg.exports as Record<string, unknown> | undefined,
    dependencies: pkg.dependencies as Record<string, string> | undefined,
    devDependencies: pkg.devDependencies as Record<string, string> | undefined,
    peerDependencies: pkg.peerDependencies as Record<string, string> | undefined,
    optionalDependencies: pkg.optionalDependencies as Record<string, string> | undefined,
    type: pkg.type as 'module' | 'commonjs' | undefined,
    scripts: pkg.scripts as Record<string, string> | undefined,
    files: pkg.files as string[] | undefined,
    raw: pkg,
  })
}

/**
 * Parses a tsconfig.json file.
 *
 * @example
 * ```ts
 * const result = await parseTsConfig('/path/to/tsconfig.json')
 * if (result.success) {
 *   console.log(`Target: ${result.data.compilerOptions?.target}`)
 * }
 * ```
 */
export async function parseTsConfig(
  tsconfigPath: string,
): Promise<Result<ParsedTsConfig, ConfigError>> {
  const normalizedPath = tsconfigPath.endsWith('.json')
    ? tsconfigPath
    : path.join(tsconfigPath, 'tsconfig.json')

  let content: string
  try {
    content = await fs.readFile(normalizedPath, 'utf-8')
  } catch (error) {
    if (isNodeError(error) && error.code === 'ENOENT') {
      return err({
        code: 'FILE_NOT_FOUND',
        message: `tsconfig.json not found: ${normalizedPath}`,
        filePath: normalizedPath,
        cause: error,
      })
    }
    return err({
      code: 'READ_ERROR',
      message: `Failed to read tsconfig.json: ${normalizedPath}`,
      filePath: normalizedPath,
      cause: error,
    })
  }

  return parseTsConfigContent(content, normalizedPath)
}

/**
 * Parses tsconfig.json content from a string.
 *
 * Note: This does basic JSON parsing. tsconfig.json supports comments
 * and trailing commas which this parser strips before parsing.
 */
export function parseTsConfigContent(
  content: string,
  filePath: string,
): Result<ParsedTsConfig, ConfigError> {
  // Strip comments and trailing commas for JSON5-like parsing
  const cleanedContent = stripJsonComments(content)

  let raw: unknown
  try {
    raw = JSON.parse(cleanedContent)
  } catch (error) {
    return err({
      code: 'INVALID_JSON',
      message: `Invalid JSON in tsconfig.json: ${filePath}`,
      filePath,
      cause: error,
    })
  }

  if (typeof raw !== 'object' || raw === null) {
    return err({
      code: 'INVALID_CONFIG',
      message: 'tsconfig.json must be an object',
      filePath,
    })
  }

  const config = raw as Record<string, unknown>

  return ok({
    extends: config.extends as string | string[] | undefined,
    compilerOptions: config.compilerOptions as TsCompilerOptions | undefined,
    include: config.include as string[] | undefined,
    exclude: config.exclude as string[] | undefined,
    references: config.references as TsProjectReference[] | undefined,
    filePath,
    raw: config,
  })
}

/**
 * Gets all dependencies from a package.json (combined).
 */
export function getAllDependencies(
  pkg: ParsedPackageJson,
): Readonly<Record<string, {version: string; type: 'prod' | 'dev' | 'peer' | 'optional'}>> {
  const deps: Record<string, {version: string; type: 'prod' | 'dev' | 'peer' | 'optional'}> = {}

  if (pkg.dependencies !== undefined) {
    for (const [name, version] of Object.entries(pkg.dependencies)) {
      deps[name] = {version, type: 'prod'}
    }
  }

  if (pkg.devDependencies !== undefined) {
    for (const [name, version] of Object.entries(pkg.devDependencies)) {
      deps[name] = {version, type: 'dev'}
    }
  }

  if (pkg.peerDependencies !== undefined) {
    for (const [name, version] of Object.entries(pkg.peerDependencies)) {
      deps[name] = {version, type: 'peer'}
    }
  }

  if (pkg.optionalDependencies !== undefined) {
    for (const [name, version] of Object.entries(pkg.optionalDependencies)) {
      deps[name] = {version, type: 'optional'}
    }
  }

  return deps
}

/**
 * Resolves tsconfig extends chain.
 */
export async function resolveTsConfigExtends(
  tsconfigPath: string,
  maxDepth = 10,
): Promise<Result<ParsedTsConfig[], ConfigError>> {
  const chain: ParsedTsConfig[] = []
  let currentPath = tsconfigPath
  let depth = 0

  while (depth < maxDepth) {
    const result = await parseTsConfig(currentPath)
    if (!result.success) {
      return result.success ? result : err(result.error)
    }

    chain.push(result.data)

    const extendsValue = result.data.extends
    if (extendsValue === undefined) {
      break
    }

    let extendsPath: string | undefined
    if (Array.isArray(extendsValue)) {
      const firstExtends: unknown = extendsValue[0]
      extendsPath = typeof firstExtends === 'string' ? firstExtends : undefined
    } else if (typeof extendsValue === 'string') {
      extendsPath = extendsValue
    }

    if (extendsPath === undefined) {
      break
    }

    // Resolve relative to current config directory
    const configDir = path.dirname(currentPath)
    currentPath = resolveExtendsPath(extendsPath, configDir)
    depth++
  }

  return ok(chain)
}

/**
 * Resolves the extends path for tsconfig.
 */
function resolveExtendsPath(extendsValue: string, configDir: string): string {
  if (extendsValue.startsWith('.')) {
    return path.resolve(configDir, extendsValue)
  }

  // Node module path resolution
  if (!extendsValue.endsWith('.json')) {
    return path.join(configDir, 'node_modules', extendsValue, 'tsconfig.json')
  }

  return path.join(configDir, 'node_modules', extendsValue)
}

/**
 * Type guard for valid package.json.
 */
function isValidPackageJson(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const obj = value as Record<string, unknown>
  return typeof obj.name === 'string' && typeof obj.version === 'string'
}

/**
 * Type guard for Node.js errors with code property.
 */
function isNodeError(error: unknown): error is Error & {code: string} {
  return error instanceof Error && 'code' in error
}

/**
 * Strips JSON comments (// and /* *\/) and trailing commas.
 */
function stripJsonComments(content: string): string {
  // Remove single-line comments
  let result = content.replaceAll(/\/\/.*$/gm, '')

  // Remove multi-line comments
  result = result.replaceAll(/\/\*[\s\S]*?\*\//g, '')

  // Remove trailing commas before } or ]
  result = result.replaceAll(/,(\s*[}\]])/g, '$1')

  return result
}
