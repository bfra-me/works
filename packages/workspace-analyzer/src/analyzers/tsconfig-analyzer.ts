/**
 * TsconfigAnalyzer - Validates tsconfig.json configuration for consistency and best practices.
 *
 * Detects issues such as:
 * - Missing recommended compiler options
 * - Inconsistent settings across packages
 * - Invalid path mappings
 * - Missing project references
 */

import type {ParsedTsConfig} from '../parser/config-parser'
import type {WorkspacePackage} from '../scanner/workspace-scanner'
import type {Issue, IssueLocation} from '../types/index'
import type {Result} from '../types/result'
import type {AnalysisContext, Analyzer, AnalyzerError, AnalyzerMetadata} from './analyzer'

import path from 'node:path'

import {ok} from '@bfra.me/es/result'

import {parseTsConfig} from '../parser/config-parser'
import {createIssue, filterIssues} from './analyzer'

/**
 * Configuration options specific to TsconfigAnalyzer.
 */
export interface TsconfigAnalyzerOptions {
  /** Whether to check for strict mode */
  readonly requireStrict?: boolean
  /** Whether to require explicit module settings */
  readonly requireModuleSettings?: boolean
  /** Whether to check path mapping consistency */
  readonly checkPaths?: boolean
  /** Whether to require project references in monorepo */
  readonly requireReferences?: boolean
  /** Package names exempt from certain checks */
  readonly exemptPackages?: readonly string[]
  /** Expected base tsconfig to extend from */
  readonly expectedExtends?: string
}

const DEFAULT_OPTIONS: TsconfigAnalyzerOptions = {
  requireStrict: true,
  requireModuleSettings: true,
  checkPaths: true,
  requireReferences: false,
  exemptPackages: [],
}

const METADATA: AnalyzerMetadata = {
  id: 'tsconfig',
  name: 'TSConfig Analyzer',
  description: 'Validates tsconfig.json configuration for consistency and best practices',
  categories: ['configuration'],
  defaultSeverity: 'warning',
}

/**
 * Creates a TsconfigAnalyzer instance.
 */
export function createTsconfigAnalyzer(options: TsconfigAnalyzerOptions = {}): Analyzer {
  const resolvedOptions = {...DEFAULT_OPTIONS, ...options}

  return {
    metadata: METADATA,
    analyze: async (context: AnalysisContext): Promise<Result<readonly Issue[], AnalyzerError>> => {
      const issues: Issue[] = []

      for (const pkg of context.packages) {
        if (!pkg.hasTsConfig) {
          continue
        }

        if (isExemptPackage(pkg.name, resolvedOptions.exemptPackages)) {
          continue
        }

        const tsconfigPath = path.join(pkg.packagePath, 'tsconfig.json')
        const parseResult = await parseTsConfig(tsconfigPath)

        if (!parseResult.success) {
          issues.push(
            createIssue({
              id: 'tsconfig-parse-error',
              title: 'Failed to parse tsconfig.json',
              description: `Package "${pkg.name}": ${parseResult.error.message}`,
              severity: 'error',
              category: 'configuration',
              location: {filePath: tsconfigPath},
            }),
          )
          continue
        }

        const packageIssues = analyzePackageTsconfig(
          pkg,
          parseResult.data,
          resolvedOptions,
          context.packages,
        )
        issues.push(...packageIssues)
      }

      return ok(filterIssues(issues, context.config))
    },
  }
}

function isExemptPackage(name: string, exemptPackages: readonly string[] | undefined): boolean {
  return exemptPackages?.includes(name) ?? false
}

function createLocation(filePath: string): IssueLocation {
  return {filePath}
}

function analyzePackageTsconfig(
  pkg: WorkspacePackage,
  tsconfig: ParsedTsConfig,
  options: TsconfigAnalyzerOptions,
  allPackages: readonly WorkspacePackage[],
): Issue[] {
  const issues: Issue[] = []

  // Check extends
  if (options.expectedExtends !== undefined) {
    issues.push(...checkExtends(pkg, tsconfig, options.expectedExtends))
  }

  // Check strict mode
  if (options.requireStrict) {
    issues.push(...checkStrictMode(pkg, tsconfig))
  }

  // Check module settings
  if (options.requireModuleSettings) {
    issues.push(...checkModuleSettings(pkg, tsconfig))
  }

  // Check path mappings
  if (options.checkPaths) {
    issues.push(...checkPathMappings(pkg, tsconfig, allPackages))
  }

  // Check project references
  if (options.requireReferences) {
    issues.push(...checkReferences(pkg, tsconfig, allPackages))
  }

  // Check common issues
  issues.push(...checkCommonIssues(pkg, tsconfig))

  return issues
}

function checkExtends(
  pkg: WorkspacePackage,
  tsconfig: ParsedTsConfig,
  expectedExtends: string,
): Issue[] {
  const issues: Issue[] = []

  if (tsconfig.extends === undefined) {
    issues.push(
      createIssue({
        id: 'tsconfig-no-extends',
        title: 'TSConfig does not extend shared config',
        description: `Package "${pkg.name}" does not extend "${expectedExtends}"`,
        severity: 'warning',
        category: 'configuration',
        location: createLocation(tsconfig.filePath),
        suggestion: `Add "extends": "${expectedExtends}" for consistent configuration`,
      }),
    )
    return issues
  }

  const extendsArray: readonly string[] = Array.isArray(tsconfig.extends)
    ? tsconfig.extends
    : [tsconfig.extends]
  const firstExtends = extendsArray[0]

  if (typeof firstExtends === 'string' && !firstExtends.includes(expectedExtends)) {
    issues.push(
      createIssue({
        id: 'tsconfig-wrong-extends',
        title: 'TSConfig extends unexpected config',
        description: `Package "${pkg.name}" extends "${firstExtends}" instead of "${expectedExtends}"`,
        severity: 'info',
        category: 'configuration',
        location: createLocation(tsconfig.filePath),
        suggestion: `Consider extending "${expectedExtends}" for consistent configuration`,
      }),
    )
  }

  return issues
}

function checkStrictMode(pkg: WorkspacePackage, tsconfig: ParsedTsConfig): Issue[] {
  const issues: Issue[] = []
  const opts = tsconfig.compilerOptions

  if (opts?.strict !== true) {
    issues.push(
      createIssue({
        id: 'tsconfig-not-strict',
        title: 'TSConfig strict mode disabled',
        description: `Package "${pkg.name}" does not have "strict": true in compilerOptions`,
        severity: 'warning',
        category: 'configuration',
        location: createLocation(tsconfig.filePath),
        suggestion: 'Enable "strict": true for better type safety',
      }),
    )
  }

  return issues
}

function checkModuleSettings(pkg: WorkspacePackage, tsconfig: ParsedTsConfig): Issue[] {
  const issues: Issue[] = []
  const opts = tsconfig.compilerOptions

  // Check for isolatedModules (required for most bundlers)
  if (opts?.isolatedModules !== true) {
    issues.push(
      createIssue({
        id: 'tsconfig-isolated-modules',
        title: 'TSConfig isolatedModules disabled',
        description: `Package "${pkg.name}" does not have "isolatedModules": true`,
        severity: 'info',
        category: 'configuration',
        location: createLocation(tsconfig.filePath),
        suggestion: 'Enable "isolatedModules": true for bundler compatibility',
      }),
    )
  }

  // Check moduleResolution for modern packages
  if (opts?.moduleResolution !== undefined) {
    const modernResolutions = ['node16', 'nodenext', 'bundler']
    const resolution = opts.moduleResolution.toLowerCase()

    if (!modernResolutions.includes(resolution)) {
      issues.push(
        createIssue({
          id: 'tsconfig-legacy-resolution',
          title: 'TSConfig uses legacy module resolution',
          description: `Package "${pkg.name}" uses "${opts.moduleResolution}" module resolution`,
          severity: 'info',
          category: 'configuration',
          location: createLocation(tsconfig.filePath),
          suggestion: 'Consider using "NodeNext" or "Bundler" for modern module resolution',
        }),
      )
    }
  }

  return issues
}

function checkPathMappings(
  pkg: WorkspacePackage,
  tsconfig: ParsedTsConfig,
  allPackages: readonly WorkspacePackage[],
): Issue[] {
  const issues: Issue[] = []
  const paths = tsconfig.compilerOptions?.paths

  if (paths === undefined) {
    return issues
  }

  // Check for path mappings to workspace packages
  for (const [alias, targets] of Object.entries(paths)) {
    // Check if this looks like a workspace package reference
    if (alias.startsWith('@') && targets.length > 0) {
      const targetPath = targets[0]
      if (targetPath === undefined) {
        continue
      }

      // Verify the target package exists
      const isWorkspacePackage = allPackages.some(p => {
        const relativePath = path.relative(pkg.packagePath, p.packagePath)
        return targetPath.includes(relativePath) || alias === p.name
      })

      if (!isWorkspacePackage && !targetPath.includes('node_modules')) {
        issues.push(
          createIssue({
            id: 'tsconfig-invalid-path',
            title: 'TSConfig path mapping may be invalid',
            description: `Package "${pkg.name}" has path mapping "${alias}" -> "${targetPath}" that may not resolve correctly`,
            severity: 'info',
            category: 'configuration',
            location: createLocation(tsconfig.filePath),
            suggestion: 'Verify the path mapping resolves to an existing package or module',
            metadata: {alias, targets},
          }),
        )
      }
    }
  }

  return issues
}

function checkReferences(
  pkg: WorkspacePackage,
  tsconfig: ParsedTsConfig,
  allPackages: readonly WorkspacePackage[],
): Issue[] {
  const issues: Issue[] = []

  // Get workspace dependencies from package.json
  const deps = {
    ...(pkg.packageJson.dependencies ?? {}),
    ...(pkg.packageJson.devDependencies ?? {}),
  }

  const workspaceDeps = Object.keys(deps).filter(dep => {
    return allPackages.some(p => p.name === dep)
  })

  if (workspaceDeps.length > 0 && tsconfig.references === undefined) {
    issues.push(
      createIssue({
        id: 'tsconfig-missing-references',
        title: 'TSConfig missing project references',
        description: `Package "${pkg.name}" depends on workspace packages but has no project references`,
        severity: 'info',
        category: 'configuration',
        location: createLocation(tsconfig.filePath),
        suggestion: 'Add "references" array for incremental builds',
        metadata: {workspaceDeps},
      }),
    )
  }

  return issues
}

function checkCommonIssues(pkg: WorkspacePackage, tsconfig: ParsedTsConfig): Issue[] {
  const issues: Issue[] = []
  const opts = tsconfig.compilerOptions

  // Check for missing outDir when declaration is true
  if (opts?.declaration === true && opts.outDir === undefined) {
    issues.push(
      createIssue({
        id: 'tsconfig-declaration-no-outdir',
        title: 'TSConfig declaration without outDir',
        description: `Package "${pkg.name}" has "declaration": true but no "outDir" specified`,
        severity: 'warning',
        category: 'configuration',
        location: createLocation(tsconfig.filePath),
        suggestion: 'Add "outDir" to specify where declaration files should be generated',
      }),
    )
  }

  // Check skipLibCheck (usually recommended for performance)
  if (opts?.skipLibCheck !== true) {
    issues.push(
      createIssue({
        id: 'tsconfig-no-skip-lib-check',
        title: 'TSConfig skipLibCheck disabled',
        description: `Package "${pkg.name}" does not have "skipLibCheck": true`,
        severity: 'info',
        category: 'configuration',
        location: createLocation(tsconfig.filePath),
        suggestion: 'Enable "skipLibCheck": true for faster compilation',
      }),
    )
  }

  return issues
}

export {METADATA as tsconfigAnalyzerMetadata}
