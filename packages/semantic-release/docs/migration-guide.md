# Migration Guide: @bfra.me/semantic-release

> Complete migration guide from the original @bfra.me/semantic-release to the new TypeScript-first implementation.

This guide covers the migration path from the original simple `defineConfig` function (v0.1.x) to the comprehensive TypeScript-first implementation (v0.2.0+) with enhanced validation, preset system, and advanced configuration features.

## Table of Contents

- [Overview](#overview)
- [Breaking Changes](#breaking-changes)
- [Migration Steps](#migration-steps)
- [API Changes](#api-changes)
- [New Features](#new-features)
- [Migration Examples](#migration-examples)
- [Troubleshooting](#troubleshooting)
- [Rollback Strategy](#rollback-strategy)

## Overview

The @bfra.me/semantic-release package has been completely rewritten to provide:

- **Enhanced TypeScript Support**: Full type safety with comprehensive plugin types
- **Runtime Validation**: Zod-based validation with detailed error messages
- **Preset System**: Pre-configured workflows for common use cases
- **Plugin Development Toolkit**: Complete utilities for creating custom plugins
- **Configuration Composition**: Advanced merging and extending capabilities
- **Environment Awareness**: Automatic optimization based on CI/development environments

### Version Comparison

| Feature            | v0.1.x (Original)         | v0.2.0+ (New)                                |
| ------------------ | ------------------------- | -------------------------------------------- |
| API                | Basic `defineConfig` only | Enhanced `defineConfig` + presets + builders |
| TypeScript         | Basic type hints          | Full type safety with plugin types           |
| Validation         | None                      | Runtime validation with Zod                  |
| Presets            | None                      | 4 built-in presets + composition             |
| Plugin Development | None                      | Complete toolkit with testing utilities      |
| Configuration      | Simple object passthrough | Advanced composition and validation          |
| Bundle Size        | ~2KB                      | ~15KB (with tree-shaking support)            |

## Breaking Changes

### 1. Import Structure Changes

**Before (v0.1.x):**

```typescript
import {defineConfig} from "@bfra.me/semantic-release"
```

**After (v0.2.0+):**

```typescript
// Basic usage (backward compatible)
import {defineConfig} from "@bfra.me/semantic-release"

// Using presets (recommended)
import {npmPreset} from "@bfra.me/semantic-release"

// Using builder pattern
import {ConfigBuilder} from "@bfra.me/semantic-release"
```

### 2. defineConfig Function Signature

**Before (v0.1.x):**

```typescript
defineConfig(config: SemanticReleaseConfig): SemanticReleaseConfig
```

**After (v0.2.0+):**

```typescript
defineConfig(
  config: GlobalConfig,
  options?: DefineConfigOptions
): Promise<GlobalConfig> | GlobalConfig
```

### 3. Type Interface Changes

**Before (v0.1.x):**

```typescript
interface SemanticReleaseConfig {
  extends?: string | string[]
  branches: BranchSpec | BranchSpec[]
  repositoryUrl?: string
  tagFormat?: string
  plugins?: Plugin[]
  dryRun?: boolean
  ci?: boolean
  [name: string]: unknown
}
```

**After (v0.2.0+):**

```typescript
interface GlobalConfig {
  branches: BranchSpec | readonly BranchSpec[]
  repositoryUrl?: string
  tagFormat?: string
  plugins?: PluginSpec[]
  dryRun?: boolean
  ci?: boolean
  preset?: string
  extends?: string | string[]
  // Plus comprehensive plugin-specific types
}
```

### 4. Plugin Configuration Types

**Before (v0.1.x):**

- Basic plugin array with minimal typing
- No plugin-specific configuration types

**After (v0.2.0+):**

- Comprehensive plugin-specific TypeScript interfaces
- Runtime validation for plugin configurations
- Plugin registry with discovery and validation

## Migration Steps

### Step 1: Update Package Dependencies

```bash
# Update to the latest version
npm install --save-dev @bfra.me/semantic-release@latest semantic-release@latest

# Or with pnpm
pnpm update @bfra.me/semantic-release semantic-release

# Or with yarn
yarn upgrade @bfra.me/semantic-release semantic-release
```

### Step 2: Choose Migration Path

You have three migration approaches:

1. **Minimal Migration**: Keep existing code with minimal changes
2. **Preset Migration**: Migrate to preset system (recommended)
3. **Advanced Migration**: Use new builder and composition features

### Step 3: Update Configuration Files

Choose one of the following approaches based on your needs.

## API Changes

### Core Function Changes

#### defineConfig Function

**v0.1.x Behavior:**

- Simple passthrough function
- No validation
- Basic TypeScript hints

**v0.2.0+ Behavior:**

- Enhanced validation with detailed errors
- Environment-specific optimizations
- Optional runtime validation
- Comprehensive TypeScript support

#### New Configuration Options

```typescript
// New options parameter in defineConfig
export default defineConfig(
  {
    branches: ["main"],
    plugins: [
      /* ... */
    ],
  },
  {
    // New configuration options
    environment: "production", // 'development' | 'production' | 'ci'
    validate: true, // Enable runtime validation
    optimizeForEnvironment: true, // Environment-specific optimizations
  },
)
```

### New Exports and APIs

```typescript
// Configuration builders
import {ConfigBuilder, PluginBuilder} from "@bfra.me/semantic-release"

// Preset system
import {npmPreset, githubPreset, monorepoPreset, developmentPreset} from "@bfra.me/semantic-release"

// Configuration composition
import {mergeConfigs, extendConfig, validateConfig} from "@bfra.me/semantic-release"

// Plugin development toolkit
import {createPluginTester, MockContext, PluginTemplate} from "@bfra.me/semantic-release"

// Validation utilities
import {ValidationError, validateCompleteConfig} from "@bfra.me/semantic-release"
```

## New Features

### 1. Preset System

The most significant addition is the preset system providing pre-configured workflows:

```typescript
// NPM package workflow
import {npmPreset} from "@bfra.me/semantic-release"

export default npmPreset({
  // Automatically includes:
  // - @semantic-release/commit-analyzer
  // - @semantic-release/release-notes-generator
  // - @semantic-release/changelog
  // - @semantic-release/npm
  // - @semantic-release/github
  // - @semantic-release/git
})

// GitHub releases only
import {githubPreset} from "@bfra.me/semantic-release"

export default githubPreset({
  // Optimized for GitHub releases without npm
})

// Monorepo package
import {monorepoPreset} from "@bfra.me/semantic-release"

export default monorepoPreset({
  packageName: "@myorg/package",
  changesetsIntegration: true,
})
```

### 2. Configuration Builder

```typescript
import {ConfigBuilder} from "@bfra.me/semantic-release"

export default new ConfigBuilder()
  .branches(["main", "next"])
  .addPlugin("@semantic-release/commit-analyzer")
  .addPlugin("@semantic-release/npm", {npmPublish: true})
  .tagFormat("v${version}")
  .build()
```

### 3. Runtime Validation

```typescript
import {defineConfig, validateConfig} from "@bfra.me/semantic-release"

const config = defineConfig({
  branches: ["main"],
  plugins: ["@semantic-release/npm"],
})

// Manual validation
try {
  await validateConfig(config)
} catch (error) {
  console.error("Configuration error:", error.message)
}
```

## Migration Examples

### Example 1: Minimal Migration (Backward Compatible)

**Before (v0.1.x):**

```typescript
// release.config.ts
import {defineConfig} from "@bfra.me/semantic-release"

export default defineConfig({
  branches: ["main"],
  plugins: [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "@semantic-release/changelog",
    "@semantic-release/npm",
    "@semantic-release/github",
    "@semantic-release/git",
  ],
})
```

**After (v0.2.0+) - Minimal Change:**

```typescript
// release.config.ts - NO CHANGES REQUIRED!
import {defineConfig} from "@bfra.me/semantic-release"

export default defineConfig({
  branches: ["main"],
  plugins: [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "@semantic-release/changelog",
    "@semantic-release/npm",
    "@semantic-release/github",
    "@semantic-release/git",
  ],
})
```

### Example 2: Preset Migration (Recommended)

**Before (v0.1.x):**

```typescript
import {defineConfig} from "@bfra.me/semantic-release"

export default defineConfig({
  branches: ["main"],
  plugins: [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "@semantic-release/changelog",
    "@semantic-release/npm",
    "@semantic-release/github",
    "@semantic-release/git",
  ],
})
```

**After (v0.2.0+) - Using Preset:**

```typescript
import {npmPreset} from "@bfra.me/semantic-release"

export default npmPreset({
  branches: ["main"],
  // All plugins automatically configured
})
```

### Example 3: Complex Configuration Migration

**Before (v0.1.x):**

```typescript
import {defineConfig} from "@bfra.me/semantic-release"

export default defineConfig({
  branches: ["main", {name: "beta", prerelease: true}, {name: "alpha", prerelease: true}],
  plugins: [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    [
      "@semantic-release/changelog",
      {
        changelogFile: "CHANGELOG.md",
      },
    ],
    [
      "@semantic-release/npm",
      {
        npmPublish: true,
      },
    ],
    [
      "@semantic-release/github",
      {
        assets: ["dist/*.tgz"],
      },
    ],
    [
      "@semantic-release/git",
      {
        assets: ["CHANGELOG.md", "package.json"],
        message: "chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}",
      },
    ],
  ],
})
```

**After (v0.2.0+) - Multiple Options:**

**Option A: Enhanced defineConfig**

```typescript
import {defineConfig} from "@bfra.me/semantic-release"

export default defineConfig(
  {
    branches: ["main", {name: "beta", prerelease: true}, {name: "alpha", prerelease: true}],
    plugins: [
      "@semantic-release/commit-analyzer",
      "@semantic-release/release-notes-generator",
      [
        "@semantic-release/changelog",
        {
          changelogFile: "CHANGELOG.md",
        },
      ],
      [
        "@semantic-release/npm",
        {
          npmPublish: true,
        },
      ],
      [
        "@semantic-release/github",
        {
          assets: ["dist/*.tgz"],
        },
      ],
      [
        "@semantic-release/git",
        {
          assets: ["CHANGELOG.md", "package.json"],
          message: "chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}",
        },
      ],
    ],
  },
  {
    validate: true, // Enable runtime validation
    environment: "production",
  },
)
```

**Option B: Preset with Customization**

```typescript
import {npmPreset} from "@bfra.me/semantic-release"

export default npmPreset({
  branches: ["main", {name: "beta", prerelease: true}, {name: "alpha", prerelease: true}],
  // Override specific plugin configurations
  plugins: {
    changelog: {
      changelogFile: "CHANGELOG.md",
    },
    github: {
      assets: ["dist/*.tgz"],
    },
    git: {
      assets: ["CHANGELOG.md", "package.json"],
      message: "chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}",
    },
  },
})
```

**Option C: Builder Pattern**

```typescript
import {ConfigBuilder} from "@bfra.me/semantic-release"

export default new ConfigBuilder()
  .branches(["main", {name: "beta", prerelease: true}, {name: "alpha", prerelease: true}])
  .addPlugin("@semantic-release/commit-analyzer")
  .addPlugin("@semantic-release/release-notes-generator")
  .addPlugin("@semantic-release/changelog", {
    changelogFile: "CHANGELOG.md",
  })
  .addPlugin("@semantic-release/npm", {
    npmPublish: true,
  })
  .addPlugin("@semantic-release/github", {
    assets: ["dist/*.tgz"],
  })
  .addPlugin("@semantic-release/git", {
    assets: ["CHANGELOG.md", "package.json"],
    message: "chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}",
  })
  .validate(true)
  .build()
```

### Example 4: Monorepo Migration

**Before (v0.1.x) - Manual monorepo setup:**

```typescript
import {defineConfig} from "@bfra.me/semantic-release"

export default defineConfig({
  tagFormat: "@myorg/package@${version}",
  branches: ["main"],
  plugins: [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    [
      "@semantic-release/npm",
      {
        pkgRoot: "packages/my-package",
      },
    ],
    [
      "@semantic-release/github",
      {
        successComment: "This release is available in @myorg/package@${nextRelease.version}",
      },
    ],
  ],
})
```

**After (v0.2.0+) - Monorepo preset:**

```typescript
import {monorepoPreset} from "@bfra.me/semantic-release"

export default monorepoPreset({
  packageName: "@myorg/package",
  pkgRoot: "packages/my-package",
  branches: ["main"],
  changesetsIntegration: true, // Enhanced changesets support
})
```

### Example 5: Environment-Specific Configuration

**Before (v0.1.x) - Manual environment handling:**

```typescript
import {defineConfig} from "@bfra.me/semantic-release"

const isDevelopment = process.env.NODE_ENV === "development"

export default defineConfig({
  branches: ["main"],
  dryRun: isDevelopment,
  plugins: isDevelopment
    ? ["@semantic-release/commit-analyzer"]
    : [
        "@semantic-release/commit-analyzer",
        "@semantic-release/release-notes-generator",
        "@semantic-release/npm",
        "@semantic-release/github",
      ],
})
```

**After (v0.2.0+) - Automatic environment handling:**

```typescript
import {defineConfig, developmentPreset, npmPreset} from "@bfra.me/semantic-release"

// Option A: Automatic environment detection
export default defineConfig(
  {
    branches: ["main"],
    plugins: [
      "@semantic-release/commit-analyzer",
      "@semantic-release/release-notes-generator",
      "@semantic-release/npm",
      "@semantic-release/github",
    ],
  },
  {
    environment: "auto", // Automatically detects CI/development/production
    optimizeForEnvironment: true,
  },
)

// Option B: Environment-specific presets
const isDevelopment = process.env.NODE_ENV === "development"

export default isDevelopment ? developmentPreset() : npmPreset()
```

## Troubleshooting

### Common Migration Issues

#### 1. TypeScript Compilation Errors

**Issue**: New strict types cause compilation errors

**Solution**:

```typescript
// Temporary: Use type assertion during migration
export default defineConfig({
  // ...config
} as any)

// Better: Fix types incrementally
export default defineConfig({
  branches: ["main"] as const, // Use const assertions
  plugins: [
    "@semantic-release/commit-analyzer",
    ["@semantic-release/npm", {npmPublish: true}] as const,
  ],
})
```

#### 2. Runtime Validation Failures

**Issue**: Configuration fails validation with new runtime checks

**Solution**:

```typescript
import {defineConfig, validateConfig} from "@bfra.me/semantic-release"

// Disable validation temporarily
export default defineConfig(
  {
    // ...config
  },
  {
    validate: false, // Disable during migration
  },
)

// Or debug validation issues
try {
  const config = defineConfig({
    // ...config
  })
  await validateConfig(config)
} catch (error) {
  console.error("Validation error:", error.message)
  console.error("Suggestions:", error.suggestions)
}
```

#### 3. Plugin Configuration Issues

**Issue**: Plugin configurations are now strictly typed

**Solution**:

```typescript
// Before: Loose typing allowed any properties
plugins: [
  [
    "@semantic-release/npm",
    {
      someInvalidProperty: true, // This was allowed
    },
  ],
]

// After: Use correct plugin configuration
plugins: [
  [
    "@semantic-release/npm",
    {
      npmPublish: true,
      tarballDir: "dist",
    },
  ],
]
```

#### 4. Bundle Size Increase

**Issue**: New version has larger bundle size

**Solution**:

```typescript
// Use tree-shaking friendly imports
import {npmPreset} from "@bfra.me/semantic-release/presets"
import {ConfigBuilder} from "@bfra.me/semantic-release/builders"

// Instead of
import {npmPreset, ConfigBuilder} from "@bfra.me/semantic-release"
```

### Migration Validation

After migrating, validate your configuration:

```bash
# Install the package
npm install --save-dev @bfra.me/semantic-release@latest

# Test your configuration
npx semantic-release --dry-run --no-ci

# Validate configuration programmatically
node -e "
import { validateConfig } from '@bfra.me/semantic-release'
import config from './release.config.js'

validateConfig(config)
  .then(() => console.log('✅ Configuration valid'))
  .catch(err => console.error('❌ Configuration invalid:', err.message))
"
```

## Rollback Strategy

If you encounter issues during migration, you can rollback:

### 1. Version Rollback

```bash
# Rollback to last known good version
npm install --save-dev @bfra.me/semantic-release@0.1.23

# Or pin to specific version in package.json
{
  "devDependencies": {
    "@bfra.me/semantic-release": "0.1.23"
  }
}
```

### 2. Configuration Rollback

Keep a backup of your original configuration:

```typescript
// release.config.backup.ts - Original v0.1.x configuration
import {defineConfig} from "@bfra.me/semantic-release"

export default defineConfig({
  branches: ["main"],
  plugins: [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "@semantic-release/changelog",
    "@semantic-release/npm",
    "@semantic-release/github",
    "@semantic-release/git",
  ],
})
```

### 3. Gradual Migration

Migrate one feature at a time:

```typescript
// Week 1: Just update to latest version, keep existing config
export default defineConfig({
  // existing config unchanged
})

// Week 2: Add validation
export default defineConfig(
  {
    // existing config
  },
  {validate: true},
)

// Week 3: Migrate to preset
export default npmPreset({
  // simplified config
})
```

## Support and Resources

- **Getting Started Guide**: [docs/getting-started.md](./getting-started.md)
- **Preset Documentation**: [docs/presets.md](./presets.md)
- **Advanced Configuration**: [docs/advanced-configuration.md](./advanced-configuration.md)
- **Plugin Development**: [docs/plugin-development.md](./plugin-development.md)
- **API Reference**: Complete TypeScript definitions in source code
- **GitHub Issues**: [Report migration issues](https://github.com/bfra-me/works/issues)

## Next Steps

After successful migration:

1. **Explore Presets**: Try the preset system for simplified configuration
2. **Enable Validation**: Add runtime validation for better error detection
3. **Use TypeScript Features**: Take advantage of enhanced type safety
4. **Consider Plugin Development**: Explore the plugin development toolkit
5. **Optimize Configuration**: Use composition utilities for complex setups

---

_For additional help or specific migration questions, please open an issue on the [GitHub repository](https://github.com/bfra-me/works/issues)._
