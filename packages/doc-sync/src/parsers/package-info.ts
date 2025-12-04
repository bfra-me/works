/**
 * @bfra.me/doc-sync/parsers/package-info - Package.json metadata extraction
 */

import type {DocConfigSource, PackageInfo, ParseError, ParseResult} from '../types'

import path from 'node:path'

import {err, ok} from '@bfra.me/es/result'

/**
 * Schema for validating package.json structure (runtime validation)
 */
export interface PackageJsonSchema {
  readonly name: string
  readonly version: string
  readonly description?: string
  readonly keywords?: readonly string[]
  readonly main?: string
  readonly module?: string
  readonly types?: string
  readonly exports?: Record<string, unknown>
  readonly repository?:
    | string
    | {
        readonly type?: string
        readonly url?: string
        readonly directory?: string
      }
  readonly docs?: DocConfigSource
}

/**
 * Options for parsing package.json files
 */
export interface PackageInfoOptions {
  readonly validateSchema?: boolean
  readonly extractDocsConfig?: boolean
}

/**
 * Parses a package.json file and extracts relevant metadata
 */
export async function parsePackageJson(
  packagePath: string,
  options?: PackageInfoOptions,
): Promise<ParseResult<PackageInfo>> {
  const packageJsonPath = packagePath.endsWith('package.json')
    ? packagePath
    : path.join(packagePath, 'package.json')

  try {
    const fs = await import('node:fs/promises')
    const content = await fs.readFile(packageJsonPath, 'utf-8')
    return parsePackageJsonContent(content, packageJsonPath, options)
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return err({
        code: 'FILE_NOT_FOUND',
        message: `package.json not found: ${packageJsonPath}`,
        filePath: packageJsonPath,
        cause: error,
      } satisfies ParseError)
    }

    return err({
      code: 'READ_ERROR',
      message: `Failed to read package.json: ${packageJsonPath}`,
      filePath: packageJsonPath,
      cause: error,
    } satisfies ParseError)
  }
}

/**
 * Parses package.json content from a string
 */
export function parsePackageJsonContent(
  content: string,
  filePath: string,
  options?: PackageInfoOptions,
): ParseResult<PackageInfo> {
  let parsed: unknown

  try {
    parsed = JSON.parse(content)
  } catch (error) {
    return err({
      code: 'MALFORMED_JSON',
      message: `Invalid JSON in package.json: ${filePath}`,
      filePath,
      cause: error,
    } satisfies ParseError)
  }

  if (!isPackageJson(parsed)) {
    return err({
      code: 'INVALID_SYNTAX',
      message: 'package.json is missing required fields (name, version)',
      filePath,
    } satisfies ParseError)
  }

  const packageDir = path.dirname(filePath)

  return ok({
    name: parsed.name,
    version: parsed.version,
    ...(parsed.description !== undefined && {description: parsed.description}),
    ...(parsed.keywords !== undefined && {keywords: parsed.keywords}),
    packagePath: packageDir,
    srcPath: path.join(packageDir, 'src'),
    ...(options?.extractDocsConfig !== false &&
      parsed.docs !== undefined && {docsConfig: parsed.docs}),
  })
}

function isPackageJson(value: unknown): value is PackageJsonSchema {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const obj = value as Record<string, unknown>

  if (typeof obj.name !== 'string' || obj.name.length === 0) {
    return false
  }

  if (typeof obj.version !== 'string' || obj.version.length === 0) {
    return false
  }

  return true
}

/**
 * Extracts documentation configuration from package.json
 */
export function extractDocsConfig(pkg: PackageInfo): DocConfigSource | undefined {
  return pkg.docsConfig
}

/**
 * Checks if a README file exists for a package
 */
export async function findReadmePath(packagePath: string): Promise<string | undefined> {
  const fs = await import('node:fs/promises')
  const candidates = ['README.md', 'readme.md', 'Readme.md', 'README.MD', 'README']

  for (const candidate of candidates) {
    const readmePath = path.join(packagePath, candidate)
    try {
      await fs.access(readmePath)
      return readmePath
    } catch {
      // Continue to next candidate
    }
  }

  return undefined
}

/**
 * Extracts the source entry point from package.json
 */
export function findEntryPoint(pkg: PackageInfo, content: string): string {
  try {
    const parsed = JSON.parse(content) as PackageJsonSchema

    // Check exports field first
    if (parsed.exports !== undefined) {
      const mainExport = parsed.exports['.']
      if (mainExport !== undefined && typeof mainExport === 'object') {
        const exportObj = mainExport as Record<string, unknown>
        if (typeof exportObj.source === 'string') {
          return path.join(pkg.packagePath, exportObj.source)
        }
        if (typeof exportObj.import === 'string') {
          // Convert lib/ to src/ for source analysis
          const importPath = exportObj.import
          if (importPath.includes('/lib/')) {
            return path.join(
              pkg.packagePath,
              importPath.replace('/lib/', '/src/').replace('.js', '.ts'),
            )
          }
          return path.join(pkg.packagePath, importPath)
        }
      }
      if (typeof mainExport === 'string') {
        return path.join(pkg.packagePath, mainExport)
      }
    }

    // Fall back to types or main field
    if (typeof parsed.types === 'string') {
      const typesPath = parsed.types.replace('/lib/', '/src/').replace('.d.ts', '.ts')
      return path.join(pkg.packagePath, typesPath)
    }

    if (typeof parsed.main === 'string') {
      const mainPath = parsed.main.replace('/lib/', '/src/').replace('.js', '.ts')
      return path.join(pkg.packagePath, mainPath)
    }
  } catch {
    // Ignore parsing errors
  }

  // Default to src/index.ts
  return path.join(pkg.srcPath, 'index.ts')
}

/**
 * Parses a complete package including README detection
 */
export async function parsePackageComplete(
  packagePath: string,
  options?: PackageInfoOptions,
): Promise<ParseResult<PackageInfo>> {
  const packageInfoResult = await parsePackageJson(packagePath, options)

  if (!packageInfoResult.success) {
    return packageInfoResult
  }

  const readmePath = await findReadmePath(packageInfoResult.data.packagePath)

  return ok({
    ...packageInfoResult.data,
    ...(readmePath !== undefined && {readmePath}),
  })
}

/**
 * Gets the package scope from a scoped package name
 */
export function getPackageScope(packageName: string): string | undefined {
  if (packageName.startsWith('@')) {
    const slashIndex = packageName.indexOf('/')
    if (slashIndex > 0) {
      return packageName.slice(0, slashIndex)
    }
  }
  return undefined
}

/**
 * Gets the unscoped package name
 */
export function getUnscopedName(packageName: string): string {
  if (packageName.startsWith('@')) {
    const slashIndex = packageName.indexOf('/')
    if (slashIndex > 0) {
      return packageName.slice(slashIndex + 1)
    }
  }
  return packageName
}

/**
 * Builds a documentation slug from a package name
 */
export function buildDocSlug(packageName: string): string {
  return getUnscopedName(packageName)
    .toLowerCase()
    .replaceAll(/[^a-z0-9-]/g, '-')
}
