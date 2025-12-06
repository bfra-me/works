---
'@bfra.me/doc-sync': minor
---

Add `@bfra.me/doc-sync` package - an intelligent documentation synchronization engine for automatic Astro Starlight site updates.

**Features:**
- TypeScript/JSDoc parsing using ts-morph and the TypeScript Compiler API
- README integration with Markdown parsing via unified/remark
- Incremental updates with content hashing for changed packages only
- Watch mode for automatic syncing during development
- MDX generation with Starlight-compatible frontmatter and components
- Content preservation using sentinel markers
- Modern CLI with interactive TUI powered by @clack/prompts
- Programmatic API for integration with other tools
