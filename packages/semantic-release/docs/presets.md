# Preset Documentation

This guide provides comprehensive documentation for all available presets in `@bfra.me/semantic-release`, including usage examples, customization options, and best practices for each preset type.

## Table of Contents

- [Overview](#overview)
- [Base Preset Options](#base-preset-options)
- [NPM Package Preset](#npm-package-preset)
- [GitHub-Only Preset](#github-only-preset)
- [Monorepo Preset](#monorepo-preset)
- [Development Preset](#development-preset)
- [Preset Composition](#preset-composition)
- [Advanced Customization](#advanced-customization)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

Presets in `@bfra.me/semantic-release` provide pre-configured workflows for common release scenarios. Each preset encapsulates best practices and proven configurations, enabling quick setup with minimal configuration while still allowing extensive customization when needed.

**Available Presets:**

| Preset | Purpose | Key Features |
|--------|---------|--------------|
| `npmPreset` | Standard npm packages | Full npm workflow, changelog, GitHub releases |
| `githubPreset` | GitHub-only releases | No npm publishing, minimal setup |
| `monorepoPreset` | Monorepo packages | Package-specific tagging, changesets integration |
| `developmentPreset` | Development/testing | Dry-run mode, enhanced debugging |

All presets support [Base Preset Options](#base-preset-options) for consistent customization across different workflows.

## Base Preset Options

All presets inherit from `BasePresetOptions`, providing common configuration patterns:

```typescript
interface BasePresetOptions {
  branches?: GlobalConfig['branches']
  repositoryUrl?: string
  dryRun?: boolean
  defineOptions?: DefineConfigOptions
}
```

### Common Options

#### `branches` Configuration

Control which branches trigger releases and their behavior:

```typescript
// Simple main branch only
branches: ['main']

// Production + prerelease branches
branches: [
  'main',
  { name: 'beta', prerelease: true },
  { name: 'alpha', prerelease: 'alpha' }
]

// Complex branch strategy
branches: [
  'main',
  'master',
  { name: 'next', prerelease: true },
  { name: 'beta', prerelease: 'beta' },
  { name: 'alpha', prerelease: 'alpha' },
  { name: 'maintenance', range: '1.x.x' }
]
```

#### `repositoryUrl` Override

Specify repository URL when auto-detection fails:

```typescript
// HTTPS format
repositoryUrl: 'https://github.com/owner/repo.git'

// SSH format
repositoryUrl: 'git@github.com:owner/repo.git'

// GitHub Enterprise
repositoryUrl: 'https://github.enterprise.com/owner/repo.git'
```

#### `dryRun` Mode

Test configurations without publishing:

```typescript
// Always dry-run
dryRun: true

// Environment-based
dryRun: process.env.NODE_ENV !== 'production'

// CI-based
dryRun: !process.env.CI || process.env.GITHUB_REF !== 'refs/heads/main'
```

#### `defineOptions` Configuration

Advanced configuration options:

```typescript
defineOptions: {
  validate: true,           // Enable strict validation
  environment: 'production', // Set environment context
  logLevel: 'info'          // Control logging verbosity
}
```

## NPM Package Preset

The **NPM Package Preset** provides a complete workflow for standard npm packages, including changelog generation, npm publishing, and GitHub releases.

### Features

- **Conventional Commit Analysis** - Automated release type detection
- **Release Notes Generation** - Automated changelog from commits
- **CHANGELOG.md Maintenance** - Persistent changelog file
- **NPM Publishing** - Automated package publishing to npm registry
- **GitHub Releases** - GitHub releases with generated notes
- **Git Commits** - Commits changelog changes back to repository

### Included Plugins

1. `@semantic-release/commit-analyzer` - Analyzes commits for release type
2. `@semantic-release/release-notes-generator` - Generates release notes
3. `@semantic-release/changelog` - Maintains CHANGELOG.md file
4. `@semantic-release/npm` - Publishes to npm registry
5. `@semantic-release/github` - Creates GitHub releases
6. `@semantic-release/git` - Commits changelog changes back to repository

### Basic Usage

```typescript
import { npmPreset } from '@bfra.me/semantic-release'

// Minimal configuration
export default npmPreset()

// With custom branches
export default npmPreset({
  branches: ['main']
})
```

### Common Configurations

#### Standard Package

```typescript
import { npmPreset } from '@bfra.me/semantic-release'

export default npmPreset({
  branches: ['main'],
  repositoryUrl: 'https://github.com/user/my-package'
})
```

#### Package with Prerelease Support

```typescript
import { npmPreset } from '@bfra.me/semantic-release'

export default npmPreset({
  branches: [
    'main',
    { name: 'beta', prerelease: true },
    { name: 'alpha', prerelease: true }
  ],
  repositoryUrl: 'https://github.com/user/my-package'
})
```

#### Testing Configuration

```typescript
import { npmPreset } from '@bfra.me/semantic-release'

export default npmPreset({
  branches: ['main'],
  dryRun: true, // Test without publishing
  defineOptions: {
    validate: true // Enable strict validation
  }
})
```

#### Production-Ready Configuration

```typescript
import { npmPreset } from '@bfra.me/semantic-release'

export default npmPreset({
  branches: [
    'main',
    { name: 'next', prerelease: true },
    { name: 'beta', prerelease: 'beta' },
    { name: 'alpha', prerelease: 'alpha' }
  ],
  repositoryUrl: 'https://github.com/org/production-package',
  dryRun: process.env.NODE_ENV !== 'production',
  defineOptions: {
    validate: true,
    environment: process.env.NODE_ENV || 'development'
  }
})
```

### Best Practices

- Use semantic branch names (`main`, `beta`, `alpha`)
- Enable validation in development with `defineOptions.validate: true`
- Test with `dryRun: true` before production deployment
- Ensure proper npm registry authentication for publishing
- Use descriptive commit messages following conventional commits

## GitHub-Only Preset

The **GitHub-Only Preset** is optimized for projects that only need GitHub releases without npm publishing or local file modifications.

### GitHub Preset Features

- **Minimal Setup** - Only essential plugins for GitHub releases
- **No File Modifications** - Doesn't change local files or commit back
- **Fast Execution** - Streamlined workflow for quick releases
- **Flexible Assets** - Support for release asset uploads

### GitHub Preset Use Cases

- Applications that don't publish to package registries
- Docker-based projects
- Binary releases and distributions
- Documentation sites
- Static websites

### GitHub Preset Plugins

1. `@semantic-release/commit-analyzer` - Analyzes commits for release type
2. `@semantic-release/release-notes-generator` - Generates release notes
3. `@semantic-release/github` - Creates GitHub releases with assets

### GitHub Preset Usage

```typescript
import { githubPreset } from '@bfra.me/semantic-release'

// Minimal GitHub releases
export default githubPreset()

// With custom branches
export default githubPreset({
  branches: ['main']
})
```

### GitHub Preset Configurations

#### Basic GitHub Releases

```typescript
import { githubPreset } from '@bfra.me/semantic-release'

export default githubPreset({
  branches: ['main'],
  repositoryUrl: 'https://github.com/user/my-project'
})
```

#### Application Releases

```typescript
import { githubPreset } from '@bfra.me/semantic-release'

export default githubPreset({
  branches: [
    'main',
    { name: 'beta', prerelease: true }
  ],
  repositoryUrl: 'https://github.com/user/my-app'
})
```

#### Binary Distribution

```typescript
import { githubPreset } from '@bfra.me/semantic-release'

// Note: Asset upload is configured via GitHub plugin options
// when using the composition system or manual plugin configuration
export default githubPreset({
  branches: ['main', 'develop'],
  repositoryUrl: 'https://github.com/user/binary-releases'
})
```

#### Documentation Site

```typescript
import { githubPreset } from '@bfra.me/semantic-release'

export default githubPreset({
  branches: [
    'main',
    { name: 'staging', prerelease: 'rc' }
  ],
  repositoryUrl: 'https://github.com/user/docs-site',
  dryRun: process.env.NODE_ENV === 'development'
})
```

### Customization with Assets

To add release assets, compose with additional GitHub plugin configuration:

```typescript
import { githubPreset, extendConfig } from '@bfra.me/semantic-release'

const baseConfig = githubPreset({
  branches: ['main'],
  repositoryUrl: 'https://github.com/user/my-project'
})

export default extendConfig(baseConfig, {
  plugins: [
    ...baseConfig.plugins.slice(0, -1), // All plugins except GitHub
    [
      '@semantic-release/github',
      {
        assets: [
          { path: 'dist/*.zip', label: 'Distribution archives' },
          { path: 'docs/**', label: 'Documentation' },
          'CHANGELOG.md'
        ]
      }
    ]
  ]
})
```

### GitHub Preset Best Practices

- Use for projects that don't need npm publishing
- Perfect for applications, tools, and documentation
- Combine with build processes for asset generation
- Consider using with Docker workflows for container releases
- Test release asset paths in development environment

## Monorepo Preset

The **Monorepo Preset** is specifically designed for packages within a monorepo, supporting package-specific tagging, conditional publishing, and seamless integration with changesets workflow.

### Monorepo Preset Features

- **Package-Specific Tagging** - Tags releases with package names
- **Changesets Integration** - Optimized for coordinated monorepo releases
- **Conditional Publishing** - Only publish when changes exist
- **Workspace-Aware Configuration** - Respects package root directories
- **Monorepo-Optimized Release Notes** - Package-specific release notes

### Monorepo Extended Options

```typescript
interface MonorepoPresetOptions extends BasePresetOptions {
  pkgRoot?: string                    // Package root directory
  packageName?: string                // Package name for tagging
  changesetsIntegration?: boolean     // Enable changesets integration
  publishOnlyIfChanged?: boolean      // Conditional publishing
  releaseNotesTemplate?: string       // Custom release notes template
}
```

### Monorepo Preset Plugins

1. `@semantic-release/commit-analyzer` - With monorepo-specific rules
2. `@semantic-release/release-notes-generator` - Package-aware release notes
3. `@semantic-release/npm` - With package root support
4. `@semantic-release/github` - Package-specific releases
5. `@semantic-release/git` - Monorepo-aware commits

### Monorepo Preset Usage

```typescript
import { monorepoPreset } from '@bfra.me/semantic-release'

// Basic monorepo package
export default monorepoPreset({
  branches: ['main'],
  packageName: '@org/package-name'
})
```

### Monorepo Preset Configurations

#### Standard Monorepo Package

```typescript
import { monorepoPreset } from '@bfra.me/semantic-release'

export default monorepoPreset({
  branches: ['main'],
  packageName: '@my-org/core-package',
  repositoryUrl: 'https://github.com/my-org/monorepo',
  pkgRoot: 'packages/core'
})
```

#### With Changesets Integration

```typescript
import { monorepoPreset } from '@bfra.me/semantic-release'

export default monorepoPreset({
  branches: ['main'],
  packageName: '@my-org/utils',
  repositoryUrl: 'https://github.com/my-org/monorepo',
  pkgRoot: 'packages/utils',
  changesetsIntegration: true,
  publishOnlyIfChanged: true
})
```

#### Complex Monorepo Workflow

```typescript
import { monorepoPreset } from '@bfra.me/semantic-release'

export default monorepoPreset({
  branches: [
    'main',
    { name: 'develop', prerelease: 'dev' },
    { name: 'beta', prerelease: 'beta' }
  ],
  packageName: '@enterprise/api-client',
  repositoryUrl: 'https://github.com/enterprise/platform',
  pkgRoot: 'packages/api-client',
  changesetsIntegration: true,
  publishOnlyIfChanged: true,
  releaseNotesTemplate: `
## Changes in @enterprise/api-client@\${nextRelease.version}

\${nextRelease.notes}

### Installation
\`\`\`bash
npm install @enterprise/api-client@\${nextRelease.version}
\`\`\`
  `
})
```

#### Development Workflow

```typescript
import { monorepoPreset } from '@bfra.me/semantic-release'

export default monorepoPreset({
  branches: ['develop', 'feature/*'],
  packageName: '@my-org/experimental',
  pkgRoot: 'packages/experimental',
  dryRun: true, // Always dry-run for development
  changesetsIntegration: false, // Disable for feature development
  defineOptions: {
    validate: true,
    environment: 'development'
  }
})
```

### Changesets Integration

When `changesetsIntegration: true` is enabled:

#### Optimized Release Rules

```typescript
// Additional commit analyzer rules for changesets
{
  type: 'chore',
  scope: 'changeset',
  release: false
},
{
  type: 'docs',
  scope: 'changeset',
  release: false
}
```

#### Package-Aware Success Comments

```typescript
// Changesets-aware GitHub success comment
'This ${issue.pull_request ? "PR is included" : "issue has been resolved"} in ${packageName}@${nextRelease.version} :tada:'
```

#### Conditional Publishing

```typescript
// Only publish if package.json version changed
publishOnly: publishOnlyIfChanged
```

### Package-Specific Tagging

The monorepo preset automatically creates package-specific tags:

```bash
# Standard package release
@my-org/package-name@1.2.3

# Prerelease
@my-org/package-name@1.2.3-beta.1
```

### Monorepo Preset Best Practices

- Always specify `packageName` for proper tagging
- Use `pkgRoot` to define package boundaries
- Enable `changesetsIntegration` for coordinated releases
- Set `publishOnlyIfChanged: true` to avoid empty releases
- Use consistent branch strategies across packages
- Consider package dependencies when planning releases

## Development Preset

The **Development Preset** is optimized for development and testing scenarios with dry-run enabled and enhanced debugging capabilities.

### Development Preset Features

- **Always Dry-Run** - Never publishes, only analyzes
- **Enhanced Debugging** - Verbose logging and debug information
- **CI Disabled** - Bypasses CI environment checks
- **Minimal Plugin Set** - Only essential plugins for analysis
- **Development Environment** - Optimized for local development

### Development Preset Configuration

```typescript
// Fixed configuration applied by development preset
{
  dryRun: true,        // Always enabled
  ci: false,           // Disable CI checks
  debug: true,         // Enable debug mode
  environment: 'development',
  validate: true       // Enable strict validation
}
```

### Development Preset Plugins

1. `@semantic-release/commit-analyzer` - Analyzes commits for release type
2. `@semantic-release/release-notes-generator` - Generates release notes

**Note:** No publishing plugins (npm, GitHub, git) are included to prevent accidental releases.

### Development Preset Usage

```typescript
import { developmentPreset } from '@bfra.me/semantic-release'

// Development preset with defaults
export default developmentPreset()

// With custom branches
export default developmentPreset({
  branches: ['develop', 'feature/*']
})
```

### Development Preset Configurations

#### Feature Development

```typescript
import { developmentPreset } from '@bfra.me/semantic-release'

export default developmentPreset({
  branches: [
    'develop',
    'feature/*',
    { name: 'experimental', prerelease: 'exp' }
  ],
  repositoryUrl: 'https://github.com/user/my-project'
})
```

#### Release Testing

```typescript
import { developmentPreset } from '@bfra.me/semantic-release'

export default developmentPreset({
  branches: ['main', 'develop'],
  repositoryUrl: 'https://github.com/user/my-package',
  defineOptions: {
    validate: true,
    logLevel: 'debug'
  }
})
```

#### CI Pipeline Testing

```typescript
import { developmentPreset } from '@bfra.me/semantic-release'

// Use development preset in test environments
export default developmentPreset({
  branches: process.env.CI
    ? ['main']
    : ['develop', 'feature/*'],
  repositoryUrl: process.env.GITHUB_REPOSITORY
    ? `https://github.com/${process.env.GITHUB_REPOSITORY}`
    : undefined
})
```

### Output Analysis

The development preset provides detailed analysis without side effects:

```bash
# Example output
✓ Analyze commits for release type
✓ Generate release notes
ℹ Next release version: 1.2.3
ℹ Release type: minor
ℹ Release notes:
## Features
- Add new API endpoint for user management

## Bug Fixes
- Fix authentication token validation

[Dry-run] No actual release performed
```

### Development Preset Best Practices

- Use for local development and testing
- Perfect for validating commit messages and release notes
- Combine with other presets for CI/CD pipeline testing
- Use to verify semantic-release configuration before production
- Helpful for training and onboarding team members

## Preset Composition

Presets can be combined and extended using the composition utilities provided by `@bfra.me/semantic-release`.

### Merging Presets

```typescript
import {
  npmPreset,
  githubPreset,
  monorepoPreset,
  mergeConfigs
} from '@bfra.me/semantic-release'

// Combine multiple presets
const baseNpm = npmPreset({
  branches: ['main'],
  repositoryUrl: 'https://github.com/user/package'
})

const githubEnhanced = githubPreset({
  branches: ['main', 'beta']
})

const monorepoFeatures = monorepoPreset({
  packageName: '@user/package',
  pkgRoot: 'packages/main'
})

// Merge configurations
export default mergeConfigs(baseNpm, githubEnhanced, monorepoFeatures)
```

### Extending Presets

```typescript
import { npmPreset, extendConfig } from '@bfra.me/semantic-release'

const baseConfig = npmPreset({
  branches: ['main'],
  repositoryUrl: 'https://github.com/user/package'
})

// Extend with additional plugins
export default extendConfig(baseConfig, {
  plugins: [
    ...baseConfig.plugins,
    [
      '@semantic-release/exec',
      {
        publishCmd: 'npm run deploy:production'
      }
    ],
    [
      'semantic-release-slack-bot',
      {
        notifyOnSuccess: true,
        slackWebhook: process.env.SLACK_WEBHOOK
      }
    ]
  ]
})
```

### Environment-Specific Composition

```typescript
import {
  npmPreset,
  developmentPreset,
  mergeConfigs
} from '@bfra.me/semantic-release'

const baseConfig = npmPreset({
  branches: ['main'],
  repositoryUrl: 'https://github.com/user/package'
})

// Use development preset in non-production environments
if (process.env.NODE_ENV !== 'production') {
  const devConfig = developmentPreset({
    branches: ['develop', 'feature/*']
  })

  export default mergeConfigs(baseConfig, devConfig)
} else {
  export default baseConfig
}
```

## Advanced Customization

### Custom Plugin Configuration

Override default plugin configurations while maintaining preset structure:

```typescript
import { npmPreset, replacePlugin } from '@bfra.me/semantic-release'

const config = npmPreset({
  branches: ['main'],
  repositoryUrl: 'https://github.com/user/package'
})

// Replace default changelog plugin with custom configuration
export default replacePlugin(config, '@semantic-release/changelog', {
  changelogFile: 'HISTORY.md',
  changelogTitle: '# Release History'
})
```

### Environment-Based Configuration

```typescript
import { npmPreset } from '@bfra.me/semantic-release'

const isProduction = process.env.NODE_ENV === 'production'
const isBeta = process.env.RELEASE_CHANNEL === 'beta'

export default npmPreset({
  branches: isProduction
    ? ['main']
    : isBeta
    ? ['beta']
    : ['develop'],
  dryRun: !isProduction,
  repositoryUrl: 'https://github.com/user/package',
  defineOptions: {
    validate: !isProduction,
    environment: process.env.NODE_ENV || 'development',
    logLevel: isProduction ? 'info' : 'debug'
  }
})
```

### Conditional Plugin Loading

```typescript
import {
  createConfigBuilder,
  npmPreset,
  extendConfig
} from '@bfra.me/semantic-release'

const baseConfig = npmPreset({
  branches: ['main'],
  repositoryUrl: 'https://github.com/user/package'
})

// Add conditional plugins based on environment
const plugins = [...baseConfig.plugins]

if (process.env.SLACK_WEBHOOK) {
  plugins.push([
    'semantic-release-slack-bot',
    {
      notifyOnSuccess: true,
      slackWebhook: process.env.SLACK_WEBHOOK
    }
  ])
}

if (process.env.DEPLOY_ENABLED === 'true') {
  plugins.push([
    '@semantic-release/exec',
    {
      publishCmd: 'npm run deploy'
    }
  ])
}

export default extendConfig(baseConfig, { plugins })
```

## Implementation Best Practices

### Choosing the Right Preset

| Use Case | Recommended Preset | Key Considerations |
|----------|-------------------|-------------------|
| Standard npm package | `npmPreset` | Full workflow with changelog |
| Application/tool | `githubPreset` | No npm publishing needed |
| Monorepo package | `monorepoPreset` | Package-specific tagging |
| Development/testing | `developmentPreset` | Safe dry-run mode |

### Configuration Guidelines

1. **Start with Presets** - Use presets as foundation, customize as needed
2. **Test with Dry-Run** - Always test configurations before production
3. **Environment Awareness** - Use environment variables for conditional logic
4. **Validate Configurations** - Enable validation in development environments
5. **Document Customizations** - Document any preset modifications for team clarity

### Common Patterns

#### Multi-Environment Setup

```typescript
// release.config.mjs
import {
  npmPreset,
  developmentPreset,
  mergeConfigs
} from '@bfra.me/semantic-release'

const environment = process.env.NODE_ENV || 'development'

const baseConfig = {
  branches: ['main'],
  repositoryUrl: 'https://github.com/user/package'
}

switch (environment) {
  case 'production':
    export default npmPreset(baseConfig)

  case 'staging':
    export default npmPreset({
      ...baseConfig,
      branches: ['staging'],
      dryRun: true
    })

  default:
    export default developmentPreset({
      ...baseConfig,
      branches: ['develop', 'feature/*']
    })
}
```

#### Monorepo with Package-Specific Configs

```typescript
// packages/core/release.config.mjs
import { monorepoPreset } from '@bfra.me/semantic-release'

export default monorepoPreset({
  packageName: '@my-org/core',
  pkgRoot: 'packages/core',
  changesetsIntegration: true,
  branches: ['main']
})
```

```typescript
// packages/utils/release.config.mjs
import { monorepoPreset } from '@bfra.me/semantic-release'

export default monorepoPreset({
  packageName: '@my-org/utils',
  pkgRoot: 'packages/utils',
  changesetsIntegration: true,
  branches: ['main']
})
```

## Troubleshooting

### Common Issues

#### Preset Not Found

```bash
Error: Cannot resolve preset 'unknown'
```

**Solution:** Verify preset name and import path:

```typescript
// ✅ Correct
import { npmPreset } from '@bfra.me/semantic-release'

// ❌ Incorrect
import { unknownPreset } from '@bfra.me/semantic-release'
```

#### Configuration Validation Errors

```bash
ValidationError: Invalid configuration option "branches"
```

**Solution:** Check branch configuration format:

```typescript
// ✅ Correct
branches: [
  'main',
  { name: 'beta', prerelease: true }
]

// ❌ Incorrect
branches: [
  'main',
  { branch: 'beta', prerelease: true } // Should be 'name', not 'branch'
]
```

#### Plugin Configuration Conflicts

```bash
Error: Plugin @semantic-release/npm configuration is invalid
```

**Solution:** Use preset composition to resolve conflicts:

```typescript
import { npmPreset, replacePlugin } from '@bfra.me/semantic-release'

const config = npmPreset()

// Replace conflicting plugin configuration
export default replacePlugin(config, '@semantic-release/npm', {
  // Custom npm configuration
  publishFlag: '--access=public'
})
```

#### Monorepo Tag Format Issues

```bash
Error: Invalid tag format for monorepo
```

**Solution:** Ensure package name is provided:

```typescript
// ✅ Correct
export default monorepoPreset({
  packageName: '@org/package-name', // Required for monorepo
  pkgRoot: 'packages/package-name'
})

// ❌ Missing package name
export default monorepoPreset({
  pkgRoot: 'packages/package-name' // packageName missing
})
```

### Debug Mode

Enable debug mode for detailed troubleshooting:

```typescript
import { npmPreset } from '@bfra.me/semantic-release'

export default npmPreset({
  branches: ['main'],
  defineOptions: {
    validate: true,
    logLevel: 'debug'
  }
})
```

### Validation Mode

Use strict validation to catch configuration issues early:

```typescript
import { validateCompleteConfig } from '@bfra.me/semantic-release'
import { npmPreset } from '@bfra.me/semantic-release'

const config = npmPreset({
  branches: ['main']
})

// Validate configuration before use
try {
  validateCompleteConfig(config)
  console.log('✅ Configuration is valid')
} catch (error) {
  console.error('❌ Configuration error:', error.message)
  process.exit(1)
}

export default config
```

For additional troubleshooting, refer to the [Getting Started Guide](getting-started.md) and [Plugin Development Tutorial](plugin-development.md).
