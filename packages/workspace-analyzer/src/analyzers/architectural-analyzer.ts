/**
 * ArchitecturalAnalyzer - Validates architectural patterns and enforces best practices.
 *
 * Integrates multiple architectural rules to detect:
 * - Layer boundary violations
 * - Barrel export (export *) misuse
 * - Public API surface issues
 * - Side effects in module initialization
 * - Import path alias violations
 * - Monorepo package boundary violations
 */

import type {LayerConfiguration, RuleContext} from '../rules/rule-engine'
import type {WorkspacePackage} from '../scanner/workspace-scanner'
import type {Issue, Severity} from '../types/index'
import type {Result} from '../types/result'
import type {
  AnalysisContext,
  Analyzer,
  AnalyzerError,
  AnalyzerMetadata,
  AnalyzerOptions,
} from './analyzer'

import path from 'node:path'

import {createProject} from '@bfra.me/doc-sync/parsers'
import {ok} from '@bfra.me/es/result'

import {getAllSourceFiles} from '../parser/typescript-parser'
import {
  createBarrelExportRule,
  createLayerViolationRule,
  createPackageBoundaryRule,
  createPathAliasRule,
  createPublicApiRule,
  createSideEffectRule,
} from '../rules/builtin-rules'
import {createRuleEngine, DEFAULT_LAYER_CONFIG} from '../rules/rule-engine'
import {matchAnyPattern} from '../utils/pattern-matcher'
import {createIssue, filterIssues} from './analyzer'

/**
 * Configuration options for the ArchitecturalAnalyzer.
 */
export interface ArchitecturalAnalyzerOptions extends AnalyzerOptions {
  /** Layer configuration for architectural boundary enforcement */
  readonly layerConfig?: LayerConfiguration
  /** tsconfig.json paths for alias validation */
  readonly tsconfigPaths?: Readonly<Record<string, readonly string[]>>
  /** Enable layer violation detection */
  readonly checkLayerViolations?: boolean
  /** Enable barrel export detection */
  readonly checkBarrelExports?: boolean
  /** Enable public API validation */
  readonly checkPublicApi?: boolean
  /** Enable side effect detection */
  readonly checkSideEffects?: boolean
  /** Enable path alias validation */
  readonly checkPathAliases?: boolean
  /** Enable package boundary enforcement */
  readonly checkPackageBoundaries?: boolean
  /** File patterns for entry points */
  readonly entryPointPatterns?: readonly string[]
  /** Patterns allowed for barrel exports */
  readonly allowedBarrelPatterns?: readonly string[]
  /** Shared packages that can be imported from anywhere */
  readonly sharedPackages?: readonly string[]
  /** Severity for layer violations */
  readonly layerViolationSeverity?: Severity
  /** Severity for barrel export issues */
  readonly barrelExportSeverity?: Severity
  /** Severity for public API issues */
  readonly publicApiSeverity?: Severity
  /** Severity for side effect issues */
  readonly sideEffectSeverity?: Severity
}

const DEFAULT_OPTIONS: Required<
  Omit<ArchitecturalAnalyzerOptions, keyof AnalyzerOptions | 'tsconfigPaths'>
> = {
  layerConfig: DEFAULT_LAYER_CONFIG,
  checkLayerViolations: true,
  checkBarrelExports: true,
  checkPublicApi: true,
  checkSideEffects: true,
  checkPathAliases: true,
  checkPackageBoundaries: true,
  entryPointPatterns: ['**/index.ts', '**/index.js'],
  allowedBarrelPatterns: ['**/index.ts'],
  sharedPackages: ['@bfra.me/es', '@bfra.me/tsconfig'],
  layerViolationSeverity: 'warning',
  barrelExportSeverity: 'warning',
  publicApiSeverity: 'info',
  sideEffectSeverity: 'warning',
}

export const architecturalAnalyzerMetadata: AnalyzerMetadata = {
  id: 'architectural',
  name: 'Architectural Analyzer',
  description:
    'Validates architectural patterns including layer boundaries, exports, and package structure',
  categories: ['architecture'],
  defaultSeverity: 'warning',
}

/**
 * Creates an ArchitecturalAnalyzer instance with all built-in rules.
 *
 * @example
 * ```ts
 * const analyzer = createArchitecturalAnalyzer({
 *   checkLayerViolations: true,
 *   checkBarrelExports: true,
 *   layerConfig: {
 *     layers: [
 *       {name: 'domain', allowedDependencies: []},
 *       {name: 'application', allowedDependencies: ['domain']},
 *     ],
 *     patterns: [
 *       {pattern: '**\/domain\/**', layer: 'domain'},
 *       {pattern: '**\/application\/**', layer: 'application'},
 *     ],
 *   },
 * })
 *
 * const result = await analyzer.analyze(context)
 * ```
 */
export function createArchitecturalAnalyzer(options: ArchitecturalAnalyzerOptions = {}): Analyzer {
  const resolvedOptions = {...DEFAULT_OPTIONS, ...options}

  const engine = createRuleEngine()

  if (resolvedOptions.checkLayerViolations) {
    engine.register('layer-violation', {
      rule: createLayerViolationRule({
        severity: resolvedOptions.layerViolationSeverity,
        options: {layerConfig: resolvedOptions.layerConfig},
      }),
      enabled: true,
      priority: 10,
    })
  }

  if (resolvedOptions.checkBarrelExports) {
    engine.register('barrel-export', {
      rule: createBarrelExportRule({
        severity: resolvedOptions.barrelExportSeverity,
        options: {
          allowedPatterns: resolvedOptions.allowedBarrelPatterns,
          allowWorkspaceReexports: false,
        },
      }),
      enabled: true,
      priority: 20,
    })
  }

  if (resolvedOptions.checkPublicApi) {
    engine.register('public-api', {
      rule: createPublicApiRule({
        severity: resolvedOptions.publicApiSeverity,
        options: {
          entryPoints: resolvedOptions.entryPointPatterns as string[],
          requireReexport: false,
        },
      }),
      enabled: true,
      priority: 30,
    })
  }

  if (resolvedOptions.checkSideEffects) {
    engine.register('side-effect', {
      rule: createSideEffectRule({
        severity: resolvedOptions.sideEffectSeverity,
        options: {
          checkConsoleCalls: true,
          checkGlobalAssignments: true,
        },
      }),
      enabled: true,
      priority: 40,
    })
  }

  if (resolvedOptions.checkPathAliases) {
    engine.register('path-alias', {
      rule: createPathAliasRule({
        options: {
          requireAliasForDeepImports: true,
          deepImportThreshold: 3,
        },
      }),
      enabled: true,
      priority: 50,
    })
  }

  if (resolvedOptions.checkPackageBoundaries) {
    engine.register('package-boundary', {
      rule: createPackageBoundaryRule({
        options: {
          sharedPackages: resolvedOptions.sharedPackages as string[],
          enforceEntryPointImports: true,
        },
      }),
      enabled: true,
      priority: 60,
    })
  }

  return {
    metadata: architecturalAnalyzerMetadata,
    analyze: async (context: AnalysisContext): Promise<Result<readonly Issue[], AnalyzerError>> => {
      const issues: Issue[] = []

      for (const pkg of context.packages) {
        context.reportProgress?.(`Analyzing architecture in ${pkg.name}...`)

        const packageIssues = await analyzePackageArchitecture(
          pkg,
          context.workspacePath,
          context.packages,
          engine,
          resolvedOptions,
        )
        issues.push(...packageIssues)
      }

      return ok(filterIssues(issues, context.config))
    },
  }
}

/**
 * Analyzes a single package's architectural patterns.
 */
async function analyzePackageArchitecture(
  pkg: WorkspacePackage,
  workspacePath: string,
  allPackages: readonly WorkspacePackage[],
  engine: ReturnType<typeof createRuleEngine>,
  options: typeof DEFAULT_OPTIONS & ArchitecturalAnalyzerOptions,
): Promise<Issue[]> {
  const issues: Issue[] = []
  const tsconfigPath = path.join(pkg.packagePath, 'tsconfig.json')

  try {
    const project = createProject({
      tsConfigPath: tsconfigPath,
    })

    const sourceFiles = getAllSourceFiles(project)

    for (const sourceFile of sourceFiles) {
      const filePath = sourceFile.getFilePath()

      if (shouldSkipFile(filePath, options.exclude)) {
        continue
      }

      const ruleContext: RuleContext = {
        sourceFile,
        pkg,
        workspacePath,
        allPackages,
        layerConfig: options.layerConfig,
        tsconfigPaths: options.tsconfigPaths,
      }

      const result = await engine.evaluateFile(ruleContext)

      if (result.success) {
        issues.push(...result.data)
      }
    }
  } catch {
    issues.push(
      createIssue({
        id: 'architectural-analysis-error',
        title: `Failed to analyze architecture in ${pkg.name}`,
        description: `Could not parse TypeScript project for architectural analysis`,
        severity: 'warning',
        category: 'architecture',
        location: {filePath: tsconfigPath},
      }),
    )
  }

  return issues
}

/**
 * Determines if a file should be skipped based on exclude patterns.
 */
function shouldSkipFile(filePath: string, excludePatterns: readonly string[] | undefined): boolean {
  if (excludePatterns === undefined || excludePatterns.length === 0) {
    return false
  }

  return matchAnyPattern(filePath, excludePatterns)
}
