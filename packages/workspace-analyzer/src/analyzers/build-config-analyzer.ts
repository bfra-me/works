/**
 * BuildConfigAnalyzer - Validates build configuration (tsup) for consistency and best practices.
 *
 * Detects issues such as:
 * - Missing build configuration for publishable packages
 * - Inconsistent build settings
 * - Missing entry points
 * - Format mismatches with package.json
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
 * Configuration options specific to BuildConfigAnalyzer.
 */
export interface BuildConfigAnalyzerOptions {
  /** Whether to require build config for packages with build scripts */
  readonly requireConfig?: boolean
  /** Expected config file pattern (e.g., 'tsup.config.ts') */
  readonly expectedConfigFile?: string
  /** Whether to check for DTS generation */
  readonly requireDts?: boolean
  /** Package names exempt from checks */
  readonly exemptPackages?: readonly string[]
}

const DEFAULT_OPTIONS: BuildConfigAnalyzerOptions = {
  requireConfig: true,
  expectedConfigFile: 'tsup.config.ts',
  requireDts: true,
  exemptPackages: [],
}

const METADATA: AnalyzerMetadata = {
  id: 'build-config',
  name: 'Build Config Analyzer',
  description: 'Validates build configuration (tsup) for consistency and best practices',
  categories: ['configuration'],
  defaultSeverity: 'warning',
}

const BUILD_CONFIG_FILES = [
  'tsup.config.ts',
  'tsup.config.mts',
  'tsup.config.cts',
  'tsup.config.js',
  'tsup.config.mjs',
  'tsup.config.cjs',
  'rollup.config.ts',
  'rollup.config.js',
  'rollup.config.mjs',
  'vite.config.ts',
  'vite.config.js',
  'vite.config.mjs',
  'esbuild.config.ts',
  'esbuild.config.js',
] as const

/**
 * Creates a BuildConfigAnalyzer instance.
 */
export function createBuildConfigAnalyzer(options: BuildConfigAnalyzerOptions = {}): Analyzer {
  const resolvedOptions = {...DEFAULT_OPTIONS, ...options}

  return {
    metadata: METADATA,
    analyze: async (context: AnalysisContext): Promise<Result<readonly Issue[], AnalyzerError>> => {
      const issues: Issue[] = []

      for (const pkg of context.packages) {
        if (isExemptPackage(pkg.name, resolvedOptions.exemptPackages)) {
          continue
        }

        const packageIssues = await analyzePackageBuild(pkg, resolvedOptions)
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

async function analyzePackageBuild(
  pkg: WorkspacePackage,
  options: BuildConfigAnalyzerOptions,
): Promise<Issue[]> {
  const issues: Issue[] = []
  const pkgJson = pkg.packageJson as ParsedPackageJson

  // Check if package has a build script
  const hasBuildScript = pkgJson.scripts?.build !== undefined

  // Find existing build config
  const configResult = await findBuildConfig(pkg.packagePath)

  // Check if build config is needed but missing
  if (options.requireConfig && hasBuildScript && !configResult.found) {
    issues.push(
      createIssue({
        id: 'build-no-config',
        title: 'Missing build configuration file',
        description: `Package "${pkg.name}" has a build script but no build configuration file`,
        severity: 'info',
        category: 'configuration',
        location: createLocation(path.join(pkg.packagePath, 'package.json')),
        suggestion: `Create "${options.expectedConfigFile ?? 'tsup.config.ts'}" for explicit build configuration`,
      }),
    )
  }

  // Check if expected config file is used
  if (
    configResult.found &&
    options.expectedConfigFile !== undefined &&
    configResult.fileName !== options.expectedConfigFile
  ) {
    issues.push(
      createIssue({
        id: 'build-unexpected-config-file',
        title: 'Unexpected build config file',
        description: `Package "${pkg.name}" uses "${configResult.fileName}" instead of "${options.expectedConfigFile}"`,
        severity: 'info',
        category: 'configuration',
        location: createLocation(configResult.filePath),
        suggestion: `Consider using "${options.expectedConfigFile}" for consistency`,
      }),
    )
  }

  // Analyze tsup config content
  if (configResult.found && configResult.isTsup) {
    const contentIssues = await analyzeTsupConfigContent(pkg, configResult.filePath, options)
    issues.push(...contentIssues)
  }

  // Check package.json and build output consistency
  issues.push(...checkBuildOutputConsistency(pkg, pkgJson))

  return issues
}

interface BuildConfigResult {
  found: boolean
  fileName: string
  filePath: string
  isTsup: boolean
}

async function findBuildConfig(packagePath: string): Promise<BuildConfigResult> {
  for (const configFile of BUILD_CONFIG_FILES) {
    const configPath = path.join(packagePath, configFile)
    if (await fileExists(configPath)) {
      return {
        found: true,
        fileName: configFile,
        filePath: configPath,
        isTsup: configFile.startsWith('tsup'),
      }
    }
  }

  return {
    found: false,
    fileName: '',
    filePath: '',
    isTsup: false,
  }
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

async function analyzeTsupConfigContent(
  pkg: WorkspacePackage,
  configPath: string,
  options: BuildConfigAnalyzerOptions,
): Promise<Issue[]> {
  const issues: Issue[] = []

  let content: string
  try {
    content = await fs.readFile(configPath, 'utf-8')
  } catch {
    return issues
  }

  // Check for DTS generation in TypeScript packages
  if (options.requireDts && pkg.hasTsConfig) {
    const hasDts = content.includes('dts') && content.includes('true')
    if (!hasDts) {
      issues.push(
        createIssue({
          id: 'build-no-dts',
          title: 'Build config missing DTS generation',
          description: `Package "${pkg.name}" is TypeScript but build config may not generate declaration files`,
          severity: 'warning',
          category: 'configuration',
          location: createLocation(configPath),
          suggestion: 'Add "dts: true" to tsup config for TypeScript declaration file generation',
        }),
      )
    }
  }

  // Check for entry point configuration
  const hasEntry = content.includes('entry')
  if (!hasEntry) {
    issues.push(
      createIssue({
        id: 'build-no-entry',
        title: 'Build config missing explicit entry points',
        description: `Package "${pkg.name}" build config does not specify explicit entry points`,
        severity: 'info',
        category: 'configuration',
        location: createLocation(configPath),
        suggestion: 'Add explicit "entry" configuration for predictable builds',
      }),
    )
  }

  // Check for format specification
  const hasFormat = content.includes('format')
  if (!hasFormat) {
    issues.push(
      createIssue({
        id: 'build-no-format',
        title: 'Build config missing format specification',
        description: `Package "${pkg.name}" build config does not specify output format(s)`,
        severity: 'info',
        category: 'configuration',
        location: createLocation(configPath),
        suggestion: 'Add explicit "format" configuration (e.g., ["esm", "cjs"]) for clarity',
      }),
    )
  }

  // Check for clean option
  const hasClean = content.includes('clean')
  if (!hasClean) {
    issues.push(
      createIssue({
        id: 'build-no-clean',
        title: 'Build config missing clean option',
        description: `Package "${pkg.name}" build config does not specify clean option`,
        severity: 'info',
        category: 'configuration',
        location: createLocation(configPath),
        suggestion: 'Add "clean: true" to ensure stale files are removed before building',
      }),
    )
  }

  return issues
}

function checkBuildOutputConsistency(pkg: WorkspacePackage, pkgJson: ParsedPackageJson): Issue[] {
  const issues: Issue[] = []

  // Check if main/module point to expected build output directories
  const commonOutputDirs = ['lib', 'dist', 'build', 'out']

  if (pkgJson.main !== undefined) {
    const mainDir = pkgJson.main.split('/')[0]
    if (mainDir !== undefined && !commonOutputDirs.includes(mainDir) && !mainDir.startsWith('.')) {
      issues.push(
        createIssue({
          id: 'build-unusual-main-path',
          title: 'Unusual main entry path',
          description: `Package "${pkg.name}" main entry "${pkgJson.main}" uses non-standard output directory`,
          severity: 'info',
          category: 'configuration',
          location: createLocation(pkg.packageJsonPath),
          suggestion: 'Consider using standard output directories like "lib", "dist", or "build"',
          metadata: {main: pkgJson.main},
        }),
      )
    }
  }

  // Check for ESM/CJS format mismatch
  if (pkgJson.type === 'module' && pkgJson.main !== undefined) {
    const mainExt = path.extname(pkgJson.main)

    // .js in ESM package is treated as ESM - check if module field exists for CJS fallback
    // .cjs is correct for ESM packages providing CJS fallback (no issue)
    const needsCjsFallbackCheck = mainExt === '.js'
    const hasCjsFallback = pkgJson.module !== undefined || pkgJson.exports !== undefined

    if (needsCjsFallbackCheck && !hasCjsFallback) {
      issues.push(
        createIssue({
          id: 'build-esm-no-cjs-fallback',
          title: 'ESM package without CJS fallback',
          description: `Package "${pkg.name}" is ESM but has no CJS fallback for older tools`,
          severity: 'info',
          category: 'configuration',
          location: createLocation(pkg.packageJsonPath),
          suggestion:
            'Consider adding exports field with both ESM and CJS formats for compatibility',
        }),
      )
    }
  }

  return issues
}

export {METADATA as buildConfigAnalyzerMetadata}
