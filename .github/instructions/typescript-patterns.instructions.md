---
description: 'APPLY when WRITING TypeScript to MAINTAIN code quality standards'
applyTo: '**/*.ts,**/*.tsx'
---

# TypeScript Patterns

Guidelines for writing efficient, maintainable TypeScript code in the bfra.me/works ecosystem

## TypeScript Best Practices

This monorepo follows specific TypeScript patterns for consistency and maintainability.

### Project Configuration

- Always extend the shared configuration from [@bfra.me/tsconfig](../../packages/tsconfig):

  ```jsonc
  {
    "extends": "@bfra.me/tsconfig",
    "compilerOptions": {
      // Project-specific overrides only
    }
  }
  ```

- Use ES modules with `"type": "module"` in package.json
- Configure proper exports in package.json:
  ```json
  {
    "exports": {
      ".": {
        "import": "./lib/index.js",
        "types": "./lib/index.d.ts"
      }
    }
  }
  ```

### Type Definitions

#### Modern Type Declarations

```typescript
// Use const assertions for literal object types
const config = {
  environment: 'production',
  features: ['auth', 'api'] as const,
  version: 1
} as const
// Type is { readonly environment: "production"; readonly features: readonly ["auth", "api"]; readonly version: 1 }

// Use type utilities for derived types
type ConfigKeys = keyof typeof config // 'environment' | 'features' | 'version'
type Features = typeof config.features[number] // 'auth' | 'api'
```

#### Prefer Interfaces for Public APIs

```typescript
// Good: Use interfaces for public API contracts
export interface ConfigOptions {
  name: string
  typescript?: boolean | TypescriptOptions
  prettier?: boolean
}

// Avoid: Simple type aliases for public APIs
export type ConfigOptions = {
  name: string
  typescript?: boolean | TypescriptOptions
  prettier?: boolean
};
```

#### Use Type Aliases for Unions, Intersections, Utility Types

```typescript
// Good: Type aliases for complex types
export type ConfigValue = boolean | string | number | ConfigObject
export type StrictConfig = BaseConfig & StrictOptions
export type PackageName = `@bfra.me/${string}`

// Template literal types for stronger typing
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
type Endpoint = `/api/v1/${string}`
type Route = `${HttpMethod} ${Endpoint}`
// Examples: 'GET /api/v1/users', 'POST /api/v1/auth/login'
```

#### Use Discriminated Unions for Complex Types

```typescript
// Good: Clear discriminated unions
type Success<T> = {
  status: 'success'
  data: T
};

type Failure = {
  status: 'error'
  error: Error
  code?: number
};

type Result<T> = Success<T> | Failure

// Usage with type narrowing
function handleResult<T>(result: Result<T>): void {
  if (result.status === 'success') {
    // TypeScript knows result is Success<T>
    console.log(result.data)
  } else {
    // TypeScript knows result is Failure
    console.error(result.error.message, result.code)
  }
}
```

### Function Patterns

#### Use Function Overloads for Complex Signatures

```typescript
// Good: Clear function overloads
export function defineConfig(options: string): Config
export function defineConfig(options: ConfigOptions): Config
export function defineConfig(options: string | ConfigOptions): Config {
  // Implementation that handles both signatures
}
```

#### Prefer Named Parameters for Complex Functions

```typescript
// Good: Named parameters with defaults
function createPackage({
  name,
  version = '0.0.0',
  description = '',
  author = '',
  template = 'default'
}: PackageOptions): Promise<void> {
  // Implementation
}
```

#### Use Type Predicates for Custom Type Guards

```typescript
// Good: Type predicate for runtime type checking
function isConfigObject(value: unknown): value is ConfigObject {
  return typeof value === 'object' && value !== null && 'name' in value
}

// Modern pattern: Use assertion functions
function assertIsConfigObject(value: unknown): asserts value is ConfigObject {
  if (!(typeof value === 'object' && value !== null && 'name' in value)) {
    throw new Error('Value is not a ConfigObject')
  }
}

// Usage
function processConfig(input: unknown) {
  assertIsConfigObject(input)
  // TypeScript knows input is ConfigObject after the assertion
  console.log(input.name)
}
```

#### Use Generic Constraints

```typescript
// Constraints ensure type safety while remaining flexible
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key]
}

// With multiple constraints
interface HasId {
  id: string | number
}

interface Timestamped {
  createdAt: Date
}

function processEntity<T extends HasId & Timestamped>(entity: T): void {
  console.log(`Processing ${entity.id} created at ${entity.createdAt.toISOString()}`)
}
```

### Error Handling

#### Use Discriminated Union for Error Results

```typescript
type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E }

function safeOperation(): Result<string> {
  try {
    // Operation that might fail
    return { success: true, data: 'result' }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error))
    };
  }
}

// Using async with Result type
async function fetchData(url: string): Promise<Result<Record<string, unknown>>> {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      return {
        success: false,
        error: new Error(`HTTP error ${response.status}`)
      }
    }
    const data = await response.json()
    return { success: true, data }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error))
    }
  }
}
```

### Module Patterns

#### Use Barrel Files for Public APIs

```typescript
export * from './constants'
// index.ts - Barrel file
export {defineConfig} from './define-config'
// Use selective re-exports to control what's exposed
export {createPackage, installDependencies} from './package-utils'

export type {ConfigOptions} from './types'
// Don't export: import {internalFunction} from './package-utils'
```

#### Use Path Aliases for Internal Imports

```jsonc
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "#internal/*": ["./src/internal/*"],
      "#shared/*": ["./src/shared/*"]
    }
  }
}
```

```typescript
// Usage
import {internalUtil} from '#internal/utils'
import {sharedTypes} from '#shared/types'
```

### Modern TypeScript Features

#### Nullish Coalescing and Optional Chaining

```typescript
// Nullish coalescing for default values (handles null and undefined)
const count = options.count ?? 10

// Optional chaining for safe property access
const userName = user?.profile?.name

// Combining both
const commentCount = post?.comments?.length ?? 0
```

#### Typed Catch Clauses

```typescript
try {
  // Potentially throwing code
} catch (error: unknown) {
  // Properly type narrow the error
  if (error instanceof SyntaxError) {
    console.error('Syntax error:', error.message)
  } else if (error instanceof Error) {
    console.error('General error:', error.message)
  } else {
    console.error('Unknown error:', String(error))
  }
}
```

#### Type Satisfies Operator

```typescript
// Checks if a value matches a type but keeps its original more specific type
interface Options {
  width?: number
  height?: number
  color?: string
}

const options = {
  width: 100,
  height: 200,
  color: 'red',
  animationDuration: 250 // Extra property not in Options
} satisfies Options

// options.animationDuration is still accessible
console.log(options.animationDuration)
```

#### Indexed Access Types

```typescript
interface User {
  id: number
  name: string
  preferences: {
    theme: 'light' | 'dark'
    fontSize: number
  }
}

// Extract specific property types
type UserTheme = User['preferences']['theme'] // 'light' | 'dark'
type UserProperties = keyof User // 'id' | 'name' | 'preferences'
```

### Special Types to Use

- Use `Record<K, T>` for objects with dynamic keys
- Use `Partial<T>` for objects with optional properties
- Use `Required<T>` to make all properties required
- Use `Pick<T, K>` and `Omit<T, K>` to create subset types
- Use `Readonly<T>` for immutable data structures
- Use `NonNullable<T>` to remove null and undefined
- Use `Parameters<T>` and `ReturnType<T>` for function types
- Use `Awaited<T>` for unwrapping Promise types

### Performance Patterns

#### Use `const` Assertions for Literal Values

```typescript
// Better performance and stronger typing
const PERMISSIONS = ['read', 'write', 'admin'] as const
type Permission = typeof PERMISSIONS[number] // 'read' | 'write' | 'admin'

// Object literals
const API_ENDPOINTS = {
  users: '/api/users',
  auth: '/api/auth',
  posts: '/api/posts'
} as const
```

#### Type-Only Imports

```typescript
// Only import types, no runtime code
import type {PostInterface, UserInterface} from './types'

// Mix of value and type imports
import {User, type Comment, type Post} from './models'
```

### Monorepo-Specific Patterns

- Use `workspace:*` for internal package dependencies
- Export all types needed by consumers
- Don't expose internal implementation details
- Follow consistent naming conventions
- Use import maps for cleaner imports across packages

## Example User Interactions

### Structuring a New TypeScript Package

**User**: How should I structure a new TypeScript package in this repo?

**Assistant**: To structure a new TypeScript package in this monorepo:

1. First, create your package directory and initial files:

```bash
mkdir -p packages/your-package-name/{src,test}
touch packages/your-package-name/{package.json,tsconfig.json}
touch packages/your-package-name/src/index.ts
```

2. Configure package.json with proper TypeScript settings:

```json
{
  "name": "@bfra.me/your-package-name",
  "version": "0.0.0-development",
  "type": "module",
  "exports": {
    ".": {
      "import": "./lib/index.js",
      "types": "./lib/index.d.ts"
    }
  },
  "files": ["lib"],
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "test": "vitest run",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {},
  "devDependencies": {
    "@bfra.me/eslint-config": "workspace:*",
    "@bfra.me/tsconfig": "workspace:*",
    "tsup": "^8.0.0",
    "typescript": "^5.0.0",
    "vitest": "^1.0.0"
  }
}
```

3. Set up tsconfig.json extending the shared config:

```json
{
  "extends": "@bfra.me/tsconfig",
  "compilerOptions": {
    "outDir": "lib",
    "rootDir": "src"
  },
  "include": ["src"],
  "exclude": ["node_modules", "lib", "test"]
}
```

4. Start building your package in the `src/` directory, exporting public APIs from `src/index.ts`.

### Using Function Overloads

**User**: When should I use function overloads in TypeScript?

**Assistant**: Use function overloads when you have a function that can be called with different argument types or counts, and you want to provide more specific type information for each call signature.

**Good Use Case:** A function that accepts either a configuration object or a path string:

```typescript
// Overloads define the specific call signatures
function loadConfig(path: string): Config
function loadConfig(options: LoadOptions): Config

// Implementation handles the combined types
function loadConfig(input: string | LoadOptions): Config {
  if (typeof input === 'string') {
    // Handle path string
  } else {
    // Handle options object
  }
  // ... load and return config
}
```

This provides better type checking and IntelliSense for callers compared to just using a union type (`input: string | LoadOptions`) in a single signature.

**Avoid Overuse:** Don't use overloads if simple optional parameters or union types suffice. Overloads add complexity to the implementation signature.

### Handling Success and Error Results

**User**: How can I represent a result that can be either success with data or failure with an error?

**Assistant**: The recommended pattern is to use a **discriminated union** type. This provides excellent type safety and makes handling the result straightforward.

```typescript
type SuccessResult<T> = {
  success: true
  data: T
};

type ErrorResult = {
  success: false
  error: Error
};

// The discriminated union type
export type OperationResult<T> = SuccessResult<T> | ErrorResult

// Example usage:
function performAction(): OperationResult<string> {
  try {
    const data = runPotentiallyFailingCode()
    return { success: true, data }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error)),
    }
  }
}

// Consuming the result:
const result = performAction()
if (result.success) {
  // TypeScript knows result is SuccessResult<string> here
  console.log("Success! Data:", result.data)
} else {
  // TypeScript knows result is ErrorResult here
  console.error("Failed:", result.error.message)
}
```

The `success` property acts as the discriminant, allowing TypeScript to narrow the type correctly within conditional blocks.
