---
goal: Revamp Markdown Linting Support with Enhanced @eslint/markdown Integration
version: 1.0
date_created: 2025-11-19
last_updated: 2025-11-20
owner: Marcus R. Brown (@marcusrbrown)
status: In Progress
tags: [feature, markdown, eslint, configuration, testing]
---

# Introduction

![Status: In Progress](https://img.shields.io/badge/status-In%20Progress-yellow)

This implementation plan outlines a comprehensive revamp of Markdown linting integration in `@bfra.me/eslint-config` to fully leverage the capabilities of `@eslint/markdown` package (v7.5.1). The revamp will introduce transparent configuration options for GitHub Flavored Markdown (GFM) support, language-specific processing, custom parser configurations, and enhanced TypeScript-ESLint integration within fenced code blocks. The implementation ensures backward compatibility while providing migration paths for enhanced features.

## 1. Requirements & Constraints

### Requirements

- **REQ-001**: Support both CommonMark and GitHub Flavored Markdown (GFM) parsing modes with user-configurable selection
- **REQ-002**: Enable frontmatter parsing for YAML, TOML, and JSON formats with explicit configuration options
- **REQ-003**: Support TypeScript-ESLint parsing within fenced code blocks (TypeScript, JavaScript, JSX, TSX)
- **REQ-004**: Implement processor chains that properly extract and lint code blocks from Markdown files
- **REQ-005**: Support eslint-disable directive handling within Markdown HTML comments
- **REQ-006**: Enable comprehensive language block processing (TypeScript, JavaScript, JSON, YAML, etc.)
- **REQ-007**: Maintain backward compatibility with existing Markdown files across the monorepo
- **REQ-008**: Provide migration documentation and practical examples for different use cases
- **REQ-009**: Support recommended Markdown rules from `@eslint/markdown` with configuration override capability
- **REQ-010**: Enable file name meta support for code blocks (e.g., ````js filename="src/index.js"````)

### Security Requirements

- **SEC-001**: Validate frontmatter parsing to prevent YAML/TOML/JSON injection vulnerabilities
- **SEC-002**: Ensure code block processing does not execute arbitrary code during linting
- **SEC-003**: Sanitize file paths from filename meta to prevent directory traversal

### Constraints

- **CON-001**: Must work with ESLint v9.15.0+ and `@eslint/markdown` v7.5.1+
- **CON-002**: Must maintain compatibility with existing `eslint-merge-processors` usage
- **CON-003**: Must integrate with existing TypeScript-ESLint configuration without breaking type-aware rules
- **CON-004**: Cannot break existing Markdown files in the monorepo during migration
- **CON-005**: Must follow the monorepo's TypeScript patterns and API design standards

### Guidelines

- **GUD-001**: Follow the self-explanatory code commenting guidelines - comment only WHY, not WHAT
- **GUD-002**: Use TypeScript discriminated unions for configuration options
- **GUD-003**: Implement comprehensive JSDoc documentation for public API surfaces
- **GUD-004**: Use explicit exports in barrel files (no `export *`)
- **GUD-005**: Follow the existing `defineConfig()` pattern for configuration API

### Patterns to Follow

- **PAT-001**: Use `requireOf()` pattern for optional dependencies with fallback
- **PAT-002**: Split configuration into multiple named config objects for clarity
- **PAT-003**: Use `interopDefault()` for ESM/CJS interoperability
- **PAT-004**: Apply `GLOB_*` constants for file pattern matching
- **PAT-005**: Implement extensive test fixtures with input/output structure

## 2. Implementation Steps

### Implementation Phase 1: Configuration API Design

- GOAL-001: Design and implement enhanced configuration API for Markdown support

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-001 | Define `MarkdownLanguage` type as discriminated union supporting `'commonmark'` and `'gfm'` modes | ✅ | 2025-11-20 |
| TASK-002 | Define `MarkdownFrontmatterOptions` type supporting `false`, `'yaml'`, `'toml'`, `'json'` | ✅ | 2025-11-20 |
| TASK-003 | Create `MarkdownProcessorOptions` interface with `enabled` and `extractCodeBlocks` options | ✅ | 2025-11-20 |
| TASK-004 | Create comprehensive `MarkdownOptions` interface extending `OptionsFiles` and `OptionsOverrides` with properties: `language`, `frontmatter`, `processor`, `rules`, `codeBlocks` | ✅ | 2025-11-20 |
| TASK-005 | Update `src/options.ts` to replace simple `markdown?: boolean \| OptionsOverrides` with `markdown?: boolean \| MarkdownOptions` | ✅ | 2025-11-20 |
| TASK-006 | Add JSDoc documentation to all new types with examples showing GFM, frontmatter, and code block configuration | ✅ | 2025-11-20 |

### Implementation Phase 2: Core Markdown Configuration Implementation

- GOAL-002: Rewrite the markdown configuration function to support enhanced features

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-007 | Refactor `src/configs/markdown.ts` to accept enhanced `MarkdownOptions` parameter | ✅ | 2025-11-20 |
| TASK-008 | Implement language selection logic: default to `'gfm'` when `options.language === 'gfm'`, otherwise use `'commonmark'` | ✅ | 2025-11-20 |
| TASK-009 | Implement frontmatter configuration in `languageOptions.frontmatter` based on `options.frontmatter` value | ✅ | 2025-11-20 |
| TASK-010 | Configure processor based on `options.processor.enabled` with conditional code block extraction | ✅ | 2025-11-20 |
| TASK-011 | Add configuration object for recommended Markdown rules from `@eslint/markdown` package | ✅ | 2025-11-20 |
| TASK-012 | Implement rule overrides mechanism allowing users to customize Markdown-specific rules via `options.rules` | ✅ | 2025-11-20 |
| TASK-013 | Add configuration object for disabling conflicting rules in Markdown files (e.g., `unicorn/filename-case`) | ✅ | 2025-11-20 |

### Implementation Phase 3: Code Block Processing Enhancement

- GOAL-003: Implement enhanced code block processing with TypeScript-ESLint integration

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-014 | Create `src/configs/markdown-code-blocks.ts` module for code block-specific configuration | ✅ | 2025-11-20 |
| TASK-015 | Implement TypeScript parser configuration for `.ts`, `.tsx` code blocks in Markdown | ✅ | 2025-11-20 |
| TASK-016 | Implement JavaScript parser configuration for `.js`, `.jsx` code blocks in Markdown | ✅ | 2025-11-20 |
| TASK-017 | Configure `parserOptions.ecmaFeatures.impliedStrict` for all code blocks | ✅ | 2025-11-20 |
| TASK-018 | Add support for filename meta extraction and virtual file naming (e.g., ````js filename="src/index.js"````) | ✅ | 2025-11-20 |
| TASK-019 | Implement rule overrides for code blocks (disable `no-undef`, `no-unused-vars`, strict imports, etc.) | ✅ | 2025-11-20 |
| TASK-020 | Integrate with existing TypeScript-ESLint type-aware rules configuration | ✅ | 2025-11-20 |
| TASK-021 | Add configuration for JSON, YAML, and other supported language blocks | ✅ | 2025-11-20 |

### Implementation Phase 4: Glob Pattern Enhancement

- GOAL-004: Update glob patterns to support new Markdown features

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-022 | Review and update `GLOB_MARKDOWN_*` constants in `src/globs.ts` for GFM support | ✅ | 2025-11-20 |
| TASK-023 | Add `GLOB_GFM_MARKDOWN` pattern for explicit GFM file matching if needed | ✅ | 2025-11-20 |
| TASK-024 | Update `GLOB_CODE_IN_MARKDOWN_FILES` to include additional language extensions (`.json`, `.yaml`, `.toml`) | ✅ | 2025-11-20 |
| TASK-025 | Verify glob patterns work correctly with frontmatter-enabled files | ✅ | 2025-11-20 |
| TASK-026 | Add glob patterns for virtual files created by the Markdown processor | ✅ | 2025-11-20 |

### Implementation Phase 5: Testing Infrastructure

- GOAL-005: Create comprehensive test suites for Markdown linting features

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-027 | Create `test/fixtures/markdown/` directory with subdirectories: `commonmark/`, `gfm/`, `frontmatter/`, `code-blocks/`, `directives/` | ✅ | 2025-11-20 |
| TASK-028 | Create test fixture: CommonMark file with basic formatting, headings, and links | ✅ | 2025-11-20 |
| TASK-029 | Create test fixture: GFM file with tables, task lists, strikethrough, and autolinks | ✅ | 2025-11-20 |
| TASK-030 | Create test fixture: YAML frontmatter file with metadata and content | ✅ | 2025-11-20 |
| TASK-031 | Create test fixture: TOML frontmatter file with configuration data | ✅ | 2025-11-20 |
| TASK-032 | Create test fixture: JSON frontmatter file with structured data | ✅ | 2025-11-20 |
| TASK-033 | Create test fixture: TypeScript code block with type annotations and interfaces | ✅ | 2025-11-20 |
| TASK-034 | Create test fixture: JavaScript code block with ES modules and async/await | ✅ | 2025-11-20 |
| TASK-035 | Create test fixture: JSX code block with React components | ✅ | 2025-11-20 |
| TASK-036 | Create test fixture: Multiple language code blocks in single file (TS, JS, JSON, YAML) | ✅ | 2025-11-20 |
| TASK-037 | Create test fixture: Nested code blocks (code block inside blockquote) | ✅ | 2025-11-20 |
| TASK-038 | Create test fixture: Code block with filename meta (````ts filename="src/utils.ts"````) | ✅ | 2025-11-20 |
| TASK-039 | Create test fixture: Markdown with eslint-disable comments (`<!-- eslint-disable markdown/no-html -->`) | ✅ | 2025-11-20 |
| TASK-040 | Create test fixture: Edge case - empty code blocks, malformed frontmatter | ✅ | 2025-11-20 |

### Implementation Phase 6: Unit and Integration Tests

- GOAL-006: Implement comprehensive test cases covering all Markdown features

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-041 | Create `test/markdown.test.ts` with describe block for Markdown configuration tests | |  |
| TASK-042 | Test: Verify CommonMark mode is used when `language: 'commonmark'` is configured | |  |
| TASK-043 | Test: Verify GFM mode is used when `language: 'gfm'` is configured | |  |
| TASK-044 | Test: Verify YAML frontmatter is parsed when `frontmatter: 'yaml'` is configured | |  |
| TASK-045 | Test: Verify TOML frontmatter is parsed when `frontmatter: 'toml'` is configured | |  |
| TASK-046 | Test: Verify JSON frontmatter is parsed when `frontmatter: 'json'` is configured | |  |
| TASK-047 | Test: Verify frontmatter is disabled when `frontmatter: false` is configured | |  |
| TASK-048 | Test: Verify processor extracts TypeScript code blocks correctly | |  |
| TASK-049 | Test: Verify processor extracts JavaScript code blocks correctly | |  |
| TASK-050 | Test: Verify processor extracts JSX/TSX code blocks correctly | |  |
| TASK-051 | Test: Verify processor handles multiple code blocks in single file | |  |
| TASK-052 | Test: Verify processor handles nested code blocks without errors | |  |
| TASK-053 | Test: Verify filename meta is extracted and used for virtual file naming | |  |
| TASK-054 | Test: Verify TypeScript-ESLint rules apply to TypeScript code blocks | |  |
| TASK-055 | Test: Verify eslint-disable directives work in Markdown HTML comments | |  |
| TASK-056 | Test: Verify recommended Markdown rules detect common issues (no-html, heading-increment, etc.) | |  |
| TASK-057 | Test: Verify rule overrides apply correctly to Markdown files | |  |
| TASK-058 | Test: Verify GFM-specific features (tables, task lists) are recognized | |  |
| TASK-059 | Test: Verify edge cases - empty files, malformed frontmatter, invalid code blocks | |  |
| TASK-060 | Test: Verify backward compatibility with existing Markdown files in monorepo | |  |

### Implementation Phase 7: Documentation and Examples

- GOAL-007: Create comprehensive documentation for Markdown support

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-061 | Update `packages/eslint-config/readme.md` with Markdown configuration section | |  |
| TASK-062 | Document CommonMark vs GFM modes with use case recommendations | |  |
| TASK-063 | Document frontmatter parsing options with examples for each format | |  |
| TASK-064 | Document code block processing with TypeScript/JavaScript examples | |  |
| TASK-065 | Document filename meta usage with practical examples | |  |
| TASK-066 | Document eslint-disable directive usage in Markdown comments | |  |
| TASK-067 | Create example configuration for documentation sites (using GFM + YAML frontmatter) | |  |
| TASK-068 | Create example configuration for README files (using CommonMark, no frontmatter) | |  |
| TASK-069 | Create example configuration for blog posts (using GFM + YAML frontmatter + code blocks) | |  |
| TASK-070 | Document migration path from old Markdown configuration to new API | |  |
| TASK-071 | Add JSDoc examples to `MarkdownOptions` interface showing common configurations | |  |
| TASK-072 | Create troubleshooting section for common Markdown linting issues | |  |

### Implementation Phase 8: Monorepo Integration and Migration

- GOAL-008: Integrate new Markdown support across the monorepo and ensure compatibility

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-073 | Update root `eslint.config.ts` to use enhanced Markdown configuration | |  |
| TASK-074 | Update package-level `eslint.config.ts` files to use new Markdown options where applicable | |  |
| TASK-075 | Run full monorepo lint to identify any breaking changes in existing Markdown files | |  |
| TASK-076 | Fix any linting errors introduced by new Markdown rules in existing files | |  |
| TASK-077 | Update `.changeset/` Markdown files if needed for new linting rules | |  |
| TASK-078 | Update documentation Markdown files (`docs/` directory) for new linting rules | |  |
| TASK-079 | Verify all `README.md` files in packages lint correctly with new configuration | |  |
| TASK-080 | Update GitHub instructions files (`.github/instructions/`) if affected by new rules | |  |
| TASK-081 | Create migration guide document in `.ai/plan/` or documentation for users | |  |

### Implementation Phase 9: Performance Optimization and Validation

- GOAL-009: Optimize Markdown linting performance and validate implementation

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-082 | Profile Markdown linting performance on large files (>1000 lines) | |  |
| TASK-083 | Optimize processor chains to minimize overhead from multiple processors | |  |
| TASK-084 | Implement caching strategy for parsed frontmatter if performance issues detected | |  |
| TASK-085 | Verify memory usage is acceptable when linting multiple large Markdown files | |  |
| TASK-086 | Run full test suite (`pnpm test`) and verify all tests pass | |  |
| TASK-087 | Run type coverage (`pnpm type-coverage`) and ensure coverage meets threshold | |  |
| TASK-088 | Run `pnpm validate` to ensure all quality checks pass | |  |
| TASK-089 | Run `pnpm lint-packages` to verify package.json exports are correct | |  |
| TASK-090 | Test ESLint config inspector (`pnpm dev`) to verify Markdown config appears correctly | |  |

### Implementation Phase 10: Release Preparation

- GOAL-010: Prepare the enhanced Markdown support for release

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-091 | Create changeset with `pnpm changeset` for minor version bump (new features) | |  |
| TASK-092 | Write comprehensive changeset description covering all new Markdown features | |  |
| TASK-093 | Update `CHANGELOG.md` preview to ensure changes are documented clearly | |  |
| TASK-094 | Review and update package dependencies if any new dependencies were added | |  |
| TASK-095 | Verify package exports in `package.json` include all necessary Markdown-related exports | |  |
| TASK-096 | Build package (`pnpm build`) and verify compiled output is correct | |  |
| TASK-097 | Run `pnpm prepack` to simulate package publishing and verify files are included | |  |
| TASK-098 | Create PR with comprehensive description of changes and migration guide link | |  |
| TASK-099 | Request review from maintainers focusing on API design and backward compatibility | |  |
| TASK-100 | Address review feedback and update implementation as needed | |  |

## 3. Alternatives

- **ALT-001**: **Continue using legacy `eslint-plugin-markdown`** - Rejected because `@eslint/markdown` is the official ESLint plugin with better integration, more features, and active maintenance. The legacy plugin is deprecated.

- **ALT-002**: **Simple boolean flag for GFM vs CommonMark** - Rejected in favor of explicit `language` property with discriminated union type for better type safety and clarity in configuration.

- **ALT-003**: **Auto-detect frontmatter format** - Rejected because explicit configuration is more predictable and allows users to enforce specific frontmatter formats, preventing inconsistencies across files.

- **ALT-004**: **Single unified configuration object without separation** - Rejected in favor of multiple named ESLint config objects (plugin, processor, language, code-blocks) for better clarity and maintainability.

- **ALT-005**: **Enable GFM by default for all Markdown files** - Rejected to maintain backward compatibility. Users must explicitly opt-in to GFM mode, though it will be recommended in documentation.

- **ALT-006**: **Use separate packages for Markdown code block linting** - Rejected because `@eslint/markdown` provides built-in processor support that integrates seamlessly with existing ESLint configurations.

## 4. Dependencies

- **DEP-001**: `@eslint/markdown@7.5.1` - Core Markdown linting plugin (already installed)
- **DEP-002**: `eslint-merge-processors@2.0.0` - For combining multiple processors (already installed)
- **DEP-003**: `typescript-eslint@8.46.4` - For TypeScript parsing in code blocks (already installed)
- **DEP-004**: `vitest` - For test suite implementation (already installed as dev dependency)
- **DEP-005**: `@eslint/core@1.0.0` - For Plugin types (already installed as dev dependency)

## 5. Files

### New Files

- **FILE-001**: `packages/eslint-config/src/configs/markdown-code-blocks.ts` - Code block-specific configuration module
- **FILE-002**: `packages/eslint-config/test/markdown.test.ts` - Comprehensive Markdown tests
- **FILE-003**: `packages/eslint-config/test/fixtures/markdown/commonmark/basic.md` - CommonMark test fixture
- **FILE-004**: `packages/eslint-config/test/fixtures/markdown/gfm/advanced.md` - GFM test fixture
- **FILE-005**: `packages/eslint-config/test/fixtures/markdown/frontmatter/yaml.md` - YAML frontmatter fixture
- **FILE-006**: `packages/eslint-config/test/fixtures/markdown/frontmatter/toml.md` - TOML frontmatter fixture
- **FILE-007**: `packages/eslint-config/test/fixtures/markdown/frontmatter/json.md` - JSON frontmatter fixture
- **FILE-008**: `packages/eslint-config/test/fixtures/markdown/code-blocks/typescript.md` - TypeScript code block fixture
- **FILE-009**: `packages/eslint-config/test/fixtures/markdown/code-blocks/javascript.md` - JavaScript code block fixture
- **FILE-010**: `packages/eslint-config/test/fixtures/markdown/code-blocks/jsx.md` - JSX code block fixture
- **FILE-011**: `packages/eslint-config/test/fixtures/markdown/code-blocks/mixed.md` - Mixed language blocks fixture
- **FILE-012**: `packages/eslint-config/test/fixtures/markdown/directives/disable.md` - ESLint directive fixture
- **FILE-013**: `packages/eslint-config/test/fixtures/markdown/edge-cases/nested.md` - Nested code blocks fixture
- **FILE-014**: `packages/eslint-config/test/fixtures/markdown/edge-cases/filename-meta.md` - Filename meta fixture

### Modified Files

- **FILE-015**: `packages/eslint-config/src/configs/markdown.ts` - Complete rewrite with enhanced configuration
- **FILE-016**: `packages/eslint-config/src/options.ts` - Update `MarkdownOptions` type definition
- **FILE-017**: `packages/eslint-config/src/globs.ts` - Add or update Markdown-related glob patterns
- **FILE-018**: `packages/eslint-config/readme.md` - Add comprehensive Markdown configuration documentation
- **FILE-019**: `packages/eslint-config/package.json` - Verify dependencies and exports
- **FILE-020**: Root `eslint.config.ts` - Update with enhanced Markdown configuration
- **FILE-021**: Various `eslint.config.ts` files in packages - Update where applicable

## 6. Testing

### Unit Tests

- **TEST-001**: Test `MarkdownOptions` type validation and inference
- **TEST-002**: Test CommonMark language configuration creates correct parser config
- **TEST-003**: Test GFM language configuration creates correct parser config
- **TEST-004**: Test frontmatter options (yaml, toml, json, false) apply correctly
- **TEST-005**: Test processor configuration with enabled/disabled states
- **TEST-006**: Test rule overrides mechanism works as expected
- **TEST-007**: Test code block extraction for each supported language (TS, JS, JSX, JSON, etc.)
- **TEST-008**: Test virtual file naming with filename meta
- **TEST-009**: Test eslint-disable directive handling in HTML comments

### Integration Tests

- **TEST-010**: Test full linting pipeline with CommonMark files
- **TEST-011**: Test full linting pipeline with GFM files
- **TEST-012**: Test full linting pipeline with YAML frontmatter files
- **TEST-013**: Test full linting pipeline with TOML frontmatter files
- **TEST-014**: Test full linting pipeline with JSON frontmatter files
- **TEST-015**: Test TypeScript-ESLint rules apply correctly in TypeScript code blocks
- **TEST-016**: Test JavaScript rules apply correctly in JavaScript code blocks
- **TEST-017**: Test JSX rules apply correctly in JSX code blocks
- **TEST-018**: Test multiple code blocks in single file are all linted
- **TEST-019**: Test recommended Markdown rules detect issues correctly
- **TEST-020**: Test custom rule overrides apply to Markdown files

### Edge Case Tests

- **TEST-021**: Test empty Markdown files don't cause errors
- **TEST-022**: Test Markdown files without code blocks lint correctly
- **TEST-023**: Test Markdown files with only frontmatter lint correctly
- **TEST-024**: Test malformed frontmatter is handled gracefully
- **TEST-025**: Test invalid code blocks (no language specified) are handled
- **TEST-026**: Test nested code blocks in blockquotes
- **TEST-027**: Test code blocks with unusual language identifiers
- **TEST-028**: Test very large Markdown files (>1000 lines) for performance
- **TEST-029**: Test Markdown files with Unicode content
- **TEST-030**: Test Markdown files with mixed line endings (CRLF/LF)

### Backward Compatibility Tests

- **TEST-031**: Test existing Markdown files in monorepo lint without errors
- **TEST-032**: Test migration from old config to new config maintains behavior
- **TEST-033**: Test deprecated options (if any) still work with warnings
- **TEST-034**: Test default configuration matches previous behavior

## 7. Risks & Assumptions

### Risks

- **RISK-001**: **Breaking Changes in Existing Files** - Mitigation: Comprehensive testing of all existing Markdown files before release, maintain backward-compatible defaults
- **RISK-002**: **Performance Degradation** - Mitigation: Performance profiling and optimization, caching strategies for large files
- **RISK-003**: **TypeScript-ESLint Integration Issues** - Mitigation: Extensive testing of code block parsing with type-aware rules, fallback to non-type-aware rules if needed
- **RISK-004**: **Frontmatter Parsing Failures** - Mitigation: Robust error handling, clear error messages, graceful degradation
- **RISK-005**: **Processor Chain Conflicts** - Mitigation: Careful testing of `eslint-merge-processors` integration, clear documentation of processor order
- **RISK-006**: **GFM Extension Compatibility** - Mitigation: Test with various GFM features, document known limitations
- **RISK-007**: **Documentation Lag** - Mitigation: Write documentation alongside implementation, include examples in JSDoc

### Assumptions

- **ASSUMPTION-001**: `@eslint/markdown@7.5.1` API is stable and won't have breaking changes in patch versions
- **ASSUMPTION-002**: Users want GFM support for documentation sites and will opt-in to it
- **ASSUMPTION-003**: YAML is the most common frontmatter format and should be the primary focus
- **ASSUMPTION-004**: Code blocks in Markdown should be linted with the same rules as standalone files (with some exceptions)
- **ASSUMPTION-005**: Existing monorepo Markdown files follow reasonable patterns that won't break with new rules
- **ASSUMPTION-006**: Users understand the difference between CommonMark and GFM and can choose appropriately
- **ASSUMPTION-007**: The `eslint-merge-processors` approach for multiple processors will continue to work with future ESLint versions
- **ASSUMPTION-008**: TypeScript-ESLint type-aware rules can be applied to code blocks without significant performance impact

## 8. Related Specifications / Further Reading

- [@eslint/markdown Documentation](https://github.com/eslint/markdown/blob/main/README.md) - Official plugin documentation
- [CommonMark Specification](https://commonmark.org/) - CommonMark format specification
- [GitHub Flavored Markdown Specification](https://github.github.com/gfm/) - GFM format specification
- [ESLint Flat Config Documentation](https://eslint.org/docs/latest/use/configure/configuration-files) - ESLint configuration system
- [TypeScript-ESLint Documentation](https://typescript-eslint.io/) - TypeScript linting rules and parser
- [micromark-extension-frontmatter](https://github.com/micromark/micromark-extension-frontmatter) - Frontmatter parsing library
- [eslint-merge-processors](https://github.com/JoshuaKGoldberg/eslint-merge-processors) - Processor merging utility
- [bfra.me/works TypeScript Patterns](../../.github/instructions/typescript-patterns.instructions.md) - Internal TypeScript patterns
- [bfra.me/works API Design Standards](../../.github/instructions/api-design-standards.instructions.md) - Internal API design standards
- [bfra.me/works Testing Practices](../../.github/instructions/testing-practices.instructions.md) - Internal testing practices
