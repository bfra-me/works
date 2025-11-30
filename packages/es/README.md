# @bfra.me/es

High-quality reusable types and utilities for ES development (JavaScript and TypeScript).

## Installation

```bash
pnpm add @bfra.me/es
```

## Features

This package provides a comprehensive set of utilities organized into subpath exports for tree-shaking:

### Result Type (`@bfra.me/es/result`)

A discriminated union type for error handling without exceptions:

```typescript
import type {Result} from '@bfra.me/es/result'
import {err, isOk, map, ok, unwrapOr} from '@bfra.me/es/result'

function divide(a: number, b: number): Result<number, Error> {
  if (b === 0) {
    return err(new Error('Division by zero'))
  }
  return ok(a / b)
}

const result = divide(10, 2)
if (isOk(result)) {
  console.log(result.data) // 5
}

// Or use unwrapOr for a default value
const value = unwrapOr(divide(10, 0), 0) // 0
```

### Functional Utilities (`@bfra.me/es/functional`)

Functional programming utilities with full TypeScript type inference:

```typescript
import {compose, curry, identity, pipe, tap} from '@bfra.me/es/functional'

const addOne = (x: number) => x + 1
const double = (x: number) => x * 2

const transform = pipe(addOne, double)
transform(5) // 12

const curriedAdd = curry((a: number, b: number, c: number) => a + b + c)
curriedAdd(1)(2)(3) // 6
```

### Module Interop (`@bfra.me/es/module`)

ES module interoperability utilities:

```typescript
import {interopDefault, resolveModule} from '@bfra.me/es/module'

const module = await interopDefault(import('some-module'))
```

### Async Utilities (`@bfra.me/es/async`)

Async utilities with proper TypeScript typing:

```typescript
import {debounce, retry, sleep, throttle, timeout} from '@bfra.me/es/async'

const result = await retry(fetchData, {maxAttempts: 3, initialDelay: 100})

const debouncedFn = debounce(saveData, 300)
```

### Environment Detection (`@bfra.me/es/env`)

Environment detection utilities:

```typescript
import {isInCI, isInEditorEnv, isInGitLifecycle} from '@bfra.me/es/env'

if (isInCI()) {
  // Running in CI environment
}
```

### Type Utilities (`@bfra.me/es/types`)

Branded types and type guards:

```typescript
import type {Brand} from '@bfra.me/es/types'
import {brand, hasProperty, isNumber, isString} from '@bfra.me/es/types'

type UserId = Brand<string, 'UserId'>
const userId = brand<string, 'UserId'>('user-123')
```

### Validation (`@bfra.me/es/validation`)

Validation utilities for common patterns:

```typescript
import {isEmail, sanitizeInput, validatePath} from '@bfra.me/es/validation'

const result = validatePath('../etc/passwd') // Err: Path traversal detected
const safe = sanitizeInput('<script>alert("xss")</script>')
```

### Error Utilities (`@bfra.me/es/error`)

Standardized error creation:

```typescript
import {BaseError, createError, ValidationError} from '@bfra.me/es/error'

throw new ValidationError('Invalid email', {field: 'email'})
```

### File Watcher (`@bfra.me/es/watcher`)

File watcher abstraction (requires `chokidar` peer dependency):

```typescript
import {createFileWatcher} from '@bfra.me/es/watcher'

const watcher = createFileWatcher(['src/**/*.ts'], {debounceMs: 100})
watcher.on('change', event => {
  console.log('Files changed:', event.changes)
})
await watcher.start()
```

## License

MIT
