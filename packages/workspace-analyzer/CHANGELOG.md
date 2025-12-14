# @bfra.me/workspace-analyzer

## 0.2.1
### Patch Changes

- Updated dependencies [[`d171df5`](https://github.com/bfra-me/works/commit/d171df5e66f61a286f8bebed44a41674c53dc2a0)]:
  - @bfra.me/doc-sync@0.1.2

## 0.2.0
### Minor Changes


- feat(workspace-analyzer): add interactive dependency graph visualization ([#2477](https://github.com/bfra-me/works/pull/2477))
  
  Add `workspace-analyzer visualize` command that generates interactive HTML visualizations of workspace dependencies with D3.js force-directed graphs.
  
  **Features:**
  - Generate self-contained HTML files with embedded D3.js visualization
  - Visualize cross-package dependencies and module relationships
  - Highlight circular import chains with clear visual differentiation
  - Display architectural layer violations with severity-based coloring
  - Interactive filtering by layer, severity, and package scope
  - Multiple view modes: full graph, cycles-only, violations-only
  - Export formats: HTML (interactive), JSON (data), Mermaid (diagram markup)
  - Auto-open in default browser with `--no-open` flag to disable
  - Offline support with no external network requests
  
  **CLI Usage:**
  ```bash
  # Generate interactive HTML visualization
  workspace-analyzer visualize
  
  # Generate JSON data for external tools
  workspace-analyzer visualize --format json --output graph.json
  
  # Generate Mermaid diagram
  workspace-analyzer visualize --format mermaid --output graph.mmd
  
  # Interactive mode with options
  workspace-analyzer visualize --interactive
  ```
  
  **CLI Options:**
  - `--output <path>`: Output file path (default: `workspace-graph.html`)
  - `--format <format>`: Output format - html, json, mermaid, both (default: `html`)
  - `--no-open`: Disable auto-opening in browser
  - `--title <title>`: Visualization title (default: `Workspace Dependency Graph`)
  - `--max-nodes <number>`: Maximum nodes to render (default: `1000`)
  - `--include-type-imports`: Include type-only imports in graph
  - `--interactive`: Interactive mode for options selection
  
  **Programmatic API:**
  ```typescript
  import {buildVisualizationData, renderVisualizationHtml} from '@bfra.me/workspace-analyzer'
  
  const vizData = buildVisualizationData(context)
  const html = renderVisualizationHtml(vizData, {title: 'My Project'})
  ```
  
  **Dependencies:**
  - Added `open` ^10.2.0 for auto-opening HTML in default browser
  - D3.js v7 embedded inline (no runtime dependency)

### Patch Changes


- Fixed JSON output corruption when using `--json` flag. The CLI now correctly suppresses UI elements (intro banner, spinner, outro) in JSON/Markdown/quiet modes, and fixes a double-stringification bug where JSON output was being encoded twice. ([#2464](https://github.com/bfra-me/works/pull/2464))

## 0.1.0
### Minor Changes


- feat(workspace-analyzer): add comprehensive monorepo static analysis package ([#2434](https://github.com/bfra-me/works/pull/2434))
  
  This new package provides workspace analysis through deep AST parsing and static analysis, detecting:
  
  - **Configuration issues**: Inconsistencies across package.json, tsconfig.json, eslint.config.ts, and tsup.config.ts
  - **Dependency problems**: Unused dependencies, circular imports with Tarjan's algorithm, duplicate dependencies, peer dependency validation
  - **Architectural violations**: Layer boundary violations, barrel export misuse, public API enforcement
  - **Performance opportunities**: Tree-shaking blockers, dead code, large dependencies
  
  Features:
  - Modern CLI with `@clack/prompts` interactive TUI
  - Programmatic API with `analyzeWorkspace()` and `analyzePackages()` functions
  - Multiple output formats: Console, JSON, Markdown
  - Incremental analysis with content-based caching
  - Type-safe configuration with `defineConfig()` helper
  - Extensible analyzer registry architecture
  
  Built on proven infrastructure from `@bfra.me/es` (Result types, async utilities) and `@bfra.me/doc-sync` (TypeScript parsing with ts-morph).
