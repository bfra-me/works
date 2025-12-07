/**
 * ConfigConsistencyAnalyzer - Cross-validates configuration across multiple config files.
 *
 * Detects issues such as:
 * - Mismatches between package.json exports and tsconfig outDir
 * - TypeScript target/module inconsistencies with package.json type
 * - Build output directory mismatches
 * - Inconsistent configurations across workspace packages
 */

import type {ParsedPackageJson, ParsedTsConfig} from '../parser/config-parser'
import type {WorkspacePackage} from '../scanner/workspace-scanner'
import type {Issue, IssueLocation} from '../types/index'
import type {Result} from '../types/result'
import type {AnalysisContext, Analyzer, AnalyzerError, AnalyzerMetadata} from './analyzer'

import path from 'node:path'

import {ok} from '@bfra.me/es/result'

import {parseTsConfig} from '../parser/config-parser'
import {createIssue, filterIssues} from './analyzer'

/**
 * Configuration options specific to ConfigConsistencyAnalyzer.
 */
export interface ConfigConsistencyAnalyzerOptions {
  /** Whether to check tsconfig/package.json consistency */
  readonly checkTsconfigPackageJson?: boolean
  /** Whether to check cross-package consistency */
  readonly checkCrossPackage?: boolean
  /** Package names exempt from checks */
  readonly exemptPackages?: readonly string[]
}

const DEFAULT_OPTIONS: ConfigConsistencyAnalyzerOptions = {
  checkTsconfigPackageJson: true,
  checkCrossPackage: true,
  exemptPackages: [],
}

const METADATA: AnalyzerMetadata = {
  id: 'config-consistency',
  name: 'Configuration Consistency Analyzer',
  description:
    'Cross-validates configuration across package.json, tsconfig.json, and build configs',
  categories: ['configuration'],
  defaultSeverity: 'warning',
}

/**
 * Creates a ConfigConsistencyAnalyzer instance.
 */
export function createConfigConsistencyAnalyzer(
  options: ConfigConsistencyAnalyzerOptions = {},
): Analyzer {
  const resolvedOptions = {...DEFAULT_OPTIONS, ...options}

  return {
    metadata: METADATA,
    analyze: async (context: AnalysisContext): Promise<Result<readonly Issue[], AnalyzerError>> => {
      const issues: Issue[] = []

      // Analyze individual package consistency
      for (const pkg of context.packages) {
        if (isExemptPackage(pkg.name, resolvedOptions.exemptPackages)) {
          continue
        }

        if (resolvedOptions.checkTsconfigPackageJson) {
          const packageIssues = await analyzePackageConsistency(pkg)
          issues.push(...packageIssues)
        }
      }

      // Analyze cross-package consistency
      if (resolvedOptions.checkCrossPackage) {
        const crossPackageIssues = analyzeCrossPackageConsistency(context.packages)
        issues.push(...crossPackageIssues)
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

async function analyzePackageConsistency(pkg: WorkspacePackage): Promise<Issue[]> {
  const issues: Issue[] = []
  const pkgJson = pkg.packageJson as ParsedPackageJson

  // Only analyze TypeScript packages
  if (!pkg.hasTsConfig) {
    return issues
  }

  const tsconfigPath = path.join(pkg.packagePath, 'tsconfig.json')
  const tsconfigResult = await parseTsConfig(tsconfigPath)

  if (!tsconfigResult.success) {
    return issues
  }

  const tsconfig = tsconfigResult.data

  // Check package.json type vs tsconfig module settings
  issues.push(...checkTypeModuleConsistency(pkg, pkgJson, tsconfig))

  // Check outDir vs package.json entry points
  issues.push(...checkOutDirConsistency(pkg, pkgJson, tsconfig))

  // Check rootDir configuration
  issues.push(...checkRootDirConsistency(pkg, tsconfig))

  return issues
}

function checkTypeModuleConsistency(
  pkg: WorkspacePackage,
  pkgJson: ParsedPackageJson,
  tsconfig: ParsedTsConfig,
): Issue[] {
  const issues: Issue[] = []
  const opts = tsconfig.compilerOptions

  if (opts?.module === undefined) {
    return issues
  }

  const moduleValue = opts.module.toLowerCase()
  const isEsmPackage = pkgJson.type === 'module'

  // ESM package should use ESM-compatible module setting
  const esmModules = ['esnext', 'es2020', 'es2022', 'node16', 'nodenext']
  const isEsmModule = esmModules.some(m => moduleValue.includes(m))

  if (isEsmPackage && !isEsmModule) {
    issues.push(
      createIssue({
        id: 'config-esm-cjs-module',
        title: 'ESM package with non-ESM tsconfig module',
        description: `Package "${pkg.name}" has "type": "module" but tsconfig uses "${opts.module}"`,
        severity: 'warning',
        category: 'configuration',
        location: createLocation(tsconfig.filePath),
        suggestion: 'Consider using "module": "NodeNext" or "ESNext" for ESM packages',
        metadata: {packageType: pkgJson.type, tsconfigModule: opts.module},
      }),
    )
  }

  // Non-ESM package using ESM module might be intentional but worth noting
  if (!isEsmPackage && isEsmModule) {
    issues.push(
      createIssue({
        id: 'config-cjs-esm-module',
        title: 'CJS package with ESM tsconfig module',
        description: `Package "${pkg.name}" is CJS but tsconfig uses "${opts.module}"`,
        severity: 'info',
        category: 'configuration',
        location: createLocation(tsconfig.filePath),
        suggestion:
          'Ensure build tooling transpiles to CJS format, or add "type": "module" to package.json',
        metadata: {packageType: pkgJson.type ?? 'commonjs', tsconfigModule: opts.module},
      }),
    )
  }

  return issues
}

function checkOutDirConsistency(
  pkg: WorkspacePackage,
  pkgJson: ParsedPackageJson,
  tsconfig: ParsedTsConfig,
): Issue[] {
  const issues: Issue[] = []
  const opts = tsconfig.compilerOptions

  if (opts?.outDir === undefined) {
    return issues
  }

  const outDir = normalizePathSegment(opts.outDir)

  // Check if main entry point uses outDir
  if (pkgJson.main !== undefined) {
    const mainDir = normalizePathSegment(pkgJson.main.split('/')[0] ?? '')

    if (outDir !== mainDir && mainDir !== '' && !mainDir.startsWith('.')) {
      issues.push(
        createIssue({
          id: 'config-outdir-main-mismatch',
          title: 'tsconfig outDir does not match main entry',
          description: `Package "${pkg.name}" tsconfig outDir "${opts.outDir}" but main points to "${mainDir}/"`,
          severity: 'warning',
          category: 'configuration',
          location: createLocation(tsconfig.filePath),
          suggestion: `Align tsconfig outDir with package.json main entry directory`,
          metadata: {outDir: opts.outDir, main: pkgJson.main},
        }),
      )
    }
  }

  // Check exports field consistency
  if (pkgJson.exports !== undefined) {
    const exportPaths = extractExportPaths(pkgJson.exports)
    const mismatchedExports = exportPaths.filter(p => {
      const exportDir = normalizePathSegment(p.split('/')[0] ?? '')
      return exportDir !== '' && exportDir !== outDir && !exportDir.startsWith('.')
    })

    if (mismatchedExports.length > 0) {
      issues.push(
        createIssue({
          id: 'config-outdir-exports-mismatch',
          title: 'tsconfig outDir does not match some exports',
          description: `Package "${pkg.name}" has exports that don't match tsconfig outDir "${opts.outDir}"`,
          severity: 'info',
          category: 'configuration',
          location: createLocation(tsconfig.filePath),
          suggestion: 'Verify exports paths are correct and match build output',
          metadata: {outDir: opts.outDir, mismatchedExports},
        }),
      )
    }
  }

  return issues
}

function checkRootDirConsistency(pkg: WorkspacePackage, tsconfig: ParsedTsConfig): Issue[] {
  const issues: Issue[] = []
  const opts = tsconfig.compilerOptions

  // Check if rootDir is set for packages with src directory
  if (opts?.rootDir === undefined && pkg.srcPath !== '') {
    // Check if src exists
    const srcDirExists = pkg.sourceFiles.some(f => f.includes('/src/'))

    if (srcDirExists) {
      issues.push(
        createIssue({
          id: 'config-no-rootdir',
          title: 'tsconfig missing rootDir',
          description: `Package "${pkg.name}" has src/ directory but tsconfig does not set rootDir`,
          severity: 'info',
          category: 'configuration',
          location: createLocation(tsconfig.filePath),
          suggestion: 'Add "rootDir": "./src" for cleaner output structure',
        }),
      )
    }
  }

  return issues
}

function analyzeCrossPackageConsistency(packages: readonly WorkspacePackage[]): Issue[] {
  const issues: Issue[] = []

  // Check for consistent package.json type across workspace
  const typeModule = packages.filter(p => (p.packageJson as ParsedPackageJson).type === 'module')
  const typeCjs = packages.filter(p => (p.packageJson as ParsedPackageJson).type !== 'module')

  // Mixed types might be intentional, but worth noting if mostly one type
  const total = packages.length
  if (total > 3) {
    const moduleRatio = typeModule.length / total
    const cjsRatio = typeCjs.length / total

    if (moduleRatio > 0.7 && typeCjs.length > 0) {
      const cjsNames = typeCjs.map(p => p.name).slice(0, 5)
      issues.push(
        createIssue({
          id: 'config-mixed-module-types',
          title: 'Mixed module types in workspace',
          description: `Workspace is mostly ESM but ${typeCjs.length} package(s) use CJS: ${cjsNames.join(', ')}${typeCjs.length > 5 ? '...' : ''}`,
          severity: 'info',
          category: 'configuration',
          location: createLocation(packages[0]?.packageJsonPath ?? ''),
          suggestion: 'Consider migrating remaining packages to ESM for consistency',
          metadata: {esmCount: typeModule.length, cjsCount: typeCjs.length, cjsNames},
        }),
      )
    } else if (cjsRatio > 0.7 && typeModule.length > 0) {
      const esmNames = typeModule.map(p => p.name).slice(0, 5)
      issues.push(
        createIssue({
          id: 'config-mixed-module-types',
          title: 'Mixed module types in workspace',
          description: `Workspace is mostly CJS but ${typeModule.length} package(s) use ESM: ${esmNames.join(', ')}${typeModule.length > 5 ? '...' : ''}`,
          severity: 'info',
          category: 'configuration',
          location: createLocation(packages[0]?.packageJsonPath ?? ''),
          suggestion: 'Consider standardizing module format across workspace',
          metadata: {esmCount: typeModule.length, cjsCount: typeCjs.length, esmNames},
        }),
      )
    }
  }

  return issues
}

function normalizePathSegment(segment: string): string {
  return segment.replace(/^\.\//, '').replace(/\/$/, '')
}

function extractExportPaths(exports: Record<string, unknown>): string[] {
  const paths: string[] = []

  function walk(value: unknown): void {
    if (typeof value === 'string') {
      paths.push(value)
    } else if (typeof value === 'object' && value !== null) {
      for (const v of Object.values(value)) {
        walk(v)
      }
    }
  }

  walk(exports)
  return paths
}

export {METADATA as configConsistencyAnalyzerMetadata}
