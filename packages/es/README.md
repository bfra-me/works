# @bfra.me/es

[![npm version](https://img.shields.io/npm/v/@bfra.me/es.svg)](https://www.npmjs.com/package/@bfra.me/es) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

High-quality reusable types and utilities for ES development (JavaScript and TypeScript). Zero runtime dependencies for core utilities, tree-shakeable via subpath exports.

## Features

- 🎯 **Result Type** — Discriminated union for type-safe error handling without exceptions
- 🔧 **Functional Utilities** — `pipe`, `compose`, `curry`, `memoize` with full TypeScript inference
- 📦 **Module Interop** — ES/CommonJS interoperability helpers
- ⏱️ **Async Utilities** — `retry`, `timeout`, `debounce`, `throttle`, concurrency control
- 🏷️ **Branded Types** — Compile-time type safety with zero runtime cost
- ✅ **Validation** — Path validation, input sanitization, common validators
- 🔍 **Environment Detection** — CI, editor, git lifecycle detection
- 📁 **File Watcher** — Debounced file watching with change detection (optional chokidar peer)
- ⚠️ **Error Utilities** — Structured errors with codes, context, and cause chain

## Installation

```bash
# pnpm (recommended)
pnpm add @bfra.me/es

# npm
npm install @bfra.me/es

# yarn
yarn add @bfra.me/es
```

### Optional Peer Dependencies

```bash
# For file watcher functionality
pnpm add chokidar
```

## Quick Start

```typescript
import {err, isOk, ok, pipe, retry} from '@bfra.me/es'

// Type-safe error handling with Result
function divide(a: number, b: number) {
  return b === 0 ? err(new Error('Division by zero')) : ok(a / b)
}

const result = divide(10, 2)
if (isOk(result)) {
  console.log(result.data) // 5
}

// Functional composition
const transform = pipe(
  (x: number) => x + 1,
  (x: number) => x * 2
)
transform(5) // 12

// Async with retry
const data = await retry(() => fetch('/api/data'), {maxAttempts: 3})
```

## Subpath Exports

All utilities are organized into tree-shakeable subpath exports. Import only what you need:

| Export                   | Description                                |
| ------------------------ | ------------------------------------------ |
| `@bfra.me/es/result`     | Result type for error handling             |
| `@bfra.me/es/functional` | Functional programming utilities           |
| `@bfra.me/es/async`      | Async utilities (retry, timeout, debounce) |
| `@bfra.me/es/module`     | ES module interoperability                 |
| `@bfra.me/es/types`      | Branded types and type guards              |
| `@bfra.me/es/validation` | Path validation and sanitization           |
| `@bfra.me/es/error`      | Structured error utilities                 |
| `@bfra.me/es/env`        | Environment detection                      |
| `@bfra.me/es/watcher`    | File watcher abstraction                   |

## API Reference

### Result Type (`@bfra.me/es/result`)

A discriminated union type for error handling without exceptions. Inspired by Rust's `Result` type.

```typescript
import type {Err, Ok, Result} from '@bfra.me/es/result'
import {err, flatMap, isErr, isOk, map, ok, unwrap, unwrapOr} from '@bfra.me/es/result'
```

#### Creating Results

```typescript
// Create success result
const success = ok(42)              // Ok<number>

// Create error result
const failure = err(new Error('failed'))  // Err<Error>
```

#### Type Guards for Results

```typescript
const result = divide(10, 2)

if (isOk(result)) {
  // TypeScript knows result.data is available
  console.log(result.data)
}

if (isErr(result)) {
  // TypeScript knows result.error is available
  console.error(result.error)
}
```

#### Transforming Results

```typescript
// map: Transform success values
const doubled = map(ok(5), x => x * 2)  // Ok(10)
const mapped = map(err('fail'), x => x * 2)  // Err('fail') - unchanged

// flatMap: Chain operations that return Results
const parsed = flatMap(ok('42'), str => {
  const num = Number.parseInt(str, 10)
  return Number.isNaN(num) ? err('Invalid number') : ok(num)
})

// mapErr: Transform error values
const withContext = mapErr(err('not found'), e => new Error(`Resource ${e}`))
```

#### Extracting Values

```typescript
// unwrap: Get value or throw (use sparingly)
const value = unwrap(ok(42))  // 42
const willThrow = unwrap(err('fail'))  // throws Error

// unwrapOr: Get value or default (preferred)
const withDefault = unwrapOr(err('fail'), 0)  // 0
```

#### Wrapping Throwing Code

```typescript
import {fromPromise, fromThrowable} from '@bfra.me/es/result'

// Wrap synchronous throwing functions
const parsed = fromThrowable(() => JSON.parse(input))

// Wrap promises
const fetched = await fromPromise(fetch('/api/data'))
```

### Functional Utilities (`@bfra.me/es/functional`)

```typescript
import {compose, constant, curry, flip, identity, memoize, noop, partial, pipe, tap} from '@bfra.me/es/functional'
```

#### pipe

Composes functions left-to-right. Each function receives the result of the previous.

```typescript
const addOne = (x: number) => x + 1
const double = (x: number) => x * 2
const toString = (x: number) => `Value: ${x}`

const transform = pipe(addOne, double, toString)
transform(5)  // "Value: 12" (5 + 1 = 6, 6 * 2 = 12)
```

#### compose

Composes functions right-to-left (mathematical composition order).

```typescript
const addOneThenDouble = compose(double, addOne)
addOneThenDouble(5)  // 12 (addOne first, then double)
```

#### curry

Transforms a function to accept arguments one at a time.

```typescript
const add = (a: number, b: number, c: number) => a + b + c
const curriedAdd = curry(add)

curriedAdd(1)(2)(3)     // 6
curriedAdd(1, 2)(3)     // 6
curriedAdd(1)(2, 3)     // 6
curriedAdd(1, 2, 3)     // 6
```

#### memoize

Caches function results based on arguments. Supports multiple cache strategies.

```typescript
import {memoize} from '@bfra.me/es/functional'

// Simple memoization
const expensive = memoize((n: number) => {
  // Complex calculation...
  return n * 2
})

// With LRU cache (evicts least recently used)
const withLRU = memoize(fn, {
  strategy: 'lru',
  maxSize: 100
})

// With TTL (time-to-live expiration)
const withTTL = memoize(fn, {
  strategy: 'ttl',
  ttl: 60000  // 1 minute
})

// Cache statistics
console.log(expensive.getStats())  // { hits: 10, misses: 5, size: 5 }
expensive.clear()  // Clear all cached values
```

#### Other Utilities

```typescript
// identity: Returns its argument unchanged
const x = identity(42)  // 42

// tap: Execute side effect, return original value
const logged = pipe(
  addOne,
  tap(x => console.log('After addOne:', x)),
  double
)

// partial: Pre-fill some arguments
const greet = (greeting: string, name: string) => `${greeting}, ${name}!`
const sayHello = partial(greet, 'Hello')
sayHello('World')  // "Hello, World!"

// flip: Swap first two arguments
const divide = (a: number, b: number) => a / b
const flipped = flip(divide)
flipped(2, 10)  // 5 (same as divide(10, 2))

// constant: Create function that always returns same value
const alwaysTrue = constant(true)
alwaysTrue()  // true

// noop: Do nothing function
element.addEventListener('click', noop)
```

### Async Utilities (`@bfra.me/es/async`)

```typescript
import {debounce, pAll, pLimit, retry, sleep, throttle, timeout} from '@bfra.me/es/async'
```

#### retry

Retries a function with exponential backoff.

```typescript
const result = await retry(
  () => fetch('/api/data'),
  {
    maxAttempts: 3,      // Default: 3
    initialDelay: 100,   // Default: 100ms
    maxDelay: 10000,     // Default: 10000ms
    backoffFactor: 2,    // Default: 2
    shouldRetry: (error, attempt) => {
      // Custom retry logic
      return error.message !== 'Not Found'
    }
  }
)

if (isOk(result)) {
  console.log(result.data)
} else {
  console.error('All retries failed:', result.error)
}
```

#### timeout

Wraps a promise with a timeout.

```typescript
const result = await timeout(fetch('/api/slow'), 5000)

if (isErr(result) && result.error instanceof TimeoutError) {
  console.log('Request timed out')
}
```

#### debounce

Creates a debounced function that delays invocation.

```typescript
const saveInput = debounce((value: string) => {
  localStorage.setItem('draft', value)
}, 300)

input.addEventListener('input', e => saveInput(e.target.value))

// Cancel pending invocation
saveInput.cancel()
```

#### throttle

Limits function invocation frequency.

```typescript
const handleScroll = throttle(() => {
  updateScrollPosition()
}, 100)

window.addEventListener('scroll', handleScroll)
```

#### Concurrency Control

```typescript
// pLimit: Create a concurrency limiter
const limit = pLimit(5)  // Max 5 concurrent operations

const results = await Promise.all(
  urls.map(url => limit(() => fetch(url)))
)

// pAll: Run promises with concurrency control
const allResults = await pAll(
  urls.map(url => () => fetch(url)),
  {concurrency: 5}
)
```

### Module Interop (`@bfra.me/es/module`)

```typescript
import {dynamicImport, interopDefault, isESModule, isPackageInScope, resolveModule} from '@bfra.me/es/module'
```

#### interopDefault

Unwraps default exports from both ES and CommonJS modules.

```typescript
// Handles both ESM and CJS exports
const lodash = await interopDefault(import('lodash'))

// Works with dynamic imports
const config = await interopDefault(import('./config.js'))
```

#### resolveModule

Safely resolves and imports a module with Result return type.

```typescript
const result = await resolveModule<typeof import('lodash')>('lodash')

if (isOk(result)) {
  const _ = result.data
}
```

#### isPackageInScope

Checks if a package is available from a specific directory context.

```typescript
if (isPackageInScope('typescript', {scopeUrl: import.meta.url})) {
  // TypeScript is available
}
```

### Type Utilities (`@bfra.me/es/types`)

```typescript
import type {Brand, NonEmptyString, Opaque, PositiveInteger} from '@bfra.me/es/types'
import {assertType, brand, hasProperty, isArray, isNonNullable, isNumber, isObject, isString, unbrand} from '@bfra.me/es/types'
```

#### Branded Types

Create nominal types in TypeScript's structural type system.

```typescript
type UserId = Brand<string, 'UserId'>
type OrderId = Brand<string, 'OrderId'>

function getUser(id: UserId): User { /* ... */ }
function getOrder(id: OrderId): Order { /* ... */ }

const userId = brand<string, 'UserId'>('user-123')
const orderId = brand<string, 'OrderId'>('order-456')

getUser(userId)   // ✅ OK
getUser(orderId)  // ❌ Type error - can't use OrderId as UserId
```

#### Type Guards

```typescript
function processValue(value: unknown) {
  if (isString(value)) {
    // value is string
    return value.toUpperCase()
  }

  if (isNumber(value)) {
    // value is number (excludes NaN)
    return value * 2
  }

  if (isObject(value)) {
    // value is Record<string, unknown> (excludes null and arrays)
    return Object.keys(value)
  }

  if (isArray(value)) {
    // value is unknown[]
    return value.length
  }
}

// Check for property existence
if (hasProperty(obj, 'name')) {
  // obj is Record<'name', unknown>
  console.log(obj.name)
}

// Filter nullish values
const values = [1, null, 2, undefined, 3].filter(isNonNullable)  // [1, 2, 3]
```

#### Type Assertions

```typescript
// Assert and narrow type
assertType(value, isString)  // throws if not string
// value is now string

// Use with custom guards
const isUser = (v: unknown): v is User =>
  isObject(v) && hasProperty(v, 'name') && hasProperty(v, 'email')

assertType(data, isUser)
// data is now User
```

### Validation (`@bfra.me/es/validation`)

```typescript
import {createValidator, isWithinBoundary, sanitizeInput, validatePath} from '@bfra.me/es/validation'
```

#### Path Validation

Validates paths against traversal attacks.

```typescript
const result = validatePath('../etc/passwd')
if (isErr(result)) {
  console.log(result.error.code)  // 'PATH_TRAVERSAL'
}

const valid = validatePath('src/index.ts')
if (isOk(valid)) {
  // valid.data is ValidPath branded type
}

// Check if path is within boundary
if (isWithinBoundary('/app/uploads/file.txt', '/app/uploads')) {
  // Safe to access
}
```

#### Input Sanitization

```typescript
const userInput = '<script>alert("xss")</script>'
const safe = sanitizeInput(userInput)
// "&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;"

// With options
const cleaned = sanitizeInput(input, {
  escapeHtml: true,      // Default: true
  removeNullBytes: true, // Default: true
  trim: true             // Default: true
})
```

### Error Utilities (`@bfra.me/es/error`)

```typescript
import {BaseError, createError, formatError, NotFoundError, PermissionError, TimeoutError, ValidationError, withErrorContext} from '@bfra.me/es/error'
```

#### Structured Errors

```typescript
// Create custom errors with code and context
const error = createError('User not found', {
  code: 'USER_NOT_FOUND',
  cause: originalError,
  context: {userId: 123}
})

// Use specialized error types
throw new ValidationError('Invalid email format', {
  field: 'email',
  value: 'not-an-email'
})

throw new NotFoundError('Resource not found', {
  resourceType: 'User',
  resourceId: '123'
})
```

#### Error Formatting

```typescript
try {
  riskyOperation()
} catch (error) {
  // Format any error to string with cause chain
  console.log(formatError(error))
}
```

### Environment Detection (`@bfra.me/es/env`)

```typescript
import {getEnvironment, isBrowser, isDeno, isInCI, isInEditorEnv, isInGitLifecycle, isNode} from '@bfra.me/es/env'
```

```typescript
if (isInCI()) {
  // Running in CI (GitHub Actions, Jenkins, etc.)
}

if (isInEditorEnv()) {
  // Running in VS Code, JetBrains, Vim, or Neovim
}

if (isInGitLifecycle()) {
  // Running during git hook (commit, push, etc.)
}

// Runtime detection
if (isNode()) { /* Node.js */ }
if (isBrowser()) { /* Browser */ }
if (isDeno()) { /* Deno */ }

// Get comprehensive environment info
const env = getEnvironment()
// { runtime: 'node', isCI: false, isEditor: true, ... }
```

### File Watcher (`@bfra.me/es/watcher`)

> **Note:** Requires `chokidar` as a peer dependency.

```typescript
import {createChangeDetector, createDebouncer, createFileHasher, createFileWatcher} from '@bfra.me/es/watcher'
```

#### Basic File Watching

```typescript
const watcher = createFileWatcher(['src/**/*.ts', 'test/**/*.ts'], {
  debounceMs: 100,
  ignored: ['**/node_modules/**'],
  usePolling: false
})

watcher.on('change', event => {
  console.log('Changes detected:', event.changes)
  // event.changes: Array<{path: string, type: 'add' | 'change' | 'unlink', timestamp: number}>
})

await watcher.start()

// Later: clean up
await watcher.close()
```

#### Change Detection with Hashing

```typescript
const hasher = createFileHasher('sha256')
const detector = createChangeDetector()

// Hash file content
const hash = await hasher.hashFile('/path/to/file.ts')

// Detect changes
const {changed, added, removed} = await detector.detectChanges({
  'src/index.ts': 'abc123...',  // Previous hashes
})
```

## TypeScript Configuration

This package requires TypeScript 5.0+ and works best with strict mode:

```json
{
  "compilerOptions": {
    "strict": true,
    "exactOptionalPropertyTypes": true,
    "moduleResolution": "bundler"
  }
}
```

## Bundle Size

- Core utilities (excluding watcher): < 5KB minified
- Full package with watcher: < 10KB minified
- Tree-shaking supported via subpath exports

## Requirements

- Node.js 20+
- TypeScript 5.0+ (for development)
- ES2022+ compatible runtime

## Related Packages

- [`@bfra.me/eslint-config`](../eslint-config) - ESLint configuration using these utilities
- [`@bfra.me/tsconfig`](../tsconfig) - TypeScript configuration

## License

MIT © [Marcus R. Brown](https://github.com/marcusrbrown)
