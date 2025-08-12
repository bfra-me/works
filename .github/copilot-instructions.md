# bfra.me/works - Copilot Instructions

## Project Overview

This is the **bfra.me/works** monorepo - a collection of shared development tools, configurations, and utilities for building TypeScript projects with consistent quality standards.

For comprehensive project navigation, see [`llms.txt`](../llms.txt) which provides structured access to all documentation and package information for AI agents.

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

## Critical Workflows

### Development Setup
```bash
# Clone and setup (use bootstrap, not install)
pnpm bootstrap               # Installs deps with --prefer-offline --loglevel warn

# Development mode
pnpm dev                    # Parallel dev mode across all packages
pnpm watch                  # Build and watch for changes
```

### Quality Assurance Commands
```bash
# Validation pipeline (use this order for efficiency)
pnpm validate               # Runs type-check → lint → test → type-coverage → build
pnpm fix                    # Auto-fixes linting + runs manypkg fix
pnpm lint-packages          # Runs publint on all packages (package.json validation)
pnpm inspect-eslint-config  # Debug ESLint config issues with --open false
```

### Package Creation & Management
```bash
# Create new package
pnpx @bfra.me/create my-package    # Uses built-in templates

# Changeset workflow
pnpm changeset              # Create changeset for release
pnpm version-changesets     # Apply versions + rebuild
pnpm publish-changesets     # Publish to npm
```

## Monorepo Architecture

### Package Dependencies (Critical for Understanding)
- **`@bfra.me/create`**: Standalone CLI - generates packages with templates
- **`@bfra.me/eslint-config`**: Used by ALL packages - provides `defineConfig()`
- **`@bfra.me/prettier-config`**: 3 variants (80/100/120-proof) - referenced in package.json
- **`@bfra.me/tsconfig`**: Extended by all TS configs - provides base + library configs
- **`@bfra.me/semantic-release`**: Provides typed semantic-release configs

### Workspace Structure (pnpm workspaces)
```
packages/                   # Published packages
├── create/                # @bfra.me/create - package generator
├── eslint-config/         # @bfra.me/eslint-config - linting
├── prettier-config/       # @bfra.me/prettier-config - formatting
├── semantic-release/      # @bfra.me/semantic-release - versioning
└── tsconfig/              # @bfra.me/tsconfig - TypeScript configs
```

### Package Creation Guide

#### Prerequisites
- Workspace properly initialized with `pnpm bootstrap`
- Core packages built (`@bfra.me/eslint-config`, `@bfra.me/tsconfig`)
- Understanding of package naming convention: `@bfra.me/package-name`

#### Automated Creation (Recommended)
```bash
# Use the built-in package generator
pnpx @bfra.me/create my-new-package

# Follow interactive prompts for package type and configuration
```

#### Manual Creation Process

##### Step 1: Create Package Directory Structure
```bash
# Create package directory
mkdir packages/my-new-package
cd packages/my-new-package

# Create required directories
mkdir src test
```

##### Step 2: Create package.json
```json
{
  "name": "@bfra.me/my-new-package",
  "version": "0.0.0",
  "description": "Brief description of package purpose",
  "type": "module",
  "exports": {
    ".": {
      "types": "./lib/index.d.ts",
      "import": "./lib/index.js"
    }
  },
  "files": ["lib", "README.md"],
  "scripts": {
    "build": "tsup",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "eslint .",
    "format": "prettier --write ."
  },
  "dependencies": {
    "@bfra.me/other-package": "workspace:*"
  },
  "devDependencies": {
    "@bfra.me/eslint-config": "workspace:*",
    "@bfra.me/tsconfig": "workspace:*"
  },
  "publishConfig": {
    "access": "public"
  }
}
```

##### Step 3: Create TypeScript Configuration
```json
// tsconfig.json
{
  "extends": "@bfra.me/tsconfig/library",
  "include": ["src"],
  "exclude": ["lib", "test"]
}
```

```json
// tsconfig.eslint.json
{
  "extends": "./tsconfig.json",
  "include": ["src", "test", "*.ts", "*.js"]
}
```

##### Step 4: Create Build Configuration
```typescript
// tsup.config.ts
import {defineConfig} from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true
})
```

##### Step 5: Create ESLint Configuration
```typescript
// eslint.config.ts
import {defineConfig} from '@bfra.me/eslint-config'

export default defineConfig({
  name: 'my-new-package',
  typescript: {
    tsconfigPath: './tsconfig.eslint.json',
    typeAware: true
  },
  prettier: true,
  vitest: true
})
```

##### Step 6: Create Source Files
```typescript
// src/index.ts
/**
 * Main entry point for @bfra.me/my-new-package
 */

export {someFunction} from './some-function'
export type {SomeType} from './types'
```

```typescript
// src/types.ts
export interface SomeType {
  name: string
  value: number
}
```

##### Step 7: Create Initial Test
```typescript
// test/index.test.ts
import {describe, expect, it} from 'vitest'
import {someFunction} from '../src'

describe('my-new-package', () => {
  it('exports expected functions', () => {
    expect(typeof someFunction).toBe('function')
  })
})
```

##### Step 8: Create README
```markdown
<!-- README.md -->
# @bfra.me/my-new-package

Brief description of what this package does.

## Installation

```bash
npm install @bfra.me/my-new-package
```

## Usage

```typescript
import {someFunction} from '@bfra.me/my-new-package'

someFunction()
```
```

#### Integration and Validation

##### Step 1: Update Workspace Dependencies
```bash
# From workspace root
pnpm install

# Verify workspace recognizes new package
pnpm list --depth=0
```

##### Step 2: Build and Test
```bash
# Build the new package
cd packages/my-new-package
pnpm build

# Run tests
pnpm test

# Lint code
pnpm lint
```

##### Step 3: Workspace Integration
```bash
# From workspace root
pnpm build        # Should include new package
pnpm test         # Should run new package tests
pnpm lint         # Should lint new package
```

##### Step 4: Validate Package Structure
```bash
# Check package exports are correct
node -e "console.log(require('./packages/my-new-package/package.json'))"

# Verify lib directory is created after build
ls packages/my-new-package/lib/
```

#### Common Integration Patterns

##### Consuming Other Workspace Packages
```typescript
// In package.json dependencies
"@bfra.me/eslint-config": "workspace:*"

// In TypeScript source
import {defineConfig} from '@bfra.me/eslint-config'
```

##### Adding to Existing Package Dependencies
```bash
# Add new package as dependency to existing package
cd packages/existing-package
pnpm add @bfra.me/my-new-package@workspace:*
```

##### Publishing Preparation
```bash
# Create changeset for new package
pnpm changeset

# Select your new package
# Choose 'minor' for new package
# Write description: "Add @bfra.me/my-new-package"
```

#### Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| `Module not found` errors | Package not built | Run `pnpm build` in package directory |
| ESLint config errors | Missing eslint-config build | Build `@bfra.me/eslint-config` first |
| Test import failures | Missing dependencies | Run `pnpm install` from workspace root |
| TypeScript errors | Wrong tsconfig extends | Verify extends path to `@bfra.me/tsconfig` |
| Package not in workspace | Not added to pnpm-workspace.yaml | Should be auto-detected in `packages/*` |

### Key Files per Package
- `src/index.ts`: Main export barrel (use explicit exports, not `export *`)
- `tsup.config.ts`: Build config (always present)
- `eslint.config.ts`: Package-specific overrides using `defineConfig()`
- `lib/`: Compiled output (gitignored, auto-generated by tsup)

## Project-Specific Patterns

### Package.json Structure (Follow This Exactly)
```json
{
  "name": "@bfra.me/package-name",
  "type": "module",                    # Always ES modules
  "exports": {
    ".": {
      "types": "./lib/index.d.ts",     # Types first
      "import": "./lib/index.js"
    }
  },
  "files": ["lib", "README.md"],       # Only ship compiled output
  "dependencies": {
    "@bfra.me/other-package": "workspace:*"  # Internal deps use workspace:*
  }
}
```

### ESLint Config Pattern (Use defineConfig)
```typescript
// eslint.config.ts - Every package uses this pattern
import {defineConfig} from '@bfra.me/eslint-config'

export default defineConfig({
  name: 'package-name',
  typescript: {tsconfigPath: './tsconfig.json', typeAware: true},
  prettier: true,
  vitest: true,
  overrides: {'no-console': 'warn'}   # Package-specific rules
})
```

### TypeScript Config Pattern
```json
// tsconfig.json - Always extend shared config
{
  "extends": "@bfra.me/tsconfig/library",
  "include": ["src"],
  "exclude": ["lib", "test"]
}
```

## Common Error Patterns & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| `TS2307: Cannot find module '@bfra.me/X'` | Missing build or workspace dep | Run `pnpm bootstrap && pnpm build` |
| `publint` errors | Package.json exports mismatch | Check exports field matches lib/ structure |
| `manypkg` errors | Inconsistent dependencies | Run `pnpm fix` (runs manypkg fix) |
| ESLint config loading issues | Wrong ESLint flag | Use `--flag v10_config_lookup_from_file` |
| Test imports failing | Missing pretest build | `pnpm pretest` builds config packages first |
| Type coverage errors | Type coverage below threshold | Run `pnpm type-coverage:detail` to see specifics |

## Integration Points

### Build Dependencies (Critical Order)
1. **`@bfra.me/prettier-config`** and **`@bfra.me/eslint-config`** must build FIRST
2. Other packages depend on these configs
3. `pnpm pretest` handles this automatically
4. `pnpm build` runs with proper dependency order

### Changeset Integration
- Changesets live in `.changeset/` directory
- Use specific semver: `major` (breaking), `minor` (features), `patch` (fixes)
- Automated "Version Packages" PR created weekly
- Never manually edit CHANGELOG.md (auto-generated)

### Testing Architecture
- All packages use Vitest with shared config from workspace root
- Tests in `test/` directory, not `__tests__` or `src/`
- Coverage aggregated across entire monorepo
- Use `describe()` for grouping, `it()` for individual tests
- **Fixture-based testing**: Packages use `test/fixtures/input` and `test/fixtures/output` for integration tests
- **Test patterns**: `it.concurrent()` for parallel test execution, `expect.soft()` for multiple assertions
- **File snapshots**: Use `toMatchFileSnapshot()` for comparing formatted output files

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
1. Clone repository and install dependencies: `pnpm bootstrap`
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
