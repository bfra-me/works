# Getting Started with @bfra.me/semantic-release

A comprehensive guide to configuring TypeScript semantic-release with type safety, validation, and modern development patterns.

## Table of Contents

- [Installation](#installation)
- [Basic Configuration](#basic-configuration)
- [Configuration Methods](#configuration-methods)
- [Using Presets](#using-presets)
- [Advanced Patterns](#advanced-patterns)
- [TypeScript Integration](#typescript-integration)
- [Validation and Error Handling](#validation-and-error-handling)
- [Best Practices](#best-practices)

## Installation

Install the package along with semantic-release:

```bash
# npm
npm install --save-dev @bfra.me/semantic-release semantic-release

# pnpm
pnpm add --save-dev @bfra.me/semantic-release semantic-release

# yarn
yarn add --dev @bfra.me/semantic-release semantic-release
```

## Basic Configuration

### Using defineConfig (Recommended)

The `defineConfig` function is the primary way to create semantic-release configurations with full TypeScript support:

```typescript
// release.config.ts
import { defineConfig } from '@bfra.me/semantic-release'

export default defineConfig({
  branches: ['main'],
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    '@semantic-release/changelog',
    '@semantic-release/npm',
    '@semantic-release/github',
    '@semantic-release/git',
  ],
})
```

### JavaScript Configuration Files

For JavaScript config files (release.config.js), use the factories export:

```javascript
// release.config.mjs
import { createConfig } from '@bfra.me/semantic-release/factories'

export default createConfig({
  name: 'my-package-release',
  branches: ['main'],
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    '@semantic-release/npm',
    '@semantic-release/github',
  ],
})
```

## Configuration Methods

### 1. defineConfig (Standard)

The most common approach with comprehensive TypeScript support:

```typescript
import { defineConfig } from '@bfra.me/semantic-release'

export default defineConfig({
  branches: [
    'main',
    { name: 'beta', prerelease: true },
    { name: 'alpha', prerelease: true }
  ],
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    ['@semantic-release/changelog', {
      changelogFile: 'CHANGELOG.md'
    }],
    ['@semantic-release/npm', {
      npmPublish: true
    }],
    ['@semantic-release/github', {
      assets: ['dist/**']
    }],
    ['@semantic-release/git', {
      assets: ['CHANGELOG.md', 'package.json']
    }]
  ]
}, {
  // Enhanced options
  validate: true,
  environment: 'production'
})
```

### 2. Builder Pattern (Fluent API)

For complex configurations, use the builder pattern:

```typescript
import { createConfigBuilder } from '@bfra.me/semantic-release/builder'

export default createConfigBuilder()
  .branches(['main', 'beta'])
  .repositoryUrl('https://github.com/user/repo')
  .plugins()
    .commitAnalyzer({
      preset: 'conventionalcommits'
    })
    .releaseNotesGenerator({
      preset: 'conventionalcommits'
    })
    .changelog({
      changelogFile: 'CHANGELOG.md'
    })
    .npm({
      npmPublish: true
    })
    .github({
      assets: ['dist/**', 'docs/**']
    })
    .git({
      assets: ['CHANGELOG.md', 'package.json', 'pnpm-lock.yaml']
    })
  .build({
    validate: true
  })
```

### 3. Factory Functions

For JavaScript files or dynamic configurations:

```javascript
// release.config.mjs
import { createConfig, createNpmConfig, createGithubConfig } from '@bfra.me/semantic-release/factories'

// Basic factory
export default createConfig({
  name: 'standard-release',
  branches: ['main'],
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/npm',
    '@semantic-release/github'
  ]
})

// Or use specialized factories
const npmConfig = createNpmConfig({
  branches: ['main', 'next'],
  npmPublish: true
})

const githubConfig = createGithubConfig({
  branches: ['main'],
  assets: ['dist/**']
})
```

## Using Presets

Presets provide pre-configured workflows for common scenarios:

### NPM Package Preset

Complete workflow for npm packages with changelog and GitHub releases:

```typescript
import { npmPreset } from '@bfra.me/semantic-release'

export default npmPreset({
  branches: ['main', { name: 'beta', prerelease: true }],
  repositoryUrl: 'https://github.com/user/my-package'
})
```

### GitHub-Only Preset

For projects that only need GitHub releases:

```typescript
import { githubPreset } from '@bfra.me/semantic-release'

export default githubPreset({
  branches: ['main'],
  repositoryUrl: 'https://github.com/user/my-project',
  assets: ['dist/**', 'docs/**']
})
```

### Monorepo Preset

Specialized configuration for monorepo packages:

```typescript
import { monorepoPreset } from '@bfra.me/semantic-release'

export default monorepoPreset({
  packageName: '@my-org/core-package',
  branches: ['main', 'develop'],
  repositoryUrl: 'https://github.com/my-org/monorepo',
  pkgRoot: 'packages/core',
  changesetsIntegration: true
})
```

### Development Preset

For development builds and pre-releases:

```typescript
import { developmentPreset } from '@bfra.me/semantic-release'

export default developmentPreset({
  branches: [
    'main',
    { name: 'develop', prerelease: 'dev' },
    { name: 'feature/*', prerelease: 'feat' }
  ],
  repositoryUrl: 'https://github.com/user/my-project'
})
```

## Advanced Patterns

### Environment-Specific Configuration

```typescript
import { defineConfig } from '@bfra.me/semantic-release'

const isCI = process.env.CI === 'true'
const isDryRun = process.env.DRY_RUN === 'true'

export default defineConfig({
  branches: ['main'],
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    '@semantic-release/changelog',
    // Only publish to npm in CI
    ...(isCI ? ['@semantic-release/npm'] : []),
    '@semantic-release/github',
    '@semantic-release/git'
  ],
  dryRun: isDryRun
}, {
  environment: isCI ? 'production' : 'development',
  validate: true
})
```

### Configuration Composition

Combine multiple presets or configurations:

```typescript
import {
  npmPreset,
  githubPreset,
  mergeConfigs,
  extendConfig
} from '@bfra.me/semantic-release'

// Base npm configuration
const baseConfig = npmPreset({
  branches: ['main'],
  repositoryUrl: 'https://github.com/user/package'
})

// Enhanced GitHub configuration
const githubConfig = githubPreset({
  branches: ['main', 'beta'],
  assets: ['dist/**', 'docs/**']
})

// Merge configurations
export default mergeConfigs(baseConfig, githubConfig)

// Or extend with additional options
export default extendConfig(baseConfig, {
  branches: ['main', 'develop', { name: 'beta', prerelease: true }],
  plugins: [
    ...baseConfig.plugins,
    ['@semantic-release/exec', {
      publishCmd: 'npm run deploy'
    }]
  ]
})
```

### Plugin Configuration with Type Safety

```typescript
import { defineConfig } from '@bfra.me/semantic-release'

export default defineConfig({
  branches: ['main'],
  plugins: [
    // Commit analyzer with preset options
    ['@semantic-release/commit-analyzer', {
      preset: 'conventionalcommits',
      releaseRules: [
        { type: 'docs', release: false },
        { type: 'style', release: false },
        { type: 'refactor', release: 'patch' },
        { type: 'perf', release: 'patch' }
      ]
    }],

    // Release notes generator with custom template
    ['@semantic-release/release-notes-generator', {
      preset: 'conventionalcommits',
      writerOpts: {
        commitsSort: ['subject', 'scope']
      }
    }],

    // Changelog with custom settings
    ['@semantic-release/changelog', {
      changelogFile: 'CHANGELOG.md',
      changelogTitle: '# Changelog\n\nAll notable changes will be documented here.'
    }],

    // NPM with registry configuration
    ['@semantic-release/npm', {
      npmPublish: true,
      tarballDir: 'dist'
    }],

    // GitHub with asset uploads
    ['@semantic-release/github', {
      assets: [
        { path: 'dist/*.tgz', label: 'Distribution' },
        { path: 'docs/**', label: 'Documentation' }
      ],
      addReleases: 'bottom'
    }],

    // Git commit with custom message
    ['@semantic-release/git', {
      assets: ['CHANGELOG.md', 'package.json'],
      message: 'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}'
    }]
  ]
})
```

## TypeScript Integration

### Type Safety and IntelliSense

The package provides comprehensive TypeScript definitions:

```typescript
import {
  defineConfig,
  GlobalConfig,
  BranchSpec,
  PluginSpec
} from '@bfra.me/semantic-release'

// Strongly typed configuration
const config: GlobalConfig = {
  branches: [
    'main',
    { name: 'beta', prerelease: true, channel: 'beta' }
  ] as BranchSpec[],
  plugins: [
    '@semantic-release/commit-analyzer',
    ['@semantic-release/npm', { npmPublish: true }]
  ] as PluginSpec[]
}

export default defineConfig(config)
```

### Custom Type Declarations

Extend types for custom plugins:

```typescript
import { defineConfig, PluginSpec } from '@bfra.me/semantic-release'

// Custom plugin type
interface CustomPluginConfig {
  customOption: string
  enableFeature: boolean
}

type CustomPluginSpec = ['./my-custom-plugin', CustomPluginConfig]

export default defineConfig({
  branches: ['main'],
  plugins: [
    '@semantic-release/commit-analyzer',
    ['./my-custom-plugin', {
      customOption: 'value',
      enableFeature: true
    }] as CustomPluginSpec
  ]
})
```

### TypeScript Compilation Check

Verify your configuration compiles correctly:

```typescript
// release.config.ts
import { defineConfig } from '@bfra.me/semantic-release'

// This will be type-checked at compile time
export default defineConfig({
  branches: ['main'],
  plugins: [
    '@semantic-release/commit-analyzer',
    // TypeScript will catch configuration errors
    ['@semantic-release/npm', {
      npmPublish: true,
      // tarballDir: 123 // ❌ Type error: should be string
    }]
  ]
})
```

## Validation and Error Handling

### Runtime Validation

Enable validation to catch configuration errors at runtime:

```typescript
import { defineConfig } from '@bfra.me/semantic-release'

export default defineConfig({
  branches: ['main'],
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/npm'
  ]
}, {
  // Enable runtime validation
  validate: true,
  // Fail fast on validation errors
  throwOnValidationError: true
})
```

### Manual Validation

Validate configurations manually:

```typescript
import {
  defineConfig,
  validateConfig,
  validateCompleteConfig
} from '@bfra.me/semantic-release'

const config = defineConfig({
  branches: ['main'],
  plugins: ['@semantic-release/commit-analyzer']
})

// Validate configuration
const validation = validateConfig(config)
if (!validation.success) {
  console.error('Configuration errors:', validation.error.issues)
  process.exit(1)
}

// Comprehensive validation including plugin configurations
const completeValidation = validateCompleteConfig(config)
if (!completeValidation.success) {
  console.error('Complete validation failed:', completeValidation.error.issues)
}
```

### Error Handling

Handle validation errors gracefully:

```typescript
import {
  defineConfig,
  ValidationError,
  validateConfig
} from '@bfra.me/semantic-release'

try {
  const config = defineConfig({
    branches: ['main'],
    plugins: [
      // Invalid plugin configuration
      ['@semantic-release/npm', { invalidOption: true }]
    ]
  }, { validate: true })

} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Configuration validation failed:')
    error.issues.forEach(issue => {
      console.error(`  - ${issue.path.join('.')}: ${issue.message}`)
    })
  } else {
    console.error('Unexpected error:', error)
  }
  process.exit(1)
}
```

## Best Practices

### 1. Use TypeScript Configuration Files

Always use TypeScript for configuration when possible:

```typescript
// ✅ Good: release.config.ts
import { defineConfig } from '@bfra.me/semantic-release'

export default defineConfig({
  // Configuration with type safety
})
```

```javascript
// ❌ Avoid: release.config.js (no type safety)
module.exports = {
  // No IntelliSense or type checking
}
```

### 2. Enable Validation in Development

```typescript
export default defineConfig({
  // ... configuration
}, {
  validate: process.env.NODE_ENV === 'development',
  environment: process.env.NODE_ENV === 'production' ? 'production' : 'development'
})
```

### 3. Use Presets for Common Workflows

```typescript
// ✅ Good: Use presets for standard workflows
import { npmPreset } from '@bfra.me/semantic-release'

export default npmPreset({
  branches: ['main']
})
```

```typescript
// ❌ Avoid: Manual plugin configuration for standard workflows
export default defineConfig({
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    '@semantic-release/changelog',
    '@semantic-release/npm',
    '@semantic-release/github',
    '@semantic-release/git'
  ]
})
```

### 4. Environment-Specific Configuration

```typescript
import { defineConfig } from '@bfra.me/semantic-release'

const isProduction = process.env.NODE_ENV === 'production'
const isCI = process.env.CI === 'true'

export default defineConfig({
  branches: isProduction ? ['main'] : ['main', 'develop'],
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    ...(isCI ? [
      '@semantic-release/changelog',
      '@semantic-release/npm',
      '@semantic-release/github',
      '@semantic-release/git'
    ] : [])
  ]
}, {
  validate: !isProduction,
  environment: isProduction ? 'production' : 'development'
})
```

### 5. Configuration Organization

For complex projects, organize configurations:

```typescript
// configs/base.ts
export const baseConfig = {
  branches: ['main'],
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator'
  ]
}

// configs/npm.ts
export const npmConfig = {
  plugins: [
    '@semantic-release/changelog',
    '@semantic-release/npm',
    '@semantic-release/git'
  ]
}

// release.config.ts
import { defineConfig, mergeConfigs } from '@bfra.me/semantic-release'
import { baseConfig } from './configs/base'
import { npmConfig } from './configs/npm'

export default defineConfig(
  mergeConfigs(baseConfig, npmConfig)
)
```

### 6. Plugin Configuration Patterns

```typescript
// Extract plugin configurations for reusability
const commitAnalyzerConfig = {
  preset: 'conventionalcommits',
  releaseRules: [
    { type: 'docs', release: false },
    { type: 'style', release: false },
    { type: 'refactor', release: 'patch' }
  ]
}

const githubConfig = {
  assets: ['dist/**', 'docs/**'],
  addReleases: 'bottom'
}

export default defineConfig({
  branches: ['main'],
  plugins: [
    ['@semantic-release/commit-analyzer', commitAnalyzerConfig],
    '@semantic-release/release-notes-generator',
    ['@semantic-release/github', githubConfig]
  ]
})
```

## Next Steps

- **Plugin Development**: Learn how to create custom plugins (guide coming in TASK-043)
- **Advanced Configuration**: Explore advanced configuration patterns (guide coming in TASK-045)
- **CI/CD Integration**: Set up CI/CD workflows (guide coming in TASK-047)
- **Monorepo Setup**: Configure monorepo releases (guide coming in TASK-048)
- **Migration Guide**: Migrate from existing configurations (guide coming in TASK-046)

## Troubleshooting

### Common Issues

1. **TypeScript Compilation Errors**

   ```bash
   # Ensure your tsconfig.json includes the config file
   {
     "include": ["src/**/*", "release.config.ts"]
   }
   ```

2. **Plugin Configuration Type Errors**

   ```typescript
   // Use type assertions for unknown plugin types
   ['@custom/plugin', config as any]
   ```

3. **Validation Failures**

   ```typescript
   // Debug validation issues
   import { validateConfig } from '@bfra.me/semantic-release'

   const result = validateConfig(config)
   if (!result.success) {
     console.log(JSON.stringify(result.error.issues, null, 2))
   }
   ```

For more help, [file an issue](https://github.com/bfra-me/works/issues) on GitHub.
