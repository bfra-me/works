---
goal: Create @bfra.me/es Package Providing High-Quality Reusable Types and Utilities for ES Development
version: 1.0
date_created: 2025-11-29
last_updated: 2025-12-01
owner: marcusrbrown
status: 'In Progress'
tags: ['feature', 'package', 'typescript', 'utilities', 'types', 'functional', 'monorepo', 'es-modules']
---

# Introduction

![Status: In Progress](https://img.shields.io/badge/status-In%20Progress-yellow)

Create a shared `@bfra.me/es` package that provides high-quality reusable types and utilities for ES development (JavaScript and TypeScript code following ES specifications and conventions). This package consolidates common patterns identified across the monorepo including the `Result<T, E>` discriminated union type, functional utilities (`pipe()`, `compose()`, `curry()`), module interop helpers (`interopDefault()`), file system abstractions, and file watching utilities. The package is organized into scoped subpath exports (e.g., `@bfra.me/es/result`, `@bfra.me/es/functional`, `@bfra.me/es/module`) enabling tree-shakeable imports. Comprehensive testing includes synthetic monorepo scenarios, performance benchmarks for large codebases, and validation against known architectural patterns and anti-patterns.

## 1. Requirements & Constraints

### Functional Requirements

- **REQ-001**: Implement `Result<T, E>` discriminated union type with success/failure variants and utility functions (`ok()`, `err()`, `isOk()`, `isErr()`, `unwrap()`, `unwrapOr()`, `map()`, `flatMap()`)
- **REQ-002**: Implement functional utilities (`pipe()`, `compose()`, `curry()`, `identity()`, `tap()`) with full TypeScript type inference
- **REQ-003**: Extract and generalize `interopDefault<T>()` from `@bfra.me/eslint-config` for ES module interop
- **REQ-004**: Implement type guards and branded types infrastructure (`Brand<T, B>`, `Opaque<T, B>`) for compile-time validation
- **REQ-005**: Create file watcher abstraction using chokidar with debouncing, change detection, and hash comparison utilities
- **REQ-006**: Implement async utilities (`retry()`, `timeout()`, `debounce()`, `throttle()`) with proper TypeScript typing
- **REQ-007**: Provide validation factories for common patterns (path validation, input sanitization, type narrowing)
- **REQ-008**: Implement memoization with configurable cache strategies and automatic invalidation
- **REQ-009**: Create error factory utilities with standardized error codes and structured error context
- **REQ-010**: Provide environment detection utilities (`isInCI()`, `isInEditor()`, `isInGitLifecycle()`) extracted from eslint-config

### Type Safety Requirements

- **TYP-001**: Strict TypeScript configuration extending `@bfra.me/tsconfig` with `exactOptionalPropertyTypes: true`
- **TYP-002**: All functions must have explicit return type annotations
- **TYP-003**: Generic type parameters must be fully constrained with clear variance annotations where applicable
- **TYP-004**: No `any` types except in test fixtures; prefer `unknown` with type guards
- **TYP-005**: Type exports must use explicit `export type` syntax for type-only exports

### Security Requirements

- **SEC-001**: Path validation utilities must prevent directory traversal attacks
- **SEC-002**: Input sanitization must escape dangerous characters for XSS prevention
- **SEC-003**: File system operations must validate paths are within allowed boundaries

### Performance Requirements

- **PER-001**: All utility functions must be zero-allocation hot paths where possible
- **PER-002**: Functional composition must not degrade performance vs. inlined code (< 5% overhead)
- **PER-003**: File watcher debouncing must batch events within configurable time windows (default 100ms)
- **PER-004**: Memoization cache lookup must be O(1) for primitive keys

### Constraints

- **CON-001**: Must use ES modules with `"type": "module"` in package.json
- **CON-002**: Dependencies on internal packages must use `workspace:*` versioning
- **CON-003**: Zero runtime dependencies except chokidar (optional peer dependency for watcher)
- **CON-004**: All exports must be tree-shakeable via subpath exports
- **CON-005**: Package must work in Node.js 20+ and modern browsers (ESNext target)
- **CON-006**: Bundle size for core utilities (excluding watcher) must be < 5KB minified

### Guidelines

- **GUD-001**: Follow TypeScript patterns from `copilot-instructions.md` (explicit exports, no `export *` in app code)
- **GUD-002**: Follow testing practices with `it.concurrent()` and `toMatchFileSnapshot()`
- **GUD-003**: Use discriminated union result pattern instead of throwing for expected errors
- **GUD-004**: Comment only WHY, not WHAT per self-explanatory code guidelines
- **GUD-005**: Prefer function declarations over arrow functions for better stack traces

### Patterns

- **PAT-001**: Use `defineConfig()` pattern for ESLint configuration
- **PAT-002**: Implement explicit barrel exports in `index.ts` per subpath
- **PAT-003**: Use discriminated unions for result types (`{success: true, data} | {success: false, error}`)
- **PAT-004**: Pure function architecture with no side effects in utility modules
- **PAT-005**: Factory functions returning configured utilities (e.g., `createMemoize(options)`)

## 2. Implementation Steps

### Implementation Phase 1: Core Infrastructure

- GOAL-001: Set up package structure, core types, and build configuration

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-001 | Create package directory structure at `packages/es/` with `src/`, `test/`, `lib/` folders | ✅ | 2025-11-30 |
| TASK-002 | Initialize `package.json` with subpath exports (`./result`, `./functional`, `./module`, `./types`, `./watcher`, `./async`, `./validation`, `./error`) | ✅ | 2025-11-30 |
| TASK-003 | Configure `tsconfig.json` extending `@bfra.me/tsconfig` with strict mode and `exactOptionalPropertyTypes` | ✅ | 2025-11-30 |
| TASK-004 | Set up `eslint.config.ts` using `defineConfig()` with TypeScript and Vitest support | ✅ | 2025-11-30 |
| TASK-005 | Create `tsup.config.ts` for ES module build with multiple entry points matching subpath exports | ✅ | 2025-11-30 |
| TASK-006 | Create `vitest.config.ts` with coverage thresholds (90% statements, 85% branches) | ✅ | 2025-11-30 |
| TASK-007 | Create main export barrel in `src/index.ts` with explicit named exports from all submodules | ✅ | 2025-11-30 |
| TASK-008 | Update root `tsconfig.json` to add path mapping for `@bfra.me/es` | ✅ | 2025-11-30 |

### Implementation Phase 2: Result Type System

- GOAL-002: Implement comprehensive `Result<T, E>` discriminated union with utility functions

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-009 | Create `src/result/types.ts` with `Result<T, E>`, `Ok<T>`, `Err<E>` type definitions | ✅ | 2025-11-30 |
| TASK-010 | Implement `ok<T>(value: T): Ok<T>` and `err<E>(error: E): Err<E>` factory functions in `src/result/factories.ts` | ✅ | 2025-11-30 |
| TASK-011 | Implement type guards `isOk<T, E>(result: Result<T, E>): result is Ok<T>` and `isErr()` in `src/result/guards.ts` | ✅ | 2025-11-30 |
| TASK-012 | Implement `unwrap<T, E>(result: Result<T, E>): T` throwing on Err, with custom error message support | ✅ | 2025-11-30 |
| TASK-013 | Implement `unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T` for safe extraction | ✅ | 2025-11-30 |
| TASK-014 | Implement `map<T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E>` for transformation | ✅ | 2025-11-30 |
| TASK-015 | Implement `flatMap<T, U, E>(result: Result<T, E>, fn: (value: T) => Result<U, E>): Result<U, E>` for chaining | ✅ | 2025-11-30 |
| TASK-016 | Implement `mapErr<T, E, F>(result: Result<T, E>, fn: (error: E) => F): Result<T, F>` for error transformation | ✅ | 2025-11-30 |
| TASK-017 | Implement `fromThrowable<T>(fn: () => T): Result<T, Error>` to wrap throwing functions | ✅ | 2025-11-30 |
| TASK-018 | Implement `fromPromise<T>(promise: Promise<T>): Promise<Result<T, Error>>` for async operations | ✅ | 2025-11-30 |
| TASK-019 | Create barrel export in `src/result/index.ts` with all Result utilities | ✅ | 2025-11-30 |

### Implementation Phase 3: Functional Utilities

- GOAL-003: Implement functional programming utilities with full TypeScript type inference

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-020 | Implement `pipe<T>(...fns: Function[]): (value: T) => unknown` with up to 10 overloads for type safety in `src/functional/pipe.ts` | ✅ | 2025-11-30 |
| TASK-021 | Implement `compose<T>(...fns: Function[]): (value: T) => unknown` (right-to-left pipe) in `src/functional/compose.ts` | ✅ | 2025-11-30 |
| TASK-022 | Implement `curry<T extends (...args: any[]) => any>(fn: T): Curried<T>` with full type inference in `src/functional/curry.ts` | ✅ | 2025-11-30 |
| TASK-023 | Implement `identity<T>(value: T): T` utility in `src/functional/identity.ts` | ✅ | 2025-11-30 |
| TASK-024 | Implement `tap<T>(fn: (value: T) => void): (value: T) => T` for side effects in pipelines in `src/functional/tap.ts` | ✅ | 2025-11-30 |
| TASK-025 | Implement `partial<T extends (...args: any[]) => any>(fn: T, ...args: Partial<Parameters<T>>): PartiallyApplied<T>` | ✅ | 2025-11-30 |
| TASK-026 | Implement `flip<A, B, R>(fn: (a: A, b: B) => R): (b: B, a: A) => R` argument order reversal | ✅ | 2025-11-30 |
| TASK-027 | Implement `constant<T>(value: T): () => T` for creating constant functions | ✅ | 2025-11-30 |
| TASK-028 | Implement `noop(): void` and `noopAsync(): Promise<void>` utility functions | ✅ | 2025-11-30 |
| TASK-029 | Create barrel export in `src/functional/index.ts` with all functional utilities | ✅ | 2025-11-30 |

### Implementation Phase 4: Module Interop Utilities

- GOAL-004: Extract and generalize module interoperability utilities from existing packages

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-030 | Extract `interopDefault<T>(m: Awaitable<T>): Promise<T>` from `@bfra.me/eslint-config/src/utils.ts` to `src/module/interop.ts` | ✅ | 2025-11-30 |
| TASK-031 | Implement `isPackageInScope(name: string, scopeUrl?: string): boolean` generalized from eslint-config | ✅ | 2025-11-30 |
| TASK-032 | Implement `resolveModule<T>(specifier: string): Promise<Result<T, Error>>` with Result return type | ✅ | 2025-11-30 |
| TASK-033 | Implement `dynamicImport<T>(path: string): Promise<Result<T, Error>>` with error handling | ✅ | 2025-11-30 |
| TASK-034 | Implement `isESModule(module: unknown): boolean` type guard for module detection | ✅ | 2025-11-30 |
| TASK-035 | Create barrel export in `src/module/index.ts` with all module utilities | ✅ | 2025-11-30 |

### Implementation Phase 5: Environment Detection

- GOAL-005: Extract and consolidate environment detection utilities

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-036 | Extract `isInGitLifecycle(): boolean` from `@bfra.me/eslint-config/src/utils.ts` to `src/env/git.ts` | ✅ | 2025-11-30 |
| TASK-037 | Extract `isInEditorEnv(): boolean` from `@bfra.me/eslint-config/src/utils.ts` to `src/env/editor.ts` | ✅ | 2025-11-30 |
| TASK-038 | Implement `isInCI(): boolean` wrapper using `is-in-ci` package in `src/env/ci.ts` | ✅ | 2025-11-30 |
| TASK-039 | Implement `getEnvironment(): EnvironmentInfo` returning comprehensive environment details | ✅ | 2025-11-30 |
| TASK-040 | Implement `isNode(): boolean`, `isBrowser(): boolean`, `isDeno(): boolean` runtime detection | ✅ | 2025-11-30 |
| TASK-041 | Create barrel export in `src/env/index.ts` with all environment utilities | ✅ | 2025-11-30 |

### Implementation Phase 6: Branded Types and Type Guards

- GOAL-006: Implement branded types infrastructure and common type guards

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-042 | Implement `Brand<T, B extends string>` and `Opaque<T, B extends string>` types in `src/types/brand.ts` | ✅ | 2025-11-30 |
| TASK-043 | Implement `brand<T, B extends string>(value: T): Brand<T, B>` factory function | ✅ | 2025-11-30 |
| TASK-044 | Implement `unbrand<T>(value: Brand<T, any>): T` extraction function | ✅ | 2025-11-30 |
| TASK-045 | Create common branded types: `NonEmptyString`, `PositiveInteger`, `ValidPath`, `AbsolutePath` | ✅ | 2025-11-30 |
| TASK-046 | Implement common type guards in `src/types/guards.ts`: `isString()`, `isNumber()`, `isObject()`, `isArray()`, `isFunction()` | ✅ | 2025-11-30 |
| TASK-047 | Implement `hasProperty<K extends PropertyKey>(obj: unknown, key: K): obj is Record<K, unknown>` | ✅ | 2025-11-30 |
| TASK-048 | Implement `isNonNullable<T>(value: T): value is NonNullable<T>` guard | ✅ | 2025-11-30 |
| TASK-049 | Implement `assertType<T>(value: unknown, guard: (v: unknown) => v is T): asserts value is T` | ✅ | 2025-11-30 |
| TASK-050 | Create barrel export in `src/types/index.ts` with all type utilities | ✅ | 2025-11-30 |

### Implementation Phase 7: Async Utilities

- GOAL-007: Implement async utilities with proper TypeScript typing and error handling

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-051 | Implement `retry<T>(fn: () => Promise<T>, options: RetryOptions): Promise<Result<T, Error>>` in `src/async/retry.ts` | ✅ | 2025-11-30 |
| TASK-052 | Implement `timeout<T>(promise: Promise<T>, ms: number): Promise<Result<T, TimeoutError>>` in `src/async/timeout.ts` | ✅ | 2025-11-30 |
| TASK-053 | Implement `debounce<T extends (...args: any[]) => any>(fn: T, ms: number): DebouncedFunction<T>` in `src/async/debounce.ts` | ✅ | 2025-11-30 |
| TASK-054 | Implement `throttle<T extends (...args: any[]) => any>(fn: T, ms: number): ThrottledFunction<T>` in `src/async/throttle.ts` | ✅ | 2025-11-30 |
| TASK-055 | Implement `sleep(ms: number): Promise<void>` delay utility in `src/async/sleep.ts` | ✅ | 2025-11-30 |
| TASK-056 | Implement `pLimit(concurrency: number): <T>(fn: () => Promise<T>) => Promise<T>` concurrency limiter | ✅ | 2025-11-30 |
| TASK-057 | Implement `pAll<T>(promises: (() => Promise<T>)[], options?: { concurrency?: number }): Promise<Result<T[], Error>>` | ✅ | 2025-11-30 |
| TASK-058 | Create barrel export in `src/async/index.ts` with all async utilities | ✅ | 2025-11-30 |

### Implementation Phase 8: Validation Utilities

- GOAL-008: Implement validation factories for common patterns

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-059 | Implement `validatePath(path: string, options?: PathValidationOptions): Result<ValidPath, ValidationError>` in `src/validation/path.ts` | ✅ | 2025-11-30 |
| TASK-060 | Implement `isWithinBoundary(path: string, boundary: string): boolean` for directory traversal prevention | ✅ | 2025-11-30 |
| TASK-061 | Implement `sanitizeInput(input: string, options?: SanitizeOptions): string` for XSS prevention in `src/validation/sanitize.ts` | ✅ | 2025-11-30 |
| TASK-062 | Implement `createValidator<T>(schema: ValidationSchema): (value: unknown) => Result<T, ValidationError>` factory | ✅ | 2025-11-30 |
| TASK-063 | Implement common validators: `isEmail()`, `isUrl()`, `isUuid()`, `isSemver()` in `src/validation/validators.ts` | ✅ | 2025-11-30 |
| TASK-064 | Create barrel export in `src/validation/index.ts` with all validation utilities | ✅ | 2025-11-30 |

### Implementation Phase 9: Error Factory Utilities

- GOAL-009: Implement standardized error creation and handling

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-065 | Create `BaseError` class with code, cause, and context support in `src/error/base.ts` | ✅ | 2025-11-30 |
| TASK-066 | Implement `createError(message: string, options?: ErrorOptions): Error` factory in `src/error/factory.ts` | ✅ | 2025-11-30 |
| TASK-067 | Implement specialized error types: `ValidationError`, `TimeoutError`, `NotFoundError`, `PermissionError` | ✅ | 2025-11-30 |
| TASK-068 | Implement `withErrorContext<T>(fn: () => T, context: ErrorContext): T` wrapper | ✅ | 2025-11-30 |
| TASK-069 | Implement `formatError(error: unknown): string` for consistent error display | ✅ | 2025-11-30 |
| TASK-070 | Create barrel export in `src/error/index.ts` with all error utilities | ✅ | 2025-11-30 |

### Implementation Phase 10: File Watcher Abstraction

- GOAL-010: Create reusable file watcher abstraction with debouncing and change detection

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-071 | Create `src/watcher/types.ts` with `WatcherOptions`, `FileChange`, `WatcherEvent` types | ✅ | 2025-11-30 |
| TASK-072 | Implement `createFileWatcher(paths: string[], options?: WatcherOptions): FileWatcher` factory in `src/watcher/file-watcher.ts` | ✅ | 2025-11-30 |
| TASK-073 | Implement `createDebouncer<T>(fn: (items: T[]) => void, ms: number): Debouncer<T>` for batching events in `src/watcher/debouncer.ts` | ✅ | 2025-11-30 |
| TASK-074 | Implement `createFileHasher(algorithm?: 'sha256' | 'md5'): FileHasher` for change detection in `src/watcher/hasher.ts` | ✅ | 2025-11-30 |
| TASK-075 | Implement `createChangeDetector(options?: ChangeDetectorOptions): ChangeDetector` in `src/watcher/change-detector.ts` | ✅ | 2025-11-30 |
| TASK-076 | Add optional peer dependency on `chokidar` with graceful degradation | ✅ | 2025-11-30 |
| TASK-077 | Create barrel export in `src/watcher/index.ts` with all watcher utilities | ✅ | 2025-11-30 |

### Implementation Phase 11: Memoization Utilities

- GOAL-011: Implement memoization with configurable cache strategies

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-078 | Implement `memoize<T extends (...args: any[]) => any>(fn: T, options?: MemoizeOptions): T` in `src/functional/memoize.ts` | ✅ | 2025-11-30 |
| TASK-079 | Implement LRU cache strategy in `src/functional/cache/lru.ts` | ✅ | 2025-11-30 |
| TASK-080 | Implement TTL cache strategy in `src/functional/cache/ttl.ts` | ✅ | 2025-11-30 |
| TASK-081 | Implement weak reference cache for object keys in `src/functional/cache/weak.ts` | ✅ | 2025-11-30 |
| TASK-082 | Implement `createKeyResolver(...args: any[]): string` for custom cache key generation | ✅ | 2025-11-30 |
| TASK-083 | Add cache statistics tracking (hits, misses, evictions) | ✅ | 2025-11-30 |

### Implementation Phase 12: Unit Testing

- GOAL-012: Implement comprehensive unit tests for all utilities

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-084 | Write unit tests for Result type in `test/result/result.test.ts` with concurrent execution | ✅ | 2025-11-30 |
| TASK-085 | Write unit tests for functional utilities in `test/functional/*.test.ts` | ✅ | 2025-11-30 |
| TASK-086 | Write unit tests for module interop in `test/module/interop.test.ts` | ✅ | 2025-11-30 |
| TASK-087 | Write unit tests for environment detection in `test/env/*.test.ts` | ✅ | 2025-11-30 |
| TASK-088 | Write unit tests for branded types in `test/types/brand.test.ts` | ✅ | 2025-11-30 |
| TASK-089 | Write unit tests for async utilities in `test/async/*.test.ts` | ✅ | 2025-11-30 |
| TASK-090 | Write unit tests for validation utilities in `test/validation/*.test.ts` | ✅ | 2025-11-30 |
| TASK-091 | Write unit tests for error utilities in `test/error/*.test.ts` | ✅ | 2025-11-30 |
| TASK-092 | Write unit tests for file watcher in `test/watcher/*.test.ts` with mock file system | ✅ | 2025-11-30 |
| TASK-093 | Write unit tests for memoization in `test/functional/memoize.test.ts` | ✅ | 2025-11-30 |

### Implementation Phase 13: Integration and Synthetic Monorepo Testing

- GOAL-013: Create integration tests with synthetic monorepo scenarios

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-094 | Create test fixtures directory `test/fixtures/synthetic-monorepo/` with sample package structures | ✅ | 2025-12-01 |
| TASK-095 | Create multi-package fixture simulating real workspace with 10+ packages | ✅ | 2025-12-01 |
| TASK-096 | Write integration tests for Result type across async boundaries in `test/integration/result-async.test.ts` | ✅ | 2025-12-01 |
| TASK-097 | Write integration tests for functional composition chains in `test/integration/functional-chains.test.ts` | ✅ | 2025-12-01 |
| TASK-098 | Write integration tests for file watcher with real file system in `test/integration/watcher.test.ts` | ✅ | 2025-12-01 |
| TASK-099 | Write integration tests for module interop with various export patterns | ✅ | 2025-12-01 |
| TASK-100 | Validate utilities work correctly with various tsconfig `moduleResolution` settings | ✅ | 2025-12-01 |

### Implementation Phase 14: Performance Benchmarks

- GOAL-014: Implement performance benchmarks for large codebase validation

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-101 | Create benchmark harness in `test/benchmarks/benchmark-harness.ts` | ✅ | 2025-12-01 |
| TASK-102 | Implement pipe/compose performance benchmarks comparing to hand-written code | ✅ | 2025-12-01 |
| TASK-103 | Implement Result creation and transformation benchmarks (100K iterations) | ✅ | 2025-12-01 |
| TASK-104 | Implement memoization cache performance benchmarks with various cache sizes | ✅ | 2025-12-01 |
| TASK-105 | Implement file watcher debouncing benchmarks with rapid event simulation | ✅ | 2025-12-01 |
| TASK-106 | Create benchmark comparison baseline in `test/benchmarks/baselines/` | ✅ | 2025-12-01 |
| TASK-107 | Add CI benchmark regression detection with < 10% performance degradation threshold | ✅ | 2025-12-01 |

### Implementation Phase 15: Anti-Pattern Detection Tests

- GOAL-015: Create tests validating against known architectural patterns and anti-patterns

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-108 | Create fixture testing proper Result usage patterns | ✅ | 2025-12-01 |
| TASK-109 | Create fixture testing improper Result usage (throwing from Result code paths) | ✅ | 2025-12-01 |
| TASK-110 | Create fixture testing proper functional composition patterns | ✅ | 2025-12-01 |
| TASK-111 | Create fixture testing pipe/compose misuse (side effects, mutation) | ✅ | 2025-12-01 |
| TASK-112 | Create fixture testing proper type guard usage vs. type assertion | ✅ | 2025-12-01 |
| TASK-113 | Write anti-pattern detection tests in `test/patterns/anti-pattern-detection.test.ts` | ✅ | 2025-12-01 |
| TASK-114 | Write best practice validation tests in `test/patterns/best-practices.test.ts` | ✅ | 2025-12-01 |

### Implementation Phase 16: Documentation

- GOAL-016: Complete documentation with examples and integration guides

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-115 | Write comprehensive README.md with API documentation and usage examples | ✅ | 2025-12-01 |
| TASK-116 | Add JSDoc comments to all public API functions with @example tags | ✅ | 2025-12-01 |
| TASK-117 | Create API reference documentation in `docs/api.md` | ✅ | 2025-12-01 |
| TASK-118 | Create migration guide for consumers of inline utilities in `docs/migration.md` | ✅ | 2025-12-01 |
| TASK-119 | Add package to docs site navigation in `docs/astro.config.mjs` | ✅ | 2025-12-01 |
| TASK-120 | Create CHANGELOG.md with initial version entry | ⏭️ | (skipped - changesets) |

### Implementation Phase 17: Dependent Plan Updates

- GOAL-017: Update dependent implementation plans to use `@bfra.me/es` utilities

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-121 | Update `refactor-create-package-1.md` TASK-002 to import `Result<T, E>` from `@bfra.me/es/result` | ✅ | 2025-12-01 |
| TASK-122 | Update `refactor-create-package-1.md` TASK-005 to import `pipe()`, `compose()`, `curry()` from `@bfra.me/es/functional` | ✅ | 2025-12-01 |
| TASK-123 | Update `feature-workspace-analyzer-1.md` TASK-008 to import `Result<T>` from `@bfra.me/es/result` | ✅ | 2025-12-01 |
| TASK-124 | Update `feature-doc-sync-engine-1.md` TASK-007 types to extend/import from `@bfra.me/es/result` | ✅ | 2025-12-01 |
| TASK-125 | Update `feature-doc-sync-engine-1.md` TASK-022-024 to use `createFileWatcher()` from `@bfra.me/es/watcher` | ✅ | 2025-12-01 |
| TASK-126 | Update `feature-workspace-analyzer-1.md` TASK-057-058 to use file hasher from `@bfra.me/es/watcher` | ✅ | 2025-12-01 |
| TASK-127 | Add `@bfra.me/es` as DEP-001 in all three dependent implementation plans | ✅ | 2025-12-01 |

### Implementation Phase 18: ESLint-Config Migration

- GOAL-018: Migrate `@bfra.me/eslint-config` to use `@bfra.me/es` utilities

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-128 | Add `@bfra.me/es` as dependency in `packages/eslint-config/package.json` | | |
| TASK-129 | Update `packages/eslint-config/src/utils.ts` to re-export `interopDefault` from `@bfra.me/es/module` | | |
| TASK-130 | Update `packages/eslint-config/src/utils.ts` to re-export `isInGitLifecycle`, `isInEditorEnv` from `@bfra.me/es/env` | | |
| TASK-131 | Add deprecation notices to original implementations pointing to `@bfra.me/es` | | |
| TASK-132 | Update eslint-config tests to verify re-exports work correctly | | |

### Implementation Phase 19: Release Preparation

- GOAL-019: Prepare package for initial release

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-133 | Run full validation suite (`pnpm validate`) and fix any issues | | |
| TASK-134 | Verify type coverage meets threshold (95%+) | | |
| TASK-135 | Run benchmarks and document baseline performance | | |
| TASK-136 | Verify bundle size meets constraint (< 5KB core, < 10KB with watcher) | | |
| TASK-137 | Create changeset for initial release | | |
| TASK-138 | Update root workspace references in `tsconfig.json` | | |
| TASK-139 | Update `llms.txt` with package documentation | | |
| TASK-140 | Final review of public API surface for breaking change potential | | |
| TASK-141 | Publish initial version via `pnpm publish-changesets` | | |

## 3. Alternatives

- **ALT-001**: Use existing utility libraries (lodash, ramda, fp-ts) — rejected because they add significant bundle size and don't follow monorepo type patterns
- **ALT-002**: Keep utilities inlined in each package — rejected due to DRY violations and maintenance burden across multiple packages
- **ALT-003**: Create separate micro-packages for each utility category — rejected due to dependency management complexity
- **ALT-004**: Use TypeScript namespaces for organization — rejected because namespaces don't tree-shake well and are considered legacy pattern
- **ALT-005**: Implement full fp-ts-style HKT system — rejected due to complexity; discriminated unions are sufficient for this use case
- **ALT-006**: Use neverthrow for Result type — considered but rejected to maintain zero-dependency goal and full control over API

## 4. Dependencies

### Runtime Dependencies

- **DEP-001**: None (zero runtime dependencies for core utilities)

### Peer Dependencies

- **DEP-002**: `chokidar` (^5.0.0) — Optional peer dependency for file watcher functionality
- **DEP-003**: `is-in-ci` (^2.0.0) — Optional peer dependency for CI detection

### Development Dependencies

- **DEP-004**: `@bfra.me/tsconfig` (workspace:*) — Shared TypeScript configuration
- **DEP-005**: `vitest` — Testing framework (via workspace root)
- **DEP-006**: `tsup` — Build tool (via workspace root)
- **DEP-007**: `memfs` — In-memory file system for testing file watcher
- **DEP-008**: `@types/node` — Node.js type definitions

## 5. Files

### Source Files

- **FILE-001**: `packages/es/src/index.ts` — Main entry point with public API exports
- **FILE-002**: `packages/es/src/result/index.ts` — Result type barrel export
- **FILE-003**: `packages/es/src/result/types.ts` — Result, Ok, Err type definitions
- **FILE-004**: `packages/es/src/result/factories.ts` — ok(), err() factory functions
- **FILE-005**: `packages/es/src/result/guards.ts` — isOk(), isErr() type guards
- **FILE-006**: `packages/es/src/result/operators.ts` — map(), flatMap(), unwrap() operators
- **FILE-007**: `packages/es/src/functional/index.ts` — Functional utilities barrel export
- **FILE-008**: `packages/es/src/functional/pipe.ts` — pipe() with type overloads
- **FILE-009**: `packages/es/src/functional/compose.ts` — compose() with type overloads
- **FILE-010**: `packages/es/src/functional/curry.ts` — curry() with type inference
- **FILE-011**: `packages/es/src/functional/memoize.ts` — memoize() with cache strategies
- **FILE-012**: `packages/es/src/module/index.ts` — Module utilities barrel export
- **FILE-013**: `packages/es/src/module/interop.ts` — interopDefault(), isESModule()
- **FILE-014**: `packages/es/src/env/index.ts` — Environment detection barrel export
- **FILE-015**: `packages/es/src/env/git.ts` — isInGitLifecycle()
- **FILE-016**: `packages/es/src/env/editor.ts` — isInEditorEnv()
- **FILE-017**: `packages/es/src/env/ci.ts` — isInCI()
- **FILE-018**: `packages/es/src/types/index.ts` — Type utilities barrel export
- **FILE-019**: `packages/es/src/types/brand.ts` — Brand, Opaque, branded type factories
- **FILE-020**: `packages/es/src/types/guards.ts` — Common type guards
- **FILE-021**: `packages/es/src/async/index.ts` — Async utilities barrel export
- **FILE-022**: `packages/es/src/async/retry.ts` — retry() with options
- **FILE-023**: `packages/es/src/async/timeout.ts` — timeout() wrapper
- **FILE-024**: `packages/es/src/async/debounce.ts` — debounce() function
- **FILE-025**: `packages/es/src/async/throttle.ts` — throttle() function
- **FILE-026**: `packages/es/src/validation/index.ts` — Validation utilities barrel export
- **FILE-027**: `packages/es/src/validation/path.ts` — Path validation utilities
- **FILE-028**: `packages/es/src/validation/sanitize.ts` — Input sanitization
- **FILE-029**: `packages/es/src/error/index.ts` — Error utilities barrel export
- **FILE-030**: `packages/es/src/error/base.ts` — BaseError class
- **FILE-031**: `packages/es/src/error/factory.ts` — createError() factory
- **FILE-032**: `packages/es/src/watcher/index.ts` — File watcher barrel export
- **FILE-033**: `packages/es/src/watcher/file-watcher.ts` — createFileWatcher() factory
- **FILE-034**: `packages/es/src/watcher/debouncer.ts` — Event debouncer
- **FILE-035**: `packages/es/src/watcher/hasher.ts` — File hash utilities

### Configuration Files

- **FILE-036**: `packages/es/package.json` — Package manifest with subpath exports
- **FILE-037**: `packages/es/tsconfig.json` — TypeScript configuration
- **FILE-038**: `packages/es/eslint.config.ts` — ESLint configuration
- **FILE-039**: `packages/es/tsup.config.ts` — Build configuration
- **FILE-040**: `packages/es/vitest.config.ts` — Test configuration

### Test Files

- **FILE-041**: `packages/es/test/result/*.test.ts` — Result type tests
- **FILE-042**: `packages/es/test/functional/*.test.ts` — Functional utility tests
- **FILE-043**: `packages/es/test/module/*.test.ts` — Module utility tests
- **FILE-044**: `packages/es/test/env/*.test.ts` — Environment detection tests
- **FILE-045**: `packages/es/test/types/*.test.ts` — Type utility tests
- **FILE-046**: `packages/es/test/async/*.test.ts` — Async utility tests
- **FILE-047**: `packages/es/test/validation/*.test.ts` — Validation utility tests
- **FILE-048**: `packages/es/test/watcher/*.test.ts` — File watcher tests
- **FILE-049**: `packages/es/test/integration/*.test.ts` — Integration tests
- **FILE-050**: `packages/es/test/benchmarks/*.bench.ts` — Performance benchmarks

### Documentation Files

- **FILE-051**: `packages/es/README.md` — Package documentation
- **FILE-052**: `packages/es/CHANGELOG.md` — Version changelog
- **FILE-053**: `packages/es/docs/api.md` — API reference
- **FILE-054**: `packages/es/docs/migration.md` — Migration guide

## 6. Testing

### Unit Tests

- **TEST-001**: Result `ok()` correctly creates success variant with typed data
- **TEST-002**: Result `err()` correctly creates failure variant with typed error
- **TEST-003**: Result `isOk()` and `isErr()` type guards narrow types correctly
- **TEST-004**: Result `unwrap()` returns value for Ok and throws for Err
- **TEST-005**: Result `map()` transforms Ok values and passes through Err
- **TEST-006**: Result `flatMap()` chains Result-returning functions correctly
- **TEST-007**: Result `fromThrowable()` catches exceptions and wraps in Err
- **TEST-008**: Result `fromPromise()` handles async success and rejection
- **TEST-009**: `pipe()` composes functions left-to-right with correct types
- **TEST-010**: `compose()` composes functions right-to-left with correct types
- **TEST-011**: `curry()` partially applies arguments with type inference
- **TEST-012**: `memoize()` caches results for identical arguments
- **TEST-013**: `memoize()` respects cache size limits (LRU eviction)
- **TEST-014**: `memoize()` respects TTL expiration
- **TEST-015**: `interopDefault()` unwraps ES module default exports
- **TEST-016**: `interopDefault()` handles CommonJS modules correctly
- **TEST-017**: `isInGitLifecycle()` detects git hook environment variables
- **TEST-018**: `isInEditorEnv()` detects VS Code, JetBrains, Vim environments
- **TEST-019**: Branded types prevent assignment of unbranded values at compile time
- **TEST-020**: Type guards correctly narrow union types
- **TEST-021**: `retry()` retries failed operations with exponential backoff
- **TEST-022**: `timeout()` rejects with TimeoutError after specified duration
- **TEST-023**: `debounce()` batches rapid calls into single invocation
- **TEST-024**: `throttle()` limits call frequency to specified interval
- **TEST-025**: `validatePath()` rejects directory traversal patterns
- **TEST-026**: `sanitizeInput()` escapes XSS-dangerous characters
- **TEST-027**: File watcher detects file creation, modification, deletion
- **TEST-028**: File watcher debouncer batches rapid events correctly

### Integration Tests

- **TEST-029**: Result type works correctly across async/await boundaries
- **TEST-030**: Functional composition chains maintain type safety through 10+ transformations
- **TEST-031**: File watcher integration with real file system operations
- **TEST-032**: Module interop works with various TypeScript `moduleResolution` settings
- **TEST-033**: Utilities work correctly in synthetic monorepo with cross-package imports

### Performance Benchmarks

- **TEST-034**: `pipe()` performance within 5% of hand-written function chains
- **TEST-035**: Result creation < 100ns per operation (100K iterations)
- **TEST-036**: Memoization cache lookup < 10ns for cache hits
- **TEST-037**: File watcher debouncing batches 1000 events/sec without drops

### Anti-Pattern Detection Tests

- **TEST-038**: Validates Result usage patterns (no throwing from Result code paths)
- **TEST-039**: Validates pipe/compose usage (no side effects, no mutation)
- **TEST-040**: Validates type guard usage over type assertions

## 7. Risks & Assumptions

### Risks

- **RISK-001**: Breaking changes to TypeScript compiler may affect type inference in complex generics — mitigate with comprehensive type tests and version pinning
- **RISK-002**: Subpath exports may not work correctly with all bundlers/resolvers — mitigate with integration tests across common tools
- **RISK-003**: Optional peer dependencies may cause runtime errors if not installed — mitigate with graceful degradation and clear error messages
- **RISK-004**: Performance overhead of functional abstractions may impact hot paths — mitigate with benchmarks and optimization passes
- **RISK-005**: Existing code using inline utilities may have subtle behavior differences — mitigate with comprehensive migration tests

### Assumptions

- **ASSUMPTION-001**: Consumers use TypeScript 5.0+ with strict mode enabled
- **ASSUMPTION-002**: Consumers use modern bundlers supporting subpath exports (Node 16+, esbuild, Vite)
- **ASSUMPTION-003**: File watcher consumers have chokidar installed as peer dependency
- **ASSUMPTION-004**: Monorepo packages follow established patterns for workspace dependencies
- **ASSUMPTION-005**: Zero runtime dependencies is an acceptable trade-off for bundle size vs. features

## 8. Related Specifications / Further Reading

- [TypeScript Handbook: Discriminated Unions](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions)
- [Node.js Subpath Exports](https://nodejs.org/api/packages.html#subpath-exports)
- [Chokidar Documentation](https://github.com/paulmillr/chokidar)
- [fp-ts Result/Either Pattern](https://gcanti.github.io/fp-ts/modules/Either.ts.html)
- [Neverthrow Library](https://github.com/supermacro/neverthrow) — Prior art for Result type
- bfra.me/works Copilot Instructions: `/.github/copilot-instructions.md`
- Existing Package Patterns: `packages/badge-config/`, `packages/eslint-config/`
- Dependent Plans:
  - `/.ai/plan/refactor-create-package-1.md`
  - `/.ai/plan/feature-workspace-analyzer-1.md`
  - `/.ai/plan/feature-doc-sync-engine-1.md`
