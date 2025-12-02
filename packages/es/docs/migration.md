# Migration Guide

This guide helps you migrate from inline utility implementations to `@bfra.me/es`.

## Why Migrate?

Moving to `@bfra.me/es` provides:

- **Type Safety**: Full TypeScript support with strict type inference
- **Consistent Patterns**: Standardized APIs across your codebase
- **Tested & Maintained**: Comprehensive test coverage and ongoing maintenance
- **Tree-Shakable**: Only import what you need via subpath exports

## Installation

```bash
pnpm add @bfra.me/es
```

For file watcher functionality, also install the optional peer dependency:

```bash
pnpm add chokidar
```

## Migration Patterns

### Result Type (Error Handling)

**Before: Try-Catch with Mixed Returns**

```typescript
function parseConfig(input: string): Config | null {
  try {
    return JSON.parse(input)
  } catch {
    return null
  }
}

const config = parseConfig(data)
if (config === null) {
  // Handle error, but we lost error context
}
```

**After: Result Type**

```typescript
import {err, isOk, ok, type Result} from '@bfra.me/es/result'

function parseConfig(input: string): Result<Config, Error> {
  try {
    return ok(JSON.parse(input))
  } catch (error) {
    return err(error instanceof Error ? error : new Error(String(error)))
  }
}

const result = parseConfig(data)
if (isOk(result)) {
  const config = result.data
} else {
  console.error(result.error.message) // Full error context preserved
}
```

### Functional Utilities

**Before: Inline Pipe Function**

```javascript
const pipe =
  (...fns) =>
  (x) =>
    fns.reduce((v, f) => f(v), x)

const result = pipe(addOne, double, toString)(5)
```

**After: Type-Safe Pipe**

```typescript
import {pipe} from '@bfra.me/es/functional'

// Full type inference through the chain
const result = pipe(5, addOne, double, toString) // string
```

**Before: Manual Memoization**

```typescript
const cache = new Map()
function memoizedFn(arg: string) {
  if (cache.has(arg)) return cache.get(arg)
  const result = expensiveComputation(arg)
  cache.set(arg, result)
  return result
}
```

**After: Memoize Utility**

```typescript
import {memoize} from '@bfra.me/es/functional'

const memoizedFn = memoize(expensiveComputation)

// With options for cache strategy
const memoizedWithTTL = memoize(expensiveComputation, {
  strategy: 'ttl',
  ttl: 60000,
})
```

### Async Utilities

**Before: Manual Retry Logic**

```typescript
async function fetchWithRetry(url: string, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fetch(url)
    } catch (error) {
      if (i === retries - 1) throw error
      await new Promise(r => setTimeout(r, 1000 * 2**i))
    }
  }
  throw new Error('Unreachable')
}
```

**After: Retry Utility**

```typescript
import {retry} from '@bfra.me/es/async'

const response = await retry(() => fetch(url), {
  maxAttempts: 3,
  initialDelay: 1000,
  backoffFactor: 2,
})
```

**Before: Manual Debounce**

```typescript
function debounce<T extends (...args: any[]) => any>(fn: T, ms: number) {
  let timeoutId: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), ms)
  }
}
```

**After: Type-Safe Debounce**

```typescript
import {debounce} from '@bfra.me/es/async'

const debouncedSearch = debounce(searchApi, 300)
debouncedSearch('query') // Returns Promise with result
```

**Before: Manual Concurrency Limiting**

```typescript
async function processInBatches<T>(items: T[], batchSize: number, fn: (item: T) => Promise<void>) {
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    await Promise.all(batch.map(fn))
  }
}
```

**After: pLimit Utility**

```typescript
import {pAll, pLimit} from '@bfra.me/es/async'

const limit = pLimit(5)
const results = await pAll(items.map(item => () => limit(() => processItem(item))))
```

### Type Guards

**Before: Inline Type Checks**

```typescript
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function hasProperty<K extends string>(obj: unknown, key: K): obj is Record<K, unknown> {
  return typeof obj === 'object' && obj !== null && key in obj
}
```

**After: Standard Type Guards**

```typescript
import {hasProperty, isNonNullable, isObject} from '@bfra.me/es/types'

if (isObject(value) && hasProperty(value, 'id')) {
  console.log(value.id) // Type-safe access
}
```

### Branded Types

**Before: Manual Type Branding**

```typescript
type UserId = string & {readonly __brand: 'UserId'}

function createUserId(id: string): UserId {
  if (!id.startsWith('user_')) throw new Error('Invalid user ID')
  return id as UserId
}
```

**After: Brand Utility**

```typescript
import {brand, type Brand} from '@bfra.me/es/types'

type UserId = Brand<string, 'UserId'>

function createUserId(id: string): UserId {
  if (!id.startsWith('user_')) throw new Error('Invalid user ID')
  return brand<string, 'UserId'>(id)
}
```

### Error Handling

**Before: Manual Error Classes**

```javascript
class ValidationError extends Error {
  constructor(message, field) {
    super(message)
    this.name = 'ValidationError'
    this.field = field
  }
}
```

**After: Error Factory**

```typescript
import {createError, ValidationError} from '@bfra.me/es/error'

throw new ValidationError('Invalid email', {field: 'email'})

// Or with custom errors
const error = createError('Operation failed', {
  code: 'OP_FAILED',
  context: {operation: 'save'},
})
```

### Environment Detection

**Before: Manual Environment Checks**

```typescript
const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true'
const isNode = typeof process !== 'undefined' && process.versions?.node
```

**After: Environment Utilities**

```typescript
import {getEnvironment, isInCI, isNode} from '@bfra.me/es/env'

if (isInCI()) {
  // Running in CI environment
}

const env = getEnvironment()
// { isNode: true, isBrowser: false, isDeno: false }
```

## Import Patterns

### Recommended: Subpath Imports

```typescript
import {debounce, retry} from '@bfra.me/es/async'
import {compose, pipe} from '@bfra.me/es/functional'
// Import specific functionality
import {err, isOk, ok} from '@bfra.me/es/result'
```

### Available Subpaths

| Subpath                  | Description              |
| ------------------------ | ------------------------ |
| `@bfra.me/es/result`     | Result type utilities    |
| `@bfra.me/es/functional` | Functional programming   |
| `@bfra.me/es/async`      | Async utilities          |
| `@bfra.me/es/types`      | Type guards and branding |
| `@bfra.me/es/validation` | Validation utilities     |
| `@bfra.me/es/error`      | Error utilities          |
| `@bfra.me/es/env`        | Environment detection    |
| `@bfra.me/es/module`     | Module interop           |
| `@bfra.me/es/watcher`    | File watcher (optional)  |

## Gradual Migration Strategy

1. **Start with New Code**: Use `@bfra.me/es` for new features
2. **Replace High-Impact Utilities**: Migrate frequently-used patterns first
3. **Update Error Handling**: Move to Result type for better error propagation
4. **Consolidate Type Guards**: Replace inline type checks with standard utilities
5. **Remove Inline Implementations**: Delete replaced utility functions

## Breaking Changes to Watch For

### Result Type vs Exceptions

The Result type requires explicit handling instead of try-catch:

```typescript
// Old pattern - implicit exception handling
try {
  const data = await fetchData()
  process(data)
} catch (error) {
  handleError(error)
}

// New pattern - explicit Result handling
const result = await fetchDataResult()
if (isOk(result)) {
  process(result.data)
} else {
  handleError(result.error)
}
```

### Pipe Argument Order

The `pipe` function takes the initial value as the first argument:

```typescript
// Before (function composition)
const fn = pipe(f1, f2, f3)
fn(value)

// After (value-first)
const result = pipe(value, f1, f2, f3)
```

### Async Function Return Types

Async utilities return properly typed Promises:

```typescript
// Before: any or unknown return type
const debouncedFn: (...args: any[]) => void

// After: Proper return type inference
const debouncedFn: (query: string) => Promise<SearchResult[]>
```

## Need Help?

- See the [API Reference](./api.md) for complete documentation
- Check the [README](../README.md) for quick start examples
- File issues at [github.com/bfra-me/works](https://github.com/bfra-me/works/issues)
