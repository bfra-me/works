---
title: Markdown Support Migration Guide
version: 1.0
date_created: 2025-11-20
last_updated: 2025-11-20
status: Active
tags: [migration, markdown, eslint, documentation]
---

# Markdown Support Migration Guide

This guide provides step-by-step instructions for migrating to the enhanced Markdown support in `@bfra.me/eslint-config` with `@eslint/markdown` integration.

## Overview

The enhanced Markdown support introduces:

- **Language modes**: Choose between CommonMark (standard) and GitHub Flavored Markdown (GFM)
- **Frontmatter parsing**: Support for YAML, TOML, and JSON frontmatter formats
- **Code block processing**: Optional extraction and linting of code blocks within Markdown
- **TypeScript-ESLint integration**: Full TypeScript type-aware linting in code blocks
- **Enhanced rule set**: Comprehensive rules for Markdown prose and structure

## Migration Timeline

### Before Migration

**Simple boolean form:**

```typescript
import {defineConfig} from '@bfra.me/eslint-config'

export default defineConfig({
  markdown: true
})
```

This enabled basic Markdown linting with default settings.

### After Migration

**Enhanced configuration with explicit options:**

```typescript
import {defineConfig} from '@bfra.me/eslint-config'

export default defineConfig({
  markdown: {
    language: 'gfm',              // GFM or 'commonmark'
    frontmatter: 'yaml',          // 'yaml', 'toml', 'json', or false
    processor: {
      enabled: false,             // Code block extraction (disabled by default)
      extractCodeBlocks: false
    },
    codeBlocks: {
      typescript: true,
      javascript: true,
      jsx: true,
      json: true,
      yaml: true
    }
  }
})
```

## Breaking Changes

### None! 🎉

The migration is **fully backward compatible**. The simple boolean form continues to work:

```typescript
// Still works!
export default defineConfig({
  markdown: true
})
```

This is now equivalent to:

```typescript
export default defineConfig({
  markdown: {
    language: 'gfm',
    frontmatter: 'yaml',
    processor: { enabled: false, extractCodeBlocks: false }
  }
})
```

## Use Case Migration Patterns

### Use Case 1: Documentation Sites (Astro, Docusaurus, VitePress)

**Before:**

```typescript
export default defineConfig({
  markdown: true
})
```

**After (Recommended):**

```typescript
export default defineConfig({
  markdown: {
    language: 'gfm',              // Enable GFM features (tables, task lists)
    frontmatter: 'yaml',          // Parse YAML frontmatter
    processor: {
      enabled: true,              // Enable code block linting
      extractCodeBlocks: true
    },
    codeBlocks: {
      typescript: true,
      javascript: true,
      jsx: true
    }
  }
})
```

**Benefits:**

- GFM features like tables and task lists work correctly
- YAML frontmatter (title, date, tags) is parsed and validated
- Code examples in documentation are linted for correctness

### Use Case 2: README Files

**Before:**

```typescript
export default defineConfig({
  markdown: true
})
```

**After (Recommended):**

```typescript
export default defineConfig({
  markdown: {
    language: 'commonmark',       // Use standard Markdown
    frontmatter: false,           // No frontmatter in READMEs
    files: ['README.md', '**/README.md']
  }
})
```

**Benefits:**

- Maximum portability with CommonMark
- Faster linting (no frontmatter parsing)
- Targeted to specific files

### Use Case 3: Blog Posts

**Before:**

```typescript
export default defineConfig({
  markdown: true
})
```

**After (Recommended):**

```typescript
export default defineConfig({
  markdown: {
    language: 'gfm',
    frontmatter: 'yaml',
    processor: {
      enabled: true,
      extractCodeBlocks: true
    },
    codeBlocks: {
      typescript: true,
      javascript: true,
      jsx: true
    },
    files: ['blog/**/*.md', 'posts/**/*.md']
  }
})
```

**Benefits:**

- GFM formatting (tables, task lists, strikethrough)
- YAML frontmatter for post metadata
- Code examples are validated
- Targeted to blog/post directories

### Use Case 4: GitHub README with Code Examples

**Before:**

```typescript
export default defineConfig({
  markdown: true
})
```

**After (Recommended):**

```typescript
export default defineConfig({
  markdown: {
    language: 'gfm',              // GitHub Flavored Markdown
    frontmatter: false,           // No frontmatter
    processor: {
      enabled: true,              // Lint code examples
      extractCodeBlocks: true
    },
    codeBlocks: {
      typescript: true,
      javascript: true
    },
    files: ['README.md']
  }
})
```

**Benefits:**

- GFM features work correctly on GitHub
- Code examples are validated for correctness
- Catches errors in installation instructions

## Configuration Options Reference

### Language Modes

| Option | Description | Best For |
|--------|-------------|----------|
| `'commonmark'` | Standard CommonMark specification | Maximum portability, strict compliance, simple READMEs |
| `'gfm'` | GitHub Flavored Markdown | Documentation sites, GitHub files, enhanced features |

**Default:** `'gfm'`

### Frontmatter Formats

| Option | Delimiters | Description | Best For |
|--------|-----------|-------------|----------|
| `'yaml'` | `---` | YAML frontmatter | Documentation sites, blogs, most static site generators |
| `'toml'` | `+++` | TOML frontmatter | Hugo sites, configuration-heavy metadata |
| `'json'` | `;;;` | JSON frontmatter | Structured data, programmatic parsing |
| `false` | N/A | Disable frontmatter | Simple Markdown files without metadata |

**Default:** `'yaml'`

### Processor Options

| Option | Description | Default |
|--------|-------------|---------|
| `enabled` | Enable Markdown processor | `false` |
| `extractCodeBlocks` | Extract and lint code blocks | `false` |

**⚠️ Important:** Code block processing is disabled by default due to compatibility issues with some ESLint plugins.

### Code Block Languages

| Option | Description | Default |
|--------|-------------|---------|
| `typescript` | TypeScript code blocks | `true` |
| `javascript` | JavaScript code blocks | `true` |
| `jsx` | JSX/React code blocks | `true` |
| `json` | JSON code blocks | `true` |
| `yaml` | YAML code blocks | `true` |

## Common Migration Scenarios

### Scenario 1: No Changes Needed

If your current setup works well, keep using the simple form:

```typescript
export default defineConfig({
  markdown: true
})
```

No migration required! This continues to work with all new features available if needed later.

### Scenario 2: Enable Code Block Linting

If you want to validate code examples in your Markdown:

```typescript
export default defineConfig({
  markdown: {
    // Keep defaults for language and frontmatter
    language: 'gfm',
    frontmatter: 'yaml',
    
    // Add code block processing
    processor: {
      enabled: true,
      extractCodeBlocks: true
    }
  }
})
```

### Scenario 3: Switch to CommonMark

If you need strict CommonMark compliance:

```typescript
export default defineConfig({
  markdown: {
    language: 'commonmark',
    // Keep other defaults
    frontmatter: 'yaml',
    processor: { enabled: false }
  }
})
```

### Scenario 4: Hugo Site (TOML Frontmatter)

If you're using Hugo with TOML frontmatter:

```typescript
export default defineConfig({
  markdown: {
    language: 'gfm',
    frontmatter: 'toml',  // Hugo uses TOML (++++)
    // Keep code block processing disabled
    processor: { enabled: false }
  }
})
```

## Testing Your Migration

After updating your configuration:

1. **Run the linter:**

   ```bash
   pnpm lint
   # or
   npm run lint
   ```

2. **Verify specific Markdown files:**

   ```bash
   pnpm eslint --flag v10_config_lookup_from_file "**/*.md"
   ```

3. **Check for warnings or errors:**

   The new rules may catch issues that were previously uncaught. Review and fix them, or add rule overrides if needed:

   ```typescript
   export default defineConfig({
     markdown: {
       rules: {
         'markdown/no-html': 'off',  // Allow HTML if needed
         'markdown/fenced-code-language': 'warn'  // Soften to warning
       }
     }
   })
   ```

## Troubleshooting

### Code Block Processing Fails

**Symptom:** ESLint errors about missing SourceCode API when code block processing is enabled.

**Solution:** Disable code block processing:

```typescript
markdown: {
  processor: { enabled: false }
}
```

### Frontmatter Parsing Errors

**Symptom:** ESLint errors about invalid frontmatter syntax.

**Solution:** Verify your frontmatter delimiters and syntax, or disable frontmatter parsing:

```typescript
markdown: {
  frontmatter: false
}
```

### Performance Issues

**Symptom:** Linting takes too long on large Markdown files.

**Solutions:**

1. Disable code block processing (fastest)
2. Target specific directories with `files: ['docs/**/*.md']`
3. Exclude generated files with ignores pattern

### GFM Features Not Working

**Symptom:** Tables, task lists, or strikethrough not recognized.

**Solution:** Ensure GFM mode is enabled:

```typescript
markdown: {
  language: 'gfm'
}
```

## Getting Help

If you encounter issues during migration:

1. Check the [troubleshooting section](../../packages/eslint-config/readme.md#troubleshooting) in the main documentation
2. Review the [configuration examples](../../packages/eslint-config/readme.md#configuration-examples) for your use case
3. Open an issue in the repository with:
   - Your current configuration
   - The error message or unexpected behavior
   - Example Markdown content that triggers the issue

## Summary

The enhanced Markdown support is **fully backward compatible** while providing powerful new features when you need them:

✅ **No breaking changes** - existing configurations continue to work
✅ **Opt-in enhancements** - enable new features as needed
✅ **Comprehensive documentation** - examples for common use cases
✅ **Flexible configuration** - customize for your specific needs

Start with the defaults and enhance as needed for your project!
