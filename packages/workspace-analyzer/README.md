# @bfra.me/workspace-analyzer

Comprehensive monorepo static analysis for workspace configuration, dependencies, and architecture.

## Features

- **Configuration Analysis**: Detect inconsistencies across `package.json`, `tsconfig.json`, `eslint.config.ts`, and `tsup.config.ts` files
- **Dependency Analysis**: Identify unused dependencies and circular imports with full path reporting
- **Architectural Validation**: Validate against configurable rule sets (layer violations, barrel export misuse)
- **Performance Analysis**: Identify tree-shaking blockers and optimization opportunities
- **Modern CLI**: Interactive TUI using `@clack/prompts` with progress reporting

## Installation

```bash
pnpm add -D @bfra.me/workspace-analyzer
```

## Usage

### CLI

```bash
# Analyze current workspace
npx workspace-analyzer

# Analyze specific path with config
npx workspace-analyzer ./my-monorepo --config workspace-analyzer.config.ts

# Output as JSON for CI integration
npx workspace-analyzer --json > analysis-report.json
```

### Programmatic API

```typescript
import {analyzeWorkspace} from '@bfra.me/workspace-analyzer'

const result = await analyzeWorkspace('./my-monorepo', {
  categories: ['dependency', 'circular-import'],
  minSeverity: 'warning',
})

if (result.success) {
  console.log(`Found ${result.data.summary.totalIssues} issues`)
  for (const issue of result.data.issues) {
    console.log(`${issue.severity}: ${issue.title}`)
  }
}
```

## Configuration

Create a `workspace-analyzer.config.ts` file in your workspace root:

```typescript
import {defineConfig} from '@bfra.me/workspace-analyzer'

export default defineConfig({
  include: ['packages/**'],
  exclude: ['**/node_modules/**', '**/lib/**'],
  minSeverity: 'warning',
  categories: ['dependency', 'configuration', 'architecture'],
  rules: {
    'no-circular-imports': 'error',
    'no-unused-deps': 'warning',
    'explicit-exports': 'error',
  },
})
```

## Issue Categories

- `configuration` - Package.json, tsconfig.json, and build config inconsistencies
- `dependency` - Unused, duplicate, or misversioned dependencies
- `architecture` - Layer violations, barrel export misuse, public API violations
- `performance` - Tree-shaking blockers, large dependencies
- `circular-import` - Circular dependency chains
- `unused-export` - Exports not used within the workspace
- `type-safety` - TypeScript configuration issues

## License

MIT © [Marcus R. Brown](https://github.com/marcusrbrown)
