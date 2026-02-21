# @bfra.me/workspace-analyzer

## 0.2.6
### Patch Changes

- Updated dependencies [[`bdf504b`](https://github.com/bfra-me/works/commit/bdf504bc736dd0b5201bc20361425ef851c61dd6)]:
  - @bfra.me/doc-sync@0.1.7

## 0.2.5
### Patch Changes


- test(doc-sync,workspace-analyzer): remove orchestrator integration tests ([#2651](https://github.com/bfra-me/works/pull/2651))
  
  - remove sync orchestrator tests from doc-sync error-scenarios suite
  - remove sync orchestrator tests from doc-sync incremental-sync suite
  - remove sync orchestrator tests from doc-sync sync-pipeline suite
  - remove analysis-pipeline integration test file for workspace-analyzer
  - remove incremental-analysis integration test file for workspace-analyzer
  - remove multi-package-analysis integration test file for workspace-analyzer
  - remove orchestrator integration tests from workspace-analyzer error-scenarios
  - remove orchestrator integration tests from workspace-analyzer configuration-validation
- Updated dependencies [[`4015ec0`](https://github.com/bfra-me/works/commit/4015ec022a0463ba9a077f77820b51bb45eeffcd), [`7838fbd`](https://github.com/bfra-me/works/commit/7838fbd4bbdb8ba21cf3525b73eeb5f39109d23d), [`9111a16`](https://github.com/bfra-me/works/commit/9111a16c89d8b236a6c31bd7e609cf674ae2e13f), [`6b2841c`](https://github.com/bfra-me/works/commit/6b2841c0809f8f264d06f49f22dc62888f092f1e)]:
  - @bfra.me/doc-sync@0.1.6

## 0.2.4
### Patch Changes

- Updated dependencies [[`bfdcf01`](https://github.com/bfra-me/works/commit/bfdcf018f2cb6c9fc8113dc703c92b69294a9565)]:
  - @bfra.me/doc-sync@0.1.5

## 0.2.3
### Patch Changes

- Updated dependencies [[`48143a6`](https://github.com/bfra-me/works/commit/48143a6695c3722a6cfd80a5c9878ae6f1052107), [`08f04df`](https://github.com/bfra-me/works/commit/08f04df51ed9621381f09df303a49bfeaf4a5500), [`4c777c2`](https://github.com/bfra-me/works/commit/4c777c2eed8061061fc9a6b872222df5c2072db4), [`23e2f84`](https://github.com/bfra-me/works/commit/23e2f84e07a39fb233f0ae1114f7e2bb4591b83c)]:
  - @bfra.me/doc-sync@0.1.4

## 0.2.2
### Patch Changes

- Updated dependencies [[`346cec5`](https://github.com/bfra-me/works/commit/346cec5debfeadd63b224ae5097fbd71c1cef0b3), [`53d3631`](https://github.com/bfra-me/works/commit/53d363117984bcea48ea42bfdd791c3f269f10b5)]:
  - @bfra.me/doc-sync@0.1.3

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
