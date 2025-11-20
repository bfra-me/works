---
'@bfra.me/eslint-config': minor
---

Add full Markdown configuration API with enhanced type definitions.

This release introduces a new configuration API for Markdown linting with support for:

- **Language modes**: Choose between CommonMark and GitHub Flavored Markdown (GFM)
- **Frontmatter parsing**: Support for YAML, TOML, and JSON frontmatter formats
- **Code block extraction**: Enable linting of code blocks embedded in Markdown files
- **Language-specific processing**: Granular control over which languages to lint in code blocks (TypeScript, JavaScript, JSX, JSON, YAML)
- **Flexible configuration**: Extends `OptionsFiles` and `OptionsOverrides` for maximum customization

New types and interfaces:
- `MarkdownLanguage`: Discriminated union for 'commonmark' | 'gfm'
- `MarkdownFrontmatterOptions`: Support for false | 'yaml' | 'toml' | 'json'
- `MarkdownProcessorOptions`: Configure processor behavior
- `MarkdownCodeBlockOptions`: Language-specific code block processing
- `MarkdownOptions`: Comprehensive configuration interface

Example usage:
```typescript
// Documentation site with GFM and YAML frontmatter
const config = defineConfig({
  markdown: {
    language: 'gfm',
    frontmatter: 'yaml',
    processor: {
      enabled: true,
      extractCodeBlocks: true
    },
    codeBlocks: {
      typescript: true,
      javascript: true
    }
  }
});
```

All types include comprehensive JSDoc documentation with examples and references to relevant specifications.
