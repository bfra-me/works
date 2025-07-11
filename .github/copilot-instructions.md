# bfra.me/works - Copilot Instructions

## Project Overview

This is the **bfra.me/works** monorepo - a collection of shared development tools, configurations, and utilities for building TypeScript projects with consistent quality standards.

### Key Features
- **Shared Configurations**: Centralized ESLint, Prettier, and TypeScript configurations
- **Development Tools**: CLI for project creation and development utilities
- **Release Automation**: Changesets for versioning and semantic release
- **Testing Framework**: Vitest-based testing across all packages
- **Type Safety**: TypeScript-first development with strict type checking
- **Code Quality**: Automated linting, formatting, and best practice enforcement

### Tech Stack
- **TypeScript**: Primary language with strict type checking and modern patterns
- **pnpm**: Workspace management and package installation
- **Vitest**: Unit testing framework across all packages
- **Changesets**: Versioning, changelogs, and release automation
- **ESLint**: Code linting with shared configurations
- **Prettier**: Code formatting with shared configurations
- **Node.js**: Runtime for CLI tools and build processes
- **tsup**: TypeScript compilation and bundling

## Monorepo Architecture

### Top-Level Directory Structure

#### Package Directory (`packages/`)
- **`create/`**: CLI tool for creating new projects with templates
- **`eslint-config/`**: Shared ESLint configuration with TypeScript support
- **`prettier-config/`**: Shared Prettier configurations (80-proof, 100-proof, 120-proof)
- **`semantic-release/`**: Semantic release configuration and automation
- **`tsconfig/`**: Shared TypeScript configurations for different project types

#### Configuration & Tooling
- **`package.json`**: Workspace root with shared dependencies and scripts
- **`pnpm-workspace.yaml`**: pnpm workspace configuration
- **`tsconfig.json`**: Root TypeScript configuration
- **`vitest.config.ts`**: Global Vitest configuration
- **`eslint.config.ts`**: Root ESLint configuration

#### Development & Documentation
- **`docs/`**: Astro-based documentation site
- **`scripts/`**: Development utilities and automation scripts
- **`.github/`**: GitHub workflows, templates, and automation

### Package Structure Standards

Each package follows a consistent structure:

```
packages/package-name/
├── package.json          # Package manifest with proper exports
├── tsconfig.json         # Extends shared TypeScript config
├── eslint.config.ts      # Package-specific ESLint overrides
├── tsup.config.ts        # Build configuration
├── README.md             # Package documentation
├── CHANGELOG.md          # Auto-generated changelog
├── src/                  # Source code
│   ├── index.ts         # Main export barrel file
│   └── ...              # Feature modules
├── lib/                  # Compiled output (auto-generated)
└── test/                 # Test files using Vitest
    └── *.test.ts
```

### Shared Configuration Strategy

- **TypeScript**: All packages extend `@bfra.me/tsconfig` for consistency
- **ESLint**: All packages use `@bfra.me/eslint-config` with project-specific overrides
- **Prettier**: All packages reference `@bfra.me/prettier-config` variants
- **Testing**: All packages use Vitest with shared configuration patterns
- **Building**: All packages use tsup for consistent compilation

## Development Standards

### TypeScript Patterns

#### Project Configuration
- Always extend shared configuration from `@bfra.me/tsconfig`
- Use ES modules with `"type": "module"` in package.json
- Configure proper exports in package.json for public APIs

#### Type Definitions
```typescript
// Use const assertions for literal types
const CONFIG = {
  environment: 'production',
  features: ['auth', 'api'] as const
} as const

// Prefer interfaces for public APIs
export interface ConfigOptions {
  name: string
  typescript?: boolean | TypescriptOptions
  prettier?: boolean
}

// Use type aliases for unions and utility types
export type ConfigValue = boolean | string | number | ConfigObject
export type PackageName = `@bfra.me/${string}`

// Use discriminated unions for result types
type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E }
```

#### Function Patterns
```typescript
// Use function overloads for complex signatures
export function defineConfig(options: string): Config
export function defineConfig(options: ConfigOptions): Config
export function defineConfig(options: string | ConfigOptions): Config {
  // Implementation
}

// Named parameters with defaults
function createPackage({
  name,
  version = '0.0.0',
  template = 'default'
}: PackageOptions): Promise<void> {
  // Implementation
}

// Type predicates for runtime checking
function isConfigObject(value: unknown): value is ConfigObject {
  return typeof value === 'object' && value !== null && 'name' in value
}
```

### API Design Standards

#### Public API Boundaries
```typescript
// index.ts - Barrel file with explicit exports
export {defineConfig} from './define-config'
export {createPackage} from './package-utils'
export type {ConfigOptions, PackageOptions} from './types'

// package.json exports field
{
  "exports": {
    ".": {
      "types": "./lib/index.d.ts",
      "import": "./lib/index.js"
    }
  }
}
```

#### Naming Conventions
- Functions: Use verb-noun pairs (`createConfig`, `validateInput`)
- Types: Use PascalCase with descriptive suffixes (`ConfigOptions`, `ValidationResult`)
- Constants: Use SCREAMING_SNAKE_CASE (`API_ENDPOINTS`)

#### Documentation Standards
```typescript
/**
 * Creates a new configuration with standardized settings.
 *
 * @param options - The configuration options
 * @param options.name - The name of the configuration
 * @returns The created configuration object
 * @example
 * ```typescript
 * const config = createConfig({ name: 'my-app' })
 * ```
 */
export function createConfig(options: ConfigOptions): Config {
  // Implementation
}
```

### ESLint Configuration

#### Setup
```typescript
// eslint.config.ts
import {defineConfig} from '@bfra.me/eslint-config'

export default defineConfig({
  name: 'my-package',
  typescript: {
    tsconfigPath: './tsconfig.json',
    typeAware: true
  },
  prettier: true,
  vitest: true,
  overrides: {
    // Package-specific rule overrides
    'no-console': 'warn'
  }
})
```

#### Configuration Options
- `typescript`: Enable TypeScript support with type-aware linting
- `jsx`: Enable JSX/React support
- `vitest`: Enable Vitest testing framework support
- `prettier`: Enable Prettier integration
- `overrides`: Package-specific rule customizations

### Testing Practices

#### Test Organization
- Place tests in `test/` directory at package root
- Use descriptive file names: `feature-name.test.ts`
- Group related tests with `describe()` blocks
- Prefer `it()` over `test()` for individual test cases

#### Vitest Setup
```typescript
// vitest.config.ts
import {defineConfig} from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json']
    },
    environment: 'node',
    include: ['test/**/*.test.ts']
  }
})
```

#### Test Patterns
```typescript
// test/math-utils.test.ts
import {describe, expect, it, vi} from 'vitest'
import {add} from '../src/math-utils'

describe('add', () => {
  it('adds two numbers correctly', () => {
    expect(add(2, 3)).toBe(5)
  })

  it('handles edge cases', () => {
    expect(add(-1, 1)).toBe(0)
    expect(add(0, 0)).toBe(0)
  })
})
```

## Package Management

### pnpm Workspace Conventions

#### Dependencies
- Use `workspace:*` for internal package dependencies
- Add shared devDependencies to workspace root
- Keep package-specific dependencies in individual package.json files

#### Scripts
```json
{
  "scripts": {
    "build": "tsup",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "eslint .",
    "format": "prettier --write ."
  }
}
```

#### Package.json Structure
```json
{
  "name": "@bfra.me/package-name",
  "version": "1.0.0",
  "type": "module",
  "exports": {
    ".": {
      "types": "./lib/index.d.ts",
      "import": "./lib/index.js"
    }
  },
  "files": ["lib", "README.md"],
  "dependencies": {
    "@bfra.me/other-package": "workspace:*"
  }
}
```

## Release Workflow

### Changeset Process

#### Creating Changesets
```bash
# Create a changeset for your changes
pnpm changeset

# Select affected packages
# Choose semver impact: major | minor | patch
# Write clear description
```

#### Changeset Format
```markdown
---
"@bfra.me/package-name": minor
"@bfra.me/other-package": patch
---

Add new feature X and fix bug Y in affected packages.
```

#### Semver Guidelines
- **Major**: Breaking changes (API changes, removed exports)
- **Minor**: New features (new exports, optional parameters)
- **Patch**: Bug fixes (no API changes)

#### Release Process
1. **Development**: Create changesets with feature PRs
2. **Weekly Release PR**: Automated "Version Packages" PR created
3. **Merge**: Release PR auto-merges and publishes to npm
4. **Manual Release**: Can be triggered manually if needed

### Versioning Strategy
- Follow semantic versioning strictly
- Breaking changes require major version bump
- Maintain backward compatibility within major versions
- Deprecate before removing APIs

## Common Patterns

### Module Exports
```typescript
// Good: Explicit barrel exports
export {createConfig} from './create-config'
export {validateOptions} from './validate'
export type {ConfigOptions} from './types'

// Avoid: Exporting internal implementation
// export * from './internal'
```

### Error Handling
```typescript
// Good: Discriminated union for results
type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E }

function processData(): Result<Data> {
  try {
    const data = performOperation()
    return { success: true, data }
  } catch (error) {
    return { success: false, error: error as Error }
  }
}
```

### Configuration Objects
```typescript
// Good: Interface with optional properties
export interface BuildOptions {
  entry: string
  outDir?: string
  minify?: boolean
  sourcemap?: boolean
}

// Good: Factory with defaults
export function createBuildConfig(options: BuildOptions): ResolvedConfig {
  return {
    entry: options.entry,
    outDir: options.outDir ?? 'dist',
    minify: options.minify ?? true,
    sourcemap: options.sourcemap ?? false
  }
}
```

### Anti-Patterns to Avoid

#### ❌ Inconsistent API Design
```typescript
// Bad: Mixed return types
function validateA(): boolean { }
function validateB(): string | null { }
function validateC(): void { }

// Good: Consistent result pattern
function validateA(): ValidationResult { }
function validateB(): ValidationResult { }
function validateC(): ValidationResult { }
```

#### ❌ Untyped Public APIs
```typescript
// Bad: Using any in public API
export function process(data: any): any { }

// Good: Properly typed
export function process<T>(data: T): ProcessedData<T> { }
```

#### ❌ Exposing Implementation Details
```typescript
// Bad: Exporting internal utilities
export * from './internal/utils'

// Good: Only export public API
export {publicFunction} from './public-api'
```

## Development Workflow

### Getting Started
1. Clone repository and install dependencies: `pnpm install`
2. Build all packages: `pnpm build`
3. Run tests: `pnpm test`
4. Start development mode: `pnpm dev`

### Making Changes
1. Create feature branch
2. Make changes following these standards
3. Add tests for new functionality
4. Create changeset: `pnpm changeset`
5. Commit and push changes
6. Create pull request

### Before Merging
- All tests pass: `pnpm test`
- Linting passes: `pnpm lint`
- Build succeeds: `pnpm build`
- Changeset created for publishable changes
- Documentation updated if needed

### Code Review Checklist
- [ ] Follows TypeScript patterns and API design standards
- [ ] Includes comprehensive tests
- [ ] Has proper TypeScript types and documentation
- [ ] Uses shared configurations (ESLint, Prettier, TypeScript)
- [ ] Changeset created with appropriate semver impact
- [ ] No breaking changes without major version bump
- [ ] Public APIs follow naming conventions
- [ ] Error handling uses result patterns
