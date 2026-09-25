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
import {isArray, isObject, isString} from '@bfra.me/es/types'

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

  const pkg = raw

  return ok({
    name: pkg.name,
    version: pkg.version,
    description: asOptionalString(pkg.description),
    main: asOptionalString(pkg.main),
    module: asOptionalString(pkg.module),
    types: asOptionalString(pkg.types),
    exports: isObject(pkg.exports) ? pkg.exports : undefined,
    dependencies: asStringRecord(pkg.dependencies),
    devDependencies: asStringRecord(pkg.devDependencies),
    peerDependencies: asStringRecord(pkg.peerDependencies),
    optionalDependencies: asStringRecord(pkg.optionalDependencies),
    type: asPackageType(pkg.type),
    scripts: asStringRecord(pkg.scripts),
    files: asStringArray(pkg.files),
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

  if (!isObject(raw)) {
    return err({
      code: 'INVALID_CONFIG',
      message: 'tsconfig.json must be an object',
      filePath,
    })
  }

  const config = raw

  return ok({
    extends: asStringOrStringArray(config.extends),
    compilerOptions: asCompilerOptions(config.compilerOptions),
    include: asStringArray(config.include),
    exclude: asStringArray(config.exclude),
    references: asProjectReferences(config.references),
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
    if (isString(extendsValue)) {
      extendsPath = extendsValue
    } else {
      const firstExtends = extendsValue[0]
      extendsPath = isString(firstExtends) ? firstExtends : undefined
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
function isValidPackageJson(
  value: unknown,
): value is Record<string, unknown> & {name: string; version: string} {
  return isObject(value) && isString(value.name) && isString(value.version)
}

/**
 * Narrows a value to a string, dropping it otherwise.
 */
function asOptionalString(value: unknown): string | undefined {
  return isString(value) ? value : undefined
}

/**
 * Narrows a value to a boolean, dropping it otherwise.
 */
function asOptionalBoolean(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined
}

/**
 * Narrows a value to an array of strings, dropping it entirely if any
 * element is not a string.
 */
function asStringArray(value: unknown): string[] | undefined {
  return isArray(value) && value.every(isString) ? value : undefined
}

/**
 * Narrows a value to a string-keyed record of strings, dropping entries
 * whose value is not a string.
 */
function asStringRecord(value: unknown): Record<string, string> | undefined {
  if (!isObject(value)) {
    return undefined
  }

  const result: Record<string, string> = {}
  for (const [key, entryValue] of Object.entries(value)) {
    if (isString(entryValue)) {
      result[key] = entryValue
    }
  }
  return result
}

/**
 * Narrows a value to a string-keyed record of string arrays, dropping
 * entries that are not arrays of strings.
 */
function asStringArrayRecord(value: unknown): Record<string, readonly string[]> | undefined {
  if (!isObject(value)) {
    return undefined
  }

  const result: Record<string, readonly string[]> = {}
  for (const [key, entryValue] of Object.entries(value)) {
    if (isArray(entryValue) && entryValue.every(isString)) {
      result[key] = entryValue
    }
  }
  return result
}

/**
 * Narrows a value to the package.json `type` field, dropping unrecognized values.
 */
function asPackageType(value: unknown): 'module' | 'commonjs' | undefined {
  return value === 'module' || value === 'commonjs' ? value : undefined
}

/**
 * Narrows a value to the tsconfig `extends` field shape.
 */
function asStringOrStringArray(value: unknown): string | string[] | undefined {
  if (isString(value)) {
    return value
  }
  return asStringArray(value)
}

/**
 * Narrows a value to tsconfig compiler options, dropping fields with the wrong type.
 */
function asCompilerOptions(value: unknown): TsCompilerOptions | undefined {
  if (!isObject(value)) {
    return undefined
  }

  return {
    target: asOptionalString(value.target),
    module: asOptionalString(value.module),
    moduleResolution: asOptionalString(value.moduleResolution),
    paths: asStringArrayRecord(value.paths),
    baseUrl: asOptionalString(value.baseUrl),
    rootDir: asOptionalString(value.rootDir),
    outDir: asOptionalString(value.outDir),
    strict: asOptionalBoolean(value.strict),
    declaration: asOptionalBoolean(value.declaration),
    sourceMap: asOptionalBoolean(value.sourceMap),
    esModuleInterop: asOptionalBoolean(value.esModuleInterop),
    allowSyntheticDefaultImports: asOptionalBoolean(value.allowSyntheticDefaultImports),
    skipLibCheck: asOptionalBoolean(value.skipLibCheck),
    resolveJsonModule: asOptionalBoolean(value.resolveJsonModule),
    isolatedModules: asOptionalBoolean(value.isolatedModules),
  }
}

/**
 * Narrows a value to an array of tsconfig project references, dropping
 * entries that don't have a string `path`.
 */
function asProjectReferences(value: unknown): TsProjectReference[] | undefined {
  if (!isArray(value)) {
    return undefined
  }

  const references: TsProjectReference[] = []
  for (const entry of value) {
    if (isObject(entry) && isString(entry.path)) {
      references.push({path: entry.path})
    }
  }
  return references
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
  // Use character-based scanning to safely remove comments
  // This avoids ReDoS vulnerabilities from regex patterns like /\/\/.*$/gm
  let result = ''
  let i = 0
  let inString = false
  let stringChar = ''

  while (i < content.length) {
    const char = content[i]
    const nextChar = content[i + 1]

    // Track string boundaries to avoid removing // inside strings
    if ((char === '"' || char === "'") && (i === 0 || content[i - 1] !== '\\')) {
      if (!inString) {
        inString = true
        stringChar = char
      } else if (char === stringChar) {
        inString = false
        stringChar = ''
      }
      result += char
      i++
      continue
    }

    // Skip comments only when not inside a string
    if (!inString) {
      // Single-line comment
      if (char === '/' && nextChar === '/') {
        // Skip until end of line
        while (i < content.length && content[i] !== '\n') {
          i++
        }
        // Include the newline
        if (i < content.length) {
          result += content[i]
          i++
        }
        continue
      }

      // Multi-line comment
      if (char === '/' && nextChar === '*') {
        // Skip until */
        i += 2
        while (i < content.length - 1) {
          if (content[i] === '*' && content[i + 1] === '/') {
            i += 2
            break
          }
          i++
        }
        continue
      }
    }

    result += char
    i++
  }

  // Remove trailing commas before } or ]
  return result.replaceAll(/,(\s*[}\]])/g, '$1')
}
