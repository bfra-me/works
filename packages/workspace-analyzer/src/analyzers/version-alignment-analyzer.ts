/**
 * VersionAlignmentAnalyzer - Checks for consistent dependency versions across workspace.
 *
 * Detects issues such as:
 * - Different versions of the same dependency across packages
 * - Workspace packages with mismatched versions
 * - Invalid workspace: protocol references
 */

import type {ParsedPackageJson} from '../parser/config-parser'
import type {WorkspacePackage} from '../scanner/workspace-scanner'
import type {Issue, IssueLocation} from '../types/index'
import type {Result} from '../types/result'
import type {AnalysisContext, Analyzer, AnalyzerError, AnalyzerMetadata} from './analyzer'

import {ok} from '@bfra.me/es/result'

import {createIssue, filterIssues} from './analyzer'

/**
 * Configuration options specific to VersionAlignmentAnalyzer.
 */
export interface VersionAlignmentAnalyzerOptions {
  /** Whether to check for misaligned external dependency versions */
  readonly checkExternalVersions?: boolean
  /** Whether to check workspace protocol references */
  readonly checkWorkspaceProtocol?: boolean
  /** Dependencies to ignore in version alignment checks */
  readonly ignoreDependencies?: readonly string[]
  /** Package names exempt from checks */
  readonly exemptPackages?: readonly string[]
}

const DEFAULT_OPTIONS: VersionAlignmentAnalyzerOptions = {
  checkExternalVersions: true,
  checkWorkspaceProtocol: true,
  ignoreDependencies: [],
  exemptPackages: [],
}

const METADATA: AnalyzerMetadata = {
  id: 'version-alignment',
  name: 'Version Alignment Analyzer',
  description: 'Checks for consistent dependency versions across workspace packages',
  categories: ['dependency'],
  defaultSeverity: 'warning',
}

/**
 * Information about a dependency version usage.
 */
interface VersionUsage {
  readonly packageName: string
  readonly version: string
  readonly type: 'prod' | 'dev' | 'peer' | 'optional'
  readonly packageJsonPath: string
}

/**
 * Creates a VersionAlignmentAnalyzer instance.
 */
export function createVersionAlignmentAnalyzer(
  options: VersionAlignmentAnalyzerOptions = {},
): Analyzer {
  const resolvedOptions = {...DEFAULT_OPTIONS, ...options}

  return {
    metadata: METADATA,
    analyze: async (context: AnalysisContext): Promise<Result<readonly Issue[], AnalyzerError>> => {
      const issues: Issue[] = []

      // Build a map of all dependency versions across workspace
      const dependencyMap = buildDependencyMap(context.packages, resolvedOptions)

      // Check for version misalignment
      if (resolvedOptions.checkExternalVersions) {
        const alignmentIssues = checkVersionAlignment(dependencyMap, resolvedOptions)
        issues.push(...alignmentIssues)
      }

      // Check workspace protocol usage
      if (resolvedOptions.checkWorkspaceProtocol) {
        const workspaceIssues = checkWorkspaceProtocol(context.packages, resolvedOptions)
        issues.push(...workspaceIssues)
      }

      return ok(filterIssues(issues, context.config))
    },
  }
}

function createLocation(filePath: string): IssueLocation {
  return {filePath}
}

/**
 * Builds a map of all dependencies and their versions across the workspace.
 */
function buildDependencyMap(
  packages: readonly WorkspacePackage[],
  options: VersionAlignmentAnalyzerOptions,
): Map<string, VersionUsage[]> {
  const dependencyMap = new Map<string, VersionUsage[]>()
  const ignoredDeps = new Set(options.ignoreDependencies ?? [])
  const exemptPackages = new Set(options.exemptPackages ?? [])

  for (const pkg of packages) {
    if (exemptPackages.has(pkg.name)) {
      continue
    }

    const pkgJson = pkg.packageJson as ParsedPackageJson

    // Process each dependency type
    const depTypes = [
      {deps: pkgJson.dependencies, type: 'prod' as const},
      {deps: pkgJson.devDependencies, type: 'dev' as const},
      {deps: pkgJson.peerDependencies, type: 'peer' as const},
      {deps: pkgJson.optionalDependencies, type: 'optional' as const},
    ]

    for (const {deps, type} of depTypes) {
      if (deps === undefined) {
        continue
      }

      for (const [depName, version] of Object.entries(deps)) {
        // Skip workspace protocol and ignored dependencies
        if (version.startsWith('workspace:') || ignoredDeps.has(depName)) {
          continue
        }

        const usages = dependencyMap.get(depName) ?? []
        usages.push({
          packageName: pkg.name,
          version,
          type,
          packageJsonPath: pkg.packageJsonPath,
        })
        dependencyMap.set(depName, usages)
      }
    }
  }

  return dependencyMap
}

/**
 * Checks for version alignment issues in the dependency map.
 */
function checkVersionAlignment(
  dependencyMap: Map<string, VersionUsage[]>,
  _options: VersionAlignmentAnalyzerOptions,
): Issue[] {
  const issues: Issue[] = []

  for (const [depName, usages] of dependencyMap) {
    if (usages.length <= 1) {
      continue
    }

    // Group by normalized version
    const versionGroups = groupByVersion(usages)

    if (versionGroups.size <= 1) {
      continue
    }

    // Different versions detected
    const versionList = Array.from(versionGroups.entries())
      .map(([version, pkgs]) => `"${version}" in ${pkgs.join(', ')}`)
      .join('; ')

    // Find the most common version
    let mostCommonVersion = ''
    let maxCount = 0
    for (const [version, pkgs] of versionGroups) {
      if (pkgs.length > maxCount) {
        maxCount = pkgs.length
        mostCommonVersion = version
      }
    }

    // Report issues for non-common versions
    for (const [version, pkgs] of versionGroups) {
      if (version === mostCommonVersion) {
        continue
      }

      for (const packageName of pkgs) {
        const usage = usages.find(u => u.packageName === packageName && u.version === version)
        if (usage === undefined) {
          continue
        }

        issues.push(
          createIssue({
            id: 'version-mismatch',
            title: 'Dependency version mismatch',
            description: `Dependency "${depName}" has inconsistent versions across workspace: ${versionList}`,
            severity: 'warning',
            category: 'dependency',
            location: createLocation(usage.packageJsonPath),
            suggestion: `Consider aligning to version "${mostCommonVersion}" used by ${maxCount} package(s)`,
            metadata: {
              dependency: depName,
              currentVersion: version,
              suggestedVersion: mostCommonVersion,
              allVersions: Object.fromEntries(versionGroups),
            },
          }),
        )
      }
    }
  }

  return issues
}

/**
 * Groups usages by their normalized version.
 */
function groupByVersion(usages: VersionUsage[]): Map<string, string[]> {
  const groups = new Map<string, string[]>()

  for (const usage of usages) {
    // Normalize version for comparison (remove leading ^ or ~)
    const normalizedVersion = usage.version

    const packages = groups.get(normalizedVersion) ?? []
    packages.push(usage.packageName)
    groups.set(normalizedVersion, packages)
  }

  return groups
}

/**
 * Checks workspace protocol usage for issues.
 */
function checkWorkspaceProtocol(
  packages: readonly WorkspacePackage[],
  options: VersionAlignmentAnalyzerOptions,
): Issue[] {
  const issues: Issue[] = []
  const packageNames = new Set(packages.map(p => p.name))
  const exemptPackages = new Set(options.exemptPackages ?? [])

  for (const pkg of packages) {
    if (exemptPackages.has(pkg.name)) {
      continue
    }

    const pkgJson = pkg.packageJson as ParsedPackageJson

    // Check all dependency types
    const depTypes = [
      {deps: pkgJson.dependencies, type: 'dependencies'},
      {deps: pkgJson.devDependencies, type: 'devDependencies'},
      {deps: pkgJson.peerDependencies, type: 'peerDependencies'},
    ]

    for (const {deps, type} of depTypes) {
      if (deps === undefined) {
        continue
      }

      for (const [depName, version] of Object.entries(deps)) {
        // Check for workspace: protocol pointing to non-existent package
        if (version.startsWith('workspace:') && !packageNames.has(depName)) {
          issues.push(
            createIssue({
              id: 'workspace-invalid-ref',
              title: 'Invalid workspace protocol reference',
              description: `Package "${pkg.name}" references "${depName}" with workspace: protocol, but package does not exist in workspace`,
              severity: 'error',
              category: 'dependency',
              location: createLocation(pkg.packageJsonPath),
              suggestion: `Either add "${depName}" to the workspace or use a valid npm version`,
              metadata: {dependency: depName, version, dependencyType: type},
            }),
          )
        }

        // Check for workspace package without workspace: protocol
        if (!version.startsWith('workspace:') && packageNames.has(depName)) {
          // Not necessarily an error - might be using published version
          issues.push(
            createIssue({
              id: 'workspace-missing-protocol',
              title: 'Workspace package without workspace: protocol',
              description: `Package "${pkg.name}" depends on workspace package "${depName}" but uses version "${version}" instead of workspace: protocol`,
              severity: 'info',
              category: 'dependency',
              location: createLocation(pkg.packageJsonPath),
              suggestion: `Consider using "workspace:*" to link to the local package`,
              metadata: {dependency: depName, version, dependencyType: type},
            }),
          )
        }
      }
    }
  }

  return issues
}

export {METADATA as versionAlignmentAnalyzerMetadata}
