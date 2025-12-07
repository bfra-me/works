/**
 * ExportsFieldAnalyzer - Validates package.json exports against actual source structure.
 *
 * Detects issues such as:
 * - Exports pointing to non-existent files
 * - Missing exports for existing source files
 * - Invalid export conditions
 * - Inconsistent export patterns
 */

import type {ParsedPackageJson} from '../parser/config-parser'
import type {WorkspacePackage} from '../scanner/workspace-scanner'
import type {Issue, IssueLocation} from '../types/index'
import type {Result} from '../types/result'
import type {AnalysisContext, Analyzer, AnalyzerError, AnalyzerMetadata} from './analyzer'

import fs from 'node:fs/promises'
import path from 'node:path'

import {ok} from '@bfra.me/es/result'

import {createIssue, filterIssues} from './analyzer'

/**
 * Configuration options specific to ExportsFieldAnalyzer.
 */
export interface ExportsFieldAnalyzerOptions {
  /** Whether to check if export paths resolve to existing files */
  readonly validatePaths?: boolean
  /** Whether to check export condition order */
  readonly checkConditionOrder?: boolean
  /** Whether to suggest missing exports for source files */
  readonly suggestMissingExports?: boolean
  /** Common output directories to check for built files */
  readonly outputDirs?: readonly string[]
  /** Package names exempt from checks */
  readonly exemptPackages?: readonly string[]
}

const DEFAULT_OPTIONS: ExportsFieldAnalyzerOptions = {
  validatePaths: true,
  checkConditionOrder: true,
  suggestMissingExports: false,
  outputDirs: ['lib', 'dist', 'build', 'out'],
  exemptPackages: [],
}

const METADATA: AnalyzerMetadata = {
  id: 'exports-field',
  name: 'Exports Field Analyzer',
  description: 'Validates package.json exports against actual source file structure',
  categories: ['configuration'],
  defaultSeverity: 'warning',
}

/**
 * Standard export conditions in recommended order.
 */
const CONDITION_ORDER = ['types', 'import', 'require', 'default'] as const

/**
 * Creates an ExportsFieldAnalyzer instance.
 */
export function createExportsFieldAnalyzer(options: ExportsFieldAnalyzerOptions = {}): Analyzer {
  const resolvedOptions = {...DEFAULT_OPTIONS, ...options}

  return {
    metadata: METADATA,
    analyze: async (context: AnalysisContext): Promise<Result<readonly Issue[], AnalyzerError>> => {
      const issues: Issue[] = []

      for (const pkg of context.packages) {
        if (isExemptPackage(pkg.name, resolvedOptions.exemptPackages)) {
          continue
        }

        const pkgJson = pkg.packageJson as ParsedPackageJson

        if (pkgJson.exports === undefined) {
          continue
        }

        const packageIssues = await analyzePackageExports(pkg, pkgJson, resolvedOptions)
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

async function analyzePackageExports(
  pkg: WorkspacePackage,
  pkgJson: ParsedPackageJson,
  options: ExportsFieldAnalyzerOptions,
): Promise<Issue[]> {
  const issues: Issue[] = []
  const exports = pkgJson.exports

  if (exports === undefined) {
    return issues
  }

  // Analyze each export entry
  const exportEntries = normalizeExports(exports)

  for (const [exportPath, conditions] of exportEntries) {
    // Check condition order
    if (options.checkConditionOrder && typeof conditions === 'object' && conditions !== null) {
      const orderIssues = checkConditionOrder(
        pkg,
        exportPath,
        conditions as Record<string, unknown>,
      )
      issues.push(...orderIssues)
    }

    // Validate export paths
    if (options.validatePaths) {
      const pathIssues = await validateExportPaths(pkg, exportPath, conditions, options)
      issues.push(...pathIssues)
    }
  }

  // Check for package.json export (required for many tools)
  issues.push(...checkPackageJsonExport(pkg, exports))

  return issues
}

/**
 * Normalizes exports to a consistent Map format.
 */
function normalizeExports(exports: Record<string, unknown>): Map<string, unknown> {
  const normalized = new Map<string, unknown>()

  for (const [key, value] of Object.entries(exports)) {
    normalized.set(key, value)
  }

  return normalized
}

/**
 * Checks if export conditions are in the recommended order.
 */
function checkConditionOrder(
  pkg: WorkspacePackage,
  exportPath: string,
  conditions: Record<string, unknown>,
): Issue[] {
  const issues: Issue[] = []
  const conditionKeys = Object.keys(conditions)

  // Find the positions of standard conditions
  const positions = new Map<string, number>()
  for (const [index, key] of conditionKeys.entries()) {
    if ((CONDITION_ORDER as readonly string[]).includes(key)) {
      positions.set(key, index)
    }
  }

  // Check if types comes before import/require
  const typesPos = positions.get('types')
  const importPos = positions.get('import')
  const requirePos = positions.get('require')

  if (typesPos !== undefined) {
    if (importPos !== undefined && typesPos > importPos) {
      issues.push(
        createIssue({
          id: 'exports-types-after-import',
          title: 'Export types condition should come before import',
          description: `Package "${pkg.name}" export "${exportPath}" has "types" after "import" condition`,
          severity: 'warning',
          category: 'configuration',
          location: createLocation(pkg.packageJsonPath),
          suggestion: 'Move "types" condition before "import" for proper TypeScript resolution',
          metadata: {exportPath, conditions: conditionKeys},
        }),
      )
    }

    if (requirePos !== undefined && typesPos > requirePos) {
      issues.push(
        createIssue({
          id: 'exports-types-after-require',
          title: 'Export types condition should come before require',
          description: `Package "${pkg.name}" export "${exportPath}" has "types" after "require" condition`,
          severity: 'warning',
          category: 'configuration',
          location: createLocation(pkg.packageJsonPath),
          suggestion: 'Move "types" condition before "require" for proper TypeScript resolution',
          metadata: {exportPath, conditions: conditionKeys},
        }),
      )
    }
  }

  return issues
}

/**
 * Validates that export paths resolve to existing files.
 */
async function validateExportPaths(
  pkg: WorkspacePackage,
  exportPath: string,
  conditions: unknown,
  options: ExportsFieldAnalyzerOptions,
): Promise<Issue[]> {
  const issues: Issue[] = []

  const paths = extractPaths(conditions)

  for (const filePath of paths) {
    // Skip non-file paths
    if (!filePath.startsWith('./')) {
      continue
    }

    const absolutePath = path.join(pkg.packagePath, filePath)
    const exists = await fileExists(absolutePath)

    if (!exists) {
      // Check if this looks like a build output
      const isBuildOutput = (options.outputDirs ?? []).some(dir => filePath.startsWith(`./${dir}/`))

      if (isBuildOutput) {
        // Build outputs might not exist yet - info level
        issues.push(
          createIssue({
            id: 'exports-build-output-missing',
            title: 'Export path points to non-existent build output',
            description: `Package "${pkg.name}" export "${exportPath}" points to "${filePath}" which does not exist (may need build)`,
            severity: 'info',
            category: 'configuration',
            location: createLocation(pkg.packageJsonPath),
            suggestion: 'Run build to generate the file, or verify the path is correct',
            metadata: {exportPath, filePath},
          }),
        )
      } else {
        // Source file missing - warning level
        issues.push(
          createIssue({
            id: 'exports-path-missing',
            title: 'Export path points to non-existent file',
            description: `Package "${pkg.name}" export "${exportPath}" points to "${filePath}" which does not exist`,
            severity: 'warning',
            category: 'configuration',
            location: createLocation(pkg.packageJsonPath),
            suggestion: 'Verify the export path is correct or create the missing file',
            metadata: {exportPath, filePath},
          }),
        )
      }
    }
  }

  return issues
}

/**
 * Extracts all file paths from an export condition structure.
 */
function extractPaths(value: unknown): string[] {
  const paths: string[] = []

  if (typeof value === 'string') {
    paths.push(value)
  } else if (typeof value === 'object' && value !== null) {
    for (const v of Object.values(value)) {
      paths.push(...extractPaths(v))
    }
  }

  return paths
}

/**
 * Checks if package.json is exported (required by many tools).
 */
function checkPackageJsonExport(pkg: WorkspacePackage, exports: Record<string, unknown>): Issue[] {
  const issues: Issue[] = []

  const hasPackageJsonExport =
    exports['./package.json'] !== undefined || exports['./package.json'] === './package.json'

  if (!hasPackageJsonExport) {
    issues.push(
      createIssue({
        id: 'exports-no-package-json',
        title: 'Missing package.json export',
        description: `Package "${pkg.name}" does not export "./package.json"`,
        severity: 'info',
        category: 'configuration',
        location: createLocation(pkg.packageJsonPath),
        suggestion: 'Add "./package.json": "./package.json" to exports for tool compatibility',
      }),
    )
  }

  return issues
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

export {METADATA as exportsFieldAnalyzerMetadata}
