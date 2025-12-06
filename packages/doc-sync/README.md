# @bfra.me/doc-sync

> Intelligent documentation synchronization engine for automatic Astro Starlight site updates

[![npm version](https://img.shields.io/npm/v/@bfra.me/doc-sync.svg)](https://www.npmjs.com/package/@bfra.me/doc-sync) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

`@bfra.me/doc-sync` monitors package source code, README files, and JSDoc comments to automatically update Astro Starlight documentation sites with zero manual intervention. It bridges the gap between your codebase and documentation, ensuring they stay in sync.

## Features

- 📝 **TypeScript/JSDoc Parsing** — Extracts documentation from source files using the TypeScript Compiler API via `ts-morph`
- 📖 **README Integration** — Parses and incorporates README content into documentation pages
- 🔄 **Incremental Updates** — Only regenerates documentation for changed packages using content hashing
- 👁️ **Watch Mode** — Monitors for changes and syncs automatically during development
- ✨ **MDX Generation** — Creates Starlight-compatible MDX files with proper frontmatter
- 🛡️ **Content Preservation** — Protects manual content sections using sentinel markers
- 🎨 **Modern CLI** — Interactive terminal UI powered by `@clack/prompts`
- 🔒 **Security** — Sanitizes content to prevent XSS and validates file paths

## Installation

```bash
pnpm add @bfra.me/doc-sync
```

## CLI Usage

The `doc-sync` CLI provides three main commands for managing documentation synchronization.

### Sync Command

Synchronize documentation for all or specific packages:

```bash
# Sync all packages
doc-sync sync

# Sync specific packages
doc-sync sync @bfra.me/es @bfra.me/eslint-config

# Interactive package selection
doc-sync sync --interactive

# Preview changes without writing files
doc-sync sync --dry-run

# With verbose output
doc-sync sync --verbose
```

### Watch Command

Monitor for changes and sync automatically during development:

```bash
# Watch all packages
doc-sync watch

# Watch specific packages
doc-sync watch @bfra.me/es

# Watch with verbose logging
doc-sync watch --verbose
```

### Validate Command

Check documentation freshness and validate MDX syntax:

```bash
# Validate all packages
doc-sync validate

# Validate specific packages
doc-sync validate @bfra.me/es
```

### Global Options

| Option          | Alias | Description                                     |
| --------------- | ----- | ----------------------------------------------- |
| `--root <dir>`  | `-r`  | Root directory of the monorepo (default: `cwd`) |
| `--dry-run`     | `-d`  | Preview changes without writing files           |
| `--verbose`     | `-v`  | Enable verbose output                           |
| `--quiet`       | `-q`  | Suppress non-error output                       |
| `--interactive` | `-i`  | Use interactive package selection               |
| `--watch`       | `-w`  | Watch for changes (on default command)          |

## Programmatic API

### Basic Usage

```typescript
import {createPackageScanner, createSyncOrchestrator} from '@bfra.me/doc-sync'

const scanner = createPackageScanner({
  rootDir: process.cwd(),
  includePatterns: ['packages/*'],
})

const orchestrator = createSyncOrchestrator({
  rootDir: process.cwd(),
  outputDir: 'docs/src/content/docs/packages',
})

const packages = await scanner.scan()
const result = await orchestrator.sync(packages)

if (result.success) {
  console.log(`Synced ${result.data.synced.length} packages`)
}
```

### Parsing APIs

```typescript
import {extractJSDoc, parseReadme, parseTypeScript} from '@bfra.me/doc-sync/parsers'

const tsResult = parseTypeScript('src/index.ts')
const jsDocResult = extractJSDoc(sourceFile)
const readmeResult = parseReadme('README.md')
```

### Generator APIs

```typescript
import {
  generateAPIReference,
  generateFrontmatter,
  generateMDXDocument,
  mergeContent,
} from '@bfra.me/doc-sync/generators'

const frontmatter = generateFrontmatter({
  title: '@bfra.me/es',
  description: 'ES utilities package',
})

const apiRef = generateAPIReference(packageAPI)
const mdx = generateMDXDocument({frontmatter, sections: [apiRef]})
```

### File Watching

```typescript
import {createDocDebouncer, createDocWatcher} from '@bfra.me/doc-sync'

const watcher = createDocWatcher({
  rootDir: process.cwd(),
  patterns: ['packages/*/src/**/*.ts', 'packages/*/README.md'],
})

const debouncer = createDocDebouncer({
  delayMs: 300,
  onBatch: async (events) => {
    console.log(`Processing ${events.length} file changes`)
  },
})

watcher.on('change', debouncer.add)
await watcher.start()
```

## Configuration

### Package-Level Configuration

Configure documentation generation per package in `package.json`:

```json
{
  "name": "@bfra.me/example",
  "docs": {
    "title": "Custom Package Title",
    "description": "Override the default description",
    "sidebar": {
      "label": "Short Name",
      "order": 1,
      "hidden": false
    },
    "excludeSections": ["internal-api"],
    "frontmatter": {
      "tableOfContents": {
        "minHeadingLevel": 2,
        "maxHeadingLevel": 3
      }
    }
  }
}
```

### Configuration Fields

| Field             | Type       | Description                              |
| ----------------- | ---------- | ---------------------------------------- |
| `title`           | `string`   | Custom title for the documentation page  |
| `description`     | `string`   | Custom description override              |
| `sidebar.label`   | `string`   | Label shown in sidebar navigation        |
| `sidebar.order`   | `number`   | Sort order in sidebar (lower = earlier)  |
| `sidebar.hidden`  | `boolean`  | Whether to hide from sidebar             |
| `excludeSections` | `string[]` | Sections to exclude from auto-generation |
| `frontmatter`     | `object`   | Additional frontmatter fields            |

## Content Preservation

Use sentinel markers to preserve manual content sections during regeneration:

```mdx
{/* AUTO-GENERATED-START */}

This content is automatically generated and will be replaced on sync.

{/* AUTO-GENERATED-END */}

{/* MANUAL-CONTENT-START */}

Your custom content here will be preserved during regeneration.
Add examples, notes, or any additional documentation.

{/* MANUAL-CONTENT-END */}
```

### Marker Types

- `{/* AUTO-GENERATED-START */}` / `{/* AUTO-GENERATED-END */}` — Marks auto-generated content
- `{/* MANUAL-CONTENT-START */}` / `{/* MANUAL-CONTENT-END */}` — Marks manually maintained content

## TypeScript Types

The package exports comprehensive types for type-safe usage:

```typescript
import type {
  DocConfig,
  DocConfigSource,
  ExportedFunction,
  ExportedType,
  MDXDocument,
  MDXFrontmatter,
  PackageAPI,
  PackageInfo,
  ParseError,
  ParseResult,
  SyncResult,
  SyncSummary,
} from '@bfra.me/doc-sync'
```

## Subpath Exports

The package provides granular imports for tree-shaking:

| Export                         | Description                           |
| ------------------------------ | ------------------------------------- |
| `@bfra.me/doc-sync`            | Main entry with all exports           |
| `@bfra.me/doc-sync/generators` | MDX and content generation utilities  |
| `@bfra.me/doc-sync/parsers`    | TypeScript, JSDoc, and README parsers |
| `@bfra.me/doc-sync/types`      | Type definitions only                 |

## Architecture

```plaintext
doc-sync/
├── src/
│   ├── cli/           # CLI commands and TUI
│   ├── generators/    # MDX and content generators
│   ├── orchestrator/  # Sync coordination
│   ├── parsers/       # Source code and README parsers
│   ├── watcher/       # File system monitoring
│   └── types.ts       # Core type definitions
```

## Requirements

- Node.js 20+
- TypeScript 5.0+
- pnpm (recommended) or npm

## Related Packages

- [`@bfra.me/es`](../es/README.md) — ES utilities including Result types and watcher utilities
- [`@astrojs/starlight`](https://starlight.astro.build/) — Documentation framework (peer dependency)

## License

[MIT](../../license.md)
