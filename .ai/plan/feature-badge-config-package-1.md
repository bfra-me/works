---
goal: Create @bfra.me/badge-config Package for Shields.io Badge Generation
version: 1.0
date_created: 2025-08-12
last_updated: 2025-08-12
owner: bfra-me/works
status: 'In Progress'
tags: ['feature', 'package', 'typescript', 'badges', 'shields.io', 'ci-cd']
---

# Introduction

![Status: In Progress](https://img.shields.io/badge/status-In_Progress-yellow)

Create a new `@bfra.me/badge-config` package in the bfra.me/works monorepo that provides a TypeScript API for generating shields.io badge URLs. The package will include core badge generation functions, preset generators for common use cases, and comprehensive tooling for CI/CD integration. The implementation follows established monorepo patterns with fixture-based testing, proper TypeScript configurations, and comprehensive documentation.

## 1. Requirements & Constraints

- **REQ-001**: Package must follow established monorepo patterns from existing packages
- **REQ-002**: Implement TypeScript API with `createBadge({ label, message, color, style })` function
- **REQ-003**: Provide preset generators for build status, coverage, version, license, and social badges
- **REQ-004**: Use fixture-based testing with `test/fixtures/input/` and `test/fixtures/output/` structure
- **REQ-005**: Implement parallel testing with `it.concurrent()` and `toMatchFileSnapshot()`
- **REQ-006**: Generate shields.io compatible URLs and optionally fetch SVG content
- **REQ-007**: Include comprehensive documentation with CI/CD integration examples

- **SEC-001**: Validate all user inputs to prevent URL injection attacks
- **SEC-002**: Sanitize badge parameters before URL encoding

- **TYP-001**: Strict TypeScript configuration extending `@bfra.me/tsconfig`
- **TYP-002**: Comprehensive type definitions for all badge configurations
- **TYP-003**: Type-safe preset generator functions with proper return types

- **CON-001**: Must use ES modules with `"type": "module"` in package.json
- **CON-002**: Dependencies on internal packages must use `workspace:*` versioning
- **CON-003**: Package size should remain minimal for CI/CD usage

- **GUD-001**: Follow TypeScript patterns from `.github/instructions/typescript-patterns.instructions.md`
- **GUD-002**: Follow testing practices from `.github/instructions/testing-practices.instructions.md`
- **GUD-003**: Follow ESLint configuration from `.github/instructions/eslint-config-usage.instructions.md`

- **PAT-001**: Use `defineConfig()` pattern for ESLint configuration
- **PAT-002**: Implement explicit barrel exports in `index.ts`
- **PAT-003**: Use discriminated unions for result types where applicable

## 2. Implementation Steps

### Implementation Phase 1: Core Infrastructure

- GOAL-001: Set up package structure and core badge generation functionality

| Task | Description | Completed | Date |
| --- | --- | --- | --- |
| TASK-001 | Create package directory structure in `packages/badge-config/` | ✅ | 2025-08-13 |
| TASK-002 | Initialize `package.json` with proper exports, scripts, and dependencies | ✅ | 2025-08-13 |
| TASK-003 | Configure `tsconfig.json` extending `@bfra.me/tsconfig` | ✅ | 2025-08-13 |
| TASK-004 | Set up `eslint.config.ts` using `defineConfig()` with TypeScript and Vitest support | ✅ | 2025-08-13 |
| TASK-005 | Create `tsup.config.ts` for ES module build configuration | ✅ | 2025-08-13 |
| TASK-006 | Implement core types in `src/types.ts` with badge interfaces | ✅ | 2025-08-13 |
| TASK-007 | Create main `createBadge()` function in `src/create-badge.ts` | ✅ | 2025-08-13 |
| TASK-008 | Implement URL encoding and validation utilities in `src/utils.ts` | ✅ | 2025-08-13 |
| TASK-009 | Set up main export barrel in `src/index.ts` | ✅ | 2025-08-13 |
| TASK-010 | Initialize testing infrastructure with Vitest configuration | ✅ | 2025-08-13 |

### Implementation Phase 2: Preset Generators

- GOAL-002: Implement preset badge generators for common use cases

| Task | Description | Completed | Date |
| --- | --- | --- | --- |
| TASK-011 | Create generators directory structure in `src/generators/` |  |  |
| TASK-012 | Implement build status generator in `src/generators/build-status.ts` |  |  |
| TASK-013 | Implement coverage generator with thresholds in `src/generators/coverage.ts` |  |  |
| TASK-014 | Implement version generator in `src/generators/version.ts` |  |  |
| TASK-015 | Implement license generator in `src/generators/license.ts` |  |  |
| TASK-016 | Implement social badges generator in `src/generators/social.ts` |  |  |
| TASK-017 | Create generators export barrel in `src/generators/index.ts` |  |  |
| TASK-018 | Add generator exports to main `src/index.ts` |  |  |

### Implementation Phase 3: Testing Implementation

- GOAL-003: Implement comprehensive fixture-based testing with parallel execution

| Task | Description | Completed | Date |
| --- | --- | --- | --- |
| TASK-019 | Create test fixtures directory structure `test/fixtures/input/` and `test/fixtures/output/` |  |  |
| TASK-020 | Create basic badge configuration fixtures in JSON format |  |  |
| TASK-021 | Create preset generator configuration fixtures |  |  |
| TASK-022 | Create expected output fixtures for URL and SVG comparisons |  |  |
| TASK-023 | Implement core badge tests with `it.concurrent()` and `toMatchFileSnapshot()` |  |  |
| TASK-024 | Implement preset generator tests with parallel execution |  |  |
| TASK-025 | Add edge case and error handling tests |  |  |
| TASK-026 | Create integration tests for CI/CD workflows |  |  |
| TASK-027 | Set up test coverage reporting and validation |  |  |

### Implementation Phase 4: Documentation and Integration

- GOAL-004: Complete documentation, CI/CD integration, and prepare for release

| Task     | Description                                                       | Completed | Date |
| -------- | ----------------------------------------------------------------- | --------- | ---- |
| TASK-028 | Write comprehensive README.md with API documentation and examples |           |      |
| TASK-029 | Create CI/CD integration examples for GitHub Actions              |           |      |
| TASK-030 | Add usage examples for npm scripts and package.json integration   |           |      |
| TASK-031 | Document performance considerations and caching strategies        |           |      |
| TASK-032 | Create TypeScript API documentation with JSDoc comments           |           |      |
| TASK-033 | Add changeset for initial package release                         |           |      |
| TASK-034 | Validate package with `pnpm lint-packages` and publint            |           |      |
| TASK-035 | Run full monorepo validation suite `pnpm validate`                |           |      |

## 3. Alternatives

- **ALT-001**: Use badgen.net instead of shields.io - Rejected due to fewer customization options and less community adoption
- **ALT-002**: Implement SVG generation from scratch - Rejected due to complexity and maintenance overhead
- **ALT-003**: Create CLI tool instead of TypeScript API - Rejected as API provides more flexibility for programmatic usage
- **ALT-004**: Use template-based configuration instead of function API - Rejected as functions provide better type safety and IDE support

## 4. Dependencies

- **DEP-001**: `@bfra.me/eslint-config` (workspace:\*) - Required for ESLint configuration
- **DEP-002**: `@bfra.me/tsconfig` (workspace:\*) - Required for TypeScript configuration
- **DEP-003**: Vitest - Required for testing framework with fixture support
- **DEP-004**: tsup - Required for TypeScript compilation and ES module output
- **DEP-005**: shields.io API - External dependency for badge generation service

## 5. Files

- **FILE-001**: `packages/badge-config/package.json` - Package configuration with exports and dependencies
- **FILE-002**: `packages/badge-config/tsconfig.json` - TypeScript configuration extending library config
- **FILE-003**: `packages/badge-config/eslint.config.ts` - ESLint configuration using defineConfig
- **FILE-004**: `packages/badge-config/tsup.config.ts` - Build configuration for ES modules
- **FILE-005**: `packages/badge-config/README.md` - Comprehensive documentation and examples
- **FILE-006**: `packages/badge-config/CHANGELOG.md` - Changeset-generated changelog
- **FILE-007**: `packages/badge-config/src/index.ts` - Main export barrel
- **FILE-008**: `packages/badge-config/src/types.ts` - Badge interfaces and type definitions
- **FILE-009**: `packages/badge-config/src/create-badge.ts` - Core badge generation function
- **FILE-010**: `packages/badge-config/src/utils.ts` - URL encoding and validation utilities
- **FILE-011**: `packages/badge-config/src/generators/index.ts` - Generator export barrel
- **FILE-012**: `packages/badge-config/src/generators/build-status.ts` - Build status badge generator
- **FILE-013**: `packages/badge-config/src/generators/coverage.ts` - Coverage badge generator
- **FILE-014**: `packages/badge-config/src/generators/version.ts` - Version badge generator
- **FILE-015**: `packages/badge-config/src/generators/license.ts` - License badge generator
- **FILE-016**: `packages/badge-config/src/generators/social.ts` - Social badges generator
- **FILE-017**: `packages/badge-config/test/create-badge.test.ts` - Core function tests
- **FILE-018**: `packages/badge-config/test/generators.test.ts` - Preset generator tests
- **FILE-019**: `packages/badge-config/test/fixtures/input/basic-badges.json` - Basic badge test configurations
- **FILE-020**: `packages/badge-config/test/fixtures/input/preset-configs.json` - Preset generator test configurations
- **FILE-021**: `packages/badge-config/test/fixtures/output/` - Expected output files for snapshot testing
- **FILE-022**: `packages/badge-config/lib/` - Compiled output directory (auto-generated)

## 6. Testing

- **TEST-001**: Basic badge generation tests with various style and color combinations
- **TEST-002**: URL encoding and special character handling tests
- **TEST-003**: Build status generator tests for all status types (success, failure, pending, etc.)
- **TEST-004**: Coverage generator tests with different percentage ranges and color thresholds
- **TEST-005**: Version generator tests with npm, git tag, and semantic version formats
- **TEST-006**: License generator tests for common license types
- **TEST-007**: Social badges tests for GitHub stars, forks, and contributors
- **TEST-008**: Error handling tests for invalid inputs and edge cases
- **TEST-009**: Integration tests for CI/CD workflow scenarios
- **TEST-010**: Performance tests for URL generation speed and memory usage
- **TEST-011**: Snapshot tests using `toMatchFileSnapshot()` for output validation
- **TEST-012**: Parallel execution tests using `it.concurrent()` for performance validation

## 7. Risks & Assumptions

- **RISK-001**: shields.io API changes could break badge generation - Mitigation: Use stable API endpoints and implement error handling
- **RISK-002**: URL encoding edge cases might cause badge rendering issues - Mitigation: Comprehensive input validation and testing
- **RISK-003**: Performance impact in CI/CD environments with many badge generations - Mitigation: Implement caching and optimize URL generation
- **RISK-004**: Package size inflation due to comprehensive preset generators - Mitigation: Tree-shaking support and modular exports

- **ASSUMPTION-001**: shields.io API will remain stable and accessible
- **ASSUMPTION-002**: Users will primarily use preset generators rather than custom badge creation
- **ASSUMPTION-003**: CI/CD integration will be the primary use case for this package
- **ASSUMPTION-004**: TypeScript users will be the primary audience requiring strong type safety
- **ASSUMPTION-005**: Fixture-based testing will provide sufficient coverage for badge generation scenarios

## 8. Related Specifications / Further Reading

- [shields.io API Documentation](https://shields.io/badges)
- [bfra.me Works Monorepo Copilot Instructions](../../.github/copilot-instructions.md)
- [TypeScript Patterns Instructions](../../.github/instructions/typescript-patterns.instructions.md)
- [Testing Practices Instructions](../../.github/instructions/testing-practices.instructions.md)
- [ESLint Config Usage Instructions](../../.github/instructions/eslint-config-usage.instructions.md)
- [API Design Standards Instructions](../../.github/instructions/api-design-standards.instructions.md)
- [Changeset Workflow Instructions](../../.github/instructions/changeset-workflow.instructions.md)
