# @bfra.me/es

## 0.1.0
### Minor Changes


- feat(es): add `@bfra.me/es` package with reusable ES development utilities ([#2301](https://github.com/bfra-me/works/pull/2301))
  
  Initial release of `@bfra.me/es` providing high-quality reusable types and utilities for ES development:
  
  **Core Features:**
  - **Result Type** (`@bfra.me/es/result`): Discriminated union for type-safe error handling with `ok()`, `err()`, `isOk()`, `isErr()`, `map()`, `flatMap()`, `unwrap()`, `unwrapOr()`
  - **Functional Utilities** (`@bfra.me/es/functional`): `pipe`, `compose`, `curry`, `memoize` (with LRU/TTL/weak cache strategies), `tap`, `identity`, `constant`, `flip`, `partial`, `noop`
  - **Async Utilities** (`@bfra.me/es/async`): `retry`, `timeout`, `debounce`, `throttle`, `sleep`, `pLimit`, `pAll` for concurrency control
  - **Type Guards & Branded Types** (`@bfra.me/es/types`): `Brand<T, B>`, `Opaque<T, B>`, common type guards, `hasProperty`, `assertType`
  - **Validation** (`@bfra.me/es/validation`): Path validation, directory traversal prevention, input sanitization, common validators (`isEmail`, `isUrl`, `isUuid`, `isSemver`)
  - **Error Utilities** (`@bfra.me/es/error`): `BaseError`, `createError()`, specialized error types (`ValidationError`, `TimeoutError`, `NotFoundError`, `PermissionError`)
  - **Module Interop** (`@bfra.me/es/module`): `interopDefault()`, `isESModule()`, `resolveModule()`, `dynamicImport()`
  - **Environment Detection** (`@bfra.me/es/env`): `isInCI()`, `isInEditorEnv()`, `isInGitLifecycle()`, `isNode()`, `isBrowser()`, `isDeno()`
  - **File Watcher** (`@bfra.me/es/watcher`): `createFileWatcher()`, `createDebouncer()`, `createFileHasher()`, `createChangeDetector()` (optional chokidar peer dependency)
  
  **Highlights:**
  - Zero runtime dependencies for core utilities
  - Tree-shakeable via subpath exports
  - Full TypeScript type inference
  - 99.89% type coverage
  - Comprehensive test suite with 800+ unit tests
  - Performance benchmarks with <10% degradation threshold
  
  **Migration from `@bfra.me/eslint-config`:**
  The `interopDefault()`, `isInGitLifecycle()`, and `isInEditorEnv()` utilities have been extracted to `@bfra.me/es`. The eslint-config package now re-exports these from `@bfra.me/es` with deprecation notices pointing to the new location.

### Patch Changes


- Updated dependency `chokidar` to `5.0.0`. ([#2329](https://github.com/bfra-me/works/pull/2329))
