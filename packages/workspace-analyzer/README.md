# @bfra.me/workspace-analyzer

Comprehensive monorepo static analysis for workspace configuration, dependencies, and architecture.

## Features

- **Configuration Analysis**: Detect inconsistencies across `package.json`, `tsconfig.json`, `eslint.config.ts`, and `tsup.config.ts` files
- **Dependency Analysis**: Identify unused dependencies and circular imports with full path reporting
- **Architectural Validation**: Validate against configurable rule sets (layer violations, barrel export misuse)
- **Performance Analysis**: Identify tree-shaking blockers, large dependencies, and dead code
- **Modern CLI**: Interactive TUI using `@clack/prompts` with progress reporting
- **Incremental Analysis**: Caching support for fast re-analysis of large codebases
- **Multiple Output Formats**: Console, JSON, and Markdown report generation

## Installation

```bash
pnpm add -D @bfra.me/workspace-analyzer
```

## Quick Start

```bash
# Analyze current workspace
npx workspace-analyzer

# Interactive mode with package selection
npx workspace-analyzer --interactive

# CI-friendly JSON output
npx workspace-analyzer --json > analysis-report.json
```

## CLI Usage

The CLI provides a modern, interactive experience powered by `@clack/prompts`:

```bash
# Basic analysis
workspace-analyzer [path]

# With configuration file
workspace-analyzer --config workspace-analyzer.config.ts

# Output formats
workspace-analyzer --json          # JSON output
workspace-analyzer --markdown      # Markdown report

# Filtering options
workspace-analyzer --min-severity warning
workspace-analyzer --categories dependency,architecture

# Analysis control
workspace-analyzer --no-cache      # Disable caching
workspace-analyzer --verbose       # Detailed output
workspace-analyzer --dry-run       # Preview without analysis
```

### CLI Options

| Option                   | Description                                                 |
| ------------------------ | ----------------------------------------------------------- |
| `--config <path>`        | Path to configuration file                                  |
| `--json`                 | Output results as JSON                                      |
| `--markdown`             | Output results as Markdown                                  |
| `--min-severity <level>` | Minimum severity to report (info, warning, error, critical) |
| `--categories <list>`    | Comma-separated categories to analyze                       |
| `--include <patterns>`   | Glob patterns for files to include                          |
| `--exclude <patterns>`   | Glob patterns for files to exclude                          |
| `--no-cache`             | Disable incremental analysis caching                        |
| `--cache-dir <path>`     | Custom cache directory                                      |
| `--concurrency <n>`      | Maximum parallel operations                                 |
| `--verbose`              | Enable verbose logging                                      |
| `--quiet`                | Suppress non-essential output                               |
| `--dry-run`              | Preview analysis without executing                          |
| `--interactive`          | Interactive package selection                               |
| `--fix`                  | Apply auto-fixes where available (placeholder)              |

## Programmatic API

### `analyzeWorkspace(path, options)`

Analyzes an entire workspace for issues.

```typescript
import {analyzeWorkspace} from '@bfra.me/workspace-analyzer'

const result = await analyzeWorkspace('./my-monorepo', {
  minSeverity: 'warning',
  categories: ['dependency', 'architecture'],
  onProgress: (progress) => {
    console.log(`${progress.phase}: ${progress.processed}/${progress.total}`)
  },
})

if (result.success) {
  console.log(`Found ${result.data.summary.totalIssues} issues`)
  for (const issue of result.data.issues) {
    console.log(`[${issue.severity}] ${issue.title}`)
    console.log(`  ${issue.location.filePath}:${issue.location.line}`)
    if (issue.suggestion) {
      console.log(`  Fix: ${issue.suggestion}`)
    }
  }
} else {
  console.error(`Analysis failed: ${result.error.message}`)
}
```

### `analyzePackages(path, packageNames, options)`

Analyzes specific packages within a workspace.

```typescript
import {analyzePackages} from '@bfra.me/workspace-analyzer'

const result = await analyzePackages('./my-monorepo', [
  '@myorg/core',
  '@myorg/utils',
])

if (result.success) {
  console.log(`Analyzed ${result.data.summary.packagesAnalyzed} packages`)
}
```

### `defineConfig(config)`

Type-safe configuration helper.

```typescript
import {defineConfig} from '@bfra.me/workspace-analyzer'

export default defineConfig({
  minSeverity: 'warning',
  categories: ['dependency', 'architecture'],
})
```

## Configuration

Create a `workspace-analyzer.config.ts` file in your workspace root:

```typescript
import {defineConfig} from '@bfra.me/workspace-analyzer'

export default defineConfig({
  // File patterns
  include: ['**/*.ts', '**/*.tsx'],
  exclude: ['**/node_modules/**', '**/lib/**', '**/dist/**'],

  // Analysis settings
  minSeverity: 'warning',
  categories: ['dependency', 'configuration', 'architecture'],

  // Performance
  cache: true,
  cacheDir: '.workspace-analyzer-cache',
  concurrency: 4,

  // Package patterns (for monorepo scanning)
  packagePatterns: ['packages/*', 'apps/*'],

  // Per-analyzer configuration
  analyzers: {
    'circular-import': {enabled: true, severity: 'error'},
    'unused-dependency': {enabled: true, severity: 'warning'},
    'config-consistency': {enabled: true},
    'tree-shaking-blocker': {enabled: true},
    'dead-code': {enabled: false}, // Disable specific analyzer
  },

  // Architectural rules
  architecture: {
    layers: [
      {name: 'domain', patterns: ['**/domain/**'], allowedImports: []},
      {name: 'application', patterns: ['**/application/**'], allowedImports: ['domain']},
      {name: 'infrastructure', patterns: ['**/infrastructure/**'], allowedImports: ['domain', 'application']},
    ],
    allowBarrelExports: ['**/index.ts'],
    enforcePublicApi: true,
  },
})
```

### Configuration File Names

The analyzer searches for configuration in these files (in order):

- `workspace-analyzer.config.ts`
- `workspace-analyzer.config.js`
- `workspace-analyzer.config.mjs`
- `workspace-analyzer.config.cjs`

## Built-in Analyzers

### Configuration Analyzers

| Analyzer             | Description                                            |
| -------------------- | ------------------------------------------------------ |
| `package-json`       | Validates package.json structure, exports, and scripts |
| `tsconfig`           | Checks TypeScript configuration consistency            |
| `eslint-config`      | Validates ESLint configuration patterns                |
| `build-config`       | Analyzes tsup/build configuration                      |
| `config-consistency` | Cross-validates configuration across files             |
| `version-alignment`  | Checks dependency version consistency across packages  |
| `exports-field`      | Validates exports field against actual source files    |

### Dependency Analyzers

| Analyzer               | Description                                           |
| ---------------------- | ----------------------------------------------------- |
| `unused-dependency`    | Detects dependencies declared but not imported        |
| `circular-import`      | Finds circular import chains using Tarjan's algorithm |
| `peer-dependency`      | Validates peer dependency declarations                |
| `duplicate-dependency` | Finds duplicate dependencies across packages          |

### Architectural Analyzers

| Analyzer        | Description                                       |
| --------------- | ------------------------------------------------- |
| `architectural` | Enforces layer boundaries and import restrictions |

### Performance Analyzers

| Analyzer               | Description                                           |
| ---------------------- | ----------------------------------------------------- |
| `tree-shaking-blocker` | Detects patterns that prevent tree-shaking            |
| `dead-code`            | Finds unreachable/unused exports                      |
| `duplicate-code`       | Identifies similar code blocks via AST fingerprinting |
| `large-dependency`     | Flags large dependencies that may impact bundle size  |

## Issue Categories

| Category          | Description                                               |
| ----------------- | --------------------------------------------------------- |
| `configuration`   | Package.json, tsconfig.json, and build config issues      |
| `dependency`      | Unused, duplicate, or misversioned dependencies           |
| `architecture`    | Layer violations, barrel export misuse, public API issues |
| `performance`     | Tree-shaking blockers, large dependencies                 |
| `circular-import` | Circular dependency chains                                |
| `unused-export`   | Exports not used within the workspace                     |
| `type-safety`     | TypeScript configuration issues                           |

## Severity Levels

| Level      | Description                                         |
| ---------- | --------------------------------------------------- |
| `info`     | Informational findings, suggestions for improvement |
| `warning`  | Potential issues that should be reviewed            |
| `error`    | Problems that should be fixed                       |
| `critical` | Severe issues requiring immediate attention         |

## Architectural Rules

### Layer Violation Rule

Enforces architectural layer boundaries:

```typescript
defineConfig({
  architecture: {
    layers: [
      {name: 'domain', patterns: ['**/domain/**'], allowedImports: []},
      {name: 'application', patterns: ['**/app/**'], allowedImports: ['domain']},
      {name: 'infrastructure', patterns: ['**/infra/**'], allowedImports: ['domain', 'application']},
    ],
  },
})
```

### Barrel Export Rule

Controls `export *` usage:

```typescript
defineConfig({
  architecture: {
    // Allow barrel exports only in specific files
    allowBarrelExports: ['**/index.ts'],
    // Or disable barrel exports entirely
    // allowBarrelExports: false,
  },
})
```

### Public API Rule

Enforces explicit public API surface:

```typescript
defineConfig({
  architecture: {
    enforcePublicApi: true,
  },
})
```

## Output Formats

### Console (Default)

Colorized terminal output with severity highlighting and file locations.

### JSON

Machine-readable output for CI integration:

```bash
workspace-analyzer --json > report.json
```

```json
{
  "issues": [],
  "summary": {
    "totalIssues": 5,
    "bySeverity": {"warning": 3, "error": 2},
    "byCategory": {"dependency": 2, "architecture": 3},
    "packagesAnalyzed": 8,
    "filesAnalyzed": 150,
    "durationMs": 2500
  }
}
```

### Markdown

Human-readable report for documentation or PR comments:

```bash
workspace-analyzer --markdown > ANALYSIS.md
```

## Caching

The analyzer supports incremental caching for improved performance:

```typescript
defineConfig({
  cache: true,
  cacheDir: '.workspace-analyzer-cache',
  maxCacheAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  hashAlgorithm: 'sha256',
})
```

Cache is automatically invalidated when:

- Source files change (content hash)
- Configuration files change
- Analyzer versions change

## CI Integration

### GitHub Actions

```yaml
- name: Run workspace analysis
  run: pnpm workspace-analyzer --json > analysis-report.json

- name: Check for errors
  run: |
    if jq -e '.summary.bySeverity.error > 0' analysis-report.json; then
      echo "Analysis found errors"
      exit 1
    fi
```

### Pre-commit Hook

```bash
# package.json
{
  "lint-staged": {
    "*.{ts,tsx}": ["workspace-analyzer --categories dependency,architecture"]
  }
}
```

## Development

```bash
# Build the package
pnpm --filter @bfra.me/workspace-analyzer build

# Run tests
pnpm --filter @bfra.me/workspace-analyzer test

# Type check
pnpm --filter @bfra.me/workspace-analyzer type-check
```

## Related Packages

- [@bfra.me/es](../es/README.md) - Core utilities (Result type, async helpers)
- [@bfra.me/doc-sync](../doc-sync/README.md) - Documentation sync (shares TypeScript parsing infrastructure)
- [@bfra.me/eslint-config](../eslint-config/readme.md) - ESLint configuration

## License

MIT © [Marcus R. Brown](https://github.com/marcusrbrown)
