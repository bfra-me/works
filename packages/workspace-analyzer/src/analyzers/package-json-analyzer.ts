/**
 * PackageJsonAnalyzer - Validates package.json configuration for best practices.
 *
 * Detects issues such as:
 * - Missing required fields (types, exports, etc.)
 * - Inconsistent entry points
 * - Invalid dependency versions
 * - Missing peer dependency declarations
 */

import type {ParsedPackageJson} from '../parser/config-parser'
import type {WorkspacePackage} from '../scanner/workspace-scanner'
import type {Issue, IssueLocation} from '../types/index'
import type {Result} from '../types/result'
import type {AnalysisContext, Analyzer, AnalyzerError, AnalyzerMetadata} from './analyzer'

import path from 'node:path'

import {ok} from '@bfra.me/es/result'

import {createIssue, filterIssues} from './analyzer'

/**
 * Configuration options specific to PackageJsonAnalyzer.
 */
export interface PackageJsonAnalyzerOptions {
  /** Whether to require types field for TypeScript packages */
  readonly requireTypes?: boolean
  /** Whether to require exports field for ESM packages */
  readonly requireExports?: boolean
  /** Whether to check for common scripts like build, test, lint */
  readonly checkScripts?: boolean
  /** Package names exempt from certain checks */
  readonly exemptPackages?: readonly string[]
}

const DEFAULT_OPTIONS: PackageJsonAnalyzerOptions = {
  requireTypes: true,
  requireExports: true,
  checkScripts: true,
  exemptPackages: [],
}

const METADATA: AnalyzerMetadata = {
  id: 'package-json',
  name: 'Package.json Analyzer',
  description: 'Validates package.json configuration for best practices and consistency',
  categories: ['configuration'],
  defaultSeverity: 'warning',
}

/**
 * Creates a PackageJsonAnalyzer instance.
 */
export function createPackageJsonAnalyzer(options: PackageJsonAnalyzerOptions = {}): Analyzer {
  const resolvedOptions = {...DEFAULT_OPTIONS, ...options}

  return {
    metadata: METADATA,
    analyze: async (context: AnalysisContext): Promise<Result<readonly Issue[], AnalyzerError>> => {
      const issues: Issue[] = []

      for (const pkg of context.packages) {
        if (isExemptPackage(pkg.name, resolvedOptions.exemptPackages)) {
          continue
        }

        const packageIssues = analyzePackage(pkg, resolvedOptions)
        issues.push(...packageIssues)
      }

      return ok(filterIssues(issues, context.config))
    },
  }
}

function isExemptPackage(name: string, exemptPackages: readonly string[] | undefined): boolean {
  return exemptPackages?.includes(name) ?? false
}

function createLocation(pkg: WorkspacePackage): IssueLocation {
  return {
    filePath: pkg.packageJsonPath,
  }
}

function analyzePackage(pkg: WorkspacePackage, options: PackageJsonAnalyzerOptions): Issue[] {
  const issues: Issue[] = []
  const pkgJson = pkg.packageJson as ParsedPackageJson

  // Check for types field in TypeScript packages
  if (options.requireTypes && pkg.hasTsConfig) {
    issues.push(...checkTypesField(pkg, pkgJson))
  }

  // Check for exports field in ESM packages
  if (options.requireExports) {
    issues.push(...checkExportsField(pkg, pkgJson))
  }

  // Check for essential scripts
  if (options.checkScripts) {
    issues.push(...checkScripts(pkg, pkgJson))
  }

  // Check for invalid dependencies
  issues.push(...checkDependencies(pkg, pkgJson))

  // Check entry point consistency
  issues.push(...checkEntryPoints(pkg, pkgJson))

  return issues
}

function checkTypesField(pkg: WorkspacePackage, pkgJson: ParsedPackageJson): Issue[] {
  const issues: Issue[] = []

  // Check main types field
  if (pkgJson.types === undefined) {
    // Check if types are declared in exports
    const hasTypesInExports = hasTypesExport(pkgJson.exports)

    if (!hasTypesInExports) {
      issues.push(
        createIssue({
          id: 'missing-types',
          title: 'Missing types field',
          description: `Package "${pkg.name}" is a TypeScript package but does not declare a "types" field or types in exports`,
          severity: 'warning',
          category: 'configuration',
          location: createLocation(pkg),
          suggestion:
            'Add "types" field pointing to your .d.ts entry point, or add "types" to exports',
        }),
      )
    }
  }

  return issues
}

function hasTypesExport(exports: Record<string, unknown> | undefined): boolean {
  if (exports === undefined) {
    return false
  }

  // Check if root export has types
  const rootExport = exports['.']
  if (typeof rootExport === 'object' && rootExport !== null && 'types' in rootExport) {
    return true
  }

  // Check nested exports
  for (const value of Object.values(exports)) {
    if (typeof value === 'object' && value !== null && 'types' in value) {
      return true
    }
  }

  return false
}

function checkExportsField(pkg: WorkspacePackage, pkgJson: ParsedPackageJson): Issue[] {
  const issues: Issue[] = []

  // Check if package uses ESM
  const isEsm = pkgJson.type === 'module'

  if (isEsm && pkgJson.exports === undefined) {
    issues.push(
      createIssue({
        id: 'missing-exports',
        title: 'ESM package missing exports field',
        description: `Package "${pkg.name}" uses ESM ("type": "module") but does not declare an "exports" field`,
        severity: 'warning',
        category: 'configuration',
        location: createLocation(pkg),
        suggestion: 'Add "exports" field with explicit entry points for better Node.js resolution',
      }),
    )
  }

  // Check for wildcard exports in non-library packages
  if (pkgJson.exports !== undefined) {
    issues.push(...checkWildcardExports(pkg, pkgJson.exports))
  }

  return issues
}

function checkWildcardExports(pkg: WorkspacePackage, exports: Record<string, unknown>): Issue[] {
  const issues: Issue[] = []

  for (const [key, value] of Object.entries(exports)) {
    if (key.includes('*')) {
      issues.push(
        createIssue({
          id: 'wildcard-export',
          title: 'Wildcard export pattern detected',
          description: `Package "${pkg.name}" uses wildcard export pattern "${key}" which may expose internal modules`,
          severity: 'info',
          category: 'configuration',
          location: createLocation(pkg),
          suggestion:
            'Consider using explicit export paths for better control over public API surface',
          metadata: {exportKey: key, exportValue: value},
        }),
      )
    }
  }

  return issues
}

function checkScripts(pkg: WorkspacePackage, pkgJson: ParsedPackageJson): Issue[] {
  const issues: Issue[] = []
  const scripts = pkgJson.scripts ?? {}

  // Check for build script
  if (scripts.build === undefined && pkg.hasTsConfig) {
    issues.push(
      createIssue({
        id: 'missing-build-script',
        title: 'Missing build script',
        description: `Package "${pkg.name}" has TypeScript config but no "build" script`,
        severity: 'info',
        category: 'configuration',
        location: createLocation(pkg),
        suggestion: 'Add a "build" script to compile TypeScript sources',
      }),
    )
  }

  return issues
}

function checkDependencies(pkg: WorkspacePackage, pkgJson: ParsedPackageJson): Issue[] {
  const issues: Issue[] = []

  // Check for deprecated version formats
  const allDeps = {
    ...(pkgJson.dependencies ?? {}),
    ...(pkgJson.devDependencies ?? {}),
    ...(pkgJson.peerDependencies ?? {}),
    ...(pkgJson.optionalDependencies ?? {}),
  }

  for (const [depName, version] of Object.entries(allDeps)) {
    // Check for file: protocol
    if (version.startsWith('file:')) {
      issues.push(
        createIssue({
          id: 'file-dependency',
          title: 'File protocol dependency',
          description: `Package "${pkg.name}" has a file: dependency on "${depName}"`,
          severity: 'warning',
          category: 'dependency',
          location: createLocation(pkg),
          suggestion: 'Use workspace: protocol for monorepo packages or publish as a package',
          metadata: {dependency: depName, version},
        }),
      )
    }

    // Check for git: protocol in production deps
    if (version.startsWith('git:') || version.includes('github:')) {
      const isDev = pkgJson.devDependencies !== undefined && depName in pkgJson.devDependencies
      if (!isDev) {
        issues.push(
          createIssue({
            id: 'git-dependency',
            title: 'Git protocol dependency in production',
            description: `Package "${pkg.name}" has a git dependency on "${depName}" in production dependencies`,
            severity: 'warning',
            category: 'dependency',
            location: createLocation(pkg),
            suggestion: 'Use a published npm package version for production dependencies',
            metadata: {dependency: depName, version},
          }),
        )
      }
    }

    // Check for latest or * versions
    if (version === 'latest' || version === '*') {
      issues.push(
        createIssue({
          id: 'unpinned-dependency',
          title: 'Unpinned dependency version',
          description: `Package "${pkg.name}" has an unpinned dependency "${depName}" with version "${version}"`,
          severity: 'error',
          category: 'dependency',
          location: createLocation(pkg),
          suggestion: 'Use a specific version or range for reproducible builds',
          metadata: {dependency: depName, version},
        }),
      )
    }
  }

  return issues
}

function checkEntryPoints(pkg: WorkspacePackage, pkgJson: ParsedPackageJson): Issue[] {
  const issues: Issue[] = []

  // Check if main and module both exist but point to same format
  if (pkgJson.main !== undefined && pkgJson.module !== undefined) {
    const mainExt = path.extname(pkgJson.main)
    const moduleExt = path.extname(pkgJson.module)

    // Both pointing to same extension might indicate misconfiguration
    if (mainExt === moduleExt && mainExt !== '') {
      issues.push(
        createIssue({
          id: 'duplicate-entry-format',
          title: 'Entry points may have same format',
          description: `Package "${pkg.name}" has both "main" and "module" pointing to ${mainExt} files`,
          severity: 'info',
          category: 'configuration',
          location: createLocation(pkg),
          suggestion:
            '"main" should typically point to CJS format (.cjs) and "module" to ESM format (.mjs or .js)',
          metadata: {main: pkgJson.main, module: pkgJson.module},
        }),
      )
    }
  }

  // Check for ESM package without module field
  if (pkgJson.type === 'module' && pkgJson.module === undefined && pkgJson.exports === undefined) {
    issues.push(
      createIssue({
        id: 'esm-without-module-or-exports',
        title: 'ESM package without module or exports field',
        description: `Package "${pkg.name}" is ESM but has neither "module" nor "exports" field`,
        severity: 'warning',
        category: 'configuration',
        location: createLocation(pkg),
        suggestion:
          'Add "exports" field for modern ESM packages, or "module" for backwards compatibility',
      }),
    )
  }

  return issues
}

export {METADATA as packageJsonAnalyzerMetadata}
