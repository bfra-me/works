# @bfra.me/semantic-release

> Comprehensive TypeScript-first semantic-release configuration with type safety, validation, and modern development patterns.

## Features

- **TypeScript-First**: Full type safety with IntelliSense support for all configurations
- **Runtime Validation**: Catch configuration errors early with Zod-based validation
- **Preset System**: Pre-configured workflows for npm packages, GitHub releases, and monorepos
- **Plugin Development**: Complete toolkit for creating custom semantic-release plugins
- **Configuration Composition**: Fluent API and composition utilities for complex setups
- **Environment Awareness**: Automatic environment detection and configuration optimization

## Quick Start

### Installation

```sh
# npm
npm install --save-dev @bfra.me/semantic-release semantic-release

# pnpm
pnpm add --save-dev @bfra.me/semantic-release semantic-release

# yarn
yarn add --dev @bfra.me/semantic-release semantic-release
```

### Basic Usage

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

### Using Presets

```typescript
// NPM package preset
import { npmPreset } from '@bfra.me/semantic-release'

export default npmPreset({
  branches: ['main', { name: 'beta', prerelease: true }],
  repositoryUrl: 'https://github.com/user/package'
})
```

### Builder Pattern

```typescript
// Fluent API for complex configurations
import { createConfigBuilder } from '@bfra.me/semantic-release/builder'

export default createConfigBuilder()
  .branches(['main', 'beta'])
  .plugins()
    .commitAnalyzer()
    .releaseNotesGenerator()
    .changelog()
    .npm()
    .github()
    .git()
  .build()
```

## Documentation

- **[Getting Started Guide](./docs/getting-started.md)** - Comprehensive guide to TypeScript semantic-release configuration
- **[API Reference](./src/index.ts)** - Complete TypeScript API documentation
- **Migration Guide** - Coming in TASK-046
- **Plugin Development Tutorial** - Coming in TASK-043

## API Overview

### Configuration Methods

- `defineConfig()` - Main configuration function with validation and type safety
- `createConfigBuilder()` - Fluent API builder pattern
- `createConfig()` - Factory function for JavaScript configurations

### Available Presets

- `npmPreset()` - Complete npm package workflow
- `githubPreset()` - GitHub releases only
- `monorepoPreset()` - Monorepo-aware configuration
- `developmentPreset()` - Development and pre-release workflows

### Configuration Composition

- `mergeConfigs()` - Merge multiple configurations
- `extendConfig()` - Extend base configurations
- `overrideConfig()` - Override specific options

### Validation & Testing

- `validateConfig()` - Runtime configuration validation
- `validateCompleteConfig()` - Comprehensive validation with plugins
- Plugin testing utilities and mock contexts

## TypeScript Support

Full TypeScript definitions are provided for:

- All semantic-release core configuration options
- Popular plugin configurations (@semantic-release/\*)
- Custom plugin development interfaces
- Runtime validation schemas
- Environment and context typing

Code editors with TypeScript support will provide IntelliSense, error checking, and auto-completion for all configuration options.

## License

[MIT](../../LICENSE.md)
