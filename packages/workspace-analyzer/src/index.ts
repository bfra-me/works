/**
 * @bfra.me/workspace-analyzer - Comprehensive monorepo static analysis
 *
 * This package provides workspace analysis through deep AST parsing and static analysis,
 * detecting configuration inconsistencies, unused dependencies, circular imports,
 * architectural violations, and performance optimization opportunities.
 *
 * @example
 * ```ts
 * import {analyzeWorkspace} from '@bfra.me/workspace-analyzer'
 *
 * const result = await analyzeWorkspace('./my-monorepo', {
 *   categories: ['dependency', 'circular-import'],
 *   minSeverity: 'warning',
 * })
 *
 * if (result.success) {
 *   console.log(`Found ${result.data.summary.totalIssues} issues`)
 * }
 * ```
 */

// Analyzer utilities
export {
  // Dependency analyzers (Phase 4)
  aggregatePackageImports,
  // Architectural analyzer (Phase 5)
  architecturalAnalyzerMetadata,
  buildConfigAnalyzerMetadata,
  BUILTIN_ANALYZER_IDS,
  builtinAnalyzers,
  circularImportAnalyzerMetadata,
  computeCycleStats,
  // Performance analyzers (Phase 6)
  computeDeadCodeStats,
  computeDuplicateStats,
  configConsistencyAnalyzerMetadata,
  createAnalyzerRegistry,
  createArchitecturalAnalyzer,
  createBuildConfigAnalyzer,
  createCircularImportAnalyzer,
  createConfigConsistencyAnalyzer,
  // Performance analyzer factories (Phase 6)
  createDeadCodeAnalyzer,
  createDefaultRegistry,
  createDuplicateCodeAnalyzer,
  createDuplicateDependencyAnalyzer,
  createEslintConfigAnalyzer,
  createExportsFieldAnalyzer,
  createIssue,
  createLargeDependencyAnalyzer,
  createPackageJsonAnalyzer,
  createPeerDependencyAnalyzer,
  createTreeShakingBlockerAnalyzer,
  createTsconfigAnalyzer,
  createUnusedDependencyAnalyzer,
  createVersionAlignmentAnalyzer,
  // Performance analyzer metadata (Phase 6)
  deadCodeAnalyzerMetadata,
  duplicateCodeAnalyzerMetadata,
  duplicateDependencyAnalyzerMetadata,
  eslintConfigAnalyzerMetadata,
  exportsFieldAnalyzerMetadata,
  filterIssues,
  generateCycleVisualization,
  getKnownLargePackages,
  getPackageInfo,
  largeDependencyAnalyzerMetadata,
  meetsMinSeverity,
  packageJsonAnalyzerMetadata,
  peerDependencyAnalyzerMetadata,
  shouldAnalyzeCategory,
  treeShakingBlockerAnalyzerMetadata,
  tsconfigAnalyzerMetadata,
  unusedDependencyAnalyzerMetadata,
  versionAlignmentAnalyzerMetadata,
} from './analyzers/index'

export type {
  AnalysisContext,
  Analyzer,
  AnalyzerError,
  AnalyzerFactory,
  AnalyzerMetadata,
  AnalyzerOptions,
  AnalyzerRegistration,
  AnalyzerRegistry,
  // Architectural analyzer types (Phase 5)
  ArchitecturalAnalyzerOptions,
  BuildConfigAnalyzerOptions,
  // Dependency analyzer types (Phase 4)
  CircularImportAnalyzerOptions,
  CircularImportStats,
  // Performance analyzer types (Phase 6)
  CodeFingerprint,
  ConfigConsistencyAnalyzerOptions,
  CycleEdge,
  CycleNode,
  CycleVisualization,
  DeadCodeAnalyzerOptions,
  DeadCodeStats,
  DuplicateCodeAnalyzerOptions,
  DuplicateDependencyAnalyzerOptions,
  DuplicateDependencyStats,
  DuplicatePattern,
  EslintConfigAnalyzerOptions,
  ExportedSymbol,
  ExportsFieldAnalyzerOptions,
  LargeDependencyAnalyzerOptions,
  PackageJsonAnalyzerOptions,
  PeerDependencyAnalyzerOptions,
  TreeShakingBlocker,
  TreeShakingBlockerAnalyzerOptions,
  TreeShakingBlockerType,
  TsconfigAnalyzerOptions,
  UnusedDependencyAnalyzerOptions,
  VersionAlignmentAnalyzerOptions,
} from './analyzers/index'

// Dependency graph utilities
export {
  buildDependencyGraph,
  computeGraphStatistics,
  findCycles,
  getTransitiveDependencies,
  getTransitiveDependents,
} from './graph/index'

export type {
  DependencyCycle,
  DependencyEdge,
  DependencyGraph,
  DependencyGraphOptions,
  DependencyNode,
  GraphStatistics,
} from './graph/index'

// Parser utilities
export {
  createProject,
  extractImports,
  getAllDependencies,
  getAllSourceFiles,
  getPackageNameFromSpecifier,
  getSourceFile,
  getUniqueDependencies,
  isJavaScriptFile,
  isRelativeImport,
  isSourceFile,
  isTypeScriptFile,
  isWorkspacePackageImport,
  parsePackageJson,
  parsePackageJsonContent,
  parseSourceContent,
  parseSourceFile,
  parseSourceFiles,
  parseTsConfig,
  parseTsConfigContent,
  resolveRelativeImport,
  resolveTsConfigExtends,
} from './parser/index'

export type {
  ConfigError,
  ConfigErrorCode,
  ExtractedImport,
  ImportExtractionResult,
  ImportExtractorOptions,
  ImportType,
  ParsedPackageJson,
  ParsedTsConfig,
  ParseError,
  ParseErrorCode,
  TsCompilerOptions,
  TsProjectReference,
  TypeScriptParserOptions,
} from './parser/index'

// Performance utilities (Phase 6)
export {
  estimateDependencySize,
  estimateFileSize,
  estimatePackageBundleSize,
  estimateTreeShakingSavings,
  findLargeDependencies,
  findLargeFiles,
  formatBytes,
} from './performance/index'

export type {
  BundleEstimatorOptions,
  BundleSizeEstimate,
  DependencySizeEstimate,
  OptimizableImport,
  PackageBundleStats,
  TreeShakingSavingsEstimate,
} from './performance/index'

// Rules engine and built-in rules (Phase 5)
export {
  barrelExportRuleMetadata,
  BUILTIN_RULE_IDS,
  createBarrelExportRule,
  createLayerViolationRule,
  createPackageBoundaryRule,
  createPathAliasRule,
  createPublicApiRule,
  createRuleEngine,
  createSideEffectRule,
  DEFAULT_LAYER_CONFIG,
  getFileLayer,
  isLayerImportAllowed,
  layerViolationRuleMetadata,
  packageBoundaryRuleMetadata,
  pathAliasRuleMetadata,
  publicApiRuleMetadata,
  sideEffectRuleMetadata,
} from './rules/index'

export type {
  BarrelExportRuleOptions,
  LayerConfiguration,
  LayerDefinition,
  LayerPattern,
  LayerViolationRuleOptions,
  PackageBoundaryRuleOptions,
  PathAliasRuleOptions,
  PublicApiRuleOptions,
  Rule,
  RuleContext,
  RuleEngine,
  RuleEngineError,
  RuleFactory,
  RuleMetadata,
  RuleOptions,
  RuleRegistration,
  RuleResult,
  RuleViolation,
  SideEffectRuleOptions,
} from './rules/index'

// Scanner utilities
export {
  createWorkspaceScanner,
  filterPackagesByPattern,
  getPackageScope,
  getUnscopedName,
  groupPackagesByScope,
} from './scanner/index'

export type {
  ScanError,
  WorkspacePackage,
  WorkspacePackageJson,
  WorkspaceScannerOptions,
  WorkspaceScanResult,
} from './scanner/index'

// Core types
export type {
  AnalysisError,
  AnalysisProgress,
  AnalysisResult,
  AnalysisResultType,
  AnalysisSummary,
  AnalyzerConfig,
  AnalyzeWorkspaceOptions,
  Issue,
  IssueCategory,
  IssueLocation,
  Severity,
} from './types/index'

// Result type utilities
export {
  err,
  flatMap,
  fromPromise,
  fromThrowable,
  isErr,
  isOk,
  map,
  mapErr,
  ok,
  unwrap,
  unwrapOr,
} from './types/index'

export type {Err, Ok, Result} from './types/index'
// Utility functions
export {matchAnyPattern, matchPattern, normalizePath} from './utils/index'

// Placeholder for main API entry point (will be implemented in Phase 9)
// export {analyzeWorkspace} from './api/analyze-workspace'
