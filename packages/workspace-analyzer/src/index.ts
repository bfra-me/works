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
  BUILTIN_ANALYZER_IDS,
  builtinAnalyzers,
  computeCycleStats,
  computeDuplicateStats,
  createAnalyzerRegistry,
  createBuildConfigAnalyzer,
  createCircularImportAnalyzer,
  createConfigConsistencyAnalyzer,
  createDefaultRegistry,
  createDuplicateDependencyAnalyzer,
  createEslintConfigAnalyzer,
  createExportsFieldAnalyzer,
  createIssue,
  createPackageJsonAnalyzer,
  createPeerDependencyAnalyzer,
  createTsconfigAnalyzer,
  createUnusedDependencyAnalyzer,
  createVersionAlignmentAnalyzer,
  filterIssues,
  generateCycleVisualization,
  meetsMinSeverity,
  shouldAnalyzeCategory,
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
  BuildConfigAnalyzerOptions,
  // Dependency analyzer types (Phase 4)
  CircularImportAnalyzerOptions,
  CircularImportStats,
  ConfigConsistencyAnalyzerOptions,
  CycleEdge,
  CycleNode,
  CycleVisualization,
  DuplicateDependencyAnalyzerOptions,
  DuplicateDependencyStats,
  EslintConfigAnalyzerOptions,
  ExportsFieldAnalyzerOptions,
  PackageJsonAnalyzerOptions,
  PeerDependencyAnalyzerOptions,
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

// Placeholder for main API entry point (will be implemented in Phase 9)
// export {analyzeWorkspace} from './api/analyze-workspace'
