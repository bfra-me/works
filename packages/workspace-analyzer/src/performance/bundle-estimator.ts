/**
 * Bundle size estimator for identifying large module contributors.
 *
 * Analyzes source files and dependencies to estimate bundle size impact,
 * helping identify optimization opportunities for tree-shaking and code splitting.
 *
 * This is a heuristic estimator - actual bundle sizes depend on bundler configuration,
 * tree-shaking effectiveness, and minification.
 */

import type {ExtractedImport, ImportExtractionResult} from '../parser/import-extractor'
import type {WorkspacePackage} from '../scanner/workspace-scanner'

import fs from 'node:fs/promises'

/**
 * Estimated size information for a module or package.
 */
export interface BundleSizeEstimate {
  /** Source file path or package name */
  readonly identifier: string
  /** Raw source size in bytes (unminified) */
  readonly sourceSize: number
  /** Estimated minified size in bytes (heuristic: ~60% of source) */
  readonly estimatedMinifiedSize: number
  /** Estimated gzipped size in bytes (heuristic: ~30% of minified) */
  readonly estimatedGzippedSize: number
  /** Number of imports this module brings in */
  readonly importCount: number
  /** Number of exports this module provides */
  readonly exportCount: number
  /** Whether this is a direct or transitive dependency */
  readonly isTransitive: boolean
}

/**
 * Aggregated bundle size statistics for a package.
 */
export interface PackageBundleStats {
  /** Package name */
  readonly packageName: string
  /** Total source size of all modules */
  readonly totalSourceSize: number
  /** Estimated total minified size */
  readonly totalMinifiedSize: number
  /** Estimated total gzipped size */
  readonly totalGzippedSize: number
  /** Number of source files */
  readonly fileCount: number
  /** Individual file estimates */
  readonly files: readonly BundleSizeEstimate[]
  /** External dependency size estimates */
  readonly dependencies: readonly DependencySizeEstimate[]
  /** Top contributors by size */
  readonly topContributors: readonly BundleSizeEstimate[]
}

/**
 * Size estimate for an external dependency.
 */
export interface DependencySizeEstimate {
  /** Package name */
  readonly packageName: string
  /** Estimated size (if known from registry data) */
  readonly estimatedSize?: number
  /** Whether size data is available */
  readonly sizeKnown: boolean
  /** Number of times imported */
  readonly importCount: number
  /** Import locations */
  readonly locations: readonly string[]
}

/**
 * Options for bundle size estimation.
 */
export interface BundleEstimatorOptions {
  /** Include node_modules size estimates */
  readonly includeNodeModules?: boolean
  /** Maximum files to analyze (for performance) */
  readonly maxFiles?: number
  /** Minification ratio estimate (0-1) */
  readonly minificationRatio?: number
  /** Gzip ratio estimate (0-1) */
  readonly gzipRatio?: number
  /** Size threshold for "large file" warnings (bytes) */
  readonly largeFileThreshold?: number
  /** Size threshold for "large dependency" warnings (bytes) */
  readonly largeDependencyThreshold?: number
}

const DEFAULT_OPTIONS: Required<BundleEstimatorOptions> = {
  includeNodeModules: false,
  maxFiles: 10000,
  minificationRatio: 0.6,
  gzipRatio: 0.3,
  largeFileThreshold: 50000,
  largeDependencyThreshold: 100000,
}

// Known large package sizes (rough estimates in KB, gzipped)
const KNOWN_PACKAGE_SIZES: Readonly<Record<string, number>> = {
  lodash: 71,
  'lodash-es': 71,
  moment: 67,
  'moment-timezone': 95,
  rxjs: 40,
  '@angular/core': 90,
  '@angular/common': 45,
  react: 6,
  'react-dom': 42,
  vue: 34,
  d3: 80,
  'chart.js': 65,
  three: 150,
  '@mui/material': 120,
  antd: 200,
  'date-fns': 25,
  dayjs: 3,
  axios: 13,
  zod: 12,
  yup: 22,
  'class-validator': 15,
  typeorm: 180,
  prisma: 40,
  '@prisma/client': 40,
  express: 30,
  fastify: 25,
  'ts-morph': 150,
  typescript: 150,
}

/**
 * Estimates bundle size for source files in a package.
 */
export async function estimatePackageBundleSize(
  pkg: WorkspacePackage,
  importResults: readonly ImportExtractionResult[],
  options?: BundleEstimatorOptions,
): Promise<PackageBundleStats> {
  const opts = {...DEFAULT_OPTIONS, ...options}

  const fileEstimates: BundleSizeEstimate[] = []
  let totalSourceSize = 0
  let totalMinifiedSize = 0
  let totalGzippedSize = 0

  const filesToAnalyze = pkg.sourceFiles.slice(0, opts.maxFiles)

  for (const filePath of filesToAnalyze) {
    try {
      const stats = await fs.stat(filePath)
      const sourceSize = stats.size

      const fileImports = importResults.find(r => r.filePath === filePath)
      const importCount = fileImports?.imports.length ?? 0

      const estimate = createSizeEstimate(
        filePath,
        sourceSize,
        importCount,
        0,
        false,
        opts.minificationRatio,
        opts.gzipRatio,
      )

      fileEstimates.push(estimate)
      totalSourceSize += sourceSize
      totalMinifiedSize += estimate.estimatedMinifiedSize
      totalGzippedSize += estimate.estimatedGzippedSize
    } catch {
      // File may not exist or be inaccessible
    }
  }

  const dependencyEstimates = collectDependencyEstimates(importResults, opts)

  const topContributors = [...fileEstimates]
    .sort((a, b) => b.sourceSize - a.sourceSize)
    .slice(0, 10)

  return {
    packageName: pkg.name,
    totalSourceSize,
    totalMinifiedSize,
    totalGzippedSize,
    fileCount: fileEstimates.length,
    files: fileEstimates,
    dependencies: dependencyEstimates,
    topContributors,
  }
}

/**
 * Estimates the size of a single source file.
 */
export async function estimateFileSize(
  filePath: string,
  options?: BundleEstimatorOptions,
): Promise<BundleSizeEstimate | null> {
  const opts = {...DEFAULT_OPTIONS, ...options}

  try {
    const stats = await fs.stat(filePath)
    return createSizeEstimate(
      filePath,
      stats.size,
      0,
      0,
      false,
      opts.minificationRatio,
      opts.gzipRatio,
    )
  } catch {
    return null
  }
}

/**
 * Estimates the size contribution of an external dependency.
 */
export function estimateDependencySize(packageName: string): DependencySizeEstimate {
  const baseName = getBasePackageName(packageName)
  const knownSize = KNOWN_PACKAGE_SIZES[baseName]

  if (knownSize === undefined) {
    return {
      packageName,
      estimatedSize: undefined,
      sizeKnown: false,
      importCount: 0,
      locations: [],
    }
  }

  return {
    packageName,
    estimatedSize: knownSize * 1024,
    sizeKnown: true,
    importCount: 0,
    locations: [],
  }
}

/**
 * Identifies files that exceed the large file threshold.
 */
export function findLargeFiles(
  stats: PackageBundleStats,
  threshold?: number,
): readonly BundleSizeEstimate[] {
  const actualThreshold = threshold ?? DEFAULT_OPTIONS.largeFileThreshold
  return stats.files.filter(file => file.sourceSize > actualThreshold)
}

/**
 * Identifies dependencies that exceed the large dependency threshold.
 */
export function findLargeDependencies(
  stats: PackageBundleStats,
  threshold?: number,
): readonly DependencySizeEstimate[] {
  const actualThreshold = threshold ?? DEFAULT_OPTIONS.largeDependencyThreshold
  return stats.dependencies.filter(
    dep => dep.sizeKnown && dep.estimatedSize !== undefined && dep.estimatedSize > actualThreshold,
  )
}

/**
 * Calculates the estimated tree-shaking savings for a file.
 *
 * Files that only use a subset of exports from large modules
 * can benefit significantly from tree-shaking.
 */
export function estimateTreeShakingSavings(
  imports: readonly ExtractedImport[],
): TreeShakingSavingsEstimate {
  let potentialSavings = 0
  const optimizableImports: OptimizableImport[] = []

  for (const imp of imports) {
    if (imp.namespaceImport !== undefined) {
      // Namespace imports (import * as X) prevent tree-shaking
      const baseName = getBasePackageName(imp.moduleSpecifier)
      const knownSize = KNOWN_PACKAGE_SIZES[baseName]

      if (knownSize !== undefined) {
        // Estimate potential savings (heuristic: 50% of package)
        const savings = Math.floor(knownSize * 1024 * 0.5)
        potentialSavings += savings

        optimizableImports.push({
          moduleSpecifier: imp.moduleSpecifier,
          currentImportStyle: 'namespace',
          suggestedImportStyle: 'named',
          estimatedSavings: savings,
          line: imp.line,
          column: imp.column,
        })
      }
    }

    if (imp.defaultImport !== undefined && imp.importedNames === undefined) {
      // Default-only imports from packages with named exports
      const baseName = getBasePackageName(imp.moduleSpecifier)
      const knownSize = KNOWN_PACKAGE_SIZES[baseName]

      if (knownSize !== undefined && !imp.isRelative) {
        const savings = Math.floor(knownSize * 1024 * 0.3)
        potentialSavings += savings

        optimizableImports.push({
          moduleSpecifier: imp.moduleSpecifier,
          currentImportStyle: 'default',
          suggestedImportStyle: 'named',
          estimatedSavings: savings,
          line: imp.line,
          column: imp.column,
        })
      }
    }
  }

  return {
    potentialSavings,
    optimizableImports,
    hasPotentialOptimizations: optimizableImports.length > 0,
  }
}

/**
 * Estimate of potential tree-shaking savings.
 */
export interface TreeShakingSavingsEstimate {
  /** Total potential bytes saved */
  readonly potentialSavings: number
  /** Imports that could be optimized */
  readonly optimizableImports: readonly OptimizableImport[]
  /** Whether any optimizations are available */
  readonly hasPotentialOptimizations: boolean
}

/**
 * An import that could be optimized for better tree-shaking.
 */
export interface OptimizableImport {
  /** The module specifier */
  readonly moduleSpecifier: string
  /** Current import style */
  readonly currentImportStyle: 'namespace' | 'default' | 'side-effect'
  /** Suggested import style */
  readonly suggestedImportStyle: 'named' | 'dynamic'
  /** Estimated bytes saved */
  readonly estimatedSavings: number
  /** Line number */
  readonly line: number
  /** Column number */
  readonly column: number
}

function createSizeEstimate(
  identifier: string,
  sourceSize: number,
  importCount: number,
  exportCount: number,
  isTransitive: boolean,
  minificationRatio: number,
  gzipRatio: number,
): BundleSizeEstimate {
  const estimatedMinifiedSize = Math.floor(sourceSize * minificationRatio)
  const estimatedGzippedSize = Math.floor(estimatedMinifiedSize * gzipRatio)

  return {
    identifier,
    sourceSize,
    estimatedMinifiedSize,
    estimatedGzippedSize,
    importCount,
    exportCount,
    isTransitive,
  }
}

function collectDependencyEstimates(
  importResults: readonly ImportExtractionResult[],
  _options: Required<BundleEstimatorOptions>,
): DependencySizeEstimate[] {
  const depMap = new Map<
    string,
    {estimatedSize?: number; sizeKnown: boolean; locations: string[]}
  >()

  for (const result of importResults) {
    for (const dep of result.externalDependencies) {
      const baseName = getBasePackageName(dep)
      const existing = depMap.get(baseName)

      if (existing === undefined) {
        const knownSize = KNOWN_PACKAGE_SIZES[baseName]
        const sizeKnown = knownSize !== undefined
        depMap.set(baseName, {
          estimatedSize: sizeKnown ? knownSize * 1024 : undefined,
          sizeKnown,
          locations: [result.filePath],
        })
      } else {
        existing.locations.push(result.filePath)
      }
    }
  }

  return Array.from(depMap.entries()).map(([packageName, data]) => ({
    packageName,
    estimatedSize: data.estimatedSize,
    sizeKnown: data.sizeKnown,
    importCount: data.locations.length,
    locations: data.locations,
  }))
}

function getBasePackageName(specifier: string): string {
  if (specifier.startsWith('@')) {
    const parts = specifier.split('/')
    if (parts.length >= 2) {
      return `${parts[0]}/${parts[1]}`
    }
  }
  return specifier.split('/')[0] ?? specifier
}

/**
 * Formats a byte size as a human-readable string.
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'

  const units = ['B', 'KB', 'MB', 'GB']
  const k = 1024
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  const size = bytes / k ** i

  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}
