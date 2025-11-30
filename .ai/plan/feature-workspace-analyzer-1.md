---
goal: Create @bfra.me/workspace-analyzer Package for Comprehensive Monorepo Static Analysis
version: 1.0
date_created: 2025-11-29
last_updated: 2025-11-29
owner: marcusrbrown
status: 'Planned'
tags: ['feature', 'package', 'typescript', 'static-analysis', 'ast', 'monorepo', 'architecture']
---

# Introduction

![Status: Planned](https://img.shields.io/badge/status-Planned-blue)

Create a new `@bfra.me/workspace-analyzer` package in the bfra.me/works monorepo that provides comprehensive workspace analysis through deep AST parsing and static analysis. The package will detect configuration inconsistencies, unused dependencies, circular imports, architectural violations, and performance optimization opportunities across the entire monorepo. The implementation includes synthetic monorepo test scenarios, performance benchmarks for large codebases, and validation against known architectural patterns and anti-patterns.

## 1. Requirements & Constraints

### Functional Requirements

- **REQ-001**: Implement deep AST parsing using TypeScript Compiler API for `.ts`, `.tsx`, `.js`, `.jsx` files
- **REQ-002**: Detect configuration inconsistencies across `package.json`, `tsconfig.json`, `eslint.config.ts`, and `tsup.config.ts` files
- **REQ-003**: Identify unused dependencies by comparing `package.json` declarations against actual import statements
- **REQ-004**: Detect circular import chains with full path reporting and cycle visualization
- **REQ-005**: Validate architectural patterns against configurable rule sets (layer violations, barrel export misuse, etc.)
- **REQ-006**: Identify performance optimization opportunities (tree-shaking blockers, large bundle contributors, duplicate code)
- **REQ-007**: Provide programmatic API with `analyzeWorkspace(path, options)` entry point returning structured `AnalysisResult`
- **REQ-008**: Support incremental analysis with caching for performance on large codebases
- **REQ-009**: Generate machine-readable JSON reports and human-readable Markdown summaries

### Security Requirements

- **SEC-001**: Validate all file paths to prevent directory traversal attacks
- **SEC-002**: Sanitize all user-provided configuration before processing
- **SEC-003**: Limit file system access to workspace boundaries only

### Type Safety Requirements

- **TYP-001**: Strict TypeScript configuration extending `@bfra.me/tsconfig`
- **TYP-002**: Discriminated union `Result<T>` pattern for all analysis operations
- **TYP-003**: Comprehensive type definitions for all analyzer configurations and results
- **TYP-004**: Type-safe plugin interface for custom analyzers

### Constraints

- **CON-001**: Must use ES modules with `"type": "module"` in package.json
- **CON-002**: Dependencies on internal packages must use `workspace:*` versioning
- **CON-003**: Analysis of 1000+ file workspaces must complete within 30 seconds on standard hardware
- **CON-004**: Memory usage must not exceed 512MB for typical monorepo analysis
- **CON-005**: Zero runtime dependencies on ESLint or Prettier (analysis only)

### Guidelines

- **GUD-001**: Follow TypeScript patterns from `copilot-instructions.md` (explicit exports, no `export *`)
- **GUD-002**: Follow testing practices with `it.concurrent()` and `toMatchFileSnapshot()`
- **GUD-003**: Use discriminated union result pattern instead of throwing for expected errors
- **GUD-004**: Comment only WHY, not WHAT per self-explanatory code guidelines

### Patterns

- **PAT-001**: Use `defineConfig()` pattern for ESLint configuration
- **PAT-002**: Implement explicit barrel exports in `index.ts`
- **PAT-003**: Use discriminated unions for result types (`{success: true, data} | {success: false, error}`)
- **PAT-004**: Orchestrator pattern with pure helper functions for analyzers
- **PAT-005**: Plugin architecture for extensible analysis rules

## 2. Implementation Steps

### Implementation Phase 1: Core Infrastructure

- GOAL-001: Set up package structure, core types, and foundational AST parsing infrastructure

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-001 | Create package directory structure at `packages/workspace-analyzer/` with `src/`, `test/`, `lib/` folders | | |
| TASK-002 | Initialize `package.json` with proper exports, scripts, and dependencies (typescript, fast-glob, picomatch) | | |
| TASK-003 | Configure `tsconfig.json` extending `@bfra.me/tsconfig` with strict mode | | |
| TASK-004 | Set up `eslint.config.ts` using `defineConfig()` with TypeScript and Vitest support | | |
| TASK-005 | Create `tsup.config.ts` for ES module build with entry points `['src/index.ts', 'src/cli.ts']` | | |
| TASK-006 | Create `vitest.config.ts` with coverage thresholds (80% statements, 75% branches) | | |
| TASK-007 | Implement core types in `src/types/index.ts` (AnalysisResult, AnalyzerConfig, Issue, Severity) | | |
| TASK-008 | Implement Result<T> discriminated union type in `src/types/result.ts` | | |
| TASK-009 | Create workspace scanner in `src/scanner/workspace-scanner.ts` for file discovery using fast-glob | | |
| TASK-010 | Implement AST parser wrapper in `src/parser/typescript-parser.ts` using TypeScript Compiler API | | |
| TASK-011 | Create main export barrel in `src/index.ts` with explicit named exports | | |
| TASK-012 | Update root `tsconfig.json` to add path mapping for `@bfra.me/workspace-analyzer` | | |

### Implementation Phase 2: Configuration Analysis

- GOAL-002: Implement analyzers for detecting configuration inconsistencies across package files

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-013 | Create analyzer interface in `src/analyzers/analyzer.ts` with `analyze(context): Promise<Result<Issue[]>>` | | |
| TASK-014 | Implement `PackageJsonAnalyzer` in `src/analyzers/package-json-analyzer.ts` for package.json validation | | |
| TASK-015 | Implement `TsconfigAnalyzer` in `src/analyzers/tsconfig-analyzer.ts` for tsconfig.json consistency | | |
| TASK-016 | Implement `EslintConfigAnalyzer` in `src/analyzers/eslint-config-analyzer.ts` for eslint.config.ts validation | | |
| TASK-017 | Implement `BuildConfigAnalyzer` in `src/analyzers/build-config-analyzer.ts` for tsup.config.ts analysis | | |
| TASK-018 | Create `ConfigConsistencyAnalyzer` in `src/analyzers/config-consistency-analyzer.ts` for cross-config validation | | |
| TASK-019 | Implement version alignment checker for workspace dependencies | | |
| TASK-020 | Add exports field validation against actual source file structure | | |
| TASK-021 | Create analyzer registry in `src/analyzers/index.ts` for plugin architecture | | |

### Implementation Phase 3: Dependency Analysis

- GOAL-003: Implement comprehensive dependency analysis including unused and circular detection

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-022 | Create import extractor in `src/parser/import-extractor.ts` using TypeScript AST | | |
| TASK-023 | Implement `UnusedDependencyAnalyzer` in `src/analyzers/unused-dependency-analyzer.ts` | | |
| TASK-024 | Handle dynamic imports and require() calls in dependency detection | | |
| TASK-025 | Implement dev vs production dependency classification | | |
| TASK-026 | Create dependency graph builder in `src/graph/dependency-graph.ts` | | |
| TASK-027 | Implement `CircularImportAnalyzer` in `src/analyzers/circular-import-analyzer.ts` with Tarjan's algorithm | | |
| TASK-028 | Generate cycle visualization data for reporting | | |
| TASK-029 | Implement peer dependency validation for workspace packages | | |
| TASK-030 | Add duplicate dependency detection across workspace packages | | |

### Implementation Phase 4: Architectural Analysis

- GOAL-004: Implement architectural pattern validation and anti-pattern detection

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-031 | Create architectural rule engine in `src/rules/rule-engine.ts` | | |
| TASK-032 | Define built-in rule set in `src/rules/builtin-rules.ts` | | |
| TASK-033 | Implement `LayerViolationRule` for detecting cross-layer imports | | |
| TASK-034 | Implement `BarrelExportRule` for detecting `export *` misuse in application code | | |
| TASK-035 | Implement `PublicApiRule` for validating explicit public API surface | | |
| TASK-036 | Implement `SideEffectRule` for detecting side effects in module initialization | | |
| TASK-037 | Create `ArchitecturalAnalyzer` in `src/analyzers/architectural-analyzer.ts` | | |
| TASK-038 | Add configurable layer definition (domain, application, infrastructure, presentation) | | |
| TASK-039 | Implement import path alias validation against tsconfig paths | | |
| TASK-040 | Add monorepo package boundary enforcement rules | | |

### Implementation Phase 5: Performance Analysis

- GOAL-005: Implement performance optimization opportunity detection

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-041 | Create bundle size estimator in `src/performance/bundle-estimator.ts` | | |
| TASK-042 | Implement `TreeShakingBlockerAnalyzer` in `src/analyzers/tree-shaking-analyzer.ts` | | |
| TASK-043 | Detect CommonJS interop patterns that prevent tree-shaking | | |
| TASK-044 | Implement `DuplicateCodeAnalyzer` in `src/analyzers/duplicate-code-analyzer.ts` using AST fingerprinting | | |
| TASK-045 | Create `LargeDependencyAnalyzer` in `src/analyzers/large-dependency-analyzer.ts` | | |
| TASK-046 | Implement `DeadCodeAnalyzer` in `src/analyzers/dead-code-analyzer.ts` for unreachable exports | | |
| TASK-047 | Add type-only import enforcement detection | | |
| TASK-048 | Implement dynamic import optimization suggestions | | |

### Implementation Phase 6: Reporting and Output

- GOAL-006: Implement structured reporting with multiple output formats

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-049 | Create report generator interface in `src/reporters/reporter.ts` | | |
| TASK-050 | Implement `JsonReporter` in `src/reporters/json-reporter.ts` for machine-readable output | | |
| TASK-051 | Implement `MarkdownReporter` in `src/reporters/markdown-reporter.ts` for human-readable summaries | | |
| TASK-052 | Implement `ConsoleReporter` in `src/reporters/console-reporter.ts` for terminal output with colors | | |
| TASK-053 | Add severity filtering and grouping options | | |
| TASK-054 | Implement fix suggestions in report output where applicable | | |
| TASK-055 | Create summary statistics (total issues, by category, by severity) | | |
| TASK-056 | Add file-based issue location with line/column numbers | | |

### Implementation Phase 7: Caching and Performance

- GOAL-007: Implement incremental analysis with caching for large codebase performance

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-057 | Design cache schema in `src/cache/cache-schema.ts` | | |
| TASK-058 | Implement file hash calculator for change detection in `src/cache/file-hasher.ts` | | |
| TASK-059 | Create cache manager in `src/cache/cache-manager.ts` with file-based storage | | |
| TASK-060 | Implement incremental analysis orchestrator in `src/core/incremental-analyzer.ts` | | |
| TASK-061 | Add cache invalidation for configuration file changes | | |
| TASK-062 | Implement parallel analysis execution with worker threads | | |
| TASK-063 | Add progress reporting callback for long-running analysis | | |
| TASK-064 | Create memory-efficient streaming for large file sets | | |

### Implementation Phase 8: Main API and Orchestration

- GOAL-008: Implement main public API with orchestration layer

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-065 | Create main API entry in `src/api/analyze-workspace.ts` | | |
| TASK-066 | Implement `AnalysisContext` for sharing state between analyzers | | |
| TASK-067 | Create analysis orchestrator in `src/core/orchestrator.ts` | | |
| TASK-068 | Implement analyzer pipeline with dependency ordering | | |
| TASK-069 | Add configuration validation and normalization | | |
| TASK-070 | Create default configuration in `src/config/defaults.ts` | | |
| TASK-071 | Implement configuration merging (file + programmatic) | | |
| TASK-072 | Add `workspace-analyzer.config.ts` file support | | |

### Implementation Phase 9: Testing Infrastructure

- GOAL-009: Set up comprehensive testing infrastructure with synthetic scenarios

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-073 | Create test fixtures directory structure `test/fixtures/` | | |
| TASK-074 | Build synthetic monorepo fixture `test/fixtures/synthetic-monorepo/` with 50+ packages | | |
| TASK-075 | Create circular dependency fixture `test/fixtures/circular-deps/` | | |
| TASK-076 | Create unused dependency fixture `test/fixtures/unused-deps/` | | |
| TASK-077 | Create config inconsistency fixture `test/fixtures/config-inconsistent/` | | |
| TASK-078 | Create architectural violation fixture `test/fixtures/arch-violations/` | | |
| TASK-079 | Create large codebase fixture generator in `test/utils/generate-large-fixture.ts` | | |
| TASK-080 | Set up expected output fixtures for snapshot testing | | |

### Implementation Phase 10: Unit and Integration Testing

- GOAL-010: Implement comprehensive unit and integration tests

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-081 | Write unit tests for TypeScript parser in `test/parser/typescript-parser.test.ts` | | |
| TASK-082 | Write unit tests for import extractor in `test/parser/import-extractor.test.ts` | | |
| TASK-083 | Write unit tests for dependency graph in `test/graph/dependency-graph.test.ts` | | |
| TASK-084 | Write unit tests for circular import detection in `test/analyzers/circular-import.test.ts` | | |
| TASK-085 | Write unit tests for unused dependency detection in `test/analyzers/unused-dependency.test.ts` | | |
| TASK-086 | Write unit tests for config analyzers in `test/analyzers/config-analyzers.test.ts` | | |
| TASK-087 | Write unit tests for architectural rules in `test/rules/architectural-rules.test.ts` | | |
| TASK-088 | Write unit tests for cache manager in `test/cache/cache-manager.test.ts` | | |
| TASK-089 | Write integration tests for full workspace analysis in `test/integration/workspace-analysis.test.ts` | | |
| TASK-090 | Write integration tests for incremental analysis in `test/integration/incremental-analysis.test.ts` | | |

### Implementation Phase 11: Performance Benchmarks

- GOAL-011: Implement performance benchmarks for large codebase validation

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-091 | Create benchmark harness in `test/benchmarks/benchmark-harness.ts` | | |
| TASK-092 | Implement small workspace benchmark (100 files) in `test/benchmarks/small-workspace.bench.ts` | | |
| TASK-093 | Implement medium workspace benchmark (1000 files) in `test/benchmarks/medium-workspace.bench.ts` | | |
| TASK-094 | Implement large workspace benchmark (5000 files) in `test/benchmarks/large-workspace.bench.ts` | | |
| TASK-095 | Add memory profiling to benchmarks | | |
| TASK-096 | Create benchmark comparison baseline in `test/benchmarks/baselines/` | | |
| TASK-097 | Add CI benchmark regression detection | | |
| TASK-098 | Document performance characteristics in README.md | | |

### Implementation Phase 12: Pattern Validation Tests

- GOAL-012: Create tests validating against known architectural patterns and anti-patterns

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-099 | Create anti-pattern fixture for barrel re-export abuse | | |
| TASK-100 | Create anti-pattern fixture for god module detection | | |
| TASK-101 | Create anti-pattern fixture for deep nesting | | |
| TASK-102 | Create anti-pattern fixture for mixed concerns | | |
| TASK-103 | Create pattern fixture for clean architecture validation | | |
| TASK-104 | Create pattern fixture for hexagonal architecture validation | | |
| TASK-105 | Write pattern validation tests in `test/patterns/pattern-validation.test.ts` | | |
| TASK-106 | Write anti-pattern detection tests in `test/patterns/anti-pattern-detection.test.ts` | | |

### Implementation Phase 13: Documentation and Examples

- GOAL-013: Complete documentation with examples and integration guides

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-107 | Write comprehensive README.md with API documentation | | |
| TASK-108 | Create configuration reference in `docs/configuration.md` | | |
| TASK-109 | Write custom rule authoring guide in `docs/custom-rules.md` | | |
| TASK-110 | Create example configurations in `examples/` directory | | |
| TASK-111 | Write CI/CD integration examples (GitHub Actions, GitLab CI) | | |
| TASK-112 | Add JSDoc comments to all public API functions | | |
| TASK-113 | Create CHANGELOG.md with initial version entry | | |
| TASK-114 | Add package to docs site navigation | | |

### Implementation Phase 14: Release Preparation

- GOAL-014: Prepare package for initial release

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-115 | Run full validation suite (`pnpm validate`) and fix any issues | | |
| TASK-116 | Verify type coverage meets threshold (95%+) | | |
| TASK-117 | Run benchmarks and document baseline performance | | |
| TASK-118 | Create changeset for initial release | | |
| TASK-119 | Update root workspace references in `tsconfig.json` | | |
| TASK-120 | Add package to `pnpm-workspace.yaml` if not auto-detected | | |
| TASK-121 | Final review of public API surface for breaking change potential | | |
| TASK-122 | Publish initial version via `pnpm publish-changesets` | | |

## 3. Alternatives

- **ALT-001**: Use ESLint with custom rules instead of standalone package — rejected because ESLint coupling adds complexity and limits non-linting analysis (dependency graphs, performance)
- **ALT-002**: Use Madge for circular import detection — rejected because it lacks TypeScript path alias support and monorepo-aware analysis
- **ALT-003**: Use ts-morph instead of TypeScript Compiler API directly — considered viable but adds ~15MB dependency; may revisit for complex AST manipulations
- **ALT-004**: Use Nx or Turborepo analysis features — rejected because they require project adoption and don't provide custom rule extensibility
- **ALT-005**: Build as ESM + CJS dual format — rejected per monorepo constraints requiring ESM only

## 4. Dependencies

### Runtime Dependencies

- **DEP-001**: `typescript` (^5.4.0) — TypeScript Compiler API for AST parsing
- **DEP-002**: `fast-glob` (^3.3.0) — Efficient file discovery with gitignore support
- **DEP-003**: `picomatch` (^3.0.0) — Glob pattern matching for rule configuration
- **DEP-004**: `picocolors` (^1.0.0) — Terminal color output for console reporter
- **DEP-005**: `json5` (^2.2.0) — JSON5 parsing for tsconfig.json with comments

### Development Dependencies

- **DEP-006**: `@bfra.me/works` (workspace:*) — Root workspace dev dependency aggregator
- **DEP-007**: `@bfra.me/tsconfig` (workspace:*) — Shared TypeScript configuration
- **DEP-008**: `vitest` — Testing framework (via workspace root)
- **DEP-009**: `tsup` — Build tool (via workspace root)

### Peer Dependencies

- **DEP-010**: `typescript` (>=5.0.0) — Consumer provides TypeScript version

## 5. Files

### Source Files

- **FILE-001**: `packages/workspace-analyzer/src/index.ts` — Main entry point with public API exports
- **FILE-002**: `packages/workspace-analyzer/src/types/index.ts` — Core type definitions (AnalysisResult, Issue, Severity)
- **FILE-003**: `packages/workspace-analyzer/src/types/result.ts` — Result<T> discriminated union type
- **FILE-004**: `packages/workspace-analyzer/src/parser/typescript-parser.ts` — TypeScript AST parser wrapper
- **FILE-005**: `packages/workspace-analyzer/src/parser/import-extractor.ts` — Import statement extraction
- **FILE-006**: `packages/workspace-analyzer/src/scanner/workspace-scanner.ts` — File discovery and workspace mapping
- **FILE-007**: `packages/workspace-analyzer/src/graph/dependency-graph.ts` — Dependency graph construction
- **FILE-008**: `packages/workspace-analyzer/src/analyzers/analyzer.ts` — Analyzer interface definition
- **FILE-009**: `packages/workspace-analyzer/src/analyzers/index.ts` — Analyzer registry and exports
- **FILE-010**: `packages/workspace-analyzer/src/analyzers/circular-import-analyzer.ts` — Circular import detection
- **FILE-011**: `packages/workspace-analyzer/src/analyzers/unused-dependency-analyzer.ts` — Unused dependency detection
- **FILE-012**: `packages/workspace-analyzer/src/analyzers/config-consistency-analyzer.ts` — Cross-config validation
- **FILE-013**: `packages/workspace-analyzer/src/analyzers/architectural-analyzer.ts` — Architectural pattern validation
- **FILE-014**: `packages/workspace-analyzer/src/analyzers/tree-shaking-analyzer.ts` — Tree-shaking blocker detection
- **FILE-015**: `packages/workspace-analyzer/src/rules/rule-engine.ts` — Architectural rule engine
- **FILE-016**: `packages/workspace-analyzer/src/rules/builtin-rules.ts` — Built-in rule definitions
- **FILE-017**: `packages/workspace-analyzer/src/reporters/json-reporter.ts` — JSON output reporter
- **FILE-018**: `packages/workspace-analyzer/src/reporters/markdown-reporter.ts` — Markdown output reporter
- **FILE-019**: `packages/workspace-analyzer/src/reporters/console-reporter.ts` — Console output reporter
- **FILE-020**: `packages/workspace-analyzer/src/cache/cache-manager.ts` — Analysis cache management
- **FILE-021**: `packages/workspace-analyzer/src/core/orchestrator.ts` — Analysis orchestration
- **FILE-022**: `packages/workspace-analyzer/src/api/analyze-workspace.ts` — Main API entry function

### Configuration Files

- **FILE-023**: `packages/workspace-analyzer/package.json` — Package manifest
- **FILE-024**: `packages/workspace-analyzer/tsconfig.json` — TypeScript configuration
- **FILE-025**: `packages/workspace-analyzer/eslint.config.ts` — ESLint configuration
- **FILE-026**: `packages/workspace-analyzer/tsup.config.ts` — Build configuration
- **FILE-027**: `packages/workspace-analyzer/vitest.config.ts` — Test configuration

### Test Files

- **FILE-028**: `packages/workspace-analyzer/test/fixtures/synthetic-monorepo/` — Synthetic test monorepo
- **FILE-029**: `packages/workspace-analyzer/test/analyzers/*.test.ts` — Analyzer unit tests
- **FILE-030**: `packages/workspace-analyzer/test/integration/*.test.ts` — Integration tests
- **FILE-031**: `packages/workspace-analyzer/test/benchmarks/*.bench.ts` — Performance benchmarks

### Documentation Files

- **FILE-032**: `packages/workspace-analyzer/README.md` — Package documentation
- **FILE-033**: `packages/workspace-analyzer/CHANGELOG.md` — Version changelog
- **FILE-034**: `packages/workspace-analyzer/docs/configuration.md` — Configuration reference
- **FILE-035**: `packages/workspace-analyzer/docs/custom-rules.md` — Custom rule authoring guide

## 6. Testing

### Unit Tests

- **TEST-001**: TypeScript parser correctly parses all supported file extensions (.ts, .tsx, .js, .jsx)
- **TEST-002**: Import extractor identifies static imports, dynamic imports, and require() calls
- **TEST-003**: Dependency graph correctly builds adjacency list from imports
- **TEST-004**: Circular import analyzer detects simple cycles (A→B→A)
- **TEST-005**: Circular import analyzer detects complex cycles (A→B→C→D→B)
- **TEST-006**: Unused dependency analyzer correctly identifies unused packages
- **TEST-007**: Unused dependency analyzer handles re-exports and type-only imports
- **TEST-008**: Config consistency analyzer detects version mismatches
- **TEST-009**: Config consistency analyzer validates tsconfig path alignment
- **TEST-010**: Architectural analyzer detects layer boundary violations
- **TEST-011**: Tree-shaking analyzer identifies barrel export issues
- **TEST-012**: Cache manager correctly stores and retrieves analysis results
- **TEST-013**: Cache invalidation triggers on config file changes

### Integration Tests

- **TEST-014**: Full workspace analysis completes without errors on synthetic monorepo
- **TEST-015**: Analysis results match expected output snapshots
- **TEST-016**: Incremental analysis only re-analyzes changed files
- **TEST-017**: Multiple output formats produce valid output (JSON, Markdown)
- **TEST-018**: Analysis respects .gitignore patterns

### Performance Benchmarks

- **TEST-019**: Small workspace (100 files) analysis completes in <5 seconds
- **TEST-020**: Medium workspace (1000 files) analysis completes in <30 seconds
- **TEST-021**: Large workspace (5000 files) analysis completes in <120 seconds
- **TEST-022**: Memory usage stays under 512MB for medium workspace
- **TEST-023**: Cached analysis shows >50% speedup on subsequent runs

### Pattern Validation Tests

- **TEST-024**: Clean architecture fixture passes all architectural rules
- **TEST-025**: Barrel re-export abuse fixture triggers anti-pattern detection
- **TEST-026**: Circular dependency fixture correctly identifies all cycles
- **TEST-027**: Mixed concern fixture triggers separation of concerns warning

## 7. Risks & Assumptions

### Risks

- **RISK-001**: TypeScript Compiler API changes between versions may break parser — mitigate with version pinning and abstraction layer
- **RISK-002**: Large codebase analysis may exceed memory limits — mitigate with streaming and chunked processing
- **RISK-003**: Complex import patterns (barrel re-exports, path aliases) may cause false positives — mitigate with comprehensive test fixtures
- **RISK-004**: Performance benchmarks may vary significantly across hardware — mitigate with relative (not absolute) regression detection
- **RISK-005**: Workspace with mixed ESM/CJS may cause analysis inconsistencies — mitigate with explicit module format detection

### Assumptions

- **ASSUMPTION-001**: Target workspaces use TypeScript 5.0+ compatible syntax
- **ASSUMPTION-002**: Workspaces follow standard Node.js project structure (package.json at root)
- **ASSUMPTION-003**: Users have read access to all files within workspace boundaries
- **ASSUMPTION-004**: tsconfig.json files are valid JSON5 format
- **ASSUMPTION-005**: Workspace does not contain symlink cycles outside node_modules

## 8. Related Specifications / Further Reading

- [TypeScript Compiler API Documentation](https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API)
- [Shields.io Badge Configuration](https://shields.io/) — for badge generation in reports
- [fast-glob Documentation](https://github.com/mrmlnc/fast-glob)
- [Tarjan's Algorithm for Strongly Connected Components](https://en.wikipedia.org/wiki/Tarjan%27s_strongly_connected_components_algorithm)
- [Clean Architecture Principles](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Tree-Shaking Guide](https://webpack.js.org/guides/tree-shaking/)
- [ESM vs CJS Module Differences](https://nodejs.org/api/esm.html)
- Existing package patterns: `packages/badge-config/`, `packages/eslint-config/`
- Monorepo conventions: `.github/copilot-instructions.md`
