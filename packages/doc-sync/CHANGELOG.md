# @bfra.me/doc-sync

## 0.1.0
### Minor Changes


- Add `@bfra.me/doc-sync` package - an intelligent documentation synchronization engine for automatic Astro Starlight site updates. ([#2363](https://github.com/bfra-me/works/pull/2363))
  
  **Features:**
  - TypeScript/JSDoc parsing using ts-morph and the TypeScript Compiler API
  - README integration with Markdown parsing via unified/remark
  - Incremental updates with content hashing for changed packages only
  - Watch mode for automatic syncing during development
  - MDX generation with Starlight-compatible frontmatter and components
  - Content preservation using sentinel markers
  - Modern CLI with interactive TUI powered by @clack/prompts
  - Programmatic API for integration with other tools

### Patch Changes


- Updated dependency `remark-mdx` to `3.1.1`. ([#2380](https://github.com/bfra-me/works/pull/2380))
