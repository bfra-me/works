/**
 * DuplicateDependencyAnalyzer - Detects duplicate and inconsistent dependencies across workspace packages.
 *
 * Identifies:
 * - Same dependency with different versions across packages
 * - Dependencies that could be hoisted to workspace root
 * - Redundant devDependencies that match production dependencies
 * - Version conflicts that may cause runtime issues
 */

import type {WorkspacePackage} from '../scanner/workspace-scanner'
import type {Issue, IssueLocation, Severity} from '../types/index'
import type {Result} from '../types/result'
import type {AnalysisContext, Analyzer, AnalyzerError, AnalyzerMetadata} from './analyzer'

import {ok} from '@bfra.me/es/result'

import {createIssue, filterIssues} from './analyzer'

/**
 * Configuration options specific to DuplicateDependencyAnalyzer.
 */
export interface DuplicateDependencyAnalyzerOptions {
  /** Ignore version differences for these packages */
  readonly ignorePackages?: readonly string[]
  /** Severity for version conflicts */
  readonly conflictSeverity?: Severity
  /** Whether to suggest hoisting common dependencies */
  readonly suggestHoisting?: boolean
  /** Minimum number of packages using a dependency to suggest hoisting */
  readonly hoistingThreshold?: number
  /** Check for redundant dev dependencies */
  readonly checkRedundantDev?: boolean
}

const DEFAULT_OPTIONS: Required<DuplicateDependencyAnalyzerOptions> = {
  ignorePackages: [],
  conflictSeverity: 'warning',
  suggestHoisting: true,
  hoistingThreshold: 3,
  checkRedundantDev: true,
}

export const duplicateDependencyAnalyzerMetadata: AnalyzerMetadata = {
  id: 'duplicate-dependency',
  name: 'Duplicate Dependency Analyzer',
  description: 'Detects duplicate and version-inconsistent dependencies across workspace packages',
  categories: ['dependency'],
  defaultSeverity: 'warning',
}

/**
 * Information about a dependency occurrence.
 */
interface DependencyOccurrence {
  readonly packageName: string
  readonly version: string
  readonly type: 'dependencies' | 'devDependencies' | 'peerDependencies' | 'optionalDependencies'
  readonly packageJsonPath: string
}

/**
 * Aggregated dependency information across all packages.
 */
interface DependencyInfo {
  readonly dependencyName: string
  readonly occurrences: readonly DependencyOccurrence[]
  readonly versions: readonly string[]
  readonly hasConflict: boolean
}

/**
 * Creates a DuplicateDependencyAnalyzer instance.
 *
 * @example
 * ```ts
 * const analyzer = createDuplicateDependencyAnalyzer({
 *   conflictSeverity: 'error',
 *   suggestHoisting: true,
 * })
 * const result = await analyzer.analyze(context)
 * ```
 */
export function createDuplicateDependencyAnalyzer(
  options: DuplicateDependencyAnalyzerOptions = {},
): Analyzer {
  const resolvedOptions = {...DEFAULT_OPTIONS, ...options}

  return {
    metadata: duplicateDependencyAnalyzerMetadata,
    analyze: async (context: AnalysisContext): Promise<Result<readonly Issue[], AnalyzerError>> => {
      const issues: Issue[] = []

      context.reportProgress?.('Collecting dependency information across workspace...')

      const dependencyMap = collectDependencies(context.packages)

      context.reportProgress?.('Analyzing for duplicates and conflicts...')

      // Check for version conflicts
      for (const [depName, info] of dependencyMap) {
        if (isIgnored(depName, resolvedOptions.ignorePackages)) {
          continue
        }

        if (info.hasConflict) {
          issues.push(createVersionConflictIssue(info, resolvedOptions))
        }

        // Suggest hoisting if same version used in multiple packages
        if (
          resolvedOptions.suggestHoisting &&
          info.occurrences.length >= resolvedOptions.hoistingThreshold &&
          !info.hasConflict
        ) {
          issues.push(createHoistingSuggestion(info, resolvedOptions))
        }
      }

      // Check for redundant dev dependencies
      if (resolvedOptions.checkRedundantDev) {
        for (const pkg of context.packages) {
          issues.push(...checkRedundantDevDependencies(pkg))
        }
      }

      return ok(filterIssues(issues, context.config))
    },
  }
}

/**
 * Collects all dependencies from all packages into a unified map.
 */
function collectDependencies(packages: readonly WorkspacePackage[]): Map<string, DependencyInfo> {
  const depMap = new Map<string, DependencyOccurrence[]>()

  for (const pkg of packages) {
    const pkgJson = pkg.packageJson

    collectFromObject(depMap, pkg, pkgJson.dependencies, 'dependencies')
    collectFromObject(depMap, pkg, pkgJson.devDependencies, 'devDependencies')
    collectFromObject(depMap, pkg, pkgJson.peerDependencies, 'peerDependencies')
    collectFromObject(depMap, pkg, pkgJson.optionalDependencies, 'optionalDependencies')
  }

  const result = new Map<string, DependencyInfo>()

  for (const [depName, occurrences] of depMap) {
    const versions = [...new Set(occurrences.map(o => normalizeVersion(o.version)))].sort()
    const hasConflict = versions.length > 1

    result.set(depName, {
      dependencyName: depName,
      occurrences,
      versions,
      hasConflict,
    })
  }

  return result
}

/**
 * Collects dependencies from a dependency object.
 */
function collectFromObject(
  depMap: Map<string, DependencyOccurrence[]>,
  pkg: WorkspacePackage,
  deps: Readonly<Record<string, string>> | undefined,
  type: DependencyOccurrence['type'],
): void {
  if (deps === undefined) {
    return
  }

  for (const [depName, version] of Object.entries(deps)) {
    const occurrence: DependencyOccurrence = {
      packageName: pkg.name,
      version,
      type,
      packageJsonPath: pkg.packageJsonPath,
    }

    const existing = depMap.get(depName)
    if (existing === undefined) {
      depMap.set(depName, [occurrence])
    } else {
      existing.push(occurrence)
    }
  }
}

/**
 * Normalizes a version string for comparison.
 * Removes workspace: prefix and leading ^ or ~ for basic comparison.
 */
function normalizeVersion(version: string): string {
  let normalized = version

  // Handle workspace protocol
  if (normalized.startsWith('workspace:')) {
    normalized = normalized.slice('workspace:'.length)
  }

  // Keep the original if it's a range operator we want to compare
  // Only normalize simple prefixes for exact matching
  if (normalized.startsWith('^') || normalized.startsWith('~')) {
    return normalized
  }

  return normalized
}

/**
 * Checks if a dependency should be ignored.
 */
function isIgnored(depName: string, ignorePackages: readonly string[]): boolean {
  return ignorePackages.some(pattern => {
    if (pattern.includes('*')) {
      const regex = new RegExp(`^${pattern.replaceAll('*', '.*')}$`)
      return regex.test(depName)
    }
    return depName === pattern
  })
}

/**
 * Creates an issue for a version conflict.
 */
function createVersionConflictIssue(
  info: DependencyInfo,
  options: Required<DuplicateDependencyAnalyzerOptions>,
): Issue {
  const firstOccurrence = info.occurrences[0]
  const location: IssueLocation = {
    filePath: firstOccurrence?.packageJsonPath ?? '',
  }

  const relatedLocations: IssueLocation[] = info.occurrences.slice(1).map(o => ({
    filePath: o.packageJsonPath,
  }))

  const versionList = info.occurrences
    .map(o => `  - ${o.packageName}: ${o.version} (${o.type})`)
    .join('\n')

  return createIssue({
    id: 'version-conflict',
    title: `Version conflict: ${info.dependencyName}`,
    description: `Dependency "${info.dependencyName}" has ${info.versions.length} different versions across packages:\n${versionList}`,
    severity: options.conflictSeverity,
    category: 'dependency',
    location,
    relatedLocations,
    suggestion: `Align all packages to use the same version of "${info.dependencyName}" to avoid potential runtime issues`,
    metadata: {
      dependencyName: info.dependencyName,
      versions: info.versions,
      packages: info.occurrences.map(o => o.packageName),
    },
  })
}

/**
 * Creates a suggestion to hoist a dependency.
 */
function createHoistingSuggestion(
  info: DependencyInfo,
  _options: Required<DuplicateDependencyAnalyzerOptions>,
): Issue {
  const firstOccurrence = info.occurrences[0]
  const location: IssueLocation = {
    filePath: firstOccurrence?.packageJsonPath ?? '',
  }

  const packageCount = info.occurrences.length
  const packageNames = info.occurrences.map(o => o.packageName).join(', ')

  return createIssue({
    id: 'hoisting-candidate',
    title: `Hoisting candidate: ${info.dependencyName}`,
    description: `Dependency "${info.dependencyName}" is used in ${packageCount} packages (${packageNames}) with the same version`,
    severity: 'info',
    category: 'dependency',
    location,
    suggestion: `Consider hoisting "${info.dependencyName}" to the workspace root package.json to reduce duplication`,
    metadata: {
      dependencyName: info.dependencyName,
      version: info.versions[0],
      packageCount,
      packages: info.occurrences.map(o => o.packageName),
    },
  })
}

/**
 * Checks for redundant dev dependencies (same package in both deps and devDeps).
 */
function checkRedundantDevDependencies(pkg: WorkspacePackage): Issue[] {
  const issues: Issue[] = []
  const pkgJson = pkg.packageJson

  if (pkgJson.dependencies === undefined || pkgJson.devDependencies === undefined) {
    return issues
  }

  for (const [depName, devVersion] of Object.entries(pkgJson.devDependencies)) {
    if (depName in pkgJson.dependencies) {
      const prodVersion = pkgJson.dependencies[depName]

      issues.push(
        createIssue({
          id: 'redundant-dev-dependency',
          title: `Redundant dev dependency: ${depName}`,
          description: `Package "${pkg.name}" has "${depName}" in both dependencies (${prodVersion}) and devDependencies (${devVersion})`,
          severity: 'info',
          category: 'dependency',
          location: {filePath: pkg.packageJsonPath},
          suggestion: `Remove "${depName}" from devDependencies as it's already in dependencies`,
          metadata: {
            packageName: pkg.name,
            dependencyName: depName,
            prodVersion,
            devVersion,
          },
        }),
      )
    }
  }

  return issues
}

/**
 * Aggregates duplicate dependency statistics.
 */
export interface DuplicateDependencyStats {
  /** Total unique dependencies across workspace */
  readonly totalUniqueDependencies: number
  /** Number of dependencies with version conflicts */
  readonly conflictingDependencies: number
  /** Number of packages with redundant dev dependencies */
  readonly packagesWithRedundantDev: number
  /** Dependencies appearing in most packages */
  readonly mostCommon: readonly {readonly name: string; readonly count: number}[]
  /** Dependencies with the most version variants */
  readonly mostVariants: readonly {readonly name: string; readonly versionCount: number}[]
}

/**
 * Computes statistics about dependency duplicates.
 */
export function computeDuplicateStats(
  dependencyMap: ReadonlyMap<string, DependencyInfo>,
  topN = 10,
): DuplicateDependencyStats {
  let conflictingDependencies = 0
  const commonDeps: {name: string; count: number}[] = []
  const variantDeps: {name: string; versionCount: number}[] = []

  for (const [name, info] of dependencyMap) {
    if (info.hasConflict) {
      conflictingDependencies++
    }

    commonDeps.push({name, count: info.occurrences.length})
    variantDeps.push({name, versionCount: info.versions.length})
  }

  commonDeps.sort((a, b) => b.count - a.count)
  variantDeps.sort((a, b) => b.versionCount - a.versionCount)

  return {
    totalUniqueDependencies: dependencyMap.size,
    conflictingDependencies,
    packagesWithRedundantDev: 0, // Computed separately per-package
    mostCommon: commonDeps.slice(0, topN),
    mostVariants: variantDeps.filter(d => d.versionCount > 1).slice(0, topN),
  }
}
