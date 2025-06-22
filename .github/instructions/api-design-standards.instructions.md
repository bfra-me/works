---
description: FOLLOW when DESIGNING APIs to ENSURE consistency and type safety
applyTo: '**/*.ts,**/*.tsx,**/package.json'
---

# API Design Standards

This guide outlines the standards for designing consistent, type-safe, and well-documented APIs across all packages in the bfra.me/works ecosystem.

## API Design Principles

All public APIs in bfra.me/works should adhere to these core principles:

1. **Consistency**: APIs should follow consistent patterns across packages
2. **Type Safety**: All public APIs must be fully typed with TypeScript
3. **Documentation**: Public interfaces must be documented with TSDoc comments
4. **Backward Compatibility**: Breaking changes must follow proper versioning
5. **Progressive Disclosure**: Simple tasks should be simple, complex tasks possible

## Public API Boundaries

### Export Structure

Every package should clearly define its public API through explicit exports:

```typescript
export * from './constants'
// ✅ Good: Clear and explicit exports
// src/index.ts
export {createConfig} from './create-config'
// ❌ Bad: Exporting internal implementation details
export * from './internal'

export type {ConfigOptions} from './types'
export * from './utils'
```

### Package.json Export Field

Use the exports field in package.json to strictly control what consumers can import:

```json
{
  "exports": {
    ".": {
      "import": "./lib/index.js",
      "types": "./lib/index.d.ts"
    },
    "./config": {
      "import": "./lib/config/index.js",
      "types": "./lib/config/index.d.ts"
    }
  }
}
```

## Type Safety Standards

### Interface vs Type Aliases

For public APIs:

```typescript
// ✅ Good: Interfaces for public API contracts
export interface ConfigOptions {
  name: string
  typescript?: boolean | TypescriptOptions
  prettier?: boolean
}

// ✅ Good: Type aliases for complex types, unions, and utility types
export type ConfigValue = boolean | string | number | Record<string, unknown>
export type PackageName = `@bfra.me/${string}`
```

### Use Discriminated Unions for Result Types

```typescript
// ✅ Good: Clear discriminated unions for results
export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E }

// Usage
function processData(): Result<Data> {
  try {
    // ...
    return { success: true, data }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error))
    }
  }
}
```

### Generics for Flexibility

```typescript
// ✅ Good: Constrained generics for type safety with flexibility
export function createEntity<T extends Record<string, unknown>>(data: T): Entity<T> {
  // Implementation
}
```

## Naming Conventions

### Function Names

- Use verb-noun pairs: `createConfig`, `validateInput`, `transformData`
- Be specific and clear: `generateTypescriptConfig` vs `makeConfig`
- Use consistent verbs across packages:

| Action                | Verb to Use | Example               |
| --------------------- | ----------- | --------------------- |
| Create a new instance | `create`    | `createConfig()`      |
| Validate data         | `validate`  | `validateOptions()`   |
| Transform data        | `transform` | `transformTsConfig()` |
| Format output         | `format`    | `formatCode()`        |
| Parse input           | `parse`     | `parseConfigFile()`   |

### Type and Interface Names

- Use PascalCase: `ConfigOptions`, `PackageManager`
- Use descriptive, clear names: `CompilerOptions` vs `Options`
- Add suffixes for special types:

| Type Category         | Suffix                | Example                |
| --------------------- | --------------------- | ---------------------- |
| Configuration objects | `Options`, `Config`   | `LintOptions`          |
| Function options      | `Options`             | `CreatePackageOptions` |
| Function results      | `Result`              | `ValidationResult`     |
| Callbacks             | `Callback`, `Handler` | `ErrorHandler`         |
| React components      | `Props`               | `ButtonProps`          |

## Documentation Standards

All public APIs must include TSDoc comments:

````typescript
/**
  * Creates a new configuration with standardized settings.
  *
  * @param options - The configuration options
  * @param options.name - The name of the configuration
  * @param options.typescript - Whether to include TypeScript configuration
  * @param options.prettier - Whether to include Prettier configuration
  * @returns The created configuration object
  *
  * @example
  * ```ts
  * const config = createConfig({
  *   name: 'my-project',
  *   typescript: true,
  *   prettier: true
  * });
  * ```
  */
export function createConfig(options: ConfigOptions): Config {
  // Implementation
}
````

### Required Documentation Elements

1. **Description**: Clear explanation of purpose
2. **Parameters**: All parameters with types and descriptions
3. **Return Value**: Type and description
4. **Examples**: At least one usage example
5. **Exceptions/Errors**: Document any errors that might be thrown

### Optional Documentation Elements

1. **See Also**: References to related APIs
2. **Deprecated**: Deprecation notice with migration path
3. **Since**: Version when the API was introduced
4. **Beta/Experimental**: Notice for non-stable APIs

## Deprecation Policy

When deprecating APIs:

1. Mark as deprecated with JSDoc/TSDoc:

```typescript
/**
  * @deprecated Use createConfig() instead. Will be removed in v3.0.0.
  */
export function makeConfig(options: ConfigOptions): Config {
  return createConfig(options)
}
```

2. Keep deprecated APIs working for at least one major version
3. Provide clear migration path in documentation
4. Export types for deprecated APIs for backward compatibility

## Versioning and Backward Compatibility

APIs follow Semantic Versioning:

- **MAJOR**: Breaking changes to the API (removing exports, changing parameter types)
- **MINOR**: New features in backward-compatible way (new exports, optional parameters)
- **PATCH**: Bug fixes that don't change the API

### Breaking Changes Checklist

- Removing a public export
- Changing parameter or return types
- Changing function behavior in incompatible ways
- Renaming exports without aliases
- Modifying object structure

### Backward Compatible Changes

- Adding new optional parameters
- Adding new exports
- Relaxing parameter types (more permissive)
- Adding new properties to interfaces where they won't conflict

## API Design Patterns

### Builder Pattern for Complex Options

```typescript
// ✅ Good: Builder pattern for complex configuration
const config = new ConfigBuilder()
  .withTypescript({strict: true})
  .withPrettier({semi: false})
  .withEslint({})
  .build()
```

### Factory Functions

```typescript
// ✅ Good: Factory function with defaults
export function createPackage(name: string, options?: Partial<PackageOptions>): Package {
  return {
    name,
    version: options?.version ?? '0.0.0',
    private: options?.private ?? false,
    // ...more properties
  };
}
```

### Fluent APIs for Chaining

```typescript
// ✅ Good: Fluent API for configuration
export class LintConfig {
  // ... properties and methods

  withRules(rules: Record<string, unknown>): this {
    this.rules = rules
    return this
  }

  withPlugins(plugins: string[]): this {
    this.plugins = plugins
    return this
  }
}
```

## Anti-Patterns to Avoid

### ❌ Avoid: Inconsistent Result Types

```typescript
// Bad: Inconsistent error handling
function validateA(input: string): boolean {
  // Returns true/false
}

function validateB(input: string): string | null {
  // Returns error message or null
}

function validateC(input: string): void {
  // Throws error on validation failure
}
```

### ❌ Avoid: Untyped Public APIs

```typescript
// Bad: Using any in public API
export function process(data: any): any {
  // Implementation
}
```

### ❌ Avoid: Mutable Parameters

```typescript
// Bad: Mutating input parameters
export function processConfig(config: Config): void {
  // Modifies config in-place
  config.processed = true
  config.options.strict = true
}
```

### ❌ Avoid: Excessive Use of Function Overloads

```typescript
// Bad: Too many overloads that could be simplified
export function createPackage(name: string): Package
export function createPackage(name: string, version: string): Package
export function createPackage(name: string, version: string, private: boolean): Package
export function createPackage(name: string, version: string, private: boolean, dependencies: Record<string, string>): Package
// ...and many more overloads
```

Instead, use optional parameters or option objects.

### ❌ Avoid: Exposing Internal Types

```typescript
// Bad: Exposing internal implementation details
export interface PackageManager {
  // Public properties
  name: string
  version: string

  // Internal implementation details that shouldn't be exposed
  _registry: Map<string, unknown>
  _processQueue: Queue<Task>
}
```

## Frequently Asked Questions

### Should I use an interface or a type alias for my public API options?

According to our API design standards:

- Use **`interface`** for defining the shape of objects that represent public API contracts, like function options or configuration objects. Interfaces are generally better for defining object shapes that might be extended.

  ```typescript
  export interface MyFunctionOptions {
    id: string
    enabled?: boolean
  }
  ```

- Use **`type`** aliases primarily for:
  - Complex types involving unions or intersections.
  - Utility types.
  - Naming primitive types or literals.
  ```typescript
  export type ResultStatus = 'success' | 'error' | 'pending'
  export type ProcessData = (input: string) => number
  ```

So, for your public API options object, `interface` is the preferred choice.

### How should I name a function that validates configuration settings?

Based on our API naming conventions, you should use a clear verb-noun pair.

For a function that validates configuration settings, the recommended pattern is:

- **Verb**: `validate`
- **Noun**: `Config` or `Options`

Therefore, good names would be:

- `validateConfig(config)`
- `validateOptions(options)`

Avoid vague names like `checkConfig` or `processSettings`. Use the standard verb `validate` for consistency.

### I need to make a breaking change to the `createConfig` function signature. What's the process?

Making a breaking change requires careful handling according to our versioning and deprecation policies:

1.  **Versioning**: This change requires a **MAJOR** version bump for the package (e.g., v1.x.x -> v2.0.0) because it breaks backward compatibility.
2.  **Deprecation (Recommended)**: Instead of immediately changing `createConfig`, consider:

    - Marking the old `createConfig` as `@deprecated` in TSDoc, pointing users to a new function (e.g., `createConfigV2`).
    - Keep the old `createConfig` functional (perhaps calling the new one internally) for at least one major version cycle to give users time to migrate.
    - Provide a clear migration path in the documentation.

    ```typescript
    /**
      * @deprecated Use createConfigV2() instead. This signature will be removed in v3.0.0.
      */
    export function createConfig(oldOptions: OldOptions): Config { /*...*/ }

    export function createConfigV2(newOptions: NewOptions): Config { /*...*/ }
    ```

3.  **Changeset**: When you commit the change (or the deprecation + new function), create a changeset using `pnpm changeset`. Select the package and choose `major` as the bump type. Clearly explain the breaking change and migration path in the changeset description.
4.  **Documentation**: Update all relevant documentation (README, TSDoc) to reflect the breaking change, the deprecation (if applicable), and the migration steps.
5.  **Release**: Once the PR is merged, the release workflow will handle the major version bump and publish the new version.

Directly changing the signature without deprecation is possible but less user-friendly. Always ensure the breaking change is clearly communicated via the MAJOR version bump and changelog generated by the changeset.
