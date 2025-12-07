/**
 * PeerDependencyAnalyzer - Validates peer dependency declarations in workspace packages.
 *
 * Ensures workspace packages correctly declare peer dependencies for:
 * - Packages that should be provided by consumers
 * - Plugin architectures where host version matters
 * - Framework dependencies that consumers must provide
 *
 * Reports:
 * - Missing peer dependency declarations
 * - Peer dependency version mismatches
 * - Invalid peer dependency ranges
 * - Workspace packages not declared as peers when they should be
 */

import type {WorkspacePackage} from '../scanner/workspace-scanner'
import type {Issue, IssueLocation} from '../types/index'
import type {Result} from '../types/result'
import type {AnalysisContext, Analyzer, AnalyzerError, AnalyzerMetadata} from './analyzer'

import {ok} from '@bfra.me/es/result'

import {createIssue, filterIssues} from './analyzer'

/**
 * Configuration options specific to PeerDependencyAnalyzer.
 */
export interface PeerDependencyAnalyzerOptions {
  /** Packages that should always be declared as peer dependencies */
  readonly requiredPeers?: readonly string[]
  /** Packages that should never be peer dependencies */
  readonly disallowedPeers?: readonly string[]
  /** Whether to check for workspace packages that should be peers */
  readonly checkWorkspacePeers?: boolean
  /** Workspace package prefixes */
  readonly workspacePrefixes?: readonly string[]
  /** Check for peer dependencies that are also in dependencies (dual declaration) */
  readonly checkDualDeclarations?: boolean
}

const DEFAULT_OPTIONS: Required<PeerDependencyAnalyzerOptions> = {
  requiredPeers: [],
  disallowedPeers: [],
  checkWorkspacePeers: true,
  workspacePrefixes: ['@bfra.me/'],
  checkDualDeclarations: true,
}

export const peerDependencyAnalyzerMetadata: AnalyzerMetadata = {
  id: 'peer-dependency',
  name: 'Peer Dependency Analyzer',
  description: 'Validates peer dependency declarations for proper package consumption',
  categories: ['dependency'],
  defaultSeverity: 'warning',
}

/**
 * Creates a PeerDependencyAnalyzer instance.
 *
 * @example
 * ```ts
 * const analyzer = createPeerDependencyAnalyzer({
 *   requiredPeers: ['react', 'typescript'],
 *   checkDualDeclarations: true,
 * })
 * const result = await analyzer.analyze(context)
 * ```
 */
export function createPeerDependencyAnalyzer(
  options: PeerDependencyAnalyzerOptions = {},
): Analyzer {
  const resolvedOptions = {...DEFAULT_OPTIONS, ...options}

  return {
    metadata: peerDependencyAnalyzerMetadata,
    analyze: async (context: AnalysisContext): Promise<Result<readonly Issue[], AnalyzerError>> => {
      const issues: Issue[] = []

      const workspacePackageNames = new Set(context.packages.map(pkg => pkg.name))

      for (const pkg of context.packages) {
        context.reportProgress?.(`Analyzing peer dependencies for ${pkg.name}...`)

        const packageIssues = analyzePackagePeerDependencies(
          pkg,
          workspacePackageNames,
          resolvedOptions,
        )
        issues.push(...packageIssues)
      }

      return ok(filterIssues(issues, context.config))
    },
  }
}

/**
 * Analyzes peer dependencies for a single package.
 */
function analyzePackagePeerDependencies(
  pkg: WorkspacePackage,
  workspacePackageNames: Set<string>,
  options: Required<PeerDependencyAnalyzerOptions>,
): Issue[] {
  const issues: Issue[] = []
  const pkgJson = pkg.packageJson

  const dependencies = pkgJson.dependencies ?? {}
  const peerDependencies = pkgJson.peerDependencies ?? {}
  const devDependencies = pkgJson.devDependencies ?? {}

  // Check for required peer dependencies that are missing
  for (const requiredPeer of options.requiredPeers) {
    const isDep = requiredPeer in dependencies
    const isDevDep = requiredPeer in devDependencies
    const isPeer = requiredPeer in peerDependencies

    if ((isDep || isDevDep) && !isPeer) {
      issues.push(
        createIssue({
          id: 'missing-peer-declaration',
          title: `Missing peer dependency: ${requiredPeer}`,
          description: `Package "${pkg.name}" uses "${requiredPeer}" but does not declare it as a peer dependency`,
          severity: 'warning',
          category: 'dependency',
          location: createLocation(pkg),
          suggestion: `Add "${requiredPeer}" to peerDependencies with an appropriate version range`,
          metadata: {
            packageName: pkg.name,
            missingPeer: requiredPeer,
          },
        }),
      )
    }
  }

  // Check for disallowed peer dependencies
  for (const disallowed of options.disallowedPeers) {
    if (disallowed in peerDependencies) {
      issues.push(
        createIssue({
          id: 'disallowed-peer-dependency',
          title: `Disallowed peer dependency: ${disallowed}`,
          description: `Package "${pkg.name}" should not declare "${disallowed}" as a peer dependency`,
          severity: 'error',
          category: 'dependency',
          location: createLocation(pkg),
          suggestion: `Remove "${disallowed}" from peerDependencies`,
          metadata: {
            packageName: pkg.name,
            disallowedPeer: disallowed,
          },
        }),
      )
    }
  }

  // Check for dual declarations (dependency + peer dependency)
  if (options.checkDualDeclarations) {
    for (const peerName of Object.keys(peerDependencies)) {
      if (peerName in dependencies) {
        issues.push(
          createIssue({
            id: 'dual-dependency-declaration',
            title: `Dual declaration: ${peerName}`,
            description: `Package "${pkg.name}" declares "${peerName}" in both dependencies and peerDependencies`,
            severity: 'info',
            category: 'dependency',
            location: createLocation(pkg),
            suggestion: `Remove "${peerName}" from dependencies if consumers should provide it, or from peerDependencies if you bundle it`,
            metadata: {
              packageName: pkg.name,
              dualDependency: peerName,
              dependencyVersion: dependencies[peerName],
              peerVersion: peerDependencies[peerName],
            },
          }),
        )
      }
    }
  }

  // Check workspace packages used as dependencies that might need to be peers
  if (options.checkWorkspacePeers) {
    for (const [depName, depVersion] of Object.entries(dependencies)) {
      const isWorkspaceDep =
        workspacePackageNames.has(depName) ||
        options.workspacePrefixes.some(prefix => depName.startsWith(prefix))
      const isWorkspaceVersion = depVersion.startsWith('workspace:')
      const isPeer = depName in peerDependencies

      // Workspace dependencies with non-workspace versions might indicate a peer dep need
      if (isWorkspaceDep && !isWorkspaceVersion && !isPeer) {
        issues.push(
          createIssue({
            id: 'workspace-peer-candidate',
            title: `Workspace package should be peer: ${depName}`,
            description: `Package "${pkg.name}" uses workspace package "${depName}" with version "${depVersion}" instead of workspace: protocol`,
            severity: 'info',
            category: 'dependency',
            location: createLocation(pkg),
            suggestion: `Consider using "workspace:*" for internal packages or declaring as peerDependency if consumers should provide it`,
            metadata: {
              packageName: pkg.name,
              dependencyName: depName,
              currentVersion: depVersion,
            },
          }),
        )
      }
    }
  }

  // Check peer dependency version ranges for validity
  for (const [peerName, peerVersion] of Object.entries(peerDependencies)) {
    if (!isValidVersionRange(peerVersion)) {
      issues.push(
        createIssue({
          id: 'invalid-peer-version',
          title: `Invalid peer version range: ${peerName}`,
          description: `Package "${pkg.name}" has an invalid version range "${peerVersion}" for peer dependency "${peerName}"`,
          severity: 'error',
          category: 'dependency',
          location: createLocation(pkg),
          suggestion: `Use a valid semver range like ">=1.0.0", "^2.0.0", or ">=1.0.0 <3.0.0"`,
          metadata: {
            packageName: pkg.name,
            peerName,
            invalidVersion: peerVersion,
          },
        }),
      )
    }
  }

  return issues
}

/**
 * Creates a location pointing to the package.json file.
 */
function createLocation(pkg: WorkspacePackage): IssueLocation {
  return {
    filePath: pkg.packageJsonPath,
  }
}

/**
 * Basic validation for semver version ranges.
 */
function isValidVersionRange(version: string): boolean {
  if (version.length === 0) {
    return false
  }

  // workspace: protocol is valid
  if (version.startsWith('workspace:')) {
    return true
  }

  // Common invalid patterns
  if (version === 'latest' || version === '*' || version === '') {
    return false
  }

  // Basic semver-like patterns (use non-capturing groups for validation only)
  const semverPattern =
    /^[\^~>=<]?\d+(?:\.\d+)?(?:\.\d+)?(?:-[\w.]+)?(?:\+[\w.]+)?(?:\s*(?:&&|\|\|)\s*[\^~>=<]?\d+(?:\.\d+)?(?:\.\d+)?(?:-[\w.]+)?(?:\+[\w.]+)?)*$/
  const rangePattern = /^>=?\d+(?:\.\d+)?(?:\.\d+)?\s+<?=?\d+(?:\.\d+)?(?:\.\d+)?$/
  const xRangePattern = /^\d+(?:\.\d+)?\.x$/

  return semverPattern.test(version) || rangePattern.test(version) || xRangePattern.test(version)
}
