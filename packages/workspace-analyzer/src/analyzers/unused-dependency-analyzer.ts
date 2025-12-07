/**
 * UnusedDependencyAnalyzer - Detects unused dependencies in workspace packages.
 *
 * Compares declared dependencies in package.json against actual imports
 * found in source files to identify unused packages that can be removed.
 *
 * Handles:
 * - Static imports (import { x } from 'pkg')
 * - Dynamic imports (await import('pkg'))
 * - require() calls (const x = require('pkg'))
 * - Type-only imports (import type { T } from 'pkg')
 * - Dev vs production dependency classification
 */

import type {ImportExtractionResult, ImportExtractorOptions} from '../parser/import-extractor'
import type {WorkspacePackage} from '../scanner/workspace-scanner'
import type {Issue, IssueLocation} from '../types/index'
import type {Result} from '../types/result'
import type {AnalysisContext, Analyzer, AnalyzerError, AnalyzerMetadata} from './analyzer'

import {createProject} from '@bfra.me/doc-sync/parsers'
import {ok} from '@bfra.me/es/result'

import {extractImports, getPackageNameFromSpecifier} from '../parser/import-extractor'
import {createIssue, filterIssues} from './analyzer'

/**
 * Configuration options specific to UnusedDependencyAnalyzer.
 */
export interface UnusedDependencyAnalyzerOptions {
  /** Include devDependencies in analysis */
  readonly checkDevDependencies?: boolean
  /** Include peerDependencies in analysis */
  readonly checkPeerDependencies?: boolean
  /** Include optionalDependencies in analysis */
  readonly checkOptionalDependencies?: boolean
  /** Package names to ignore (regex patterns) */
  readonly ignorePatterns?: readonly string[]
  /** Packages known to be used implicitly (e.g., type packages, build tools) */
  readonly implicitlyUsed?: readonly string[]
  /** Workspace package prefixes for identifying workspace dependencies */
  readonly workspacePrefixes?: readonly string[]
}

const DEFAULT_OPTIONS: Required<UnusedDependencyAnalyzerOptions> = {
  checkDevDependencies: true,
  checkPeerDependencies: false,
  checkOptionalDependencies: false,
  ignorePatterns: [],
  implicitlyUsed: [
    // Common packages that are used implicitly or at build time
    'typescript',
    '@types/*',
    'eslint',
    'prettier',
    'vitest',
    '@vitest/*',
    'tsup',
    'vite',
    '@vitejs/*',
  ],
  workspacePrefixes: ['@bfra.me/'],
}

export const unusedDependencyAnalyzerMetadata: AnalyzerMetadata = {
  id: 'unused-dependency',
  name: 'Unused Dependency Analyzer',
  description: 'Detects dependencies declared in package.json that are not imported in source code',
  categories: ['dependency'],
  defaultSeverity: 'warning',
}

/**
 * Creates an UnusedDependencyAnalyzer instance.
 *
 * @example
 * ```ts
 * const analyzer = createUnusedDependencyAnalyzer({
 *   checkDevDependencies: true,
 *   ignorePatterns: ['@types/*'],
 * })
 * const result = await analyzer.analyze(context)
 * ```
 */
export function createUnusedDependencyAnalyzer(
  options: UnusedDependencyAnalyzerOptions = {},
): Analyzer {
  const resolvedOptions = {...DEFAULT_OPTIONS, ...options}

  return {
    metadata: unusedDependencyAnalyzerMetadata,
    analyze: async (context: AnalysisContext): Promise<Result<readonly Issue[], AnalyzerError>> => {
      const issues: Issue[] = []

      for (const pkg of context.packages) {
        context.reportProgress?.(`Analyzing dependencies for ${pkg.name}...`)

        const packageIssues = await analyzePackageDependencies(pkg, resolvedOptions)
        issues.push(...packageIssues)
      }

      return ok(filterIssues(issues, context.config))
    },
  }
}

/**
 * Dependency classification for proper issue severity and messaging.
 */
type DependencyType =
  | 'dependencies'
  | 'devDependencies'
  | 'peerDependencies'
  | 'optionalDependencies'

interface DeclaredDependency {
  readonly name: string
  readonly version: string
  readonly type: DependencyType
}

/**
 * Analyzes a single package for unused dependencies.
 */
async function analyzePackageDependencies(
  pkg: WorkspacePackage,
  options: Required<UnusedDependencyAnalyzerOptions>,
): Promise<Issue[]> {
  const issues: Issue[] = []

  const declaredDeps = collectDeclaredDependencies(pkg, options)
  if (declaredDeps.length === 0) {
    return issues
  }

  const usedPackages = await collectUsedPackages(pkg, options)

  for (const dep of declaredDeps) {
    if (isIgnored(dep.name, options)) {
      continue
    }

    if (isImplicitlyUsed(dep.name, options.implicitlyUsed)) {
      continue
    }

    if (!usedPackages.has(dep.name)) {
      issues.push(createUnusedDependencyIssue(pkg, dep))
    }
  }

  return issues
}

/**
 * Collects all declared dependencies from package.json based on configuration.
 */
function collectDeclaredDependencies(
  pkg: WorkspacePackage,
  options: Required<UnusedDependencyAnalyzerOptions>,
): DeclaredDependency[] {
  const deps: DeclaredDependency[] = []
  const pkgJson = pkg.packageJson

  // Always check production dependencies
  if (pkgJson.dependencies !== undefined) {
    for (const [name, version] of Object.entries(pkgJson.dependencies)) {
      deps.push({name, version, type: 'dependencies'})
    }
  }

  if (options.checkDevDependencies && pkgJson.devDependencies !== undefined) {
    for (const [name, version] of Object.entries(pkgJson.devDependencies)) {
      deps.push({name, version, type: 'devDependencies'})
    }
  }

  if (options.checkPeerDependencies && pkgJson.peerDependencies !== undefined) {
    for (const [name, version] of Object.entries(pkgJson.peerDependencies)) {
      deps.push({name, version, type: 'peerDependencies'})
    }
  }

  if (options.checkOptionalDependencies && pkgJson.optionalDependencies !== undefined) {
    for (const [name, version] of Object.entries(pkgJson.optionalDependencies)) {
      deps.push({name, version, type: 'optionalDependencies'})
    }
  }

  return deps
}

/**
 * Collects all packages actually used in source files.
 */
async function collectUsedPackages(
  pkg: WorkspacePackage,
  options: Required<UnusedDependencyAnalyzerOptions>,
): Promise<Set<string>> {
  const usedPackages = new Set<string>()

  if (pkg.sourceFiles.length === 0) {
    return usedPackages
  }

  const project = createProject()

  const extractorOptions: ImportExtractorOptions = {
    workspacePrefixes: options.workspacePrefixes,
    includeTypeImports: true,
    includeDynamicImports: true,
    includeRequireCalls: true,
  }

  for (const filePath of pkg.sourceFiles) {
    try {
      const sourceFile = project.addSourceFileAtPath(filePath)
      const result = extractImports(sourceFile, extractorOptions)

      for (const imp of result.imports) {
        const packageName = getPackageNameFromSpecifier(imp.moduleSpecifier)
        if (!isRelativeSpecifier(imp.moduleSpecifier)) {
          usedPackages.add(packageName)
        }
      }
    } catch {
      // Skip files that can't be parsed (may be invalid syntax or not TypeScript)
    }
  }

  return usedPackages
}

/**
 * Checks if a module specifier is a relative import.
 */
function isRelativeSpecifier(specifier: string): boolean {
  return specifier.startsWith('.') || specifier.startsWith('/')
}

/**
 * Checks if a dependency should be ignored based on patterns.
 */
function isIgnored(depName: string, options: Required<UnusedDependencyAnalyzerOptions>): boolean {
  return options.ignorePatterns.some(pattern => {
    if (pattern.includes('*')) {
      const regex = new RegExp(`^${pattern.replaceAll('*', '.*')}$`)
      return regex.test(depName)
    }
    return depName === pattern
  })
}

/**
 * Checks if a dependency is implicitly used (build tools, type definitions, etc.).
 */
function isImplicitlyUsed(depName: string, implicitlyUsed: readonly string[]): boolean {
  return implicitlyUsed.some(pattern => {
    if (pattern.includes('*')) {
      const regex = new RegExp(`^${pattern.replaceAll('*', '.*')}$`)
      return regex.test(depName)
    }
    return depName === pattern
  })
}

/**
 * Creates an issue for an unused dependency.
 */
function createUnusedDependencyIssue(pkg: WorkspacePackage, dep: DeclaredDependency): Issue {
  const location: IssueLocation = {
    filePath: pkg.packageJsonPath,
  }

  const severityMap: Record<DependencyType, 'warning' | 'info'> = {
    dependencies: 'warning',
    devDependencies: 'info',
    peerDependencies: 'info',
    optionalDependencies: 'info',
  }

  const typeDescription = getDependencyTypeDescription(dep.type)

  return createIssue({
    id: 'unused-dependency',
    title: `Unused ${typeDescription}: ${dep.name}`,
    description: `Package "${pkg.name}" declares "${dep.name}" in ${dep.type} but it is not imported in any source file`,
    severity: severityMap[dep.type],
    category: 'dependency',
    location,
    suggestion: `Remove "${dep.name}" from ${dep.type} in package.json, or verify it is used at runtime/build time`,
    metadata: {
      packageName: pkg.name,
      dependencyName: dep.name,
      dependencyVersion: dep.version,
      dependencyType: dep.type,
    },
  })
}

/**
 * Gets a human-readable description for a dependency type.
 */
function getDependencyTypeDescription(type: DependencyType): string {
  switch (type) {
    case 'dependencies':
      return 'dependency'
    case 'devDependencies':
      return 'dev dependency'
    case 'peerDependencies':
      return 'peer dependency'
    case 'optionalDependencies':
      return 'optional dependency'
  }
}

/**
 * Aggregates import information from multiple packages for workspace-wide analysis.
 */
export function aggregatePackageImports(
  packages: readonly WorkspacePackage[],
  importResults: ReadonlyMap<string, readonly ImportExtractionResult[]>,
): {
  readonly externalByPackage: ReadonlyMap<string, Set<string>>
  readonly workspaceByPackage: ReadonlyMap<string, Set<string>>
} {
  const externalByPackage = new Map<string, Set<string>>()
  const workspaceByPackage = new Map<string, Set<string>>()

  for (const pkg of packages) {
    const results = importResults.get(pkg.name)
    if (results === undefined) {
      continue
    }

    const external = new Set<string>()
    const workspace = new Set<string>()

    for (const result of results) {
      for (const dep of result.externalDependencies) {
        external.add(dep)
      }
      for (const dep of result.workspaceDependencies) {
        workspace.add(dep)
      }
    }

    externalByPackage.set(pkg.name, external)
    workspaceByPackage.set(pkg.name, workspace)
  }

  return {
    externalByPackage,
    workspaceByPackage,
  }
}
