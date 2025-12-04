# @bfra.me/doc-sync

> Intelligent documentation synchronization engine for automatic Astro Starlight site updates

[![npm version](https://img.shields.io/npm/v/@bfra.me/doc-sync.svg)](https://www.npmjs.com/package/@bfra.me/doc-sync) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

`@bfra.me/doc-sync` monitors package source code, README files, and JSDoc comments to automatically update Astro Starlight documentation sites with zero manual intervention.

## Features

- 📝 **TypeScript/JSDoc Parsing** - Extracts documentation from source files using the TypeScript Compiler API
- 📖 **README Integration** - Parses and incorporates README content into documentation pages
- 🔄 **Incremental Updates** - Only regenerates documentation for changed packages
- 👁️ **Watch Mode** - Monitors for changes and syncs automatically during development
- ✨ **MDX Generation** - Creates Starlight-compatible MDX files with proper frontmatter
- 🛡️ **Content Preservation** - Protects manual content sections using sentinel markers

## Installation

```bash
pnpm add @bfra.me/doc-sync
```

## Usage

### CLI

```bash
# Sync all packages
doc-sync

# Sync specific packages
doc-sync @bfra.me/es @bfra.me/eslint-config

# Watch mode for development
doc-sync --watch

# Dry run to preview changes
doc-sync --dry-run
```

### Programmatic API

```typescript
import type {DocConfig, SyncResult} from '@bfra.me/doc-sync'
```

## Configuration

Documentation configuration can be specified in `package.json`:

```json
{
  "docs": {
    "title": "Custom Package Title",
    "sidebar": {
      "label": "Short Name",
      "order": 1
    }
  }
}
```

## Content Preservation

Use sentinel markers to preserve manual content in generated files:

```mdx
{/* MANUAL-CONTENT-START */}

Your custom content here will be preserved during regeneration.

{/* MANUAL-CONTENT-END */}
```

## License

[MIT](../../LICENSE.md)
