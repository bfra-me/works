# bfra.me Works

[![Build Status](https://img.shields.io/github/actions/workflow/status/bfra-me/works/main.yaml?style=for-the-badge&label=Build)](https://github.com/bfra-me/works/actions) [![TypeScript](https://img.shields.io/badge/TypeScript-blue?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org) [![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](license.md) [![pnpm](https://img.shields.io/badge/pnpm-workspace-orange?style=for-the-badge&logo=pnpm)](https://pnpm.io)

> A comprehensive toolkit for modern JavaScript and TypeScript development, providing shared configurations, development tools, and utilities for building consistent, high-quality projects.

bfra.me Works is a monorepo containing battle-tested packages that streamline development with opinionated configurations. From ESLint and Prettier setups to a powerful project creation CLI with AI assistance, this toolkit enables teams to maintain professional-grade projects with minimal configuration overhead.

**Key Philosophy**: All packages work independently but are designed to complement each other for a cohesive development experience focused on consistency, quality, and developer productivity.

## Features

- **AI-Powered Project Creation** - Intelligent scaffolding with `@bfra.me/create` CLI
- **Shared Configurations** - Consistent ESLint, Prettier, and TypeScript setups
- **Monorepo Ready** - Optimized for pnpm workspaces and monorepo development
- **Type-Safe by Default** - Strict TypeScript configurations with comprehensive coverage
- **Automated Releases** - Semantic versioning and publishing with changesets
- **Testing Framework** - Vitest-based testing with coverage reporting
- **Modern Tooling** - Built for ES modules, Node.js 20+, and latest standards

## Quick Start

### Create a New Project

```bash
# Use the CLI to scaffold a new project
npx @bfra.me/create my-project

# With specific template and options
npx @bfra.me/create my-library --template library --no-git
```

### Add to Existing Project

```bash
# Install shared ESLint configuration
npm install --save-dev @bfra.me/eslint-config

# Add to your eslint.config.js
import { defineConfig } from '@bfra.me/eslint-config'

export default defineConfig({
  typescript: true,
  prettier: true
})
```

## Packages

| Package | Description | Version |
| --- | --- | --- |
| [`@bfra.me/create`](packages/create/README.md) | AI-powered CLI for creating projects from templates | [![npm](https://img.shields.io/npm/v/@bfra.me/create?style=for-the-badge)](https://www.npmjs.com/package/@bfra.me/create) |
| [`@bfra.me/eslint-config`](packages/eslint-config/readme.md) | Shared ESLint configuration with TypeScript and Prettier support | [![npm](https://img.shields.io/npm/v/@bfra.me/eslint-config?style=for-the-badge)](https://www.npmjs.com/package/@bfra.me/eslint-config) |
| [`@bfra.me/prettier-config`](packages/prettier-config/readme.md) | Opinionated Prettier configuration with multiple variants | [![npm](https://img.shields.io/npm/v/@bfra.me/prettier-config?style=for-the-badge)](https://www.npmjs.com/package/@bfra.me/prettier-config) |
| [`@bfra.me/tsconfig`](packages/tsconfig/readme.md) | Strict TypeScript configurations for libraries and applications | [![npm](https://img.shields.io/npm/v/@bfra.me/tsconfig?style=for-the-badge)](https://www.npmjs.com/package/@bfra.me/tsconfig) |
| [`@bfra.me/semantic-release`](packages/semantic-release/readme.md) | Automated versioning and release configuration | [![npm](https://img.shields.io/npm/v/@bfra.me/semantic-release?style=for-the-badge)](https://www.npmjs.com/package/@bfra.me/semantic-release) |
| [`@bfra.me/badge-config`](packages/badge-config/README.md) | TypeScript API for generating shields.io badge URLs | [![npm](https://img.shields.io/npm/v/@bfra.me/badge-config?style=for-the-badge)](https://www.npmjs.com/package/@bfra.me/badge-config) |

## Usage Examples

### TypeScript Project Setup

```bash
# 1. Create project with AI assistance
npx @bfra.me/create my-app --template typescript

# 2. Or configure existing project
npm install --save-dev @bfra.me/eslint-config @bfra.me/prettier-config @bfra.me/tsconfig
```

#### Configuration Files

`tsconfig.json`:

```json
{
  "extends": "@bfra.me/tsconfig",
  "include": ["src"],
  "exclude": ["dist", "node_modules"]
}
```

`package.json`:

```json
{
  "prettier": "@bfra.me/prettier-config",
  "scripts": {
    "build": "tsc",
    "lint": "eslint src --fix",
    "format": "prettier --write src"
  }
}
```

### Monorepo Configuration

```bash
# Create monorepo structure
npx @bfra.me/create my-monorepo --template monorepo

# Add packages to existing monorepo
npx @bfra.me/create packages/ui --template library
npx @bfra.me/create packages/api --template node
```

#### Root Configuration

`package.json`:

```json
{
  "workspaces": ["packages/*"],
  "scripts": {
    "build": "pnpm -r run build",
    "test": "pnpm -r run test",
    "lint": "pnpm -r run lint"
  }
}
```

### Badge Generation

```typescript
import { buildStatus, coverage, version } from '@bfra.me/badge-config/generators'

// Generate status badges
const buildBadge = buildStatus('passing')
// => https://img.shields.io/badge/build-passing-green

const coverageBadge = coverage(85)
// => https://img.shields.io/badge/coverage-85%25-yellow

const versionBadge = version('1.2.3')
// => https://img.shields.io/badge/version-1.2.3-blue
```

## Development

> [!NOTE]
>
> This project requires Node.js 20+ and pnpm for optimal performance.

### Setup

```bash
# Clone the repository
git clone https://github.com/bfra-me/works.git
cd works

# Install dependencies (use bootstrap, not install)
pnpm bootstrap

# Build all packages
pnpm build
```

### Development Workflow

```bash
# Start development mode (watches all packages)
pnpm dev

# Run tests across all packages
pnpm test

# Lint and fix code
pnpm lint --fix

# Full validation pipeline
pnpm validate
```

### Quality Assurance

```bash
# Type checking
pnpm type-check

# Type coverage reporting
pnpm type-coverage

# Package validation
pnpm lint-packages

# Integration testing
pnpm test
```

## Documentation

- **[Getting Started Guide](docs/src/content/docs/getting-started/introduction.mdx)** - Comprehensive introduction and setup
- **[Configuration Guide](docs/src/content/docs/guides/configuration.mdx)** - Best practices for package configuration
- **[API Reference](docs/src/content/docs/reference/index.mdx)** - Complete API documentation

## Why bfra.me Works?

**For Individual Developers:**

- Skip tedious configuration setup
- Get consistent, professional-grade tooling
- Focus on building features, not fighting tools
- Learn modern development best practices

**For Teams:**

- Standardize development workflows across projects
- Reduce onboarding time for new team members
- Maintain code quality with minimal effort
- Enable faster feature delivery with proven patterns

**For Organizations:**

- Consistent architecture patterns across teams
- Reduced maintenance overhead for tooling
- Built-in best practices for scalability and performance
- Battle-tested configurations used in production
