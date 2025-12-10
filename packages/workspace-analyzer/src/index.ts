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

// Main API entry point (Phase 9)
export {analyzePackages, analyzeWorkspace} from './api/index'

// Cache utilities (Phase 8)
export {
  CACHE_SCHEMA_VERSION,
  collectConfigFileStates,
  CONFIG_FILE_PATTERNS,
  createAnalysisChangeDetector,
  createCacheManager,
  createChangeDetector,
  createEmptyCache,
  createFileAnalysisEntry,
  createFileHasher,
  createPackageAnalysisEntry,
  createWorkspaceHasher,
  DEFAULT_CACHE_OPTIONS,
  initializeCache,
} from './cache/index'

export type {
  AnalysisCache,
  AnalysisChangeDetector,
  AnalysisChangeDetectorOptions,
  CachedFileAnalysis,
  CachedFileState,
  CachedPackageAnalysis,
  CacheError,
  CacheErrorCode,
  CacheManager,
  CacheManagerOptions,
  CacheMetadata,
  CacheOptions,
  CacheStatistics,
  CacheValidationResult,
  ChangeDetector,
  ChangeDetectorOptions,
  FileHasher,
  WorkspaceFileHasher,
  WorkspaceHasherOptions,
} from './cache/index'

// Configuration utilities (Phase 9)
export {
  DEFAULT_ANALYZER_CONFIG,
  DEFAULT_CONCURRENCY,
  DEFAULT_EXCLUDE_PATTERNS,
  DEFAULT_INCLUDE_PATTERNS,
  DEFAULT_PACKAGE_PATTERNS,
  DEFAULT_WORKSPACE_OPTIONS,
  defineConfig,
  findConfigFile,
  getAnalyzerOptions,
  getDefaultConfig,
  loadConfig,
  loadConfigFile,
  mergeAnalyzerConfigs,
  mergeConfig,
  parseWorkspaceAnalyzerConfig,
  safeParseAnalyzeOptions,
} from './config/index'

export type {
  ConfigLoadError,
  ConfigLoadErrorCode,
  ConfigLoadResult,
  MergedConfig,
  SafeParseResult,
  WorkspaceAnalyzerConfig,
} from './config/index'

// Core orchestration utilities (Phase 8 & 9)
export {
  createConsoleProgressCallback,
  createIncrementalAnalyzer,
  createOrchestrator,
  createSilentProgressCallback,
  DEFAULT_INCREMENTAL_OPTIONS,
} from './core/index'

export type {
  AnalysisOrchestrator,
  IncrementalAnalysisContext,
  IncrementalAnalysisError,
  IncrementalAnalysisErrorCode,
  IncrementalAnalysisOptions,
  IncrementalAnalysisResult,
  IncrementalAnalyzer,
  OrchestratorOptions,
} from './core/index'

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

// Reporter utilities (Phase 7)
export {
  calculateSummary,
  CATEGORY_CONFIG,
  createConsoleReporter,
  createJsonReporter,
  createMarkdownReporter,
  DEFAULT_REPORT_OPTIONS,
  filterIssuesForReport,
  formatDuration,
  formatLocation,
  getRelativePath,
  groupIssues,
  SEVERITY_CONFIG,
  truncateText,
} from './reporters/index'

export type {
  ConsoleReporterOptions,
  GroupedIssues,
  JsonReport,
  JsonReporterOptions,
  JsonReportGroup,
  JsonReportIssue,
  JsonReportLocation,
  JsonReportMetadata,
  MarkdownReporterOptions,
  Reporter,
  ReporterFactory,
  ReportFormat,
  ReportOptions,
  ReportSummary,
} from './reporters/index'

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

// Visualizer module
export type {
  BuildVisualizationOptions,
  GraphBuilderContext,
  GraphConfig,
  HtmlRenderError,
  HtmlRenderOptions,
  MermaidExportOptions,
  ViolationCollectionContext,
  ViolationCollectionOptions,
  VisualizationCycle,
  VisualizationData,
  VisualizationEdge,
  VisualizationError,
  VisualizationFilters,
  VisualizationLayerDefinition,
  VisualizationMetadata,
  VisualizationNode,
  VisualizationStatistics,
  VisualizationViolation,
  VisualizerOptions,
} from './visualizer/index'
export {
  buildVisualizationData,
  collectVisualizationViolations,
  D3_CDN_URLS,
  D3_VERSION,
  DEFAULT_BUILD_OPTIONS,
  DEFAULT_HTML_RENDER_OPTIONS,
  DEFAULT_VIOLATION_COLLECTION_OPTIONS,
  DEFAULT_VISUALIZER_OPTIONS,
  estimateHtmlSize,
  exportCycleMermaid,
  exportVisualizationJson,
  exportVisualizationMermaid,
  getHighestSeverity,
  isWithinSizeLimit,
  mapIssuesToNodes,
  renderVisualizationHtml,
  sanitizeFilePath,
  sanitizeHtml,
  sanitizeJsString,
  sanitizeVisualizationData,
  SEVERITY_ORDER,
  transformCycleToVisualization,
  transformEdgeToVisualization,
  transformNodeToVisualization,
} from './visualizer/index'
