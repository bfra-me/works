# Migration Guide: @bfra.me/create v0.4.x → v0.5.x

This guide helps you migrate from the legacy `@sxzz/create`-based implementation to the modern redesigned version of `@bfra.me/create`.

## Overview

Version 0.5.x represents a complete architectural redesign with:

- 🚀 **New Template System** - Modern architecture supporting GitHub repos, URLs, and local directories
- 🤖 **AI-Powered Features** - Intelligent project setup and recommendations
- 📋 **Enhanced CLI** - Beautiful interactive prompts and better user experience
- 🔧 **Feature Addition** - Add components and tools to existing projects
- ⚡ **Performance Improvements** - Template caching, concurrent operations, and better error handling

## Breaking Changes

### 1. Template Location Changed

**Before (v0.4.x):**

```text
packages/create/src/templates/
├── default/
├── library/
└── cli/
```

**After (v0.5.x):**

```text
packages/create/templates/
├── default/
├── library/
├── cli/
├── react/
└── node/
```

**Migration:** No action required for users. Template references remain the same.

### 2. API Changes

#### CLI Options Renamed

| Old Option | New Option | Notes |
|------------|------------|-------|
| `-v, --version <version>` | `--version <version>` | `-v` now shows CLI version |
| No equivalent | `--output-dir <dir>` | New: Specify output directory |
| No equivalent | `--package-manager <pm>` | New: Choose package manager |
| No equivalent | `--skip-prompts` | New: Non-interactive mode |
| No equivalent | `--force` | New: Overwrite existing files |
| No equivalent | `--dry-run` | New: Preview mode |
| No equivalent | `--preset <preset>` | New: Configuration presets |

#### Programmatic API Changes

**Before (v0.4.x):**

```typescript
import {createPackage} from '@bfra.me/create'

await createPackage('my-package', {
  template: 'default',
  version: '1.0.0',
  description: 'My package',
  author: 'Author Name'
})
```

**After (v0.5.x):**

```typescript
import {createPackage} from '@bfra.me/create'

await createPackage({
  name: 'my-package',
  template: 'default',
  version: '1.0.0',
  description: 'My package',
  author: 'Author Name',
  outputDir: './my-package',
  interactive: false
})
```

**Migration Steps:**

1. Update function signature: move `packageName` into options object as `name`
2. Add required `outputDir` option
3. Set `interactive: false` for programmatic usage

### 3. Template Format Changes

#### Variable Syntax Updated

**Before (v0.4.x):**

```json
// template.json
{
  "name": "{{name}}",
  "version": "{{version}}"
}
```

**After (v0.5.x):**

```json
// Use .eta extension for template files
// package.json.eta
{
  "name": "<%= it.name %>",
  "version": "<%= it.version %>"
}
```

**Migration Steps:**

1. Rename template files: `file.ext` → `file.ext.eta`
2. Update variable syntax: `{{var}}` → `<%= it.var %>`
3. Add `template.json` with metadata

#### New Template Metadata

**After (v0.5.x):**

```json
// template.json (new required file)
{
  "name": "My Template",
  "description": "Template description",
  "version": "1.0.0",
  "author": "Your Name",
  "tags": ["typescript", "library"],
  "variables": [
    {
      "name": "packageName",
      "description": "NPM package name",
      "type": "string",
      "required": true
    }
  ]
}
```

### 4. Dependencies Removed

The following dependencies are no longer used:

- `@sxzz/create` - Replaced with custom implementation
- Any plugins or extensions for `@sxzz/create`

## New Features

### 1. Enhanced Template Sources

```bash
# GitHub repositories (new)
create my-project --template user/repo-name
create my-project --template github:user/repo#branch

# URLs (new)
create my-project --template https://example.com/template.zip

# Local directories (improved)
create my-project --template ./my-template
create my-project --template /absolute/path/template

# Built-in templates (unchanged)
create my-project --template library
```

### 2. Feature Addition Command

```bash
# Add features to existing projects (new)
create add eslint
create add vitest
create add component --name Header
```

### 3. Configuration Presets

```bash
# Quick setup with presets (new)
create my-project --preset minimal   # Basic setup
create my-project --preset standard  # Library template
create my-project --preset full      # Complete setup
```

### 4. AI-Powered Features

```bash
# AI assistance (new - requires API keys)
export OPENAI_API_KEY="your-key"
create "A React component library" --ai-assist
```

### 5. Enhanced CLI Experience

- Interactive prompts with beautiful UI
- Progress indicators for long operations
- Better error messages and recovery options
- Verbose mode for debugging
- Dry run mode for previewing changes

## Migration Steps

### For End Users

#### 1. Update Global Installation

```bash
# Uninstall old version
npm uninstall -g @bfra.me/create

# Install new version
npm install -g @bfra.me/create@latest
```

#### 2. Update Scripts

**Before:**

```bash
# Old command syntax
create my-package --template default --version 1.0.0
```

**After:**

```bash
# New command syntax (mostly compatible)
create my-package --template default --version 1.0.0

# Or use new features
create my-package \
  --template default \
  --version 1.0.0 \
  --output-dir ./projects/my-package \
  --skip-prompts
```

#### 3. Custom Templates

If you have custom templates:

1. **Move templates** from `src/templates/` to `templates/`
2. **Add template.json** to each template directory
3. **Rename template files** with `.eta` extension
4. **Update variable syntax** from `{{var}}` to `<%= it.var %>`

### For Package Developers

#### 1. Update Dependencies

```bash
# Update package.json
npm install @bfra.me/create@latest
```

#### 2. Update Programmatic Usage

**Before:**

```typescript
import {createPackage} from '@bfra.me/create'

async function createMyPackage() {
  await createPackage('my-package', {
    template: 'library',
    description: 'My library'
  })
}
```

**After:**

```typescript
import {createPackage} from '@bfra.me/create'

async function createMyPackage() {
  const result = await createPackage({
    name: 'my-package',
    template: 'library',
    description: 'My library',
    outputDir: './my-package',
    interactive: false,
    skipPrompts: true
  })

  if (!result.success) {
    throw result.error
  }
}
```

#### 3. Update TypeScript Types

```typescript
// New comprehensive types available
import type {
  CreateCommandOptions,
  AddCommandOptions,
  TemplateSource,
  TemplateMetadata
} from '@bfra.me/create'
```

### For Template Authors

#### 1. Convert Template Format

**Before:**

```text
my-template/
├── package.json        # {{name}}, {{version}}
├── README.md          # {{description}}
└── src/
    └── index.ts       # {{name}}
```

**After:**

```text
my-template/
├── template.json      # New metadata file
├── package.json.eta   # <%= it.name %>, <%= it.version %>
├── README.md.eta      # <%= it.description %>
└── src/
    └── index.ts.eta   # <%= it.name %>
```

#### 2. Create template.json

```json
{
  "name": "My Custom Template",
  "description": "A template for creating awesome projects",
  "version": "1.0.0",
  "author": "Your Name <email@example.com>",
  "tags": ["typescript", "library", "npm"],
  "variables": [
    {
      "name": "packageName",
      "description": "NPM package name",
      "type": "string",
      "required": true,
      "pattern": "^[@a-z0-9-/]+$"
    },
    {
      "name": "license",
      "description": "License type",
      "type": "select",
      "default": "MIT",
      "options": ["MIT", "Apache-2.0", "BSD-3-Clause"]
    }
  ],
  "nodeVersion": ">=18.0.0"
}
```

#### 3. Update Template Variables

Available variables in `.eta` files:

| Variable | Description | Example |
|----------|-------------|---------|
| `it.name` | Project name | `my-project` |
| `it.description` | Project description | `My awesome project` |
| `it.author` | Project author | `Name <email@example.com>` |
| `it.version` | Project version | `1.0.0` |
| `it.packageManager` | Package manager | `pnpm` |
| `it.year` | Current year | `2024` |
| `it.date` | Current date | `2024-01-15` |

## Troubleshooting

### Common Migration Issues

#### 1. "Template not found" errors

**Cause:** Template paths changed or template format is outdated.

**Solution:**

```bash
# Use new template syntax
create my-project --template library  # Built-in
create my-project --template user/repo  # GitHub
create my-project --template ./path/to/template  # Local
```

#### 2. Variable substitution not working

**Cause:** Old `{{variable}}` syntax used instead of `<%= it.variable %>`.

**Solution:**

1. Rename files: `file.ext` → `file.ext.eta`
2. Update syntax: `{{name}}` → `<%= it.name %>`

#### 3. Programmatic API errors

**Cause:** Function signature changed.

**Solution:**

```typescript
// Before
await createPackage('name', options)

// After
await createPackage({name: 'name', ...options})
```

### Getting Help

If you encounter migration issues:

1. **Check Documentation** - [README.md](./README.md) has comprehensive examples
2. **Enable Verbose Mode** - Use `--verbose` for detailed debugging
3. **Use Dry Run** - Test with `--dry-run` before making changes
4. **Report Issues** - [GitHub Issues](https://github.com/bfra-me/works/issues)

## Rollback Plan

If you need to temporarily rollback to the old version:

```bash
# Install specific old version
npm install -g @bfra.me/create@0.4.12

# Or pin version in package.json
"@bfra.me/create": "0.4.12"
```

**Note:** The old version will receive only critical bug fixes. We recommend migrating to the new version for ongoing support and new features.

## Testing Your Migration

### 1. Test Template Creation

```bash
# Test basic project creation
create test-project --template default --dry-run

# Test with custom template
create test-custom --template ./my-template --dry-run

# Test programmatic API
node -e "
import {createPackage} from '@bfra.me/create'
const result = await createPackage({
  name: 'test',
  template: 'default',
  outputDir: './test-output',
  dryRun: true
})
console.log('Success:', result.success)
"
```

### 2. Validate Template Format

```bash
# Verify template works with new format
create test-template --template ./my-converted-template --verbose
```

### 3. Test Integration

Run your existing build processes and CI/CD pipelines to ensure compatibility.

## Summary

The migration to v0.5.x brings significant improvements but requires attention to:

1. **API Changes** - Update function signatures for programmatic usage
2. **Template Format** - Convert to Eta syntax and add metadata
3. **New Features** - Take advantage of enhanced capabilities

Most CLI usage remains compatible, but programmatic usage requires updates. The investment in migration pays off with improved performance, better error handling, and powerful new features.

For detailed examples and comprehensive documentation, see the [README.md](./README.md).
