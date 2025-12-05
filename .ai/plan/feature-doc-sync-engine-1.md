---
goal: Build Intelligent Documentation Synchronization Engine for Automatic Astro Site Updates
version: 1.1
date_created: 2025-11-29
last_updated: 2025-12-04
owner: marcusrbrown
status: 'In Progress'
tags: ['feature', 'documentation', 'automation', 'astro', 'starlight', 'typescript', 'testing']
---

# Introduction

![Status: In Progress](https://img.shields.io/badge/status-In%20Progress-yellow)

Build an intelligent documentation synchronization engine that continuously monitors package source code, README files, and JSDoc comments to automatically update the Astro Starlight documentation site (`docs/`) with zero manual intervention. The system will parse TypeScript source files, extract JSDoc annotations, monitor README changes, and generate synchronized MDX documentation pages. Comprehensive testing includes mock file systems, document generation validation, and integration tests that verify the entire sync pipeline from source changes to deployed documentation updates. The CLI provides modern interactive features using `@clack/prompts` for a user-friendly experience alongside programmatic API access.

## 1. Requirements & Constraints

- **REQ-001**: Monitor all packages in `packages/*/` for changes to README.md, source files (`src/**/*.ts`), and JSDoc comments
- **REQ-002**: Parse TypeScript files using TypeScript Compiler API to extract JSDoc annotations, exported functions, types, and interfaces
- **REQ-003**: Generate MDX documentation files compatible with Astro Starlight in `docs/src/content/docs/packages/`
- **REQ-004**: Preserve manual content sections in generated MDX files using sentinel markers (e.g., `{/* AUTO-GENERATED */}`)
- **REQ-005**: Support incremental updates - only regenerate documentation for changed packages
- **REQ-006**: Provide CLI interface with modern TUI using `@clack/prompts` for interactive sync triggers and watch mode for development
- **REQ-007**: Generate API reference documentation from JSDoc annotations with type information
- **REQ-008**: Validate generated MDX syntax before writing to prevent broken documentation
- **REQ-009**: Support custom frontmatter configuration per package via `docs.config.json` or package.json field

- **SEC-001**: Sanitize all extracted content to prevent XSS in generated documentation
- **SEC-002**: Validate file paths to prevent directory traversal attacks during file operations

- **TYP-001**: Strict TypeScript configuration extending `@bfra.me/tsconfig`
- **TYP-002**: Type-safe AST traversal with proper node guards for TypeScript Compiler API
- **TYP-003**: Discriminated union `Result<T>` pattern for all parsing and generation operations

- **CON-001**: Must use ES modules with `"type": "module"` in package.json
- **CON-002**: Dependencies on internal packages must use `workspace:*` versioning
- **CON-003**: File system operations must be mockable for comprehensive testing
- **CON-004**: Integration with existing Astro Starlight configuration in `docs/astro.config.mjs`
- **CON-005**: Support for existing MDX component usage (Badge, Card, CardGrid, Tabs, TabItem)

- **GUD-001**: Follow TypeScript patterns from monorepo conventions with explicit named exports
- **GUD-002**: Follow testing practices with fixture-based tests and `it.concurrent()` patterns
- **GUD-003**: Use self-explanatory code with minimal comments explaining WHY not WHAT

- **PAT-001**: Use `defineConfig()` pattern for ESLint configuration
- **PAT-002**: Implement explicit barrel exports in `index.ts` - no wildcard exports
- **PAT-003**: Use discriminated unions for result types with `{success: true, data}` or `{success: false, error}`
- **PAT-004**: Pure function architecture for parsers and generators with orchestrator pattern for side effects

## 2. Implementation Steps

### Implementation Phase 1: Package Infrastructure Setup

- GOAL-001: Create the `@bfra.me/doc-sync` package with core infrastructure and configuration

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-001 | Create package directory structure in `packages/doc-sync/` with `src/`, `test/`, `lib/` directories | ✅ | 2025-12-03 |
| TASK-002 | Initialize `package.json` with exports, scripts, and dependencies (typescript, ts-morph, chokidar, fast-glob) | ✅ | 2025-12-03 |
| TASK-003 | Configure `tsconfig.json` extending `@bfra.me/tsconfig` with strict settings | ✅ | 2025-12-03 |
| TASK-004 | Set up `eslint.config.ts` using `defineConfig()` with TypeScript and Vitest support | ✅ | 2025-12-03 |
| TASK-005 | Create `tsup.config.ts` for ES module build with proper entry points | ✅ | 2025-12-03 |
| TASK-006 | Initialize `vitest.config.ts` with coverage and test configuration | ✅ | 2025-12-03 |
| TASK-007 | Create core types in `src/types.ts` for PackageInfo, DocConfig, ParseResult, SyncResult extending `Result<T, E>` from `@bfra.me/es/result` | ✅ | 2025-12-03 |

### Implementation Phase 2: Source Code Parsing Engine

- GOAL-002: Implement TypeScript/JSDoc parsing with proper AST traversal and extraction

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-008 | Create `src/parsers/typescript-parser.ts` using ts-morph for source file analysis | ✅ | 2025-12-04 |
| TASK-009 | Implement JSDoc extraction in `src/parsers/jsdoc-extractor.ts` with @param, @returns, @example support | ✅ | 2025-12-04 |
| TASK-010 | Create `src/parsers/export-analyzer.ts` to identify public API surface (exports from index.ts) | ✅ | 2025-12-04 |
| TASK-011 | Implement `src/parsers/readme-parser.ts` for Markdown parsing with section extraction | ✅ | 2025-12-04 |
| TASK-012 | Create `src/parsers/package-info.ts` to extract metadata from package.json files | ✅ | 2025-12-04 |
| TASK-013 | Build parser barrel export in `src/parsers/index.ts` with explicit named exports | ✅ | 2025-12-04 |
| TASK-014 | Add comprehensive type guards and validation for AST node types | ✅ | 2025-12-04 |

### Implementation Phase 3: Documentation Generation Engine

- GOAL-003: Build MDX generation with Starlight component integration and content merging

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-015 | Create `src/generators/mdx-generator.ts` for MDX document structure generation | ✅ | 2025-12-04 |
| TASK-016 | Implement `src/generators/frontmatter-generator.ts` for Starlight-compatible frontmatter | ✅ | 2025-12-04 |
| TASK-017 | Create `src/generators/api-reference-generator.ts` for function/type documentation tables | ✅ | 2025-12-04 |
| TASK-018 | Implement `src/generators/component-mapper.ts` to map content sections to Starlight components | ✅ | 2025-12-04 |
| TASK-019 | Create `src/generators/content-merger.ts` to preserve manual sections using sentinel markers | ✅ | 2025-12-04 |
| TASK-020 | Build `src/generators/code-example-formatter.ts` for syntax-highlighted code blocks | ✅ | 2025-12-04 |
| TASK-021 | Create generator barrel export in `src/generators/index.ts` | ✅ | 2025-12-04 |

### Implementation Phase 4: File System Watcher and Sync Orchestrator

- GOAL-004: Implement file watching, change detection, and sync orchestration

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-022 | Create `src/watcher/file-watcher.ts` using `createFileWatcher()` from `@bfra.me/es/watcher` for file system monitoring | ✅ | 2025-12-04 |
| TASK-023 | Implement `src/watcher/change-detector.ts` using `createChangeDetector()` from `@bfra.me/es/watcher` with hash comparison | ✅ | 2025-12-04 |
| TASK-024 | Create `src/watcher/debouncer.ts` using `createDebouncer()` from `@bfra.me/es/watcher` for batching file changes | ✅ | 2025-12-04 |
| TASK-025 | Implement `src/orchestrator/sync-orchestrator.ts` for coordinating parse → generate → write flow | ✅ | 2025-12-04 |
| TASK-026 | Create `src/orchestrator/package-scanner.ts` for discovering packages and their documentation needs | ✅ | 2025-12-04 |
| TASK-027 | Build `src/orchestrator/validation-pipeline.ts` for pre-write MDX validation | ✅ | 2025-12-04 |

### Implementation Phase 5: CLI Interface with Modern TUI

- GOAL-005: Create command-line interface with modern interactive features using `@clack/prompts`

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-028 | Create `src/cli/index.ts` with command structure using `cac` for typed CLI argument parsing | ✅ | 2025-12-04 |
| TASK-029 | Implement interactive intro/outro screens using `@clack/prompts` intro() and outro() for startup and completion messaging | ✅ | 2025-12-04 |
| TASK-030 | Implement `sync` command with `@clack/prompts` spinner component for real-time progress feedback | ✅ | 2025-12-04 |
| TASK-031 | Implement `watch` command with `@clack/prompts` for monitoring mode with file change notifications | ✅ | 2025-12-04 |
| TASK-032 | Implement `validate` command to check documentation freshness with `@clack/prompts` log methods (info, warn, error, success) | ✅ | 2025-12-04 |
| TASK-033 | Add `--package` filter option and analyzer selection using `@clack/prompts` multiselect for choosing sync scope | ✅ | 2025-12-04 |
| TASK-034 | Add `--dry-run`, `--verbose`, `--quiet` logging options with consola integration and proper spinner state management | ✅ | 2025-12-04 |

### Implementation Phase 6: Mock File System and Unit Testing

- GOAL-006: Implement comprehensive unit tests with mock file systems

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-035 | Create `__mocks__/fs.ts` with memfs-based mock file system | ✅ | 2025-12-04 |
| TASK-036 | Create test fixtures in `test/fixtures/packages/` with sample package structures | ✅ | 2025-12-04 |
| TASK-037 | Create expected output fixtures in `test/fixtures/expected/` for MDX comparison | ✅ | 2025-12-04 |
| TASK-038 | Implement `test/parsers/typescript-parser.test.ts` with concurrent test execution | ✅ | 2025-12-04 |
| TASK-039 | Implement `test/parsers/jsdoc-extractor.test.ts` for JSDoc parsing validation | ✅ | 2025-12-04 |
| TASK-040 | Implement `test/parsers/readme-parser.test.ts` for Markdown parsing | ✅ | 2025-12-04 |
| TASK-041 | Implement `test/generators/mdx-generator.test.ts` with snapshot testing | ✅ | 2025-12-04 |
| TASK-042 | Implement `test/generators/content-merger.test.ts` for preservation logic | ✅ | 2025-12-04 |

### Implementation Phase 7: Integration and Pipeline Testing

- GOAL-007: Create integration tests verifying end-to-end sync pipeline

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-043 | Create `test/integration/sync-pipeline.test.ts` for full sync flow validation | ✅ | 2025-12-04 |
| TASK-044 | Implement `test/integration/incremental-sync.test.ts` for change detection accuracy | ✅ | 2025-12-04 |
| TASK-045 | Create `test/integration/watch-mode.test.ts` for file watcher integration | ✅ | 2025-12-04 |
| TASK-046 | Implement `test/integration/mdx-validation.test.ts` to verify generated MDX is valid | ✅ | 2025-12-04 |
| TASK-047 | Create `test/integration/starlight-compatibility.test.ts` for Astro component usage | ✅ | 2025-12-04 |
| TASK-048 | Add test coverage for error scenarios and recovery paths | ✅ | 2025-12-04 |

### Implementation Phase 8: Documentation and CI Integration

- GOAL-008: Complete documentation, GitHub Actions integration, and prepare for release

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-049 | Create comprehensive README.md for `packages/doc-sync/` | | |
| TASK-050 | Add package documentation to `docs/src/content/docs/packages/doc-sync.mdx` | | |
| TASK-051 | Create `.github/workflows/docs-sync.yaml` for automated documentation sync on push | | |
| TASK-052 | Add pre-commit hook integration for documentation freshness check | | |
| TASK-053 | Create changeset entry for initial release | | |
| TASK-054 | Update root `llms.txt` with doc-sync package information | | |
| TASK-055 | Add doc-sync to `docs/astro.config.mjs` sidebar configuration | | |

## 3. Alternatives

- **ALT-001**: Use TypeDoc directly for API documentation generation - rejected because it generates standalone HTML rather than Starlight-integrated MDX
- **ALT-002**: Use markdown-it for README parsing - rejected in favor of unified/remark for better MDX compatibility
- **ALT-003**: Store documentation config in separate YAML files - rejected for package.json field approach for colocation
- **ALT-004**: Use Astro content collections API for dynamic documentation - rejected to maintain static site generation benefits
- **ALT-005**: Poll-based file watching instead of chokidar - rejected due to CPU inefficiency and delayed detection
- **ALT-006**: Use commander.js or yargs for CLI - rejected in favor of `cac` for lighter footprint and better TypeScript integration
- **ALT-007**: Use basic console output instead of @clack/prompts - rejected in favor of modern, user-friendly TUI for better DX

## 4. Dependencies

- **DEP-001**: `@bfra.me/es` (workspace:*) — Provides `Result<T, E>` type from `/result` and file watcher utilities (`createFileWatcher()`, `createChangeDetector()`, `createDebouncer()`) from `/watcher`
- **DEP-002**: `ts-morph` — TypeScript Compiler API wrapper for source code analysis and JSDoc extraction
- **DEP-003**: `chokidar` — Cross-platform file system watcher for change detection (peer dependency of @bfra.me/es)
- **DEP-004**: `fast-glob` — Fast file globbing for package discovery
- **DEP-005**: `unified` + `remark-parse` + `remark-mdx` — Markdown/MDX parsing and generation
- **DEP-006**: `cac` — Lightweight, type-safe CLI argument parser
- **DEP-007**: `consola` — Console logging with levels and formatting (already in workspace)
- **DEP-008**: `@clack/prompts` — Modern interactive CLI prompts for TUI components (intro, outro, spinner, multiselect, log methods)
- **DEP-009**: `memfs` — In-memory file system for testing (dev dependency)
- **DEP-010**: `@astrojs/starlight` — Peer dependency for type references (already in docs/)
- **DEP-011**: `zod` — Runtime validation for configuration schemas (already in workspace)

## 5. Files

- **FILE-001**: `packages/doc-sync/package.json` - Package manifest with dependencies and scripts
- **FILE-002**: `packages/doc-sync/src/index.ts` - Main barrel export with explicit named exports
- **FILE-003**: `packages/doc-sync/src/types.ts` - Core type definitions (PackageInfo, DocConfig, ParseResult, SyncResult)
- **FILE-004**: `packages/doc-sync/src/parsers/typescript-parser.ts` - TypeScript source file parser
- **FILE-005**: `packages/doc-sync/src/parsers/jsdoc-extractor.ts` - JSDoc annotation extractor
- **FILE-006**: `packages/doc-sync/src/parsers/readme-parser.ts` - README Markdown parser
- **FILE-007**: `packages/doc-sync/src/parsers/export-analyzer.ts` - Public API surface analyzer
- **FILE-008**: `packages/doc-sync/src/generators/mdx-generator.ts` - MDX document generator
- **FILE-009**: `packages/doc-sync/src/generators/api-reference-generator.ts` - API reference section generator
- **FILE-010**: `packages/doc-sync/src/generators/content-merger.ts` - Manual content preservation
- **FILE-011**: `packages/doc-sync/src/watcher/file-watcher.ts` - File system change watcher
- **FILE-012**: `packages/doc-sync/src/watcher/change-detector.ts` - Incremental change detection
- **FILE-013**: `packages/doc-sync/src/orchestrator/sync-orchestrator.ts` - Main sync coordination logic
- **FILE-014**: `packages/doc-sync/src/cli/index.ts` - CLI entry point with cac and @clack/prompts
- **FILE-015**: `packages/doc-sync/__mocks__/fs.ts` - Mock file system for testing
- **FILE-016**: `packages/doc-sync/test/integration/sync-pipeline.test.ts` - End-to-end integration tests
- **FILE-017**: `docs/src/content/docs/packages/doc-sync.mdx` - Package documentation page
- **FILE-018**: `.github/workflows/docs-sync.yaml` - CI workflow for automated sync

## 6. Testing

- **TEST-001**: Unit tests for TypeScript parser verifying function/class/interface extraction with various export patterns
- **TEST-002**: Unit tests for JSDoc extractor covering @param, @returns, @example, @deprecated annotations
- **TEST-003**: Unit tests for README parser validating section extraction and frontmatter handling
- **TEST-004**: Unit tests for MDX generator comparing output against expected fixture files using `toMatchFileSnapshot()`
- **TEST-005**: Unit tests for content merger verifying sentinel marker detection and section preservation
- **TEST-006**: Integration tests for sync pipeline from mock package to generated MDX with full validation
- **TEST-007**: Integration tests for incremental sync verifying only changed packages are regenerated
- **TEST-008**: Integration tests for watch mode with simulated file changes and debouncing
- **TEST-009**: Validation tests confirming generated MDX parses correctly with Astro/Starlight
- **TEST-010**: Error handling tests for malformed source files, missing exports, invalid JSDoc
- **TEST-011**: Edge case tests for empty packages, packages without README, packages with only types
- **TEST-012**: CLI tests for command parsing, interactive mode with @clack/prompts, and output formatting

## 7. Risks & Assumptions

- **RISK-001**: TypeScript Compiler API changes between versions may require parser updates - mitigate with ts-morph abstraction
- **RISK-002**: Complex JSDoc patterns may not parse correctly - mitigate with comprehensive test fixtures covering edge cases
- **RISK-003**: Astro Starlight component API changes may break generated MDX - mitigate with peer dependency versioning
- **RISK-004**: @clack/prompts may have breaking changes - mitigate with version pinning and abstraction layer for TUI components
- **RISK-005**: Race conditions in watch mode with rapid file changes - mitigate with proper debouncing and atomic writes

- **ASSUMPTION-001**: All packages follow the established `src/index.ts` barrel export pattern
- **ASSUMPTION-002**: README files use standard Markdown with optional frontmatter
- **ASSUMPTION-003**: Documentation site uses Astro Starlight with standard configuration
- **ASSUMPTION-004**: Developers will use sentinel markers for content they want preserved
- **ASSUMPTION-005**: Package.json files are valid JSON with standard fields (name, description, version)
- **ASSUMPTION-006**: CLI users have terminal supporting ANSI colors and interactive prompts

## 8. Related Specifications / Further Reading

- [Astro Starlight Documentation](https://starlight.astro.build/)
- [TypeScript Compiler API](https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API)
- [ts-morph Documentation](https://ts-morph.com/)
- [Unified/Remark Ecosystem](https://unifiedjs.com/)
- [Chokidar File Watcher](https://github.com/paulmillr/chokidar)
- [cac CLI Parser Documentation](https://github.com/cacjs/cac)
- [@clack/prompts Modern CLI Prompts](https://github.com/bombshell-dev/clack)
- bfra.me/works Monorepo Patterns: `/AGENTS.md`
- Related workspace-analyzer CLI patterns: `/.ai/plan/feature-workspace-analyzer-1.md`
- Existing Package Plans: `/.ai/plan/feature-badge-config-package-1.md`
