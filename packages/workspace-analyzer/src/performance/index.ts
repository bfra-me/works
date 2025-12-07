/**
 * Performance analysis utilities for bundle size estimation and optimization detection.
 *
 * Provides tools for identifying performance optimization opportunities including:
 * - Bundle size estimation and large file detection
 * - Tree-shaking blocker identification
 * - Dependency size analysis
 */

export {
  estimateDependencySize,
  estimateFileSize,
  estimatePackageBundleSize,
  estimateTreeShakingSavings,
  findLargeDependencies,
  findLargeFiles,
  formatBytes,
} from './bundle-estimator'

export type {
  BundleEstimatorOptions,
  BundleSizeEstimate,
  DependencySizeEstimate,
  OptimizableImport,
  PackageBundleStats,
  TreeShakingSavingsEstimate,
} from './bundle-estimator'
