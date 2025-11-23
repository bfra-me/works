# @bfra.me/eslint-config

> Shared ESLint configuration for bfra.me.

## Install

### NPM

```sh
npm install --save-dev @bfra.me/eslint-config eslint
```

### PNPM

```sh
pnpm add --save-dev @bfra.me/eslint-config eslint
```

### Yarn

```sh
yarn add --dev @bfra.me/eslint-config eslint
```

## Usage

Add or update your `eslint.config.js` file to include the following:

```js
import preset from "@bfra.me/eslint-config"

export default preset()
```

## Markdown Support

Lint your Markdown files with support for both CommonMark and GitHub Flavored Markdown (GFM). Parse frontmatter in YAML, TOML, or JSON formats, and optionally lint code blocks within your documentation. Built on the official [@eslint/markdown](https://github.com/eslint/markdown) plugin.

### Quick Start

```js
import {defineConfig} from "@bfra.me/eslint-config"

// Enable with defaults (GFM + YAML frontmatter)
export default defineConfig({
  markdown: true
})
```

### Language Modes: CommonMark vs GFM

Choose the Markdown parsing mode that fits your use case:

#### CommonMark (Standard)

Use CommonMark for maximum portability and strict compliance with the standard specification:

```js
export default defineConfig({
  markdown: {
    language: 'commonmark'
  }
})
```

**Best for:**

- README files
- Portable documentation
- Cross-platform content
- Strict Markdown compliance

#### GitHub Flavored Markdown (GFM)

Use GFM for enhanced features commonly used in GitHub and documentation sites:

```js
export default defineConfig({
  markdown: {
    language: 'gfm'
  }
})
```

**Adds support for:**

- Tables
- Task lists (`- [ ] Todo item`)
- Strikethrough (`~~deleted text~~`)
- Autolinks (automatic URL linking)

**Best for:**

- Documentation sites
- GitHub README files
- Blog posts
- Wiki pages

**GFM is the default mode** when you enable Markdown support.

### Frontmatter Parsing

Most static site generators (Astro, Next.js, Jekyll) use frontmatter to store metadata at the top of Markdown files. You can configure which format to parse—or disable it entirely.

#### YAML Frontmatter (Recommended)

```js
export default defineConfig({
  markdown: {
    frontmatter: 'yaml'
  }
})
```

Example Markdown file with YAML frontmatter:

```markdown
---
title: Getting Started
date: 2025-11-20
tags: [tutorial, documentation]
---

# Getting Started

Your content here...
```

**Best for:**

- Documentation sites (Astro, Docusaurus, VitePress)
- Blog posts
- Most static site generators

#### TOML Frontmatter

```js
export default defineConfig({
  markdown: {
    frontmatter: 'toml'
  }
})
```

Example Markdown file with TOML frontmatter:

```markdown
+++
title = "Getting Started"
date = 2025-11-20
tags = ["tutorial", "documentation"]
+++

# Getting Started

Your content here...
```

**Best for:**

- Hugo sites
- Configuration-heavy frontmatter

#### JSON Frontmatter

```js
export default defineConfig({
  markdown: {
    frontmatter: 'json'
  }
})
```

Example Markdown file with JSON frontmatter:

```markdown
;;;
{
  "title": "Getting Started",
  "date": "2025-11-20",
  "tags": ["tutorial", "documentation"]
}
;;;

# Getting Started

Your content here...
```

#### Disable Frontmatter

For simple Markdown files without metadata:

```js
export default defineConfig({
  markdown: {
    frontmatter: false
  }
})
```

**YAML is the default frontmatter format** when you enable Markdown support.

### Code Block Processing

#### Enable Code Block Linting

```js
export default defineConfig({
  markdown: {
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

With code block processing enabled (the default), fenced code blocks are extracted and linted as separate virtual files:

````markdown
# Example

```typescript
// This TypeScript code will be linted with TypeScript rules
interface User {
  name: string
  age: number
}

const user: User = {
  name: "John",
  age: 30
}
```
````

#### Filename Meta Support

Use filename annotations for better error reporting:

````markdown
```typescript filename="src/user.ts"
export interface User {
  name: string
  age: number
}
```
````

The linter will treat this code block as if it were in `src/user.ts` for error messages and rule contexts.

#### Supported Languages in Code Blocks

The following languages are supported:

- **TypeScript** (`.ts`, `.tsx`) - Full TypeScript-ESLint support
- **JavaScript** (`.js`, `.jsx`) - ES modules, async/await, modern syntax
- **JSX/TSX** - React components with proper linting
- **JSON** - JSON/JSON5 syntax validation
- **YAML** - YAML syntax validation

### Disable Directives in Markdown

Use HTML comments to disable ESLint rules within Markdown files:

```markdown
<!-- eslint-disable markdown/no-html -->

<div>Custom HTML content</div>

<!-- eslint-enable markdown/no-html -->
```

### Configuration Examples

#### Documentation Site (Astro, Docusaurus, VitePress)

```js
import {defineConfig} from "@bfra.me/eslint-config"

export default defineConfig({
  markdown: {
    language: 'gfm',
    frontmatter: 'yaml',
    codeBlocks: {
      typescript: true,
      javascript: true
    }
  }
})
```

#### Simple README Files

```js
import {defineConfig} from "@bfra.me/eslint-config"

export default defineConfig({
  markdown: {
    language: 'commonmark',
    frontmatter: false,
    files: ['README.md', '**/README.md']
  }
})
```

#### Blog Posts with Code Examples

```js
import {defineConfig} from "@bfra.me/eslint-config"

export default defineConfig({
  markdown: {
    language: 'gfm',
    frontmatter: 'yaml',
    codeBlocks: {
      typescript: true,
      javascript: true,
      jsx: true
    },
    files: ['blog/**/*.md', 'posts/**/*.md']
  }
})
```

#### Custom Rule Overrides

```js
import {defineConfig} from "@bfra.me/eslint-config"

export default defineConfig({
  markdown: {
    language: 'gfm',
    rules: {
      // Allow HTML in Markdown
      'markdown/no-html': 'off',
      // Warn on missing code block languages
      'markdown/fenced-code-language': 'warn',
      // Enforce alt text for images
      'markdown/require-alt-text': 'error'
    }
  }
})
```

### Default Rules

These rules are enabled out of the box to catch common Markdown issues:

- **`markdown/fenced-code-language`** - Require language identifiers on fenced code blocks
- **`markdown/heading-increment`** - Enforce proper heading level increments
- **`markdown/no-duplicate-definitions`** - Prevent duplicate link/image definitions
- **`markdown/no-empty-definitions`** - Prevent empty link/image definitions
- **`markdown/no-empty-images`** - Prevent empty image alt text
- **`markdown/no-empty-links`** - Prevent empty link text
- **`markdown/no-invalid-label-refs`** - Prevent invalid reference-style links
- **`markdown/no-missing-label-refs`** - Prevent missing reference definitions
- **`markdown/no-missing-link-fragments`** - Validate heading fragment links
- **`markdown/no-multiple-h1`** - Enforce single h1 heading per file
- **`markdown/no-unused-definitions`** - Prevent unused link/image definitions
- **`markdown/require-alt-text`** - Require alt text for images
- **`markdown/table-column-count`** - Validate table column consistency

### Migrating from Simple Configuration

The simple boolean form still works:

```js
// Simple form
export default defineConfig({
  markdown: true
})
```

This is equivalent to:

```js
// Explicit defaults
export default defineConfig({
  markdown: {
    language: 'gfm',
    frontmatter: 'yaml',
    codeBlocks: {
      javascript: true,
      json: true,
      jsx: true,
      typescript: true,
      yaml: true
    }
  }
})
```

You only need the expanded form if you want to customize these defaults.

### Troubleshooting

#### Code Block Processing Issues

Running into issues with code block extraction? Try these fixes:

1. **Selectively enable languages** that work in your environment:

   ```js
   export default defineConfig({
    markdown: {
      codeBlocks: {
        typescript: true,
        javascript: true,
        jsx: false,  // Disable if causing issues
        json: false,
        yaml: false
      }
    }
   })
   ```

2. **Check for plugin conflicts** - some ESLint plugins require full SourceCode API that isn't available in virtual code block files

#### Frontmatter Parsing Errors

Frontmatter not parsing correctly? Check these common issues:

- Verify delimiters: `---` for YAML, `+++` for TOML, `;;;` for JSON
- Validate your frontmatter syntax with a dedicated parser
- If you don't need frontmatter, disable it: `frontmatter: false`

#### Performance Issues

Linting taking too long? Here's how to speed things up:

- Target specific directories: `files: ['docs/**/*.md']`
- Exclude generated docs using the `ignores` option:

  ```js
  export default defineConfig({
    ignores: ['docs/api/**/*.md', '**/CHANGELOG.md']
  })
  ```

## License

[MIT](../../LICENSE.md)
