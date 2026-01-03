# @bfra.me/doc-sync

## 0.1.4
### Patch Changes


- Updated dependency `zod` to `4.3.0`. ([#2554](https://github.com/bfra-me/works/pull/2554))


- Updated dependency `zod` to `4.3.4`. ([#2558](https://github.com/bfra-me/works/pull/2558))


- Updated dependency `zod` to `4.3.3`. ([#2557](https://github.com/bfra-me/works/pull/2557))


- Updated dependency `zod` to `4.3.2`. ([#2555](https://github.com/bfra-me/works/pull/2555))

## 0.1.3
### Patch Changes


- Updated dependency `zod` to `4.2.1`. ([#2523](https://github.com/bfra-me/works/pull/2523))


- Updated dependency `zod` to `4.2.0`. ([#2518](https://github.com/bfra-me/works/pull/2518))

## 0.1.2
### Patch Changes


- Add inline content serialization to preserve markdown formatting. ([#2499](https://github.com/bfra-me/works/pull/2499))

## 0.1.1
### Patch Changes


- Fix package exports configuration to properly expose all public modules ([#2400](https://github.com/bfra-me/works/pull/2400))
  
  **Added missing package.json exports:**
  - `./orchestrator` - Package scanning and sync orchestration utilities
  - `./watcher` - File watching and change detection utilities
  - `./utils` - Security utilities for MDX generation and sanitization
  
  **Added corresponding tsup build entry points** for orchestrator, watcher, and utils modules
  
  **Added re-exports to main barrel export (src/index.ts):**
  - All parsers exports (56 functions/types from ./parsers)
  - All utils exports (9 functions from ./utils)
  
  This ensures all subdirectory imports work correctly:
  - `import {} from '@bfra.me/doc-sync/orchestrator'`
  - `import {} from '@bfra.me/doc-sync/watcher'`
  - `import {} from '@bfra.me/doc-sync/utils'`
  - `import {} from '@bfra.me/doc-sync/parsers'`

- Fix MDX validation false positives for TypeScript generics in documentation ([#2398](https://github.com/bfra-me/works/pull/2398))
  
  Fixed an issue where TypeScript generic syntax (e.g., `Result<T, E>`) in README content was incorrectly flagged as unclosed JSX tags during MDX validation. The validator now:
  
  - Extracts and filters inline code spans (backtick-wrapped text) in addition to fenced code blocks
  - Filters out single-letter tag names (T, E, K, V, etc.) that are common TypeScript generic type parameters
  - Correctly validates documentation containing type signatures without false positives
  
  This fix enables successful synchronization of packages with TypeScript generic types in their documentation, such as `@bfra.me/create`.

- Updated dependency `ts-morph` to `27.0.2`. ([#2397](https://github.com/bfra-me/works/pull/2397))

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
