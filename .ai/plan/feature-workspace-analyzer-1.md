---
goal: Create @bfra.me/workspace-analyzer Package for Comprehensive Monorepo Static Analysis
version: 1.2
date_created: 2025-11-29
last_updated: 2025-12-06
owner: marcusrbrown
status: 'In Progress'
tags: ['feature', 'package', 'typescript', 'static-analysis', 'ast', 'monorepo', 'architecture', 'cli']
---

# Introduction

![Status: In Progress](https://img.shields.io/badge/status-In_Progress-yellow)

Create a new `@bfra.me/workspace-analyzer` package in the bfra.me/works monorepo that provides comprehensive workspace analysis through deep AST parsing and static analysis. The package will detect configuration inconsistencies, unused dependencies, circular imports, architectural violations, and performance optimization opportunities across the entire monorepo. The implementation reuses proven infrastructure from `@bfra.me/es` (Result types, file watchers, async utilities) and `@bfra.me/doc-sync` (TypeScript parsing with ts-morph, package scanning patterns, orchestrator architecture). A modern CLI interface using `@clack/prompts` provides interactive analysis with progress reporting. The package includes a `workspace-analyzer.config.ts` configuration file for the `@bfra.me/works` monorepo itself to codify project-specific rules and integrate with CI validation.

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
- **REQ-010**: Provide CLI tool with modern TUI using `@clack/prompts` for interactive workspace analysis
- **REQ-011**: Support `workspace-analyzer.config.ts` configuration files for project-specific rules and settings

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

- **GUD-001**: Follow TypeScript patterns from `AGENTS.md` (explicit exports, no `export *`)
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
| TASK-001 | Create package directory structure at `packages/workspace-analyzer/` with `src/`, `test/`, `lib/` folders | ✅ | 2025-12-06 |
| TASK-002 | Initialize `package.json` with proper exports, scripts, dependencies (typescript, ts-morph, @clack/prompts, cac, consola), and `bin` entry for CLI | ✅ | 2025-12-06 |
| TASK-003 | Configure `tsconfig.json` extending `@bfra.me/tsconfig` with strict mode | ✅ | 2025-12-06 |
| TASK-004 | Set up `eslint.config.ts` using `defineConfig()` with TypeScript and Vitest support | ✅ | 2025-12-06 |
| TASK-005 | Create `tsup.config.ts` for ES module build with entry points `['src/index.ts', 'src/cli.ts']` | ✅ | 2025-12-06 |
| TASK-006 | Create `vitest.config.ts` with coverage thresholds (80% statements, 75% branches) | ✅ | 2025-12-06 |
| TASK-007 | Import and re-export `Result<T, E>` type from `@bfra.me/es/result` in `src/types/result.ts` | ✅ | 2025-12-06 |
| TASK-008 | Create core analysis types in `src/types/index.ts` (AnalysisResult, Issue, Severity, AnalyzerConfig) extending Result pattern | ✅ | 2025-12-06 |
| TASK-009 | Create main export barrel in `src/index.ts` with explicit named exports | ✅ | 2025-12-06 |
| TASK-010 | Update root `tsconfig.json` to add path mapping for `@bfra.me/workspace-analyzer` | ✅ | 2025-12-06 |

### Implementation Phase 2: Workspace Scanner and TypeScript Parser Infrastructure

- GOAL-002: Reuse proven scanning and parsing patterns from @bfra.me/doc-sync by **directly importing** (not duplicating)

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-011 | Adapt `createPackageScanner()` pattern from `@bfra.me/doc-sync/orchestrator/package-scanner` for workspace package discovery | ✅ | 2025-12-06 |
| TASK-012 | **Import and re-export** `createProject()`, `parseSourceFile()`, `parseSourceContent()` from `@bfra.me/doc-sync/parsers` | ✅ | 2025-12-06 |
| TASK-013 | Create workspace scanner in `src/scanner/workspace-scanner.ts` using adapted package discovery pattern | ✅ | 2025-12-06 |
| TASK-014 | Implement import extractor in `src/parser/import-extractor.ts` using ts-morph types (via doc-sync transitive dependency) | ✅ | 2025-12-06 |
| TASK-015 | Create dependency graph builder in `src/graph/dependency-graph.ts` for import relationship tracking | ✅ | 2025-12-06 |
| TASK-016 | Implement configuration file parser in `src/parser/config-parser.ts` for package.json, tsconfig.json analysis | ✅ | 2025-12-06 |
| TASK-017 | Add source file collector using fs.readdir pattern (like doc-sync) instead of fast-glob for better control | ✅ | 2025-12-06 |
| TASK-018 | Create parser registry in `src/parser/index.ts` with explicit barrel exports (re-exporting from doc-sync + local) | ✅ | 2025-12-06 |

### Implementation Phase 3: Configuration Analysis

- GOAL-003: Implement analyzers for detecting configuration inconsistencies across package files

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-019 | Create analyzer interface in `src/analyzers/analyzer.ts` with `analyze(context): Promise<Result<Issue[]>>` | ✅ | 2025-12-06 |
| TASK-020 | Implement `PackageJsonAnalyzer` in `src/analyzers/package-json-analyzer.ts` reusing package parsing from doc-sync | ✅ | 2025-12-06 |
| TASK-021 | Implement `TsconfigAnalyzer` in `src/analyzers/tsconfig-analyzer.ts` for tsconfig.json consistency | ✅ | 2025-12-06 |
| TASK-022 | Implement `EslintConfigAnalyzer` in `src/analyzers/eslint-config-analyzer.ts` for eslint.config.ts validation | ✅ | 2025-12-06 |
| TASK-023 | Implement `BuildConfigAnalyzer` in `src/analyzers/build-config-analyzer.ts` for tsup.config.ts analysis | ✅ | 2025-12-06 |
| TASK-024 | Create `ConfigConsistencyAnalyzer` in `src/analyzers/config-consistency-analyzer.ts` for cross-config validation | ✅ | 2025-12-06 |
| TASK-025 | Implement version alignment checker for workspace dependencies | ✅ | 2025-12-06 |
| TASK-026 | Add exports field validation against actual source file structure | ✅ | 2025-12-06 |
| TASK-027 | Create analyzer registry in `src/analyzers/index.ts` for plugin architecture | ✅ | 2025-12-06 |

### Implementation Phase 4: Dependency Analysis

- GOAL-004: Implement comprehensive dependency analysis including unused and circular detection

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-028 | Implement `UnusedDependencyAnalyzer` in `src/analyzers/unused-dependency-analyzer.ts` using import extraction | ✅ | 2025-12-06 |
| TASK-029 | Handle dynamic imports and require() calls in dependency detection | ✅ | 2025-12-06 |
| TASK-030 | Implement dev vs production dependency classification | ✅ | 2025-12-06 |
| TASK-031 | Implement `CircularImportAnalyzer` in `src/analyzers/circular-import-analyzer.ts` with Tarjan's algorithm | ✅ | 2025-12-06 |
| TASK-032 | Generate cycle visualization data for reporting | ✅ | 2025-12-06 |
| TASK-033 | Implement peer dependency validation for workspace packages | ✅ | 2025-12-06 |
| TASK-034 | Add duplicate dependency detection across workspace packages | ✅ | 2025-12-06 |

### Implementation Phase 5: Architectural Analysis

- GOAL-005: Implement architectural pattern validation and anti-pattern detection

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-035 | Create architectural rule engine in `src/rules/rule-engine.ts` | ✅ | 2025-12-06 |
| TASK-036 | Define built-in rule set in `src/rules/builtin-rules.ts` | ✅ | 2025-12-06 |
| TASK-037 | Implement `LayerViolationRule` for detecting cross-layer imports | ✅ | 2025-12-06 |
| TASK-038 | Implement `BarrelExportRule` for detecting `export *` misuse in application code | ✅ | 2025-12-06 |
| TASK-039 | Implement `PublicApiRule` for validating explicit public API surface using export-analyzer pattern | ✅ | 2025-12-06 |
| TASK-040 | Implement `SideEffectRule` for detecting side effects in module initialization | ✅ | 2025-12-06 |
| TASK-041 | Create `ArchitecturalAnalyzer` in `src/analyzers/architectural-analyzer.ts` | ✅ | 2025-12-06 |
| TASK-042 | Add configurable layer definition (domain, application, infrastructure, presentation) | ✅ | 2025-12-06 |
| TASK-043 | Implement import path alias validation against tsconfig paths | ✅ | 2025-12-06 |
| TASK-044 | Add monorepo package boundary enforcement rules | ✅ | 2025-12-06 |

### Implementation Phase 6: Performance Analysis

- GOAL-006: Implement performance optimization opportunity detection

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-045 | Create bundle size estimator in `src/performance/bundle-estimator.ts` | ✅ | 2025-12-06 |
| TASK-046 | Implement `TreeShakingBlockerAnalyzer` in `src/analyzers/tree-shaking-analyzer.ts` | ✅ | 2025-12-06 |
| TASK-047 | Detect CommonJS interop patterns that prevent tree-shaking | ✅ | 2025-12-06 |
| TASK-048 | Implement `DuplicateCodeAnalyzer` in `src/analyzers/duplicate-code-analyzer.ts` using AST fingerprinting | ✅ | 2025-12-06 |
| TASK-049 | Create `LargeDependencyAnalyzer` in `src/analyzers/large-dependency-analyzer.ts` | ✅ | 2025-12-06 |
| TASK-050 | Implement `DeadCodeAnalyzer` in `src/analyzers/dead-code-analyzer.ts` for unreachable exports | ✅ | 2025-12-06 |
| TASK-051 | Add type-only import enforcement detection | ✅ | 2025-12-06 |
| TASK-052 | Implement dynamic import optimization suggestions | ✅ | 2025-12-06 |

### Implementation Phase 7: Reporting and Output

- GOAL-007: Implement structured reporting with multiple output formats

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-053 | Create report generator interface in `src/reporters/reporter.ts` | | |
| TASK-054 | Implement `JsonReporter` in `src/reporters/json-reporter.ts` for machine-readable output | | |
| TASK-055 | Implement `MarkdownReporter` in `src/reporters/markdown-reporter.ts` for human-readable summaries | | |
| TASK-056 | Implement `ConsoleReporter` in `src/reporters/console-reporter.ts` using consola for colored terminal output | | |
| TASK-057 | Add severity filtering and grouping options | | |
| TASK-058 | Implement fix suggestions in report output where applicable | | |
| TASK-059 | Create summary statistics (total issues, by category, by severity) | | |
| TASK-060 | Add file-based issue location with line/column numbers | | |

### Implementation Phase 8: Caching and Incremental Analysis

- GOAL-008: Implement incremental analysis with caching using @bfra.me/es utilities for large codebase performance

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-061 | Design cache schema in `src/cache/cache-schema.ts` | | |
| TASK-062 | Reuse `createFileHasher()` from `@bfra.me/es/watcher` for file change detection | | |
| TASK-063 | Reuse `createChangeDetector()` from `@bfra.me/es/watcher` for incremental analysis | | |
| TASK-064 | Create cache manager in `src/cache/cache-manager.ts` with file-based storage | | |
| TASK-065 | Implement incremental analysis orchestrator in `src/core/incremental-analyzer.ts` | | |
| TASK-066 | Add cache invalidation for configuration file changes | | |
| TASK-067 | Use `pLimit()` from `@bfra.me/es/async` for parallel analysis execution | | |
| TASK-068 | Add progress reporting callback for long-running analysis | | |

### Implementation Phase 9: Main API and Orchestration

- GOAL-009: Implement main public API with orchestration layer reusing doc-sync patterns

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-069 | Create main API entry in `src/api/analyze-workspace.ts` | | |
| TASK-070 | Implement `AnalysisContext` for sharing state between analyzers | | |
| TASK-071 | Create analysis orchestrator in `src/core/orchestrator.ts` adapting doc-sync's sync-orchestrator pattern | | |
| TASK-072 | Implement analyzer pipeline with dependency ordering | | |
| TASK-073 | Add configuration validation using zod (already in workspace via doc-sync) | | |
| TASK-074 | Create default configuration in `src/config/defaults.ts` | | |
| TASK-075 | Implement configuration merging (file + programmatic) | | |
| TASK-076 | Add `workspace-analyzer.config.ts` file support with defineConfig() pattern | | |

### Implementation Phase 10: CLI Interface

- GOAL-010: Implement modern CLI with interactive TUI reusing doc-sync CLI patterns and @clack/prompts

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-077 | Create CLI entry point in `src/cli/index.ts` adapting doc-sync's CLI structure with cac for argument parsing | | |
| TASK-078 | Implement `analyze` command with `@clack/prompts` intro, outro, and spinner components | | |
| TASK-079 | Add analyzer selection using `@clack/prompts` multiselect adapting doc-sync's package selection pattern | | |
| TASK-080 | Implement progress reporting with `@clack/prompts` spinner and createProgressCallback pattern from doc-sync | | |
| TASK-081 | Create results display using `@clack/prompts` log methods and consola integration like doc-sync | | |
| TASK-082 | Add `--config` flag support for custom `workspace-analyzer.config.ts` path | | |
| TASK-083 | Implement `--json` and `--markdown` output format flags for non-interactive use | | |
| TASK-084 | Add `--fix` flag placeholder for future auto-fix capabilities | | |
| TASK-085 | Implement `--dry-run`, `--verbose`, `--quiet` logging options like doc-sync | | |
| TASK-086 | Write CLI unit tests in `test/cli/cli.test.ts` | | |

### Implementation Phase 11: Testing Infrastructure

- GOAL-011: Set up comprehensive testing infrastructure with synthetic scenarios and memfs mocks

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-087 | Create `__mocks__/fs.ts` with memfs-based mock file system adapting doc-sync's testing pattern | | |
| TASK-088 | Create test fixtures in `test/fixtures/workspaces/` with sample monorepo structures | | |
| TASK-089 | Create expected output fixtures in `test/fixtures/expected/` for analysis result comparison | | |
| TASK-090 | Implement `test/scanner/workspace-scanner.test.ts` with concurrent test execution | | |
| TASK-091 | Implement `test/analyzers/unused-dependency-analyzer.test.ts` | | |
| TASK-092 | Implement `test/analyzers/circular-import-analyzer.test.ts` | | |
| TASK-093 | Implement `test/analyzers/config-consistency-analyzer.test.ts` | | |
| TASK-094 | Implement `test/reporters/report-generation.test.ts` with snapshot testing | | |

### Implementation Phase 12: Integration Testing

- GOAL-012: Create integration tests verifying end-to-end analysis pipeline

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-095 | Create `test/integration/analysis-pipeline.test.ts` for full analysis flow validation | | |
| TASK-096 | Implement `test/integration/incremental-analysis.test.ts` for cache and change detection accuracy | | |
| TASK-097 | Create `test/integration/configuration-validation.test.ts` for config file handling | | |
| TASK-098 | Implement `test/integration/multi-package-analysis.test.ts` for workspace-wide scenarios | | |
| TASK-099 | Add test coverage for error scenarios and recovery paths | | |

### Implementation Phase 13: Documentation and Works Integration

- GOAL-013: Complete documentation and create workspace-analyzer.config.ts for the monorepo itself

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-100 | Create comprehensive README.md for `packages/workspace-analyzer/` | | |
| TASK-101 | Add package documentation to `docs/src/content/docs/packages/workspace-analyzer.mdx` | | |
| TASK-102 | Create `workspace-analyzer.config.ts` at workspace root codifying bfra.me/works-specific rules | | |
| TASK-103 | Document built-in analyzers and rule configuration patterns | | |
| TASK-104 | Add `workspace-analyzer` script to root `package.json` for running analysis | | |
| TASK-105 | Integrate workspace-analyzer into `pnpm validate` script | | |
| TASK-106 | Add workspace-analyzer step to `.github/workflows/main.yaml` CI workflow | | |
| TASK-107 | Create changeset entry for initial release | | |
| TASK-108 | Update root `llms.txt` with workspace-analyzer package information | | |

## 3. Alternatives

- **ALT-001**: Use ESLint with custom rules instead of standalone package — rejected because ESLint coupling adds complexity and limits non-linting analysis (dependency graphs, performance)
- **ALT-002**: Use Madge for circular import detection — rejected because it lacks TypeScript path alias support and monorepo-aware analysis
- **ALT-003**: Build own TypeScript parser instead of reusing ts-morph infrastructure from doc-sync — rejected due to proven reliability and DRY principle
- **ALT-004**: Use fast-glob for package discovery instead of fs.readdir pattern — rejected in favor of proven doc-sync scanning pattern with better control
- **ALT-005**: Use commander.js or yargs for CLI instead of cac — rejected in favor of cac (lighter footprint, proven in doc-sync)
- **ALT-006**: Build custom change detection instead of reusing @bfra.me/es/watcher — rejected due to DRY principle and proven reliability
- **ALT-007**: Use Nx or Turborepo analysis features — rejected because they require project adoption and don't provide custom rule extensibility

## 4. Dependencies

### Reused Internal Dependencies (Direct Imports)

- **DEP-001**: `@bfra.me/es` (workspace:*) — Core utilities package. **Directly imported:**
  - `Result<T, E>` type from `@bfra.me/es/result` for error handling
  - `ok()`, `err()`, `isOk()`, `isErr()` utilities from `@bfra.me/es/result`
  - `createFileHasher()` from `@bfra.me/es/watcher` for file change detection (Phase 8)
  - `createChangeDetector()` from `@bfra.me/es/watcher` for incremental analysis (Phase 8)
  - `pLimit()` from `@bfra.me/es/async` for parallel analysis execution (Phase 8)
  - `debounce()`, `throttle()` from `@bfra.me/es/async` for CLI responsiveness (Phase 10)

- **DEP-002**: `@bfra.me/doc-sync` (workspace:*) — Documentation sync package. **Directly imported:**
  - `createProject()` from `@bfra.me/doc-sync/parsers` for ts-morph project initialization
  - `parseSourceFile()` from `@bfra.me/doc-sync/parsers` for TypeScript AST parsing
  - `parseSourceContent()` from `@bfra.me/doc-sync/parsers` for in-memory parsing
  - `TypeScriptParserOptions` type from `@bfra.me/doc-sync/parsers`
  - `ParseError`, `ParseErrorCode` types from `@bfra.me/doc-sync/types`
  - CLI patterns adapted from `@bfra.me/doc-sync/cli` (Phase 10)
  - Configuration validation patterns using zod (Phase 9)

### External Dependencies (via @bfra.me/doc-sync transitive)

- **DEP-003**: `typescript` (^5.4.0) — TypeScript Compiler API for AST parsing (transitive via doc-sync)
- **DEP-004**: `ts-morph` (^27.0.0) — TypeScript Compiler API wrapper (transitive via doc-sync, peer dependency)
- **DEP-005**: `@clack/prompts` (^0.11.0) — Modern CLI prompts for interactive TUI
- **DEP-006**: `cac` (^6.7.14) — Lightweight CLI argument parser
- **DEP-007**: `consola` (^3.4.2) — Console logging with levels

### External Development Dependencies

- **DEP-008**: `@bfra.me/works` (workspace:*) — Development tooling package for ESLint/TS config
- **DEP-009**: `memfs` (^4.51.1) — In-memory file system for testing

### Peer Dependencies

- **DEP-010**: `typescript` (>=5.0.0) — Consumer provides TypeScript version
- **DEP-011**: `ts-morph` (>=27.0.0) — Consumer provides ts-morph for AST operations

## 5. Files

### Source Files

- **FILE-001**: `packages/workspace-analyzer/src/index.ts` — Main entry point with public API exports
- **FILE-002**: `packages/workspace-analyzer/src/cli.ts` — CLI entry point with @clack/prompts TUI
- **FILE-003**: `packages/workspace-analyzer/src/types/index.ts` — Core type definitions (AnalysisResult, Issue, Severity, CliOptions)
- **FILE-004**: `packages/workspace-analyzer/src/types/result.ts` — Result<T> discriminated union type re-export
- **FILE-005**: `packages/workspace-analyzer/src/parser/typescript-parser.ts` — TypeScript AST parser wrapper
- **FILE-006**: `packages/workspace-analyzer/src/parser/import-extractor.ts` — Import statement extraction
- **FILE-007**: `packages/workspace-analyzer/src/scanner/workspace-scanner.ts` — File discovery and workspace mapping
- **FILE-008**: `packages/workspace-analyzer/src/graph/dependency-graph.ts` — Dependency graph construction
- **FILE-009**: `packages/workspace-analyzer/src/analyzers/analyzer.ts` — Analyzer interface definition
- **FILE-010**: `packages/workspace-analyzer/src/analyzers/index.ts` — Analyzer registry and exports
- **FILE-011**: `packages/workspace-analyzer/src/analyzers/circular-import-analyzer.ts` — Circular import detection
- **FILE-012**: `packages/workspace-analyzer/src/analyzers/unused-dependency-analyzer.ts` — Unused dependency detection
- **FILE-013**: `packages/workspace-analyzer/src/analyzers/config-consistency-analyzer.ts` — Cross-config validation
- **FILE-014**: `packages/workspace-analyzer/src/analyzers/architectural-analyzer.ts` — Architectural pattern validation
- **FILE-015**: `packages/workspace-analyzer/src/analyzers/tree-shaking-analyzer.ts` — Tree-shaking blocker detection
- **FILE-016**: `packages/workspace-analyzer/src/rules/rule-engine.ts` — Architectural rule engine
- **FILE-017**: `packages/workspace-analyzer/src/rules/builtin-rules.ts` — Built-in rule definitions
- **FILE-018**: `packages/workspace-analyzer/src/reporters/json-reporter.ts` — JSON output reporter
- **FILE-019**: `packages/workspace-analyzer/src/reporters/markdown-reporter.ts` — Markdown output reporter
- **FILE-020**: `packages/workspace-analyzer/src/reporters/console-reporter.ts` — Console output reporter
- **FILE-021**: `packages/workspace-analyzer/src/cache/cache-manager.ts` — Analysis cache management
- **FILE-022**: `packages/workspace-analyzer/src/core/orchestrator.ts` — Analysis orchestration
- **FILE-023**: `packages/workspace-analyzer/src/api/analyze-workspace.ts` — Main API entry function

## 5. Files

### Core Implementation Files

- **FILE-001**: `packages/workspace-analyzer/src/index.ts` — Main export barrel with explicit named exports
- **FILE-002**: `packages/workspace-analyzer/src/types/index.ts` — Core analysis types (AnalysisResult, Issue, Severity)
- **FILE-003**: `packages/workspace-analyzer/src/types/result.ts` — Re-export of Result type from @bfra.me/es
- **FILE-004**: `packages/workspace-analyzer/src/scanner/workspace-scanner.ts` — Workspace package discovery (adapted from doc-sync)
- **FILE-005**: `packages/workspace-analyzer/src/parser/typescript-parser.ts` — **Re-exports from @bfra.me/doc-sync/parsers** + workspace-specific utilities
- **FILE-006**: `packages/workspace-analyzer/src/parser/import-extractor.ts` — Import statement extraction (uses ts-morph via doc-sync)
- **FILE-007**: `packages/workspace-analyzer/src/graph/dependency-graph.ts` — Dependency relationship tracking with Tarjan's cycle detection
- **FILE-008**: `packages/workspace-analyzer/src/parser/config-parser.ts` — package.json and tsconfig.json parsing
- **FILE-009**: `packages/workspace-analyzer/src/analyzers/unused-dependency-analyzer.ts` — Unused dependency detection
- **FILE-010**: `packages/workspace-analyzer/src/analyzers/circular-import-analyzer.ts` — Circular dependency detection with Tarjan's algorithm
- **FILE-011**: `packages/workspace-analyzer/src/analyzers/config-consistency-analyzer.ts` — Configuration cross-validation
- **FILE-012**: `packages/workspace-analyzer/src/analyzers/architectural-analyzer.ts` — Architectural pattern validation
- **FILE-013**: `packages/workspace-analyzer/src/rules/rule-engine.ts` — Architectural rule execution engine
- **FILE-014**: `packages/workspace-analyzer/src/rules/builtin-rules.ts` — Built-in rule definitions
- **FILE-015**: `packages/workspace-analyzer/src/reporters/reporter.ts` — Reporter interface
- **FILE-016**: `packages/workspace-analyzer/src/reporters/json-reporter.ts` — JSON output format
- **FILE-017**: `packages/workspace-analyzer/src/reporters/markdown-reporter.ts` — Markdown output format
- **FILE-018**: `packages/workspace-analyzer/src/reporters/console-reporter.ts` — Terminal output with consola
- **FILE-019**: `packages/workspace-analyzer/src/cache/cache-manager.ts` — Analysis result caching
- **FILE-020**: `packages/workspace-analyzer/src/core/orchestrator.ts` — Analysis orchestration (adapted from doc-sync)
- **FILE-021**: `packages/workspace-analyzer/src/api/analyze-workspace.ts` — Public API entry point
- **FILE-022**: `packages/workspace-analyzer/src/cli/index.ts` — CLI entry point (adapted from doc-sync CLI structure)
- **FILE-023**: `packages/workspace-analyzer/src/cli/commands/*.ts` — CLI command implementations

### Configuration Files

- **FILE-024**: `packages/workspace-analyzer/package.json` — Package manifest with bin entry
- **FILE-025**: `packages/workspace-analyzer/tsconfig.json` — TypeScript configuration
- **FILE-026**: `packages/workspace-analyzer/eslint.config.ts` — ESLint configuration
- **FILE-027**: `packages/workspace-analyzer/tsup.config.ts` — Build configuration
- **FILE-028**: `packages/workspace-analyzer/vitest.config.ts` — Test configuration

### Workspace Configuration Files

- **FILE-029**: `workspace-analyzer.config.ts` — @bfra.me/works monorepo analyzer configuration

### Test Files

- **FILE-030**: `packages/workspace-analyzer/__mocks__/fs.ts` — memfs-based mock file system (adapted from doc-sync)
- **FILE-031**: `packages/workspace-analyzer/test/fixtures/workspaces/` — Synthetic test workspace fixtures
- **FILE-032**: `packages/workspace-analyzer/test/analyzers/*.test.ts` — Analyzer unit tests
- **FILE-033**: `packages/workspace-analyzer/test/integration/*.test.ts` — Integration tests
- **FILE-034**: `packages/workspace-analyzer/test/cli/*.test.ts` — CLI unit tests

### Documentation Files

- **FILE-035**: `packages/workspace-analyzer/README.md` — Package and CLI documentation
- **FILE-036**: `docs/src/content/docs/packages/workspace-analyzer.mdx` — Package documentation for docs site

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
- **TEST-014**: CLI parses arguments correctly (--config, --json, --markdown, --help, --version)
- **TEST-015**: CLI interactive mode prompts work with @clack/prompts

### Integration Tests

- **TEST-016**: Full workspace analysis completes without errors on synthetic monorepo
- **TEST-017**: Analysis results match expected output snapshots
- **TEST-018**: Incremental analysis only re-analyzes changed files
- **TEST-019**: Multiple output formats produce valid output (JSON, Markdown)
- **TEST-020**: Analysis respects .gitignore patterns
- **TEST-021**: CLI runs successfully on @bfra.me/works monorepo with workspace-analyzer.config.ts

### Pattern Validation Tests

- **TEST-022**: Clean architecture fixture passes all architectural rules
- **TEST-023**: Barrel re-export abuse fixture triggers anti-pattern detection
- **TEST-024**: Circular dependency fixture correctly identifies all cycles
- **TEST-025**: Mixed concern fixture triggers separation of concerns warning

## 7. Risks & Assumptions

### Risks

- **RISK-001**: TypeScript Compiler API changes between versions may break parser — mitigate with version pinning and abstraction layer
- **RISK-002**: Large codebase analysis may exceed memory limits — mitigate with streaming and chunked processing
- **RISK-003**: Complex import patterns (barrel re-exports, path aliases) may cause false positives — mitigate with comprehensive test fixtures
- **RISK-004**: Workspace with mixed ESM/CJS may cause analysis inconsistencies — mitigate with explicit module format detection
- **RISK-005**: @clack/prompts may have breaking changes — mitigate with version pinning and abstraction layer for TUI components

### Assumptions

- **ASSUMPTION-001**: Target workspaces use TypeScript 5.0+ compatible syntax
- **ASSUMPTION-002**: Workspaces follow standard Node.js project structure (package.json at root)
- **ASSUMPTION-003**: Users have read access to all files within workspace boundaries
- **ASSUMPTION-004**: tsconfig.json files are valid JSON5 format
- **ASSUMPTION-005**: Workspace does not contain symlink cycles outside node_modules
- **ASSUMPTION-006**: CLI users have terminal supporting ANSI colors and interactive prompts
- **ASSUMPTION-007**: @bfra.me/es and @bfra.me/doc-sync packages provide stable APIs for reuse

## 8. Related Specifications / Further Reading

- [TypeScript Compiler API Documentation](https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API)
- [ts-morph Documentation](https://ts-morph.com/) — TypeScript Compiler API wrapper used by doc-sync
- [Tarjan's Algorithm for Strongly Connected Components](https://en.wikipedia.org/wiki/Tarjan%27s_strongly_connected_components_algorithm)
- [Clean Architecture Principles](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Tree-Shaking Guide](https://webpack.js.org/guides/tree-shaking/)
- [ESM vs CJS Module Differences](https://nodejs.org/api/esm.html)
- [@clack/prompts Documentation](https://github.com/bombshell-dev/clack) — Modern CLI prompts library
- [cac Documentation](https://github.com/cacjs/cac) — Lightweight CLI framework
- Reusable patterns from `@bfra.me/doc-sync`: package scanning, TypeScript parsing, CLI structure, orchestration
- Reusable utilities from `@bfra.me/es`: Result type, file watchers, async utilities, type guards
- Existing test fixtures: `packages/doc-sync/test/fixtures/`, `packages/doc-sync/__mocks__/`
- Monorepo conventions: `AGENTS.md`, `CLAUDE.md`
