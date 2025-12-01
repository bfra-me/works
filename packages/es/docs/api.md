# @bfra.me/es API Reference

Complete API documentation for all exports from `@bfra.me/es`.

## Table of Contents

- [Result Type](#result-type)
- [Functional Utilities](#functional-utilities)
- [Async Utilities](#async-utilities)
- [Module Interop](#module-interop)
- [Type Utilities](#type-utilities)
- [Validation](#validation)
- [Error Utilities](#error-utilities)
- [Environment Detection](#environment-detection)
- [File Watcher](#file-watcher)

---

## Result Type

**Import:** `@bfra.me/es/result`

A discriminated union type for type-safe error handling without exceptions.

### Result Types

#### `Result<T, E>`

```typescript
type Result<T, E> = Ok<T> | Err<E>
```

Discriminated union representing either a successful value (`Ok<T>`) or an error (`Err<E>`).

#### `Ok<T>`

```typescript
interface Ok<T> {
  readonly success: true
  readonly data: T
}
```

Represents a successful result containing a value.

#### `Err<E>`

```typescript
interface Err<E> {
  readonly success: false
  readonly error: E
}
```

Represents a failed result containing an error.

### Factory Functions

#### `ok<T>(value: T): Ok<T>`

Creates a successful Result.

```typescript
const result = ok(42)
// { success: true, data: 42 }
```

#### `err<E>(error: E): Err<E>`

Creates a failed Result.

```typescript
const result = err(new Error('failed'))
// { success: false, error: Error }
```

### Result Type Guards

#### `isOk<T, E>(result: Result<T, E>): result is Ok<T>`

Returns `true` if the result is `Ok`, narrowing the type.

#### `isErr<T, E>(result: Result<T, E>): result is Err<E>`

Returns `true` if the result is `Err`, narrowing the type.

### Operators

#### `unwrap<T, E>(result: Result<T, E>, message?: string): T`

Extracts the value from `Ok`, or throws for `Err`. Use sparingly.

#### `unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T`

Extracts the value from `Ok`, or returns the default value for `Err`.

#### `map<T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E>`

Transforms the value inside `Ok`. `Err` results pass through unchanged.

#### `flatMap<T, U, E>(result: Result<T, E>, fn: (value: T) => Result<U, E>): Result<U, E>`

Chains Result-returning functions, flattening nested Results.

#### `mapErr<T, E, F>(result: Result<T, E>, fn: (error: E) => F): Result<T, F>`

Transforms the error inside `Err`. `Ok` results pass through unchanged.

#### `fromThrowable<T>(fn: () => T): Result<T, Error>`

Wraps a potentially throwing function in a Result.

#### `fromPromise<T>(promise: Promise<T>): Promise<Result<T, Error>>`

Converts a Promise to `Promise<Result>`, catching rejections.

---

## Functional Utilities

**Import:** `@bfra.me/es/functional`

Functional programming utilities with full TypeScript type inference.

### `pipe<A, B, ...>(fn1, fn2, ...): (a: A) => Result`

Composes functions left-to-right. Supports up to 10 functions with full type inference.

```typescript
const transform = pipe(
  (x: number) => x + 1,
  (x: number) => x * 2
)
transform(5) // 12
```

### `compose<A, B, ...>(fn1, fn2, ...): (a: A) => Result`

Composes functions right-to-left (mathematical composition order).

```typescript
const transform = compose(
  (x: number) => x * 2,
  (x: number) => x + 1
)
transform(5) // 12
```

### `curry<F>(fn: F): Curried<F>`

Transforms a function to accept arguments one at a time. Supports up to 5 arguments.

```typescript
const add = curry((a: number, b: number, c: number) => a + b + c)
add(1)(2)(3) // 6
add(1, 2)(3) // 6
```

### `memoize<F>(fn: F, options?: MemoizeOptions): MemoizedFunction<F>`

Caches function results based on arguments.

**Options:**

| Property      | Type                      | Description                         |
| ------------- | ------------------------- | ----------------------------------- |
| `strategy`    | `'map' \| 'lru' \| 'ttl'` | Cache strategy (default: `'map'`)   |
| `maxSize`     | `number`                  | Max cache entries (for `lru`/`ttl`) |
| `ttl`         | `number`                  | Time-to-live in ms (for `ttl`)      |
| `keyResolver` | `(args) => string`        | Custom cache key function           |
| `onHit`       | `(key, value) => void`    | Called on cache hit                 |
| `onMiss`      | `(key) => void`           | Called on cache miss                |

**Returned function properties:**

- `clear()` - Clear all cached values
- `delete(...args)` - Delete specific cached value
- `getStats()` - Get cache statistics `{ hits, misses, size, evictions }`
- `resetStats()` - Reset statistics

### `identity<T>(value: T): T`

Returns its argument unchanged. Useful as a default function.

### `tap<T>(fn: (value: T) => void): (value: T) => T`

Creates a function that executes a side effect and returns the original value.

### `partial<F>(fn: F, ...args): PartiallyApplied<F>`

Pre-fills some arguments of a function.

### `flip<A, B, R>(fn: (a: A, b: B) => R): (b: B, a: A) => R`

Reverses the order of the first two arguments.

### `constant<T>(value: T): () => T`

Creates a function that always returns the same value.

### `noop(): void`

A function that does nothing.

### `noopAsync(): Promise<void>`

An async function that does nothing.

---

## Async Utilities

**Import:** `@bfra.me/es/async`

Async utilities with proper TypeScript typing and error handling.

### `retry<T>(fn: () => Promise<T>, options?: RetryOptions): Promise<Result<T, Error>>`

Retries a function with exponential backoff.

**Options:**

| Property        | Type                          | Default | Description                    |
| --------------- | ----------------------------- | ------- | ------------------------------ |
| `maxAttempts`   | `number`                      | `3`     | Maximum retry attempts         |
| `initialDelay`  | `number`                      | `100`   | Initial delay in ms            |
| `maxDelay`      | `number`                      | `10000` | Maximum delay in ms            |
| `backoffFactor` | `number`                      | `2`     | Exponential backoff multiplier |
| `shouldRetry`   | `(error, attempt) => boolean` | -       | Custom retry condition         |

### `timeout<T>(promise: Promise<T>, ms: number): Promise<Result<T, TimeoutError>>`

Wraps a promise with a timeout, returning a Result.

### `debounce<F>(fn: F, ms: number): DebouncedFunction<F>`

Creates a debounced function that delays invocation until after `ms` milliseconds have elapsed since the last call.

**Returned function properties:**

- `cancel()` - Cancel pending invocation

### `throttle<F>(fn: F, ms: number): ThrottledFunction<F>`

Creates a throttled function that invokes at most once per `ms` milliseconds.

**Returned function properties:**

- `cancel()` - Cancel pending invocation

### `sleep(ms: number): Promise<void>`

Returns a promise that resolves after the specified delay.

### `pLimit(concurrency: number): <T>(fn: () => Promise<T>) => Promise<T>`

Creates a concurrency limiter.

```typescript
const limit = pLimit(5)
const results = await Promise.all(urls.map(url => limit(() => fetch(url))))
```

### `pAll<T>(tasks: (() => Promise<T>)[], options?: PAllOptions): Promise<Result<T[], Error>>`

Runs promise-returning functions with optional concurrency control.

**Options:**

| Property      | Type     | Default    | Description               |
| ------------- | -------- | ---------- | ------------------------- |
| `concurrency` | `number` | `Infinity` | Max concurrent operations |

---

## Module Interop

**Import:** `@bfra.me/es/module`

ES module interoperability utilities.

### Module Types

#### `Awaitable<T>`

```typescript
type Awaitable<T> = T | Promise<T>
```

### Module Functions

#### `interopDefault<T>(m: Awaitable<T>): Promise<T>`

Unwraps the default export from a module. Handles both ESM and CommonJS.

### `resolveModule<T>(specifier: string): Promise<Result<T, Error>>`

Resolves a module specifier to its exports, returning a Result.

### `dynamicImport<T>(path: string): Promise<Result<T, Error>>`

Dynamically imports a module, returning a Result.

### `isESModule(module: unknown): boolean`

Checks if a value is an ES module.

### `isPackageInScope(name: string, options?: IsPackageInScopeOptions): boolean`

Checks if a package exists within a specific scope.

**Options:**

| Property   | Type            | Description                 |
| ---------- | --------------- | --------------------------- |
| `scopeUrl` | `string \| URL` | The scope URL to check from |

---

## Type Utilities

**Import:** `@bfra.me/es/types`

Branded types and type guards.

### Branded Types

#### `Brand<T, B extends string>`

Creates nominal typing in TypeScript's structural type system.

```typescript
type UserId = Brand<string, 'UserId'>
type OrderId = Brand<string, 'OrderId'>

// These are now incompatible types
const userId: UserId = brand<string, 'UserId'>('user-123')
const orderId: OrderId = brand<string, 'OrderId'>('order-456')
```

#### `Opaque<T, B extends string>`

Like `Brand` but semantically indicates the underlying type should be treated as hidden.

#### Pre-defined Branded Types

- `NonEmptyString` - Strings validated as non-empty
- `PositiveInteger` - Numbers validated as positive integers
- `ValidPath` - Paths validated against invalid characters
- `AbsolutePath` - Paths validated as absolute

### Branding Functions

#### `brand<T, B extends string>(value: T): Brand<T, B>`

Zero-cost type cast that brands a value.

#### `unbrand<T>(value: Brand<T, string>): T`

Removes branding to get the raw value.

### Value Type Guards

#### `isString(value: unknown): value is string`

#### `isNumber(value: unknown): value is number`

Excludes `NaN`.

#### `isObject(value: unknown): value is Record<string, unknown>`

Excludes arrays and `null`.

#### `isArray(value: unknown): value is unknown[]`

#### `isFunction(value: unknown): value is (...args: unknown[]) => unknown`

#### `hasProperty<K>(obj: unknown, key: K): obj is Record<K, unknown>`

Checks for property existence.

#### `isNonNullable<T>(value: T): value is NonNullable<T>`

Filters out `null` and `undefined`.

#### `assertType<T>(value: unknown, guard: (v: unknown) => v is T, message?: string): asserts value is T`

Runtime assertion that throws for invalid types.

---

## Validation

**Import:** `@bfra.me/es/validation`

Validation utilities for common patterns.

### `validatePath(path: string, options?: PathValidationOptions): Result<ValidPath, ValidationError>`

Validates a path for safety, checking for traversal attacks.

**Options:**

| Property        | Type      | Default | Description          |
| --------------- | --------- | ------- | -------------------- |
| `allowRelative` | `boolean` | `true`  | Allow relative paths |
| `allowAbsolute` | `boolean` | `true`  | Allow absolute paths |
| `maxLength`     | `number`  | `4096`  | Maximum path length  |

### `isWithinBoundary(path: string, boundary: string): boolean`

Checks if a path is within a specified boundary directory.

### `sanitizeInput(input: string, options?: SanitizeOptions): string`

Sanitizes user input to prevent XSS attacks.

**Options:**

| Property          | Type      | Default | Description          |
| ----------------- | --------- | ------- | -------------------- |
| `escapeHtml`      | `boolean` | `true`  | Escape HTML entities |
| `removeNullBytes` | `boolean` | `true`  | Remove null bytes    |
| `trim`            | `boolean` | `true`  | Trim whitespace      |

---

## Error Utilities

**Import:** `@bfra.me/es/error`

Structured error creation and handling.

### Classes

#### `BaseError`

Base error class with code, cause, and context support.

```typescript
const error = new BaseError(message, {
  code: 'VALIDATION_ERROR',
  cause: originalError,
  context: { field: 'email' }
})
```

**Properties:**

- `code: string` - Error code (default: `'UNKNOWN_ERROR'`)
- `context: ErrorContext | undefined` - Additional context
- `cause: unknown` - The underlying cause (inherited from Error)

#### `ValidationError`

Error thrown when validation fails.

**Additional properties:**

- `field: string | undefined` - The field that failed validation

#### `NotFoundError`

Error thrown when a resource is not found.

**Additional properties:**

- `resource: string | undefined` - The type of resource

#### `PermissionError`

Error thrown when permission is denied.

**Additional properties:**

- `requiredPermission: string | undefined` - The required permission

#### `TimeoutError`

Error thrown when an operation times out.

**Additional properties:**

- `timeout: number` - The timeout duration in ms

### Error Functions

#### `createError(message: string, options?: CreateErrorOptions): BaseError`

Creates a new BaseError with the given message and options.

#### `formatError(error: unknown): string`

Formats an unknown error value to a string, including cause chain.

#### `withErrorContext<T>(fn: () => T, context: ErrorContext): T`

Wraps a function execution with error context.

---

## Environment Detection

**Import:** `@bfra.me/es/env`

Environment detection utilities.

### `isInCI(): boolean`

Checks if running in a CI environment.

### `isInEditorEnv(): boolean`

Checks if running in an editor environment (VS Code, JetBrains, Vim, Neovim).

### `isInGitLifecycle(): boolean`

Checks if running in a git hook or under lint-staged.

### `isNode(): boolean`

Checks if running in Node.js.

### `isBrowser(): boolean`

Checks if running in a browser.

### `isDeno(): boolean`

Checks if running in Deno.

### `getEnvironment(): EnvironmentInfo`

Returns comprehensive environment information.

```typescript
interface EnvironmentInfo {
  readonly isNode: boolean
  readonly isBrowser: boolean
  readonly isDeno: boolean
  readonly isCI: boolean
  readonly isEditor: boolean
  readonly isGitLifecycle: boolean
}
```

---

## File Watcher

**Import:** `@bfra.me/es/watcher`

File watcher abstraction with debouncing and change detection.

> **Note:** Requires `chokidar` as an optional peer dependency.

### `createFileWatcher(paths: string | string[], options?: WatcherOptions): FileWatcher`

Creates a file watcher that monitors file system changes.

**Options:**

| Property          | Type                 | Default | Description                          |
| ----------------- | -------------------- | ------- | ------------------------------------ |
| `debounceMs`      | `number`             | `100`   | Debounce delay in ms                 |
| `ignored`         | `string \| string[]` | -       | Patterns to ignore                   |
| `usePolling`      | `boolean`            | `false` | Use polling instead of native events |
| `pollingInterval` | `number`             | `100`   | Polling interval in ms               |

**FileWatcher interface:**

```typescript
interface FileWatcher {
  start: () => Promise<void>
  close: () => Promise<void>
  on: (event: 'change', handler: (event: WatcherEvent) => void) => void
  off: (event: 'change', handler: (event: WatcherEvent) => void) => void
}
```

### `createDebouncer<T>(fn: (items: T[]) => void, ms: number): Debouncer<T>`

Creates a debouncer that batches items.

**Debouncer interface:**

```typescript
interface Debouncer<T> {
  add: (item: T) => void
  flush: () => void
  cancel: () => void
}
```

### `createFileHasher(algorithm?: 'sha256' | 'md5'): FileHasher`

Creates a file hasher for change detection.

**FileHasher interface:**

```typescript
interface FileHasher {
  hash: (path: string) => Promise<string>
  hashContent: (content: string | Uint8Array) => string
}
```

### `createChangeDetector(options?: ChangeDetectorOptions): ChangeDetector`

Creates a change detector that tracks file changes by content hash.

**ChangeDetector interface:**

```typescript
interface ChangeDetector {
  hasChanged: (path: string) => Promise<boolean>
  record: (path: string) => Promise<void>
  clear: (path: string) => void
  clearAll: () => void
}
```
