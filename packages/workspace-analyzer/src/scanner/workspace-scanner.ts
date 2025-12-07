/**
 * Workspace scanner for discovering and analyzing packages in a monorepo.
 *
 * Adapts the createPackageScanner() pattern from @bfra.me/doc-sync for workspace analysis.
 * Uses fs.readdir pattern (not fast-glob) for better control over directory traversal.
 */

import type {Result} from '../types/result'

import fs from 'node:fs/promises'
import path from 'node:path'

import {err, ok} from '@bfra.me/es/result'

/**
 * Options for configuring the workspace scanner.
 */
export interface WorkspaceScannerOptions {
  /** Root directory of the workspace/monorepo */
  readonly rootDir: string
  /** Glob patterns for package locations (e.g., ['packages/*', 'apps/*']) */
  readonly includePatterns?: readonly string[]
  /** Package names to exclude from scanning */
  readonly excludePackages?: readonly string[]
  /** File extensions to include in source file collection */
  readonly sourceExtensions?: readonly string[]
  /** Directories to skip during source file collection */
  readonly excludeDirs?: readonly string[]
}

/**
 * Minimal package.json structure for workspace analysis.
 */
export interface WorkspacePackageJson {
  readonly name: string
  readonly version: string
  readonly description?: string
  readonly main?: string
  readonly module?: string
  readonly types?: string
  readonly exports?: Record<string, unknown>
  readonly dependencies?: Readonly<Record<string, string>>
  readonly devDependencies?: Readonly<Record<string, string>>
  readonly peerDependencies?: Readonly<Record<string, string>>
  readonly optionalDependencies?: Readonly<Record<string, string>>
}

/**
 * Information about a discovered workspace package.
 */
export interface WorkspacePackage {
  /** Package name from package.json */
  readonly name: string
  /** Package version from package.json */
  readonly version: string
  /** Absolute path to the package directory */
  readonly packagePath: string
  /** Absolute path to package.json */
  readonly packageJsonPath: string
  /** Absolute path to source directory (if exists) */
  readonly srcPath: string
  /** Parsed package.json content */
  readonly packageJson: WorkspacePackageJson
  /** List of source file paths in the package */
  readonly sourceFiles: readonly string[]
  /** Whether the package has a tsconfig.json */
  readonly hasTsConfig: boolean
  /** Whether the package has an eslint config */
  readonly hasEslintConfig: boolean
}

/**
 * Error that occurred during workspace scanning.
 */
export interface ScanError {
  /** Error code for programmatic handling */
  readonly code: 'INVALID_PATH' | 'NO_PACKAGE_JSON' | 'INVALID_PACKAGE_JSON' | 'READ_ERROR'
  /** Human-readable error message */
  readonly message: string
  /** Path where the error occurred */
  readonly path: string
  /** Underlying error cause */
  readonly cause?: unknown
}

/**
 * Result of a workspace scan operation.
 */
export interface WorkspaceScanResult {
  /** All discovered packages */
  readonly packages: readonly WorkspacePackage[]
  /** Root workspace path */
  readonly workspacePath: string
  /** Errors encountered during scanning */
  readonly errors: readonly ScanError[]
  /** Duration of scan in milliseconds */
  readonly durationMs: number
}

const DEFAULT_OPTIONS = {
  includePatterns: ['packages/*'],
  excludePackages: [],
  sourceExtensions: ['.ts', '.tsx', '.js', '.jsx', '.mts', '.cts', '.mjs', '.cjs'],
  excludeDirs: ['node_modules', '__tests__', '__mocks__', 'test', 'tests', 'dist', 'lib', 'build'],
} as const

/**
 * Check if a file exists at the given path.
 */
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

/**
 * Creates a workspace scanner for discovering and analyzing packages.
 *
 * @example
 * ```ts
 * const scanner = createWorkspaceScanner({rootDir: '/path/to/monorepo'})
 * const result = await scanner.scan()
 *
 * for (const pkg of result.packages) {
 *   console.log(`Found package: ${pkg.name}`)
 * }
 * ```
 */
export function createWorkspaceScanner(options: WorkspaceScannerOptions): {
  /** Scan the entire workspace for packages */
  readonly scan: () => Promise<WorkspaceScanResult>
  /** Scan a single package directory */
  readonly scanPackage: (packagePath: string) => Promise<Result<WorkspacePackage, ScanError>>
  /** Collect source files from a directory */
  readonly collectSourceFiles: (dir: string) => Promise<readonly string[]>
} {
  const {
    rootDir,
    includePatterns = DEFAULT_OPTIONS.includePatterns,
    excludePackages = DEFAULT_OPTIONS.excludePackages,
    sourceExtensions = DEFAULT_OPTIONS.sourceExtensions,
    excludeDirs = DEFAULT_OPTIONS.excludeDirs,
  } = options

  const extensionSet = new Set(sourceExtensions)
  const excludeDirSet = new Set(excludeDirs)

  /**
   * Discover package directories based on include patterns.
   * Uses fs.readdir pattern for consistent behavior with doc-sync.
   */
  async function discoverPackages(): Promise<string[]> {
    const packagePaths: string[] = []

    for (const pattern of includePatterns) {
      const baseDir = path.join(rootDir, pattern.replace('/*', ''))

      try {
        const entries = await fs.readdir(baseDir, {withFileTypes: true})

        for (const entry of entries) {
          if (!entry.isDirectory()) {
            continue
          }

          const packagePath = path.join(baseDir, entry.name)
          const packageJsonPath = path.join(packagePath, 'package.json')

          try {
            await fs.access(packageJsonPath)
            packagePaths.push(packagePath)
          } catch {
            // Directory doesn't contain package.json, skip
          }
        }
      } catch {
        // Pattern directory doesn't exist, skip
      }
    }

    return packagePaths
  }

  /**
   * Recursively collect source files from a directory.
   */
  async function collectSourceFiles(dir: string): Promise<readonly string[]> {
    const files: string[] = []

    try {
      await collectSourceFilesRecursive(dir, files)
    } catch {
      // Source directory doesn't exist or is not accessible
    }

    return files
  }

  async function collectSourceFilesRecursive(dir: string, files: string[]): Promise<void> {
    const entries = await fs.readdir(dir, {withFileTypes: true})

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)

      if (entry.isDirectory()) {
        if (excludeDirSet.has(entry.name)) {
          continue
        }
        await collectSourceFilesRecursive(fullPath, files)
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase()
        const isSourceFile = extensionSet.has(ext)
        const isTestFile = entry.name.includes('.test.') || entry.name.includes('.spec.')

        if (isSourceFile && !isTestFile) {
          files.push(fullPath)
        }
      }
    }
  }

  /**
   * Scan a single package directory.
   */
  async function scanPackage(packagePath: string): Promise<Result<WorkspacePackage, ScanError>> {
    const packageJsonPath = path.join(packagePath, 'package.json')

    let content: string
    try {
      content = await fs.readFile(packageJsonPath, 'utf-8')
    } catch (error) {
      return err({
        code: 'READ_ERROR',
        message: `Failed to read package.json: ${packageJsonPath}`,
        path: packageJsonPath,
        cause: error,
      })
    }

    let packageJson: unknown
    try {
      packageJson = JSON.parse(content)
    } catch (error) {
      return err({
        code: 'INVALID_PACKAGE_JSON',
        message: `Invalid JSON in package.json: ${packageJsonPath}`,
        path: packageJsonPath,
        cause: error,
      })
    }

    if (!isValidPackageJson(packageJson)) {
      return err({
        code: 'INVALID_PACKAGE_JSON',
        message: 'package.json is missing required fields (name, version)',
        path: packageJsonPath,
      })
    }

    const srcPath = path.join(packagePath, 'src')
    const sourceFiles = await collectSourceFiles(srcPath)

    const [hasTsConfig, hasEslintTs, hasEslintJs] = await Promise.all([
      fileExists(path.join(packagePath, 'tsconfig.json')),
      fileExists(path.join(packagePath, 'eslint.config.ts')),
      fileExists(path.join(packagePath, 'eslint.config.js')),
    ])

    return ok({
      name: packageJson.name,
      version: packageJson.version,
      packagePath,
      packageJsonPath,
      srcPath,
      packageJson,
      sourceFiles,
      hasTsConfig,
      hasEslintConfig: hasEslintTs === true || hasEslintJs === true,
    })
  }

  /**
   * Scan the entire workspace for packages.
   */
  async function scan(): Promise<WorkspaceScanResult> {
    const startTime = Date.now()
    const packagePaths = await discoverPackages()
    const packages: WorkspacePackage[] = []
    const errors: ScanError[] = []

    for (const packagePath of packagePaths) {
      const result = await scanPackage(packagePath)

      if (result.success) {
        const scanned = result.data

        if (excludePackages.includes(scanned.name)) {
          continue
        }

        packages.push(scanned)
      } else {
        errors.push(result.error)
      }
    }

    return {
      packages,
      workspacePath: rootDir,
      errors,
      durationMs: Date.now() - startTime,
    }
  }

  return {
    scan,
    scanPackage,
    collectSourceFiles,
  }
}

/**
 * Type guard for validating package.json structure.
 */
function isValidPackageJson(value: unknown): value is WorkspacePackageJson {
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
 * Filter packages by name pattern.
 */
export function filterPackagesByPattern(
  packages: readonly WorkspacePackage[],
  pattern: string,
): WorkspacePackage[] {
  const regex = new RegExp(pattern.replaceAll('*', '.*'), 'i')
  return packages.filter(pkg => regex.test(pkg.name))
}

/**
 * Group packages by their npm scope.
 */
export function groupPackagesByScope(
  packages: readonly WorkspacePackage[],
): Map<string, WorkspacePackage[]> {
  const grouped = new Map<string, WorkspacePackage[]>()

  for (const pkg of packages) {
    const scope = getPackageScope(pkg.name) ?? '__unscoped__'
    const existing = grouped.get(scope)

    if (existing === undefined) {
      grouped.set(scope, [pkg])
    } else {
      existing.push(pkg)
    }
  }

  return grouped
}

/**
 * Extract the scope from a scoped package name.
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
 * Get the unscoped name from a package name.
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
