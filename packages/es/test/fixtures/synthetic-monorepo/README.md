# Synthetic Monorepo Test Fixtures

This directory contains a simulated monorepo structure used for integration testing of `@bfra.me/es` utilities. The structure tests cross-package imports, various module configurations, and common monorepo patterns.

## Structure

```text
synthetic-monorepo/
├── packages/
│   ├── core/                    # Core utilities package (foundation)
│   ├── config/                  # Configuration package (depends on core)
│   ├── types/                   # Shared types package (TypeScript only)
│   ├── cli/                     # CLI tool package (depends on core, config)
│   ├── api-client/              # API client package (depends on types)
│   ├── web-components/          # Web components package (browser target)
│   ├── node-utils/              # Node.js utilities (Node target)
│   ├── testing/                 # Testing utilities package
│   ├── build-tools/             # Build tooling package
│   └── docs-generator/          # Documentation generator (depends on many)
└── apps/
    ├── web-app/                 # Web application (consumes packages)
    └── api-server/              # API server application
```

## Test Scenarios

### Cross-Package Imports

- Verify Result type works across package boundaries
- Test functional composition chains across modules
- Validate type inference across workspace dependencies

### Module Resolution

- ESM modules with subpath exports
- Different `moduleResolution` settings (Node, Bundler, NodeNext)
- Tree-shaking effectiveness validation

### Error Handling Patterns

- Error propagation across package boundaries
- Result type unwrapping in async contexts
- Error context preservation

## Usage in Tests

```typescript
import {getFixturePath} from './helpers'

const corePkg = await import(getFixturePath('packages/core'))
```
